const path = require('path');
const src = path.join('./', 'src');
const dist = path.join('./', 'build');
const tests = path.join('./', 'spec');
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const tsProject = $.typescript.createProject({
        "target": "ES6",
        "outFile": "scout.js"
    }
);
const tsProjectTest = $.typescript.createProject({
        "target": "ES6",
        "outFile": "scout-spec.js"
    }
);

gulp.task('default', ['build']);

gulp.task('build', ['test'], () => tsCompile(tsProject, path.join(src, 'main.ts'), dist));

gulp.task('test_compile', () => tsCompile(tsProjectTest, path.join(tests, 'spec.ts'), tests));

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

gulp.task('w', ['build'], () => {
    gulp.watch(path.join(src, '**/*.ts'), ['build']);
    gulp.watch(path.join(tests, '**/*.ts'), ['test']);
});

gulp.task('b', ['build']);
gulp.task('t', ['test']);

function tsCompile(project, src, dest) {
    return gulp.src(src)
        .pipe($.typescript(project))
        .pipe($.babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest(dest));
}
