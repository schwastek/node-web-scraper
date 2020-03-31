// Source: https://github.com/foundation/foundation-zurb-template/blob/4492303cfb6a05c60f74cb412247fa5f1e619ec8/gulpfile.babel.js

const plugins = require('gulp-load-plugins');
const yargs = require('yargs');
const browser = require('browser-sync');
const gulp = require('gulp');
const panini = require('panini');
const rimraf = require('rimraf');
const yaml = require('js-yaml');
const fs = require('fs');
const uncss = require('uncss');
const autoprefixer = require('autoprefixer');

// Load all Gulp plugins into one variable
const $ = plugins();

// Check for --production flag
const PRODUCTION = !!(yargs.argv.production);

function loadConfig() {
  const ymlFile = fs.readFileSync('config.yml', 'utf8');
  return yaml.load(ymlFile);
}

// Load settings from settings.yml
const { PORT, UNCSS_OPTIONS, PATHS } = loadConfig();

// Delete the "dist" folder
// This happens every time a build starts
function clean(done) {
  rimraf(PATHS.dist, done);
}

// Copy files out of the assets folder
// This task skips over the "scss" folder, which is parsed separately
function copy() {
  return gulp.src(PATHS.assets)
    .pipe(gulp.dest(`${PATHS.dist}/assets`));
}

// Copy page templates into finished HTML files
function pages() {
  return gulp.src('src/pages/**/*.{html,hbs,handlebars}')
    .pipe(panini({
      root: 'src/pages/',
      layouts: 'src/layouts/',
      partials: 'src/partials/',
      data: 'src/data/',
      helpers: 'src/helpers/',
    }))
    .pipe(gulp.dest(PATHS.dist));
}

// Load updated HTML templates and partials into Panini
function resetPages(done) {
  panini.refresh();
  done();
}

// Compile Sass into CSS
// In production, the CSS is compressed
function sass() {
  const postCssPlugins = [
    // Autoprefixer
    autoprefixer(),

    // UnCSS - Uncomment to remove unused styles in production
    PRODUCTION && uncss.postcssPlugin(UNCSS_OPTIONS),
  ].filter(Boolean);

  return gulp.src('src/assets/scss/app.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: PATHS.sass,
    })
      .on('error', $.sass.logError))
    .pipe($.postcss(postCssPlugins))
    .pipe($.if(PRODUCTION, $.cleanCss()))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(`${PATHS.dist}/assets/css`))
    .pipe(browser.reload({ stream: true }));
}

// Start a server with BrowserSync to preview the site in
function server(done) {
  browser.init({
    server: PATHS.dist,
    port: PORT,
    startPath: '/products.html',
  }, done);
}

// Watch for changes to static assets, pages, Sass, and JavaScript
function watch() {
  gulp.watch(PATHS.assets, copy);
  gulp.watch('src/pages/**/*.html').on('all', gulp.series(pages, browser.reload));
  gulp.watch('src/{layouts,partials}/**/*.html').on('all', gulp.series(resetPages, pages, browser.reload));
  gulp.watch('src/data/**/*.{js,json,yml}').on('all', gulp.series(resetPages, pages, browser.reload));
  gulp.watch('src/helpers/**/*.js').on('all', gulp.series(resetPages, pages, browser.reload));
  gulp.watch('src/assets/scss/**/*.scss').on('all', sass);
}

// Build the "dist" folder by running all of the below tasks
// Sass must be run later so UnCSS can search for used classes in the others assets.
gulp.task('build',
  gulp.series(clean, gulp.parallel(pages, copy), sass));

// Build the site, run the server, and watch for file changes
gulp.task('dev',
  gulp.series('build', server, watch));

// Build the site, run the server
gulp.task('serve',
  gulp.series('build', server));
