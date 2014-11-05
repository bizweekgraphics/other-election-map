var gulp = require('./gulp')([
  'webserver',
  'html',
  'watch',
  'browserify',
  'vendor',
  'sass'
])

gulp.task('default', ['sass', 'vendor', 'browserify', 'webserver', 'watch']);