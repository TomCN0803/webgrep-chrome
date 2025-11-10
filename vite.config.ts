import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    webExtension({
      manifest: 'public/manifest.json',
    }),
  ],
});
