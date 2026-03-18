import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tuempresa.nutristats',
  appName: 'NutriStats',
  webDir: 'out',
  server: {
    // Usar 'app' es el estándar más compatible para iOS moderno
    iosScheme: 'app',
    hostname: 'localhost'
  }
};

export default config;