const assert = require("node:assert/strict");
const { mkdtemp, mkdir, writeFile, readFile, readdir, stat, rm } = require("node:fs/promises");
const { createRequire } = require("node:module");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { Readable } = require("node:stream");
const vm = require("node:vm");
const test = require("node:test");

const repository = path.resolve(__dirname, "..");
const scripts = [
  "packages/prelude/scripts/postinstall.js",
  "packages/prelude-standalone/scripts/postinstall.js",
];

async function fixture(scriptName) {
  const root = await mkdtemp(path.join(require("node:os").tmpdir(), "prelude postinstall-"));
  const packageRoot = path.join(root, "package");
  const scriptsRoot = path.join(packageRoot, "scripts");
  await mkdir(scriptsRoot, { recursive: true });
  await writeFile(path.join(scriptsRoot, "postinstall.js"), await readFile(path.join(repository, scriptName)));
  await writeFile(
    path.join(packageRoot, "package.json"),
    JSON.stringify({ name: "fixture", so_prelude: { apple_sdk_tag: "0.6.0" } }),
  );
  return { root, packageRoot, sdkPath: path.join(packageRoot, "ios", "sdk") };
}

function response(bytes, status = 200, statusText = "OK") {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    body: Readable.toWeb(Readable.from(bytes)),
  };
}

function responseWithBody(body, status = 200, statusText = "OK") {
  return { ok: status >= 200 && status < 300, status, statusText, body };
}

function zipDirectory(directory, archive, rootName) {
  execFileSync("zip", ["-qr", archive, rootName], { cwd: directory });
}

async function sourceArchive(root) {
  const archiveRoot = path.join(root, "apple-sdk-0.6.0");
  await mkdir(path.join(archiveRoot, "Sources"), { recursive: true });
  await writeFile(
    path.join(archiveRoot, "Package.swift"),
    'url: "https://example.test/Prelude.xcframework.zip",\n',
  );
  await writeFile(path.join(archiveRoot, "Sources", "Prelude.swift"), "public struct Prelude {}\n");
  const archive = path.join(root, "sources.zip");
  zipDirectory(root, archive, "apple-sdk-0.6.0");
  return archive;
}

async function binaryArchive(root) {
  const archiveRoot = path.join(root, "Prelude.xcframework");
  await mkdir(archiveRoot, { recursive: true });
  await writeFile(path.join(archiveRoot, "Info.plist"), "fixture binary\n");
  const archive = path.join(root, "binary.zip");
  zipDirectory(root, archive, "Prelude.xcframework");
  return archive;
}

async function runScript(fixtureInfo, { platform = "darwin", env = {}, fetchImpl, logs = [], fsImpl } = {}) {
  const scriptPath = path.join(fixtureInfo.packageRoot, "scripts", "postinstall.js");
  const source = await readFile(scriptPath, "utf8");
  const processShim = {
    env: { ...env },
    get platform() {
      return platform;
    },
  };
  const context = {
    __dirname: path.dirname(scriptPath),
    console: {
      log: (message) => logs.push(String(message)),
      warn: (message) => logs.push(String(message)),
      error: (message) => logs.push(String(message)),
    },
    process: processShim,
    fetch: fetchImpl,
    require: (name) => name === "fs" && fsImpl ? fsImpl : createRequire(scriptPath)(name),
    module: { exports: {} },
    exports: {},
  };
  return vm.runInNewContext(source, context, { filename: scriptPath });
}

async function assertNoStaging(info, expectedSdk) {
  const entries = (await readdir(path.join(info.packageRoot, "ios"))).sort();
  assert.deepEqual(entries, expectedSdk ? ["sdk"] : []);
}

function assertInstallWarning(logs) {
  const warning = logs.join("\n");
  assert.match(warning, /Warning: Could not configure the Prelude Apple SDK:/);
  assert.match(warning, /Continuing package installation/);
  assert.match(warning, /missing or out of date/);
  assert.match(warning, /npm rebuild --foreground-scripts fixture/);
  assert.doesNotMatch(warning, /successfully configured/i);
}

function interruptedResponse() {
  const stream = new Readable({
    read() {
      process.nextTick(() => this.destroy(new Error("interrupted stream")));
    },
  });
  return responseWithBody(Readable.toWeb(stream));
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}

for (const scriptName of scripts) {
  const label = path.dirname(path.dirname(scriptName));

  test(`${label}: skips on Linux and Windows even when APPLE_SDK_LOCATION is set`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    await mkdir(info.sdkPath, { recursive: true });
    await writeFile(path.join(info.sdkPath, "old.txt"), "old SDK\n");
    const logs = [];
    let calls = 0;
    const fetchImpl = async () => { calls += 1; throw new Error("fetch must not be called"); };
    for (const platform of ["linux", "win32"]) {
      await runScript(info, { platform, env: { APPLE_SDK_LOCATION: "/does/not/exist" }, fetchImpl, logs });
    }
    assert.equal(calls, 0);
    assert.equal(await readFile(path.join(info.sdkPath, "old.txt"), "utf8"), "old SDK\n");
    await assertNoStaging(info, true);
  });

  test(`${label}: honors PRELUDE_SKIP_APPLE_SDK on every platform`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    await mkdir(info.sdkPath, { recursive: true });
    await writeFile(path.join(info.sdkPath, "old.txt"), "old SDK\n");
    let calls = 0;
    const fetchImpl = async () => { calls += 1; throw new Error("fetch must not be called"); };
    for (const platform of ["darwin", "linux", "win32"]) {
      await runScript(info, { platform, env: { PRELUDE_SKIP_APPLE_SDK: "1" }, fetchImpl });
    }
    assert.equal(calls, 0);
    assert.equal(await readFile(path.join(info.sdkPath, "old.txt"), "utf8"), "old SDK\n");
    await assertNoStaging(info, true);
  });

  test(`${label}: warns and resolves on a source HTTP failure on a fresh install`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    const logs = [];
    let calls = 0;
    await runScript(info, {
      fetchImpl: async () => { calls += 1; return response(Buffer.from("unavailable"), 503, "Service Unavailable"); },
      logs,
    });
    assert.equal(calls, 1);
    assertInstallWarning(logs);
    assert.match(logs.join("\n"), /Service Unavailable/);
    assert.equal(await exists(info.sdkPath), false);
    await assertNoStaging(info, false);
  });

  test(`${label}: preserves an existing SDK after source download failure`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    await mkdir(path.join(info.sdkPath, "Sources"), { recursive: true });
    await writeFile(path.join(info.sdkPath, "Sources", "old.swift"), "old SDK\n");
    const logs = [];
    let calls = 0;
    await runScript(info, {
      fetchImpl: async () => { calls += 1; return response(Buffer.from("unavailable"), 503, "Service Unavailable"); },
      logs,
    });
    assert.equal(calls, 1);
    assertInstallWarning(logs);
    assert.equal(await readFile(path.join(info.sdkPath, "Sources", "old.swift"), "utf8"), "old SDK\n");
    await assertNoStaging(info, true);
  });

  test(`${label}: preserves an existing SDK after a corrupt source archive`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    await mkdir(info.sdkPath, { recursive: true });
    await writeFile(path.join(info.sdkPath, "old.txt"), "old SDK\n");
    const logs = [];
    let calls = 0;
    await runScript(info, {
      fetchImpl: async () => { calls += 1; return response(Buffer.from("not a zip")); },
      logs,
    });
    assert.equal(calls, 1);
    assertInstallWarning(logs);
    assert.equal(await readFile(path.join(info.sdkPath, "old.txt"), "utf8"), "old SDK\n");
    await assertNoStaging(info, true);
  });

  test(`${label}: warns and cleans up after a rejected source download`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    const logs = [];
    let calls = 0;
    await runScript(info, {
      fetchImpl: async () => { calls += 1; throw new Error("network unavailable"); },
      logs,
    });
    assert.equal(calls, 1);
    assertInstallWarning(logs);
    assert.match(logs.join("\n"), /network unavailable/);
    await assertNoStaging(info, false);
  });

  test(`${label}: warns and cleans up after an interrupted download stream`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    const logs = [];
    let calls = 0;
    await runScript(info, {
      fetchImpl: async () => { calls += 1; return interruptedResponse(); },
      logs,
    });
    assert.equal(calls, 1);
    assertInstallWarning(logs);
    assert.match(logs.join("\n"), /interrupted stream/);
    await assertNoStaging(info, false);
  });

  test(`${label}: preserves an existing SDK after binary HTTP failure`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    const fixtureRoot = await mkdtemp(path.join(require("node:os").tmpdir(), "prelude-zips-"));
    t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
    const sourceZip = await sourceArchive(fixtureRoot);
    await mkdir(info.sdkPath, { recursive: true });
    await writeFile(path.join(info.sdkPath, "old.txt"), "old SDK\n");
    let calls = 0;
    const logs = [];
    await runScript(info, {
      fetchImpl: async (url) => {
        calls += 1;
        assert.equal(await readFile(path.join(info.sdkPath, "old.txt"), "utf8"), "old SDK\n");
        return calls === 1
          ? response(await readFile(sourceZip))
          : response(Buffer.from("unavailable"), 502, "Bad Gateway");
      },
      logs,
    });
    assert.equal(calls, 2);
    assertInstallWarning(logs);
    assert.equal(await readFile(path.join(info.sdkPath, "old.txt"), "utf8"), "old SDK\n");
    await assertNoStaging(info, true);
  });

  test(`${label}: preserves an existing SDK after a corrupt binary archive`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    const fixtureRoot = await mkdtemp(path.join(require("node:os").tmpdir(), "prelude zips-"));
    t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
    const sourceZip = await sourceArchive(fixtureRoot);
    await mkdir(info.sdkPath, { recursive: true });
    await writeFile(path.join(info.sdkPath, "old.txt"), "old SDK\n");
    let calls = 0;
    const logs = [];
    await runScript(info, {
      fetchImpl: async () => {
        calls += 1;
        assert.equal(await readFile(path.join(info.sdkPath, "old.txt"), "utf8"), "old SDK\n");
        return calls === 1 ? response(await readFile(sourceZip)) : response(Buffer.from("not a zip"));
      },
      logs,
    });
    assert.equal(calls, 2);
    assertInstallWarning(logs);
    assert.equal(await readFile(path.join(info.sdkPath, "old.txt"), "utf8"), "old SDK\n");
    await assertNoStaging(info, true);
  });

  test(`${label}: replaces an existing SDK only after both archives succeed`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    const fixtureRoot = await mkdtemp(path.join(require("node:os").tmpdir(), "prelude-zips-"));
    t.after(() => rm(fixtureRoot, { recursive: true, force: true }));
    const sourceZip = await sourceArchive(fixtureRoot);
    const binaryZip = await binaryArchive(fixtureRoot);
    await mkdir(info.sdkPath, { recursive: true });
    await writeFile(path.join(info.sdkPath, "old.txt"), "old SDK\n");
    let calls = 0;
    await runScript(info, {
      fetchImpl: async (url) => {
        calls += 1;
        assert.equal(await readFile(path.join(info.sdkPath, "old.txt"), "utf8"), "old SDK\n");
        return calls === 1 ? response(await readFile(sourceZip)) : response(await readFile(binaryZip));
      },
    });
    assert.equal(calls, 2);
    assert.equal(await exists(path.join(info.sdkPath, "old.txt")), false);
    assert.equal(await readFile(path.join(info.sdkPath, "Sources", "Prelude.swift"), "utf8"), "public struct Prelude {}\n");
    assert.equal(await readFile(path.join(info.sdkPath, "core", "Prelude.xcframework", "Info.plist"), "utf8"), "fixture binary\n");
    await assertNoStaging(info, true);
  });

  test(`${label}: copies a local APPLE_SDK_LOCATION and removes Package.swift`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    const localSource = path.join(info.root, "local-sdk");
    await mkdir(path.join(localSource, "Sources"), { recursive: true });
    await writeFile(path.join(localSource, "Package.swift"), "manifest\n");
    await writeFile(path.join(localSource, "Sources", "Prelude.swift"), "local SDK\n");
    await runScript(info, { env: { APPLE_SDK_LOCATION: localSource }, fetchImpl: async () => { throw new Error("no fetch"); } });
    assert.equal(await exists(path.join(info.sdkPath, "Package.swift")), false);
    assert.equal(await readFile(path.join(info.sdkPath, "Sources", "Prelude.swift"), "utf8"), "local SDK\n");
    await assertNoStaging(info, true);
  });

  test(`${label}: restores the existing SDK if replacing it fails`, async (t) => {
    const info = await fixture(scriptName);
    t.after(() => rm(info.root, { recursive: true, force: true }));
    const localSource = path.join(info.root, "local-sdk");
    await mkdir(localSource);
    await writeFile(path.join(localSource, "Package.swift"), "manifest\n");
    await mkdir(info.sdkPath, { recursive: true });
    await writeFile(path.join(info.sdkPath, "old.txt"), "old SDK\n");
    const fs = require("node:fs");
    const logs = [];
    await runScript(info, {
      env: { APPLE_SDK_LOCATION: localSource },
      logs,
      fsImpl: {
        ...fs,
        renameSync(source, destination) {
          if (path.basename(source) === "sdk" && destination === info.sdkPath) {
            throw new Error("replacement failed");
          }
          fs.renameSync(source, destination);
        },
      },
    });
    assertInstallWarning(logs);
    assert.match(logs.join("\n"), /replacement failed/);
    assert.equal(await readFile(path.join(info.sdkPath, "old.txt"), "utf8"), "old SDK\n");
    await assertNoStaging(info, true);
  });
}
