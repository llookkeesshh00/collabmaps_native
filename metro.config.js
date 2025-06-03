const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    ...(config.resolver.extraNodeModules || {}),
    '@expo/metro-runtime': path.resolve(__dirname, 'node_modules/@expo/metro-runtime/src'),
  },
};

module.exports = withNativeWind(config, { input: './app/global.css' });