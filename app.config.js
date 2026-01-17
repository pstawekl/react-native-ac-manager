/* eslint-disable */
import 'dotenv/config';

module.exports = {
  expo: {
    scheme: 'ac-manager',
    runtimeVersion: '1.0.0',
    extra: {
      apiUrl: process.env.API_URL,
      apiPort: process.env.API_PORT,
      eas: {
        projectId: '2a63209a-3ba8-4390-9457-79f3a4e1a5f8',
      },
    },
    android: {
      package: 'com.acmenago.acmanager',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'ac-manager',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      config: {
        googleMaps: {
          apiKey: process.env.GOOGLE_MAPS_API_KEY,
        },
      },
    },
    ios: {
      bundleIdentifier: 'com.acmenago.acmanager',
    },
  },
};
