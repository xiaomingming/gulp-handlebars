var staticURL = "./js/",
    tplPath = 'tpl/';
// 新增的模板js文件在这里配置
var tplPaths = {
    account: 'account/hbs'
};
var utilsConfig = {
    baseUrl: staticURL,
    paths: {
        jquery: "libs/jquery-1.8.2",
        tpl: "tpl",
        handlebars: "libs/handlebars",
        runtime: "libs/handlebars.runtime"
    },
    shim: {

    }
};
for (var tplProp in tplPaths) {
    utilsConfig.paths['hbs_' + tplProp] = tplPath + tplPaths[tplProp];
}
require.config(utilsConfig);
