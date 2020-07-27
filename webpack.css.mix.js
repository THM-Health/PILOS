const mix = require('laravel-mix');
const fs = require('fs');
require('laravel-mix-merge-manifest');

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

mix.sass('resources/sass/app.scss', 'public/css')
  .copy('resources/images', 'public/images')
  .sourceMaps(false);

if (fs.existsSync('resources/custom/images')) {
  mix.copy('resources/custom/images', 'public/images');
}

if (!mix.inProduction()) {
  mix.browserSync(process.env.APP_URL);
}

if (mix.inProduction()) {
  mix.version();
}

mix.mergeManifest();
