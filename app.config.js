require('dotenv').config();

const buildProfile = process.env.EAS_BUILD_PROFILE || 'main';

module.exports = () => ({
  name: 'collabmaps',
  slug: 'collabmaps',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/app-icon.jpg',
  scheme: 'myapp',
  userInterfaceStyle: 'automatic',
  updates: {
    url: "https://u.expo.dev/c1c14bce-405c-4fd6-8d13-d3f2398d1dae",
    channel: buildProfile
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
    package: 'com.anonymous.collabmaps',
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
    googleMapsApiBaseUrl: process.env.GOOGLE_MAP_API_URL,
    websocketUrl: process.env.WS_URL,
    "eas": {
      "projectId": "c1c14bce-405c-4fd6-8d13-d3f2398d1dae"
    }
  },
});
