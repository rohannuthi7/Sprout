module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    // Skip the worklets Babel transform in Jest — reanimated is mocked in tests.
    // react-native-reanimated/plugin must remain last among plugins.
    plugins: process.env.NODE_ENV === 'test' ? [] : ['react-native-reanimated/plugin'],
  };
};
