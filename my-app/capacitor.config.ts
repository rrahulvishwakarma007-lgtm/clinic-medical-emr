import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medicare.emr',
  appName: 'MediCare EMR',
  server: {
    url: 'https://clinic-medical-emr.vercel.app',
    cleartext: true
  }
};

export default config;