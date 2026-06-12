module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Skip the worklets Babel transform in Jest — reanimated is mocked in tests.
    plugins: process.env.NODE_ENV === 'test' ? [] : ['react-native-reanimated/plugin'],
  };
};
