const mix = require('laravel-mix')
const fs = require('fs')
const glob = require('glob')
const path = require('path')

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

const jsFiles = ['resources/js/app.js']

if (!process.env.MIX_AVAILABLE_LOCALES) {
  process.env.MIX_AVAILABLE_LOCALES = glob.sync('resources/js/lang/*.js').map(file => {
    return path.basename(file, '.js')
  }).join(',')
}

if (fs.existsSync('resources/custom/js/')) {
  const customFiles = glob.sync('resources/custom/js/**/*.js')

  customFiles.forEach(file => {
    jsFiles.push(file)
  })
}

mix.js(jsFiles, 'public/js/app.js')
  .sass('resources/sass/app.scss', 'public/css')
  .copy('resources/images', 'public/images')
  .sourceMaps(false)

// TODO: Uncomment if a real solution will exist for the following issue
// https://github.com/JeffreyWay/laravel-mix/issues/1914
// and don't forget to adjust the application blade with the necessary imports
// if (process.env.NODE_ENV !== 'test') {
//   mix.extract()
// }

if (fs.existsSync('resources/custom/images')) {
  mix.copy('resources/custom/images', 'public/images')
}

if (!mix.inProduction()) {
  mix.browserSync(process.env.APP_URL)
}

if (mix.inProduction()) {
  mix.version()
}
