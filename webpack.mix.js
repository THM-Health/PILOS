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
  process.env.MIX_AVAILABLE_LOCALES = glob.sync('resources/js/lang/*').map(folder => {
    return path.basename(folder);
  }).join(',');
}

if (!process.env.MIX_DEFAULT_LOCALE) {
  process.env.MIX_DEFAULT_LOCALE = 'en';
}

if (fs.existsSync('resources/custom/js/')) {
  const customFiles = glob.sync('resources/custom/js/**/*.js');

  customFiles.forEach(file => {
    files.push(file);
  });
}

mix.js(files, 'public/js')
  .vue()
  .sass('resources/sass/app.scss', 'public/css')
  .copy('resources/images', 'public/images')
  .sourceMaps(false);

if (fs.existsSync('resources/custom/images')) {
  mix.copy('resources/custom/images', 'public/images');
}

if (!mix.inProduction()) {
  mix.browserSync(process.env.BROWSERSYNC_URL || process.env.APP_URL);
}

if (mix.inProduction()) {
  mix.version();
}
