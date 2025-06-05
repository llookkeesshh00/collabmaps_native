const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Only include the project's node_modules folder
config.watchFolders = [
  path.resolve(__dirname, 'node_modules'),
];

// Ensure all necessary file extensions are included
config.resolver = {
  ...config.resolver,
  extraNodeModules: new Proxy({}, {
    get: (target, name) => path.join(process.cwd(), `node_modules/${name}`),
  }),
  sourceExts: [...config.resolver.sourceExts, 'cjs', 'mjs'],
};

module.exports = withNativeWind(config, { input: './app/global.css' });