var gulp = require('gulp');
var browserify = require('browserify');
var source = require('vinyl-source-stream');
var libs = require('../utils/libs.js').libs;
var deamdify = require('deamdify');
var debowerify = require('debowerify');

module.exports = function() {

  gulp.task('vendor', function() {
    var opts = {
      debug: true
    }

    var bundle = browserify(opts)
      .transform({global: true}, deamdify)
      .transform({global: true}, debowerify);

    libs.forEach(function(lib) {
      bundle.require(lib)
    })

    return bundle
      .bundle()
      .pipe(source('vendor.js'))
      .pipe(gulp.dest('./build/scripts'));
  })

}
