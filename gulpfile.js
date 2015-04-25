var gulp = require('gulp');
var concat = require('gulp-concat');

var cssSources = 'src/css/**/*.css';
var jsSources = 'src/js/**/*.js';

var dist = 'dist/';

gulp.task('js', function() {
  return gulp.src(jsSources)
    .pipe(concat('ngPresenter.js'))
    .pipe(gulp.dest(dist));
});

gulp.task('css', function() {
  return gulp.src(cssSources)
    .pipe(concat('ngPresenter.css'))
    .pipe(gulp.dest(dist));
});

gulp.task('watch', ['css', 'js'], function() {
  gulp.watch(cssSources, ['css']);
  gulp.watch(jsSources, ['js']);
});

