import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue2';
import * as fs from 'fs';
import * as path from 'path';

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  /**
   * Create aliases for the paths we use in our app
   * Slightly different behaviour in testing mode
   */
  function getAlias () {
    const alias = {
      '@': path.resolve(__dirname, './resources/js')
    };

    if (!process.env.VITEST) {
      alias.vue = 'vue/dist/vue.esm.js';
    } else {
      alias.vue$ = 'vue/dist/vue.esm.js';
    }
    return alias;
  }

  function getSslConfig () {
    if (process.env.VITE_SSL) {
      return {
        key: fs.readFileSync(process.env.VITE_SSL_KEY),
        cert: fs.readFileSync(process.env.VITE_SSL_CERT)
      };
    }
    return false;
  }

  return defineConfig({
    test: {
      coverage: {
        provider: 'istanbul',
        include: ['resources/js/**/*.{js,vue}'],
        all: true
      },
      globals: true,
      open: false,
      restoreMocks: true,
      environment: 'jsdom',
      environmentOptions: { url: 'http://localhost' },
      threads: false,
      setupFiles: './tests/Frontend/setup.js'
    },
    plugins: [
      laravel([
        'resources/js/app.js',
        'resources/sass/theme/' + (process.env.VITE_THEME || 'default') + '/app.scss'
      ]),
      vue()
    ],
    server: {
      https: getSslConfig(),
      host: true,
      hmr: {
        host: process.env.VITE_HOST || 'localhost'
      }
    },
    resolve: {
      alias: getAlias()
    }
  });
};
