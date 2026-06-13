const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
const config = getDefaultConfig(__dirname);

const EMPTY = config.resolver.emptyModulePath;

// 1. Stub aws-amplify OAuth modules — app uses email/password auth only.
//    signInWithRedirect eagerly imports enableOAuthListener as a side-effect,
//    which calls Amplify[ADD_OAUTH_LISTENER] on startup. On web, Metro creates
//    separate CJS and ESM instances of @aws-amplify/core with different Symbols,
//    making the method lookup fail. Stubbing these files prevents that entirely.
//
// 2. Force zustand to CJS — zustand's ESM build uses `import.meta.env` which
//    is Vite-only syntax and crashes in Metro's CommonJS bundle.

const ZUSTAND_CJS = path.resolve(__dirname, 'node_modules/zustand/index.js');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes('enableOAuthListener') ||
    moduleName.includes('attemptCompleteOAuthFlow') ||
    // Match only the OAuth sign-in API file, not signInWithRedirectStore (used by TokenOrchestrator)
    moduleName.endsWith('/signInWithRedirect') ||
    moduleName.endsWith('/signInWithRedirect.mjs') ||
    moduleName.endsWith('/signInWithRedirect.js')
  ) {
    return { type: 'sourceFile', filePath: EMPTY };
  }

  if (moduleName === 'zustand') {
    return { type: 'sourceFile', filePath: ZUSTAND_CJS };
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
