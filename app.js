

var http=require("http");
var express = require('express');
var path = require('path'); //目录模块
var middleeWafe=require("./middlewafe");   //中间件
var routeIndex = require('./routes/index/');     //前端路由
var routeAdmin = require('./routes/admin/');     //前端路由
var error=require("./error")
//应用
var app = express();


//应用设置
app.set("port",81||process.env.PORT);
app.disable("view cache");

// 模板引擎设置
app.engine('html', require('ejs').renderFile);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

//设置静态目录
app.use(express.static(path.join(__dirname, 'public')));

//全局变量设置


middleeWafe(app)  //使用中间件
routeIndex(app);       //前端路由
routeAdmin(app); //后台路由
error(app)        //错误处理



var server=http.createServer(app);
server.listen(app.get("port"),function(){
  console.log("服务器开始执行")
})




