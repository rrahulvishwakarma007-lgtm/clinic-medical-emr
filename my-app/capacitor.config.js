// capacitor.config.js
/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.medicare.emr',
  appName: 'MediCare EMR',
  webDir: 'out',

  server: {
    url: 'https://clinic-medical-emr.vercel.app', // ✅ your URL stays same
    androidScheme: 'https',
    cleartext: false, // ✅ changed to false (HTTPS is secure, no need for cleartext)
  },

  android: {
    allowMixedContent: false,
  },

  plugins: {
    // ✅ HTTP requests via Capacitor (faster than fetch in WebView)
    CapacitorHttp: {
      enabled: true,
    },

    // ✅ @capacitor/browser — open links in in-app browser
    Browser: {
      presentationStyle: 'popover',
    },

    // ✅ Status bar — matches your navy blue theme
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0d1b2e',
    },

    // ✅ Splash screen
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#0d1b2e',
      showSpinner: false,
    },

    // ✅ Keyboard — prevents content being hidden behind keyboard
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },
  },
};

module.exports = config;