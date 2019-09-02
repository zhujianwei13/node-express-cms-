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
    ;
var mime=require("mime")
module.exports =function(app){
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
    //后台首页
    app.get( '/admin',function(req, res) {
        console.log("后台登录信息:",req.session.userinfo)
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
                          console.log("验证成功后获取的结果集:",resuls)

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
    //用户管理
    app.get('/admin/user', function(req, res, next) {
        res.locals= req.session.userinfo;
        var data={
            title:"用户管理"
        }
        //删除用户
        if(req.query['del']){
            console.log("query的值:",req.query['del']);
            var del=`delete  from users where id= ${req.query['del']} `;
            console.log("del:",del);
            query(del,function(resuls,fields) {

                console.log("删除成功y",resuls) ;

                if(resuls.affectedRows){
                    console.log("删除成功y")
                    var sqlall=`select * from users`;
                    query(sqlall,function(ress,fies) {
                        let userdata=[];
                        for(let i =0;i<ress.length;i++){
                            userdata.push(ress[i])
                        }
                        data.user = userdata;
                        console.log("获得的值:",data,userdata)
                        return  res.render('admin/user.html', { data: data });

                    })

                }

            });
            return false;
        }

        //编辑用户

        if(req.query['edit']&&req.query["page"]){
            console.log("edit query的值:",req.query['edit']);
            var sqlone=`select *  from users where id= ${req.query['edit']} `;
            console.log("sqlone:",sqlone);
            query(sqlone,function(rels,fieds) {

                console.log("edit查询结果",rels,rels.length) ;

                if(rels.length>0){

                    let userdata=[];
                    for(let i =0;i<rels.length;i++){
                        userdata.push(rels[i])
                    }
                    data.user = userdata[0];
                    console.log("edit获得的值:",userdata)
                    return  res.render('admin/edit.html', { data: data });


                }

            });
            return false;
        }

        //var start=(req.query.page-1)*num


        //显示用户
        var sqlcount=`select count(*) from users`;
        query(sqlcount,function(sqlcountres,fields) {
            var total=sqlcountres[0]["count(*)"]
            console.log("当前总的数据:",total,sqlcountres)

                  //如果编辑功能







            var userdata=[];
            var num=6;
            var start = (req.query["page"] - 1) * num;
            var sql=`select * from users  limit ${start},${num} `;
            query(sql,function(resuls,fields) {


                for(let i =0;i<resuls.length;i++){
                    userdata.push(resuls[i])
                }
                data.user = userdata;

                //实现分页功能

                var pagedata={
                     "first":1,
                     "end": Math.round(total/num),
                    "total": total,   // 总的条数
                    "ret_code": num,  //每页的条数
                    "totalPages":Math.round(total/num),  // 总页数
                    "currentPage": req.query.page,   // 当前页数
                }
                console.log("当前的pagedata：",pagedata)

                return  res.render('admin/user.html', { data: data ,pagedata:pagedata});



            });



        });








    });
    //增加管理员（用户）
    app.post('/admin/user', function(req, res, next) {

        var form = new formidable.IncomingForm();
        var data={
            title:"用户管理"
        }

        //上传文件配置项
           with (form){
               encoding="utf-8";       //编码
               uploadDir= path.join(__dirname,"temp");       //临时目录
               keepExtensions=true;//保存扩展名
               type="multipart"      //multipart or   urlencoded
               maxFields=1000; // 可接收最大字段的数量
               maxFieldsSize=2*1024*1024;// 文件大小
               hash="md5"   //对上传文件进行hash 检验
           }

        form.parse(req,function(err,fields,file){
            if(err){
                console.log("错误:",err)   ;
                return false;
            } ;

 // num1 处理  获取上传后文件的信息
            var filename;
            // 1   获取图片文件的位置
               var fileTempPath=''
               if(file.himg){
                   fileTempPath=file.himg.path;

               } ;
               //2   实际放存的目录
              var targetDir = path.join(ROOT, 'public/uploads');
                 //判断  如果目录不存在   就创建目录
            if(!fs.existsSync(targetDir)) {
                fs.mkdir(targetDir) ;
            }
               // 3. 获取文件的类型
            var fileExt=fileTempPath.substring(fileTempPath.lastIndexOf('.')+1).trim();
            //约束上传文件的类型
            var filetype=["jpg","jpeg","gif","png"]  ;
           if(filetype.indexOf(fileExt)!=-1){
                 //1 设置新文件名
               filename=file.himg.name;
                 //2 移动后的文件位置
               var targetFile=path.join(targetDir,filename);
                // 3. 移动文件
               fs.rename(fileTempPath,targetFile,function(err){
                   if(err){
                       console.info(err);
                       res.json({code:-1, message:'操作失败'});
                   }

               })
         }else {
               var err = new Error('此文件类型不允许上传');
               res.json({code:-1, message:'此文件类型不允许上传'});
           }

// num2  处理 其他字段信息
            fields['timg']=`uploads/${filename}`;

            if(fields.sex=="男"){
                fields.sex=1
            }else {
                fields.sex=0
            }

           //验证用户名和邮箱是否已经存在了
            var sqlusernane=`select * from users where username= \'${fields['username']}\'  or  email= \'${fields['email']}\'`;
            query(sqlusernane,function(resuls,fis){
                if(Boolean(resuls.length)){
  //用户名邮箱已经存在

                    //通过编辑来的数据

                    if(req.query['edit']){
                        let updatedata=fields;
var update=`update users set username=\'${updatedata.username}\',password=${updatedata.password},sex=${updatedata.sex},email=\'${updatedata.email}\',tel=${updatedata.tel},timg=\'${updatedata.timg}\'   where id= ${req.query['edit']}`;
                        query(update,function(updateres,updatefds) {
                                 if(updateres.affectedRows){
                                     //数据更新 成功后
                                     var sqlalls=`select * from users order by id DESC;`;
                                     query(sqlalls,function(resss,fies) {
                                         let userdata=[];
                                         for(let i =0;i<resss.length;i++){
                                             userdata.push(resss[i])
                                         }
                                         data.user = userdata;
                                         return  res.render('admin/user.html', { data: data });
                                     })
                                 }
                        })

                    }else{
                        //提交来的数据
                        res.end(util.inspect(resuls))
                    }


                }else {
                    //用户名邮箱    不存在


  var sqlss=`insert into users(username,password,sex,email,tel,timg) VALUES(\'${fields.username}\',\'${fields.password}\',${fields.sex},\'${fields.email}\',${fields.tel},\'${fields.timg}\')`;

          query(sqlss,function(results,fieldss) {
          if (results.affectedRows) {
          //用户名邮箱已经存在
          console.log("存在",results,fieldss);
        //  res.end("返回值:",util.inspect(results))

              var sqlall=`select * from users order by id DESC`;
              query(sqlall,function(ress,fies) {
                  var userdata=[];
                  for(let i =0;i<ress.length;i++){
                      userdata.push(ress[i])
                  }
                  data.user = userdata;
                  return  res.render('admin/user.html', { data: data });

              })



          }


          })

                   // res.end(util.inspect(fields))



                }
            })







  });


    })



     //登录验证码
    app.get("/idenfy.png",function(req,res,next){

        var data=randomcodePngController(req,res,next)
        return res.end(data);
    })

} ;




