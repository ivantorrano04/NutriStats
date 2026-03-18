import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuempresa.nutristats',
  appName: 'NutriStats',
  webDir: 'out',
  server: {
    // Esto ayuda a que el iPhone trate la app como un sitio seguro
    androidScheme: 'https',
    iosScheme: 'capacitor'
  }
};

export default config;