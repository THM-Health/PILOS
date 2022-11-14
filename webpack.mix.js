const mix = require('laravel-mix');
const fs = require('fs');
const glob = require('glob');
const path = require('path');

/*
 |--------------------------------------------------------------------------
 | Mix Asset Management
 |--------------------------------------------------------------------------
 |
 | Mix provides a clean, fluent API for defining some Webpack build steps
 | for your Laravel application. By default, we are compiling the Sass
 | file for the application as well as bundling up all the JS files.
 |
 */

const files = ['resources/js/app.js'];

if (!process.env.MIX_AVAILABLE_LOCALES) {
  process.env.MIX_AVAILABLE_LOCALES = glob.sync('lang/*.json').map(file => {
    return path.parse(file).name;
  }).join(',');
}

if (!process.env.MIX_DEFAULT_LOCALE) {
  process.env.MIX_DEFAULT_LOCALE = 'en';
}

if (fs.existsSync('resources/custom/js/lang/')) {
  const customFiles = glob.sync('resources/custom/js/lang/**/*.js');

  customFiles.forEach(file => {
    files.push(file);
  });
}

if (!process.env.MIX_THEME) {
  process.env.MIX_THEME = 'default';
}

mix.js(files, 'public/js')
  .vue()
  .sass('resources/sass/theme/' + process.env.MIX_THEME + '/app.scss', 'public/css')
  .copy('resources/images', 'public/images')
  .sourceMaps(false)
  .webpackConfig({
    resolve: {
      modules: [
        path.resolve(__dirname, 'resources/custom/js'),
        path.resolve(__dirname, 'resources/js'),
        'node_modules'
      ]
    }
  });

if (fs.existsSync('resources/custom/images')) {
  mix.copy('resources/custom/images', 'public/images');
}

if (!mix.inProduction()) {
  mix.browserSync({
    proxy: process.env.BROWSERSYNC_URL || process.env.APP_URL,
    files: ['resources']
  });
} else {
  mix.version();
}
