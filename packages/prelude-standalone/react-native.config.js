// Consumer-side autolinking config (RN Community CLI).
// iOS is auto-discovered from the root podspec, so no `ios` entry is needed.
module.exports = {
  dependency: {
    platforms: {
      android: {
        sourceDir: "android",
        packageImportPath:
          "import so.prelude.reactnative.standalone.PreludeReactNativeSdkStandalonePackage;",
        packageInstance: "new PreludeReactNativeSdkStandalonePackage()",
      },
    },
  },
};
