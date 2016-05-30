# gulp-handlebars
gulp-handlebars demo，提供按目录打包的方式，支持amd打包。
之前用过`grunt-contrib-handlebars`,感觉`grunt`的组件成熟度比较高，质量很好，而`gulp`就让人觉得相当不靠谱了。
用过`grunt-contrib-handlebars`都知道，该组件支持按目录进行hbs的预编译工作，但是，gulp-handlebars官方demo中，你是找不到相关示例的。
另外，`grunt-contrib-handlebars`支持将当前目录下的`hbs`预编译成支持`amd`格式的`js`文件，但是`gulp-handlebars`则不支持。

本项目提供`gulp-handlebars`按目录预编译hbs的，并封装为`amd`格式的模块的示例。
