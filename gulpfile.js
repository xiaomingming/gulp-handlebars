// http://www.gulpjs.com.cn/docs/recipes/running-task-steps-per-folder/
var gulp = require('gulp');
var handlebars = require('gulp-handlebars');
var wrap = require('gulp-wrap');
var declare = require('gulp-declare');
var concat = require("gulp-concat");
var merge = require("merge-stream");
var path = require('path');
var fs = require('fs');
var clean = require('gulp-clean');
var through2 = require('through2');
var tplBaseDir = 'dev/js/tpl/';
var hbsNamespace = 'Vip'; //hbs命名空间
var moduleWrapConfig = {
    amd: {
        start: 'define(["runtime"], function(Handlebars) {',
        end: 'return this["' + hbsNamespace + '"];});'
    },
    cmd: {
        start: 'module.exports = {',
        end: 'return this["' + hbsNamespace + '"];};'
    }
};
// 获取文件目录
function getFolders(dir) {
    return fs.readdirSync(dir)
        .filter(function(file) {
            return fs.statSync(path.join(dir, file)).isDirectory();
        });
}
// handlebars amd 包裹器
function hbsAmdWrap(entry, output, moduleType) {
    if (typeof moduleType === 'undefined') {
        moduleType = 'amd';
    }
    return fs.createReadStream(entry)
        .pipe(through2(function(chunk, enc, callback) {
            chunk = moduleWrapConfig[moduleType].start + chunk + moduleWrapConfig[moduleType].end;
            this.push(chunk);
            callback();
        })).pipe(fs.createWriteStream(output));
}

function taskLoop(basedir, taskfn) {
    var folders = getFolders(basedir);
    var task = folders.map(function(folder) {
        return taskfn(folder);
    });
    return task;
}
gulp.task('del-hbs', function() {
    return gulp.src([tplBaseDir + '**/*.js'], { read: false }).pipe(clean());
});
gulp.task('hbs-compile', ['del-hbs'], function() {
    // var folders = getFolders(tplBaseDir);
    var hbsTask = taskLoop(tplBaseDir, function(folder) {
        var spath = path.join(tplBaseDir, folder, '/[^_]*.hbs');
        return gulp.src(spath)
            .pipe(handlebars({
                handlebars: require('handlebars')
            }))
            .pipe(wrap('Handlebars.template(<%= contents %>)'))
            .pipe(declare({
                namespace: 'Vip',
                noRedeclare: true,
                processName: function(filePath) {
                    //获取文件上级目录和文件名称，比如 account/main.js
                    var fdName = path.join(folder, path.basename(filePath));
                    return declare.processNameByPath(fdName);
                }
            }))
            .pipe(gulp.dest(path.join(tplBaseDir, folder)));
    });
    var partialTask = taskLoop(tplBaseDir, function(folder) {
        var spath = path.join(tplBaseDir, folder, '/_*.hbs');
        return gulp.src(spath)
            .pipe(handlebars({
                handlebars: require('handlebars')
            }))
            .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));', {}, {
                imports: {
                    processPartialName: function(fileName) {
                        // Strip the extension and the underscore
                        // Escape the output with JSON.stringify
                        return JSON.stringify(path.basename(fileName, '.js').substr(1));
                    }
                }
            }))
            .pipe(gulp.dest(path.join(tplBaseDir, folder)));
    });
    return merge(hbsTask, partialTask);
});

gulp.task('hbs-merge', ['hbs-compile'], function() {
    var task = taskLoop(tplBaseDir, function(folder) {
        return gulp.src(path.join(tplBaseDir, folder, '/*[^hbs].js'))
            .pipe(concat('entry.js'))
            .pipe(gulp.dest(path.join(tplBaseDir, folder)));
    });
    return merge(task);
});
gulp.task('ctpl', ['hbs-merge'], function() {
    return gulp.src([tplBaseDir + '**/*.js', '!' + tplBaseDir + '**/entry.js'], { read: false }).pipe(clean());
});
gulp.task('hbs', ['ctpl'], function() {
    // var folders = getFolders(tplBaseDir);
// var tasks = folders.map(function(folder) {
//     var filePath = path.join(tplBaseDir, folder, '/entry.js');
//     return hbsAmdWrap(filePath, path.join(tplBaseDir, folder, '/hbs.js'));
// });

    taskLoop(tplBaseDir, function(folder) {
        var filePath = path.join(tplBaseDir, folder, '/entry.js');
        return hbsAmdWrap(filePath, path.join(tplBaseDir, folder, '/hbs.js'));
    });
});
