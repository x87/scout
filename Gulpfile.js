const path = require('path');
const src = path.join('./', 'src');
const dist = path.join('./', 'build');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const tsProject = $.typescript.createProject('tsconfig.json');

gulp.task('default', ['build']);

gulp.task('build', () => {
    return tsProject.src()
        .pipe($.typescript(tsProject))
        .pipe($.babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(dist));
});


gulp.task('w', ['build'], () => gulp.watch(path.join(src, '**/*.ts'), ['build']));

gulp.task('b', ['build']);
