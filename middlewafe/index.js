/**
 * Created by Administrator on 2017/11/29.
 */

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session=require("express-session");
var cors = require('cors');  //ajax跨域
//var MemcachedStore = require('connect-memcached')(session); //session 的存储
module.exports=function(app){
    app.use(logger('dev'));
    app.use(bodyParser({uploadDir:'../public/uploads'}));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.use(session({
        secret:'12345',
        cookie:{maxAge:new Date(Date.now() + 24*60 * 60 * 1000)},
        resave:true,

    }))

}
