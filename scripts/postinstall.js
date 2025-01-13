const fs = require("fs");
const child_process = require("node:child_process");
const util = require("node:util");
const path = require("path");
const { Readable } = require("stream");
const { finished } = require("stream/promises");

async function main() {
  const packagePath = path.resolve(__dirname, "../package.json");
  const sdkPath = path.resolve(__dirname, "../ios/sdk");
  if (fs.existsSync(sdkPath)) {
    fs.rmSync(sdkPath, { recursive: true });
  }
  fs.mkdirSync(sdkPath);
  const packageFile = require(packagePath);
  const appleSdkVersion = packageFile.so_prelude.apple_sdk_tag;
  const appleSdkSources =
    process.env.APPLE_SDK_LOCATION ||
    `https://github.com/prelude-so/apple-sdk/archive/refs/tags/${appleSdkVersion}.zip`;

  await configureSources(appleSdkSources, sdkPath, appleSdkVersion);

  logSuccess("The Prelude Apple SDK has been successfully configured.");
}

async function configureSources(sourcesPath, localSdkPath, appleSdkVersion) {
  if (sourcesPath.startsWith("http")) {
    await configureFromUrl(sourcesPath, localSdkPath, appleSdkVersion);
  } else {
    fs.cpSync(sourcesPath, localSdkPath, { recursive: true });
    fs.rmSync(`${localSdkPath}/Package.swift`)
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

const downloadFile = async (url, fileName) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Error downloading the Prelude Apple SDK. Response: ${res.statusText}. Tried ${url}.`,
    );
  }
  fs.rmSync(fileName, { force: true });
  const fileStream = fs.createWriteStream(fileName, { flags: "wx" });
  await finished(Readable.fromWeb(res.body).pipe(fileStream));
};

const exec = util.promisify(child_process.execSync);

async function unzip(fileName, destination) {
  const unzip = await exec("unzip " + fileName + " -d " + destination, {
    stdio: "inherit",
  });
  logMessage(unzip.stdout);
}

function logMessage(msg) {
  console.log(msg);
}

function logSuccess(msg) {
  console.log(`\x1b[32m ${msg} \x1b[0m`);
}

(async () => {
  await main();
})();
