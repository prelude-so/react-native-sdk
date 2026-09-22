const fs = require("fs");
const child_process = require("node:child_process");
const path = require("path");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

async function main() {
  // The Apple SDK is only needed for iOS builds. Skip the download when it is
  // clearly unneeded (e.g. web-only installs or CI that opts out).
  if (process.env.PRELUDE_SKIP_APPLE_SDK === "1") {
    logMessage("PRELUDE_SKIP_APPLE_SDK set — skipping Apple SDK download.");
    return;
  }
  if (process.platform !== "darwin") {
    logMessage(`Skipping Apple SDK download on ${process.platform}: iOS builds only run on macOS.`);
    return;
  }

  const packagePath = path.resolve(__dirname, "../package.json");
  const sdkPath = path.resolve(__dirname, "../ios/sdk");
  const packageFile = require(packagePath);
  const appleSdkVersion = packageFile.so_prelude.apple_sdk_tag;
  const appleSdkSources =
    process.env.APPLE_SDK_LOCATION ||
    `https://github.com/prelude-so/apple-sdk/archive/refs/tags/${appleSdkVersion}.zip`;

  fs.mkdirSync(path.dirname(sdkPath), { recursive: true });
  const temporaryPath = fs.mkdtempSync(
    path.join(path.dirname(sdkPath), ".prelude-sdk-"),
  );
  const stagingPath = path.join(temporaryPath, "sdk");
  const backupPath = path.join(temporaryPath, "previous-sdk");
  try {
    fs.mkdirSync(stagingPath);
    await configureSources(appleSdkSources, stagingPath, appleSdkVersion);

    if (fs.existsSync(sdkPath)) {
      fs.renameSync(sdkPath, backupPath);
    }
    try {
      fs.renameSync(stagingPath, sdkPath);
    } catch (error) {
      if (fs.existsSync(backupPath)) {
        fs.renameSync(backupPath, sdkPath);
      }
      throw error;
    }
    fs.rmSync(backupPath, { recursive: true, force: true });
    logSuccess("The Prelude Apple SDK has been successfully configured.");
  } finally {
    // Keep the backup if restoring it failed.
    if (!fs.existsSync(backupPath)) {
      fs.rmSync(temporaryPath, { recursive: true, force: true });
    }
  }
}

async function configureSources(sourcesPath, localSdkPath, appleSdkVersion) {
  if (sourcesPath.startsWith("http")) {
    await configureFromUrl(sourcesPath, localSdkPath, appleSdkVersion);
  } else {
    fs.cpSync(sourcesPath, localSdkPath, { recursive: true });
    fs.rmSync(`${localSdkPath}/Package.swift`);
  }
}

async function configureFromUrl(url, localSdkPath, appleSdkVersion) {
  logMessage(`Downloading the Prelude Apple SDK version: ${appleSdkVersion}.`);

  await downloadFile(url, `${localSdkPath}/${appleSdkVersion}.zip`);
  unzip(`${localSdkPath}/${appleSdkVersion}.zip`, `${localSdkPath}/tmp`);
  fs.rmSync(`${localSdkPath}/${appleSdkVersion}.zip`, { force: true });
  const unzipped_to = fs.readdirSync(`${localSdkPath}/tmp`)[0];

  const swiftPackage = `${localSdkPath}/tmp/${unzipped_to}/Package.swift`;
  const sources = `${localSdkPath}/tmp/${unzipped_to}/Sources`;
  fs.renameSync(sources, `${localSdkPath}/Sources`);

  const xcframeworkUrl = await extractXcFrameworkUrl(swiftPackage);
  logMessage("Downloading the Prelude Apple SDK binaries...");
  const xcframeworkFileName = xcframeworkUrl.split("/").pop();
  await downloadFile(
    xcframeworkUrl,
    `${localSdkPath}/tmp/${xcframeworkFileName}`,
  );

  unzip(
    `${localSdkPath}/tmp/${xcframeworkFileName}`,
    `${localSdkPath}/tmp/core/`,
  );
  fs.renameSync(`${localSdkPath}/tmp/core/`, `${localSdkPath}/core`);

  fs.rmSync(`${localSdkPath}/tmp`, { recursive: true, force: true });
}

async function extractXcFrameworkUrl(packageFileName) {
  const readline = require("node:readline");
  const fileStream = fs.createReadStream(packageFileName);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (line.includes("url:") && line.includes("xcframework.zip")) {
      const xcframeworkUrl = line
        .trim()
        .replace("url:", "")
        .replaceAll('"', "")
        .replace(",", "")
        .trim();
      return xcframeworkUrl;
    }
  }
}

const MAX_ATTEMPTS = 5;

const isRetryable = (res) => res.status >= 500 || res.status === 429;

const fetchWithRetries = async (url) => {
  for (let attempt = 1; ; attempt++) {
    let res;
    let failure;
    try {
      res = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (res.ok || !isRetryable(res)) return res;
      failure = res.statusText;
    } catch (err) {
      failure = err.cause?.message ?? err.message;
    }
    if (attempt === MAX_ATTEMPTS) {
      throw new Error(`Error downloading the Prelude Apple SDK after ${MAX_ATTEMPTS} attempts: ${failure}. Tried ${url}.`);
    }
    const delay = 1000 * 2 ** (attempt - 1);
    logMessage(`Attempt ${attempt}/${MAX_ATTEMPTS} failed (${failure}), retrying in ${delay / 1000}s.`);
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
};

const downloadFile = async (url, fileName) => {
  const res = await fetchWithRetries(url);
  if (!res.ok) {
    throw new Error(
      `Error downloading the Prelude Apple SDK. Response: ${res.statusText}. Tried ${url}.`,
    );
  }
  fs.rmSync(fileName, { force: true });
  const fileStream = fs.createWriteStream(fileName, { flags: "wx" });
  await pipeline(Readable.fromWeb(res.body), fileStream);
};

function unzip(fileName, destination) {
  child_process.execFileSync("unzip", [fileName, "-d", destination], {
    stdio: "inherit",
  });
}

function logMessage(msg) {
  console.log(msg);
}

function logSuccess(msg) {
  console.log(`\x1b[32m ${msg} \x1b[0m`);
}

(async () => {
  try {
    await main();
  } catch (error) {
    const packageName = require("../package.json").name;
    console.warn(
      `Warning: Could not configure the Prelude Apple SDK: ${error.message}\n` +
        "Continuing package installation. The Apple SDK may be missing or out of date. " +
        `Before building iOS, run \`npm rebuild --foreground-scripts ${packageName}\` on macOS with PRELUDE_SKIP_APPLE_SDK unset.`,
    );
  }
})();
