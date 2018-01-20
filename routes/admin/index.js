/**
 * Created by Administrator on 2017/11/29.
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
module.exports =function(app){
    //用户管理
    require("./public")(app);
    //后台首页
    app.get( '/admin',function(req, res) {
       //  获取上次登录时间



        res.locals=req.session.userinfo;


        res.render('admin/main.html', { title: 'Express' });
    }) ;
    //登录验证
    app.post('/login',function(req, res) {
        //从前台获取的数据；   1:验证码不正确
        var data=JSON.parse(Object.keys(req.body));
         var idenfy=req.session.idenfy;
                                                       //1 验证验证码
         if(data['idenfy']!=idenfy){
          return  res.end("1");  //验证码错误
        }else {
                                                       //2. 验证用户名
      var sql=`select * from users where username= \'${data['loginname']}\'  `;
      query(sql,function(results,fields){
              if(Boolean(results.length)){
                                                       //3. 验证密码
                  var sqlpass=`select date from users where password= \'${data['password']}\'  `;
                  query(sqlpass,function(resuls,fis){
                      if(Boolean(resuls.length)){
                          req.session.loginname=data['loginname']
                          req.session.userinfo=null;
                          req.session.userinfo={
                              name:  data['loginname'],
                              date: resuls[0].date     ,

                          }

                       res.end("4");  //验证成功
                      }else {
                       res.end("3"); //密码错误
                      }
                  })
              }else {
                  res.end("2");  //用户名不存在
              }
      }) ;
         }
    })
    //后台初始页
    app.get('/admin/init', function(req, res, next) {
        res.render('admin/init.html');
    });
    //网站首页管理
    app.get('/admin/index', function(req, res, next) {
        res.locals= req.session.userinfo;
        res.render('admin/default.html', { title: '网站首页管理' });
    });
    //登录验证码
    app.get("/idenfy.png",function(req,res,next){

        var data=randomcodePngController(req,res,next)
        return res.end(data);
    })
    //用户管理
    require("./user")(app);
    //栏目部分
    require("./list")(app);
    //文章部分
    require("./article")(app);
    //友情链接
    require("./flink")(app);

} ;




