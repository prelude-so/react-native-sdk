// Expo config plugin: records the app's SDK distribution links where each
// native build reads them.
//
//   ["@prelude.so/react-native-sdk", {
//     "androidSdkUrl": "https://.../dis_.../maven",
//     "iosSdkUrl": "https://.../dis_.../apple-sdk.git"
//   }]
//
// Both links come from the app's page in the Prelude Dashboard. Android is
// added as a Maven repository to allprojects in android/build.gradle; iOS goes
// to Podfile.properties.json as PRELUDE_IOS_SDK_URL, read on `pod install`.

const {
  createRunOncePlugin,
  withPodfileProperties,
  withProjectBuildGradle,
} = require("expo/config-plugins");

const pkg = require("./package.json");

const LINK = /^https:\/\/[^\s/]+\/dis_[0-9a-z]{26}\/(maven|apple-sdk\.git)$/;

const requireLink = (name, value, suffix) => {
  if (typeof value !== "string" || !LINK.test(value) || !value.endsWith(suffix)) {
    throw new Error(
      `${pkg.name}: "${name}" must be the link ending in "/${suffix}" shown for ` +
        "your app in the Prelude Dashboard.",
    );
  }
};

const MAVEN_MARKER = "// Prelude SDK distribution link";
const MAVEN_BLOCK = /\n *\/\/ Prelude SDK distribution link\n *maven \{[^}]*\{[^}]*\}[^}]*\}/;

const withAndroidLink = (config, url) =>
  withProjectBuildGradle(config, (cfg) => {
    const repository =
      `\n    ${MAVEN_MARKER}\n    maven {\n      url("${url}")\n` +
      `      content { includeGroup("so.prelude.android") }\n    }`;
    const contents = cfg.modResults.contents.replace(MAVEN_BLOCK, "");
    const match = contents.match(/allprojects\s*\{\s*repositories\s*\{/);
    if (!match) {
      throw new Error(`${pkg.name}: no allprojects { repositories { } } block in android/build.gradle.`);
    }
    const at = match.index + match[0].length;
    cfg.modResults.contents = contents.slice(0, at) + repository + contents.slice(at);
    return cfg;
  });

const withIosLink = (config, url) =>
  withPodfileProperties(config, (cfg) => {
    cfg.modResults.PRELUDE_IOS_SDK_URL = url;
    return cfg;
  });

const withPrelude = (config, props) => {
  const { androidSdkUrl, iosSdkUrl } = props ?? {};
  if (androidSdkUrl === undefined && iosSdkUrl === undefined) {
    throw new Error(`${pkg.name}: pass "androidSdkUrl", "iosSdkUrl", or both.`);
  }
  if (androidSdkUrl !== undefined) {
    requireLink("androidSdkUrl", androidSdkUrl, "maven");
    config = withAndroidLink(config, androidSdkUrl);
  }
  if (iosSdkUrl !== undefined) {
    requireLink("iosSdkUrl", iosSdkUrl, "apple-sdk.git");
    config = withIosLink(config, iosSdkUrl);
  }
  return config;
};

module.exports = createRunOncePlugin(withPrelude, pkg.name, pkg.version);
