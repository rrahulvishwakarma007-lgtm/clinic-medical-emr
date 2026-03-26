/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.medicare.emr',
  appName: 'MediCare EMR',
  webDir: 'out',

  server: {
    url: 'https://clinic-medical-emr.vercel.app', // ✅ your Vercel URL
    androidScheme: 'https',
    cleartext: false,
  },

  android: {
    allowMixedContent: false,
  },

  plugins: {
    // ✅ HTTP
    CapacitorHttp: { enabled: true },

    // ✅ Open links in-app browser
    Browser: { presentationStyle: 'popover' },

    // ✅ Status bar — navy blue
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

    // ✅ Keyboard doesn't hide content
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
    },

    // ✅ Local notifications for follow-up reminders
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#0f4c81',
    },

    // ✅ Push notifications
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },

    // ✅ Save files (reports, prescriptions PDF)
    Filesystem: {
      directory: 'DOCUMENTS',
    },
  },
};

module.exports = config;