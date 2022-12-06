import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue2';
const path = require('path');

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    test: {
      coverage: {
        provider: 'istanbul',
        include: ['resources/js/**/*.{js,vue}'],
        all: true
      },
      globals: true,
      restoreMocks: true,
      environment: 'jsdom',
      environmentOptions: { url: 'http://localhost' },
      threads: false,
      setupFiles: './tests/Frontend/setup.js'
    },
    plugins: [
      laravel([
        'resources/js/app.js',
        'resources/sass/theme/' + process.env.VITE_THEME + '/app.scss'
      ]),
      vue()
    ],
    server: {
      hmr: {
        host: 'localhost',
      }
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './resources/js'),
        vue$: 'vue/dist/vue.esm.js'
      }
    }
  });
};
