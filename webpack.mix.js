const mix = require('laravel-mix')
const fs = require('fs')

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

mix.js('resources/js/app.js', 'public/js')
  .sass('resources/sass/app.scss', 'public/css')
  .sourceMaps(false)
  .copy('resources/images', 'public/images')
  .extract()

if (fs.existsSync('resources/custom/images')) {
  mix.copy('resources/custom/images', 'public/images')
}

if (mix.inProduction()) {
  mix.version()
}
