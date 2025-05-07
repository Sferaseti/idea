import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/idea/',
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 51712,
    cors: true,
  },
});
