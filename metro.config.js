const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const baseConfig = getDefaultConfig(__dirname);
const config = withNativeWind(baseConfig, { input: "./global.css" });

// Zustand v5's ESM build (esm/*.mjs) uses `import.meta.env`, which
// Metro's web bundler doesn't transform — the resulting script throws
// `Cannot use 'import.meta' outside a module` and the whole bundle
// dies. The CJS build (./*.js) is clean, so for web we force the
// resolver to use "require"/"default" conditions for zustand.
const path = require("path");
const ZUSTAND_CJS = {
  zustand: "zustand/index.js",
  "zustand/middleware": "zustand/middleware.js",
  "zustand/vanilla": "zustand/vanilla.js",
  "zustand/react": "zustand/react.js",
  "zustand/shallow": "zustand/shallow.js",
  "zustand/traditional": "zustand/traditional.js",
};

const upstreamResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === "web" && ZUSTAND_CJS[moduleName]) {
    return {
      type: "sourceFile",
      filePath: path.join(__dirname, "node_modules", ZUSTAND_CJS[moduleName]),
    };
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
