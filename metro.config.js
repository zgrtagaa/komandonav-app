const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// HTML dosyalarını asset olarak tanı
config.resolver.assetExts.push('html');

module.exports = config;
