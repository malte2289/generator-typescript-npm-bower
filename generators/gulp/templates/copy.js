/**
 * Gulp copy task.
 */

'use strict';

var path = require('path'),
    gulp = require('gulp-help')(require('gulp')),
    conf = require('./conf');

/**
 * Gulp copy css task.
 * Copy css files in .cssTmp to<% if (bower) { -%> bower directory and<% } -%> npm directory.
 */
gulp.task('copy-css', function(done) {
    gulp.src(path.join(conf.paths.cssTmp, conf.path_pattern.css))
<% if (bower) { -%>
        .pipe(gulp.dest(conf.paths.bower))
<% } -%>
        .pipe(gulp.dest(conf.paths.lib))
        .on('end', function(){
          done();
        });
});
<% if (fonts) { -%>

/**
 * Gulp copy fonts task.
 * Copy font files in styles directory to bower directory and npm directory.
 */
gulp.task('copy-fonts', function (done) {
  gulp.src(path.join(conf.paths.font_dir, conf.path_pattern.fonts), {
    base: conf.paths.styles
  })
    .pipe(gulp.dest(conf.paths.bower))
    .pipe(gulp.dest(conf.paths.lib))
    .on('end', function () {
      done();
    });
});
<% } -%>
