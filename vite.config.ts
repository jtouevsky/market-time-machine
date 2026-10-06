import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig(({ mode }) => ({
  plugins: mode === 'single' ? [react(), viteSingleFile()] : [react()],
  // dev and preview print their URL; if the port is taken Vite picks the next free one
  server: { port: 5173, strictPort: false },
  preview: { port: 4173, strictPort: false },
  // the single-file build is a portable offline demo: it does not carry the 37 MB dataset
  publicDir: mode === 'single' ? false : 'public',
  build: { outDir: mode === 'single' ? 'dist-single' : 'dist', chunkSizeWarningLimit: 900 },
}));
