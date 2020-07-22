const mix = require('laravel-mix')
const fs = require('fs')
const glob = require('glob')
const path = require('path')
require('laravel-mix-merge-manifest')

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

const files = ['resources/js/app.js']

if (!process.env.MIX_AVAILABLE_LOCALES) {
  process.env.MIX_AVAILABLE_LOCALES = glob.sync('resources/js/lang/*.js').map(file => {
    return path.basename(file, '.js')
  }).join(',')
}

if (fs.existsSync('resources/custom/js/')) {
  const customFiles = glob.sync('resources/custom/js/**/*.js')

  customFiles.forEach(file => {
    files.push(file)
  })
}

mix.js(files, 'public/js')
  .sourceMaps(false)

if (process.env.NODE_ENV !== 'test') {
  mix.extract()
}

if (!mix.inProduction()) {
  mix.browserSync(process.env.APP_URL)
}

if (mix.inProduction()) {
  mix.version()
}

mix.mergeManifest()
