const path = require('path');
const src = path.join('./', 'src');
const dist = path.join('./', 'build');
const tests = path.join('./', 'tests');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const tsProject = $.typescript.createProject('tsconfig.json');
const tsProjectTest = $.typescript.createProject('tsconfig-test.json');

gulp.task('default', ['build']);

gulp.task('build', ['test'], () => tsCompile(tsProject, dist));

gulp.task('test', ['test_compile'], () => {

    gulp.src(path.join(tests, '**/*[sS]pec.js'))
        .pipe($.jasmine({
            config: {
                spec_dir: tests,
                spec_files: [
                    '**/*[sS]pec.js'
                ],
                helpers: [
                    'helpers/**/*.js'
                ]
            }
        }))
});

gulp.task('test_compile', () => tsCompile(tsProjectTest, tests));

gulp.task('w', ['build'], () => {
    gulp.watch(path.join(src, '**/*.ts'), ['build']);
    gulp.watch(path.join(tests, '**/*.ts'), ['test']);
});

gulp.task('b', ['build']);
gulp.task('t', ['test']);

function tsCompile(project, dest) {
    return project.src()
        .pipe($.typescript(project))
        .pipe($.babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(dest));
}
