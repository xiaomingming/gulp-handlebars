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
var defineModule = require('gulp-define-module');
var wrapAmd = require('gulp-wrap-amd');
var tplBaseDir = 'dev/js/tpl/';
var hbsNamespace = 'myApp'; //hbs命名空间
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
    return gulp.src([tplBaseDir + '**/*.js'], {
        read: false
    }).pipe(clean());
});
gulp.task('hbs-compile', ['del-hbs'], function() {
    var hbsTask = taskLoop(tplBaseDir, function(folder) {
        var spath = path.join(tplBaseDir, folder, '/[^_]*.hbs');
        return gulp.src(spath)
            .pipe(handlebars({
                handlebars: require('handlebars')
            }))
            .pipe(wrap('Handlebars.template(<%= contents %>)'))
            .pipe(declare({
                namespace: hbsNamespace,
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
            .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, this["' + hbsNamespace + '"][<%= processPartialName(file.relative).split("/")[0] %>"]["<%= processPartialName(file.relative).split("/")[1] %>] = Handlebars.template(<%= contents %>));', {}, {
                imports: {
                    processPartialName: function(fileName) {
                        return JSON.stringify(folder + '/' + path.basename(fileName, '.js'));
                    }
                }
            }))
            .pipe(gulp.dest(path.join(tplBaseDir, folder)));
    });
    return merge(hbsTask, partialTask);
});
gulp.task('hbs-partials', function() {
    var spath = tplBaseDir + '/_*.hbs';
    return gulp.src(spath)
        .pipe(handlebars({
            handlebars: require('handlebars')
        }))
        .pipe(wrap('Handlebars.registerPartial(<%= processPartialName(file.relative) %>, Handlebars.template(<%= contents %>));', {}, {
            imports: {
                processPartialName: function(fileName) {
                    return JSON.stringify(path.basename(fileName, '.js'));
                }
            }
        }))
        .pipe(gulp.dest(tplBaseDir));
});
gulp.task('hbs-merge', ['hbs-compile', 'hbs-partials'], function() {
    var task = taskLoop(tplBaseDir, function(folder) {
        return gulp.src([path.join(tplBaseDir, folder, '/[^_]*.js'), path.join(tplBaseDir, folder, '/_*.js'), tplBaseDir + '/_*.js'])
            .pipe(concat('hbs.js'))
            .pipe(gulp.dest(path.join(tplBaseDir, folder)));
    });
    return merge(task);
});
gulp.task('ctpl', ['hbs-merge'], function() {
    return gulp.src([tplBaseDir + '**/*.js', '!' + tplBaseDir + '**/hbs.js', '!' + tplBaseDir + '/*.js'], {
        read: false
    }).pipe(clean());
});
gulp.task('hbs-common', function() {
    var spath = tplBaseDir + '/[^_]*.hbs';
    return gulp.src(spath)
        .pipe(handlebars())
        .pipe(defineModule('amd', {
            require: {
                Handlebars: 'runtime',
                helpers: 'helpers'
            }
        }))
        .pipe(gulp.dest(tplBaseDir));
});
gulp.task('hbs', ['ctpl', 'hbs-common'], function() {
    var task = taskLoop(tplBaseDir, function(folder) {
        var filePath = path.join(tplBaseDir, folder, '/hbs.js');
        return gulp.src(filePath).pipe(wrapAmd({
            deps: ['runtime', 'helpers'],
            params: ['Handlebars', 'helpers'],
            exports: 'this["' + hbsNamespace + '"]',
        })).pipe(gulp.dest(tplBaseDir + '/' + folder));
    });
    return merge(task);
});