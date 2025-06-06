require('dotenv').config();

module.exports = () => ({
  name: 'maps',
  slug: 'maps',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/app-icon.jpg',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  updates: {
    url: "https://u.expo.dev/1414134b-ce5b-4d6d-924e-012fd4775165",
    channel: "main"
  },
  runtimeVersion: {
    "policy": "appVersion"
  },
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
  },
  android: {
    config: {
      googleMaps: {
        apiKey: process.env.GOOGLE_MAPS_API_KEY,
      },
    },
    adaptiveIcon: {
      foregroundImage: './assets/images/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.anonymous.maps',
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#ffffff',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY,
    googleMapsApiBaseUrl: process.env.GOOGLE_MAPS_API_BASE_URL,
    websocketUrl: process.env.WS_URL,
    "eas": {
      "projectId": "1414134b-ce5b-4d6d-924e-012fd4775165"
    }
  },
});
