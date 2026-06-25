import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/ProyectoIntegrador2/',
  server: {
    port: 4173,
  },
  preview: {
    port: 4174,
  },
});
