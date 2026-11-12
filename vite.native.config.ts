import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwind from '@tailwindcss/vite';
import { resolve } from 'node:path';
// Adapted from Ludo: swap the root document for the local native root.
const nativeModules: Plugin = {
  name: 'ord-native-modules', enforce: 'pre',
  resolveId(source, importer) {
    if (source === './routes/__root' && importer?.endsWith('routeTree.gen.ts')) return resolve('src/native/root.tsx');
    return null;
  },
};
export default defineConfig({
  root: resolve('native-shell'), envDir: resolve('.'), base: './',
  plugins: [nativeModules, react(), tailwind()],
  resolve: { alias: { '@': resolve('src') } },
  build: { outDir: resolve('dist-native'), emptyOutDir: true },
});