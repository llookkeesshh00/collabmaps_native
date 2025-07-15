require('dotenv').config();

module.exports = () => ({
  name: 'collabmaps',
  slug: 'collabmaps',
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
      foregroundImage: './assets/images/app-icon.jpg',
      backgroundColor: '#ffffff',
    },
    package: 'com.anonymous.maps',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.jpg',
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
