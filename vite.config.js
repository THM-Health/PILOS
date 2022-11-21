import {defineConfig, loadEnv} from 'vite';
import laravel from 'laravel-vite-plugin';
import vue from '@vitejs/plugin-vue2';
const path = require('path');

export default ({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return defineConfig({
    plugins: [
      laravel([
        'resources/js/app.js',
        'resources/sass/theme/' + process.env.VITE_THEME + '/app.scss'
      ]),
      vue()
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './resources/js'),
        vue: 'vue/dist/vue.esm.js'
      }
    }
  });
}
