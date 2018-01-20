/**
 * Created by Administrator on 2018/1/2.
 */

var config=require(`${process.cwd()}/config.js`);  //配置文件
var ROOT= config.ROOT;
var randomcodePngController=require(`${ROOT}/funC/idenfy.js`) ;
var {query}=require(`${ROOT}/sql/mysql.js`) ;
var tool=require(`${ROOT}/funC/func.js`) ;
//var upload=require(`${ROOT}/module/file.js`) ;
var formidable = require('formidable');
var  util = require('util');
var fs=require("fs");
var path=require("path")
var mime=require("mime")
module .exports=function(app){

    //安全退出功能
    app.get("/lgout",function(req,res,next){

        //req.session.loginname='' ;
        //更新上次登录的时间
        var t=tool.getDate();
        res.cookie('lasttime',t, {expires: new Date(Date.now() + 900000), httpOnly: true })
        console.log("退出")
        return  res.render('admin/login.html');


    });
    //注销功能
    app.get("/delete",function(req,res,next){
        var username=req.session.loginname;
        let sql=`delete  from users where username= \'${username}\'  `;
        query(sql,function(results,fields){
            if(results.affectedRows) {
                return res.end("1 ")
            }
        } ) ;

        res.writeHead(200, {'Content-Type': 'text/html'});
        res.write('<head><meta charset="utf-8"/></head>');
        res.write("<a href='/'>删除成功</a>");
        return  res.write(`<script>
               setTimeout(function(){
               window.location.href="/" ;
               },1000)
        </script>`);
    });
    //验证是否登录
    app.all(["/admin","/admin/*?"],function(req,res,next){
        if(typeof req.session.loginname!="undefined"){
            //获取上次登录时间功能
            var t=tool.getDate();
            if(!req.cookies.lasttime){
                res.cookie('lasttime',t, {expires: new Date(Date.now() + 900000), httpOnly: true })
            }else {
                req.session.userinfo['lasttime']= req.cookies.lasttime
            }

            next()
        }else {
            res.render('admin/login.html');
        }
    })



}
