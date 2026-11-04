#!/usr/bin/env node
// Fetches the Prelude Apple SDK into ios/sdk through the app's distribution
// link. The podspec runs this on `pod install`, with the Podfile directory as
// the only argument.
//
// The link resolves a Swift package whose manifest names the two XCFrameworks
// by URL and checksum. Those are downloaded, verified and unpacked beside the
// bridge, where the podspec vendors them.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const { Readable } = require("stream");
const { finished } = require("stream/promises");

const PROPERTY = "PRELUDE_IOS_SDK_URL";
const FRAMEWORKS = ["PreludeSignals", "PreludeCore"];
const TAG = require("../package.json").so_prelude.apple_sdk_version;
const SDK_DIR = path.resolve(__dirname, "../ios/sdk");
const STAMP = path.join(SDK_DIR, ".resolved");

function resolveLink(podfileDir) {
  if (process.env[PROPERTY]) return process.env[PROPERTY];
  const properties = path.join(podfileDir, "Podfile.properties.json");
  const link = fs.existsSync(properties)
    ? JSON.parse(fs.readFileSync(properties, "utf8"))[PROPERTY]
    : undefined;
  if (link) return link;
  throw new Error(
    `Prelude: no Apple SDK link. Add "${PROPERTY}" to ${properties}, or export it, ` +
      "with the Swift package link of your app from the Prelude Dashboard.",
  );
}

function isResolved(link) {
  const stamp = fs.existsSync(STAMP) && fs.readFileSync(STAMP, "utf8");
  return (
    stamp === `${link}\n${TAG}\n` &&
    FRAMEWORKS.every((name) => fs.existsSync(path.join(SDK_DIR, `${name}.xcframework`)))
  );
}

function cloneManifest(link, dir) {
  try {
    execFileSync(
      "git",
      ["clone", "--quiet", "--branch", TAG, "-c", "advice.detachedHead=false", link, dir],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
  } catch (err) {
    throw new Error(
      `Prelude: cannot clone ${link} at ${TAG}: ${err.stderr?.toString().trim() || err.message}. ` +
        "Check the link in the Prelude Dashboard; it may have been revoked.",
    );
  }
  return fs.readFileSync(path.join(dir, "Package.swift"), "utf8");
}

function binaryTargets(manifest) {
  const pattern =
    /\.binaryTarget\(\s*name:\s*"(\w+)",\s*url:\s*"([^"]+)",\s*checksum:\s*"([0-9a-f]{64})"/g;
  const targets = Object.fromEntries(
    [...manifest.matchAll(pattern)].map(([, name, url, checksum]) => [name, { url, checksum }]),
  );
  for (const name of FRAMEWORKS) {
    if (!targets[name]) throw new Error(`Prelude: Package.swift at ${TAG} has no ${name} target.`);
  }
  return targets;
}

async function download(url, file) {
  const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!res.ok) throw new Error(`Prelude: downloading ${url}: ${res.status} ${res.statusText}`);
  await finished(Readable.fromWeb(res.body).pipe(fs.createWriteStream(file)));
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

async function fetchFramework(name, { url, checksum }, tmp) {
  const zip = path.join(tmp, `${name}.zip`);
  console.log(`Prelude: downloading ${name} ${TAG}...`);
  await download(url, zip);
  if (sha256(zip) !== checksum) {
    throw new Error(`Prelude: ${name} does not match the checksum in Package.swift.`);
  }
  const out = path.join(tmp, name);
  execFileSync("unzip", ["-q", zip, "-d", out]);
  const framework = `${name}.xcframework`;
  fs.rmSync(path.join(SDK_DIR, framework), { recursive: true, force: true });
  fs.renameSync(path.join(out, framework), path.join(SDK_DIR, framework));
}

async function main() {
  const link = resolveLink(path.resolve(process.argv[2] ?? "."));
  if (isResolved(link)) return;

  const tmp = path.join(SDK_DIR, ".tmp");
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  fs.rmSync(STAMP, { force: true });
  try {
    const targets = binaryTargets(cloneManifest(link, path.join(tmp, "manifest")));
    for (const name of FRAMEWORKS) await fetchFramework(name, targets[name], tmp);
    fs.writeFileSync(STAMP, `${link}\n${TAG}\n`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`Prelude: Apple SDK ${TAG} is ready.`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
