var gulp = require('./gulp')([
  'webserver',
  'html',
  'watch',
  'browserify',
  'vendor',
  'sass',
  'jshint'
])

gulp.task('default', ['sass', 'jshint', 'vendor', 'browserify', 'webserver', 'watch']);