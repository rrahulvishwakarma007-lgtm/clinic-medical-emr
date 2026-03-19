/** @type {import('@capacitor/cli').CapacitorConfig} */
const config = {
  appId: 'com.medicare.emr',
  appName: 'MediCare EMR',
  webDir: 'out',
  server: {
    url: 'https://clinic-medical-emr.vercel.app',
    cleartext: true
  }
};

module.exports = config;