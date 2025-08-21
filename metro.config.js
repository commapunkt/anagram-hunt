const { getDefaultConfig } = require('@expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

config.version = 1;

// Add support for additional file extensions
config.resolver.sourceExts = [
  'js',
  'jsx',
  'json',
  'ts',
  'tsx',
  'cjs',
  'web.js',
  'web.jsx',
  'web.ts',
  'web.tsx',
];

// Configure asset handling
config.transformer.assetPlugins = ['expo-asset/tools/hashAssetFiles'];

module.exports = config; 
