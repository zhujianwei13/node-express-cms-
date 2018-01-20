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
//使用模块




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
                    //1 获取数据的总数
                    var sqlcount=`select count(*) from users`;
                    query(sqlcount,function(sqlcountres,fields) {
                        var total=sqlcountres[0]["count(*)"]
                        var userdata = [];
                        var num = 6;
                        var start = 0;
                        var sqlalls = `select * from users  limit ${start},${num} `;
                        console.log("sql:",sqlalls)
                        query(sqlalls, function (resss, fies) {
                            for (let i = 0; i < resss.length; i++) {
                                userdata.push(resss[i])
                            }
                            data.user = userdata;
                            //实现分页功能
                            var pagedata = {
                                "first": 1,
                                "end": Math.round(total / num),
                                "total": total,   // 总的条数
                                "ret_code": num,  //每页的条数
                                "totalPages": Math.round(total / num),  // 总页数
                                "currentPage": req.query.page,   // 当前页数
                            }
                            return res.render('admin/user.html', {data: data, pagedata: pagedata});
                        })
                    })
                }

            });
            return false;
        }
        //显示用户
        var sqlcount=`select count(*) from users`;
        query(sqlcount,function(sqlcountres,fields) {
            var total=sqlcountres[0]["count(*)"]
            var userdata=[];
            var num=6;
            var start = (req.query["page"] - 1) * num;
            var sql=`select * from users   ORDER BY  id  DESC limit ${start},${num}`;
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
        return  res.render('admin/userManner/user.html', { data: data ,pagedata:pagedata});
            });
        });
    });

    //修改用户信息
    app.get('/admin/user/edit', function(req, res, next) {
        //编辑用户
        var data={
            title:"用户管理"
        }
            var sqlone=`select *  from users where id= ${req.query['edit']} `;
            console.log("sqlone:",sqlone);
            query(sqlone,function(rels,fieds) {
                if(rels.length>0){
                    let userdata=[];
                    for(let i =0;i<rels.length;i++){
                        userdata.push(rels[i])
                    }
                    data.user = userdata[0];
                    return  res.render('admin/userManner/edit.html', { data: data });
                }

            });
            return false;
    })
    //提交修改用户信息
    app.post('/admin/user/edit', function(req, res, next) {
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


 //通过编辑来的数据
            //1  更新数据
    if (req.query['edit']) {
          let updatedata = fields;
 var update = `update users set username=\'${updatedata.username}\',password=${updatedata.password},sex=${updatedata.sex},email=\'${updatedata.email}\',tel=${updatedata.tel},timg=\'${updatedata.timg}\'   where id= ${req.query['edit']}`;
                        console.log("编辑后提交的数据集:", updatedata, update)
                        query(update, function (updateres, updatefds) {
                            if (updateres.affectedRows) {
                                //数据更新 成功后     返回要显示的数据
                                       //1 获取数据的总数
                                var sqlcount=`select count(*) from users`;
                                query(sqlcount,function(sqlcountres,fields) {
                                var total=sqlcountres[0]["count(*)"]
                                var userdata = [];
                                var num = 6;
                                var start = 0;
                                var sqlalls = `select * from users ORDER BY  id  DESC  limit ${start},${num} `;
                                query(sqlalls, function (resss, fies) {
                                    for (let i = 0; i < resss.length; i++) {
                                        userdata.push(resss[i])
                                    }
                                    data.user = userdata;

                                    //实现分页功能
                                    var pagedata = {
                                        "first": 1,
                                        "end": Math.round(total / num),
                                        "total": total,   // 总的条数
                                        "ret_code": num,  //每页的条数
                                        "totalPages": Math.round(total / num),  // 总页数
                                        "currentPage": req.query.page,   // 当前页数
                                    }
                                    return res.render('admin/userManner/user.html', {data: data, pagedata: pagedata});
                                })
                                })
                            }
                        })

 }

        })

    })
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
                        //提交来的数据
                        res.end(util.inspect(resuls))

                }else {
                    //用户名邮箱    不存在


  var sqlss=`insert into users(username,password,sex,email,tel,timg) VALUES(\'${fields.username}\',\'${fields.password}\',${fields.sex},\'${fields.email}\',${fields.tel},\'${fields.timg}\')`;

          query(sqlss,function(results,fieldss) {
          if (results.affectedRows) {
          //用户名邮箱已经存在
          console.log("存在",results,fieldss);
        //  res.end("返回值:",util.inspect(results))
                  //数据更新 成功后     返回要显示的数据
                  //1 获取数据的总数
                  var sqlcount=`select count(*) from users`;
                  query(sqlcount,function(sqlcountres,fields) {
                      var total=sqlcountres[0]["count(*)"]
                      var userdata = [];
                      var num = 6;
                      var start = 0;
                      var sqlalls = `select * from users ORDER BY  id  DESC  limit ${start},${num} `;
                      query(sqlalls, function (resss, fies) {
                          for (let i = 0; i < resss.length; i++) {
                              userdata.push(resss[i])
                          }
                          data.user = userdata;

                          //实现分页功能
                          var pagedata = {
                              "first": 1,
                              "end": Math.round(total / num),
                              "total": total,   // 总的条数
                              "ret_code": num,  //每页的条数
                              "totalPages": Math.round(total / num),  // 总页数
                              "currentPage": req.query.page,   // 当前页数
                          }
                          return res.render('admin/userManner/user.html', {data: data, pagedata: pagedata});
                      })
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

    //========================================>栏目部分
    app.get("/admin/category",function(req,res,next){
      //删除栏目
        if(req.query["del"]){
            let delsql=`delete from  node_category where id= ${req.query["del"]}`
           query(delsql,function(delres,delfield){
                if(delres.affectedRows){
                    let sqlall=`select * from node_category`  ;
                    query(sqlall,function(resus,files){
                        return  res.render("admin/category/index.html",{alldata:resus});
                    })
                }
           })

        }else if(req.query["update"]){
           //编辑栏目功能
           let sqlone=`select * from node_category where id=${req.query["update"]}` ;
           query(sqlone,function(re,fie){
               let data=re;
               return    res.render("admin/category/eDitCate.html",{data:data});
           })

       }   else {

           let sqlall=`select * from node_category`  ;
           query(sqlall,function(resus,files){
               //  console.log("获取总数据:",resus,typeof resus,Array.isArray(resus))
               return res.render("admin/category/index.html",{alldata:resus});
           })
       }
    })
   //增加顶级栏目
    app.get("/admin/category/addTopCate",function(req,res,next){

        res.render("admin/category/addTopCate.html")
    })
    app.post("/admin/category/addTopCate",function(req,res,next){

         var data=req.body;
        //去空格
         for (var k in data){
            if(typeof  data[k]=="string") {
                data[k]=data[k].trim();
            }
         }

        if(!data['sort']){
            data['sort']=0;
        }  else {
            data['sort']=parseInt(data['sort']);
        }
        if(!data['idenfy']){
            data['idenfy']=0;
        }  else {
            data['idenfy']=1;
        }


//处理删除的数据功能


        if(req.query['update']){
//处理更新的数据功能
 var updatesql=`update node_category set typename=\'${data['typename']}\', keywords=\'${data['keywords']}\',description=\'${data['description']}\',sort=${data['sort']}, idenfy=${data['idenfy']}   where id=${data['id']}  `  ;
            query(updatesql,function(ru,fu){
                //更新成功后显示数据
                if(ru.affectedRows){
                    let sqlall=`select * from node_category`  ;
                    query(sqlall,function(resus,files){
                        return  res.render("admin/category/index.html",{alldata:resus});
                    })
                }
            })
        }  else {

 //处理增加栏目的数据功能
        //判断添加的栏目名是否已经存在
         const sqlone=`select * from node_category where typename=\'${data['typename']}\' ` ;
        query(sqlone,function(resus,fiels){
            if(resus.length>0){
                //添加的栏目已经存在
                var html=fs.readFileSync('views/admin/category/cateExist.html');
                return res.end(html);
            }else {
                       //向数据库添加数据
                       const sqlInsert=`insert into node_category(typename,keywords,description,sort,idenfy) values(\'${data['typename']}\',\'${data['keywords']}\',
                  \'${data['description']}\',${data['sort']},${data['idenfy']}
                  ) `  ;

                       query(sqlInsert,function(results,field){
                           //插入成功后显示数据
                           if(results.affectedRows){

                               let sqlall=`select * from node_category`  ;
                               query(sqlall,function(resus,files){
                                   return  res.render("admin/category/index.html",{alldata:resus});
                               })
                           }
                       })  ;
            }

        })

        }








    //    console.log("数据:",data,sqlInsert);
   //     res.end(sqlInsert)

    })

    //========================================>文章部分
         //处理编辑器上传图片的问题
    app.post("/upload",function(req,res,next){
        var form = new formidable.IncomingForm();
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
        form.parse(req,function(err,fields,file) {
            if (err) {
                console.log("错误:", err);
                return false;
            }



            var imgsval=Object.values(file);
            // num1 处理  获取上传后文件的信息

            // 1   获取图片文件的位置

            var fileTempPath = ''
             var imgArr=[];
            //1  实际放存的目录
            var targetDir = path.join(ROOT, 'public/uploads');
                 for(var i=0;i<imgsval.length;i++){
                     fileTempPath = imgsval[i].path;

                     //1 设置新文件名
                    let filename =imgsval[i].name;
                     imgArr.push(imgsval[i].name)
                    let targetFile = path.join(targetDir, filename);

                     // 3. 移动文件
                     fs.rename(fileTempPath, targetFile, function (err) {
                         if (err) {
                             console.info(err);
                             res.json({code: -1, message: '操作失败'});
                         }

                         console.log("图片上传成功")
                          var aimgurl=[];
                            for(var i=0; i<imgArr.length;i++){
                               let imgurl="/uploads/"+imgArr[i];
                                aimgurl.push(imgurl)
                            }
                         var data={
                             errno: 0,
                             data: aimgurl
                         }
                         data= JSON.stringify(data);
                         console.log("返回的数据:",data)
                            res.end(data)

                     })
                 }



        })
    }) ;

    app.get("/admin/article",function(req,res,next){

        //更改文章
        if(req.query.edit!='1'||req.query.edit=="") {
            //显示添加的文章
            var sql=`select * from node_category`  ;
            query(sql,function(re,fe){
                console.log("请求更改1：",sql)
                let cateData=re;
                return  res.render("admin/article/index.html",{cateData:cateData}) ;
                /*
                 let data={
                 id:2,
                 typeid:1
                 }
                 */
                // res.render("admin/article/success.html",{data:data})    ;


            })   ;
        }  else {
            let aid=req.query.aid;
            let sqlone=`select * from node_article_content where id=${aid}`    ;
            query(sqlone,function(arcdata,field){
                var currentData=arcdata[0]     //当前文章的数据
                //显示添加的文章
                var sql=`select * from node_category`  ;
                query(sql,function(re,fe){
                    let cateData=re;
               return  res.render("admin/article/index2.html",{cateData:cateData,currentData:currentData})

                })   ;

            })
        }







    })

    app.post("/admin/article",function(req,res,next){

        var form = new formidable.IncomingForm();
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


            //如果缩略图存在
            var imgpath='' ,imgname='';
            if(file.thumbnail){
                imgpath=file.thumbnail.path;
                imgname=file.thumbnail.name;
                fields['thumbnail']=`arcUploads/${imgname}`;
            }  else {
                fields['thumbnail']='';
            }


            //2   实际放存的目录
            var targetDir = path.join(ROOT, 'public/arcUploads');
            //判断  如果目录不存在   就创建目录
            if(!fs.existsSync(targetDir)) {
                fs.mkdir(targetDir) ;
            }

            // 3. 获取文件的类型
             //约束上传文件的类型
            var filetype=["jpg","jpeg","gif","png"]  ;
            if(filetype.indexOf(fileExt)!=-1){
                //2 移动后的文件位置
                var targetFile=path.join(targetDir,imgname);
                // 3. 移动文件
fs.rename(imgpath,targetFile,function(err){
                    if(err){
                        console.info(err);
                        res.json({code:-1, message:'操作失败'});
                    }

    var aid=req.query.edit

    if(!req.query.edit) {
        //1 验证添加的文章标题是否已经存在
        var titleIsExist = `select title from node_article_content where title=\'${fields.title}\' `;
        query(titleIsExist, function (titleres, titlefield) {
            if (titleres.length > 0) {;
                res.render("admin/article/exit.html");
            } else {
                //标题不存在   插入数据
                //开始插入数据库
                var sqlInsert = `insert into node_article_content(title,keywords,descriptions,author,thumbnail,content,typeid,flags)
               VALUES(\'${fields.title}\',\'${fields.keywords}\',\'${fields.descriptions}\',\'${fields.author}\',
               \'${fields.thumbnail}\',\'${fields.content}\',${fields.typename},\'${fields["flags[]"]}\')`;
                query(sqlInsert, function (insertRes, insertFields) {

                    var sqlId = `select id,typeid from node_article_content where title=\'${fields.title}\' `;
                    query(sqlId, function (sqlid, idfield) {
                        let data = sqlid[0];
                        console.log("data:", data)
                        res.render(`admin/article/success.html`, {data: data})

                    })
                })


            }


        })

    } else {

        //开始插入数据库
        var sqlUpdate = `update node_article_content set title=\'${fields.title}\',keywords=\'${fields.keywords}\',
        descriptions=\'${fields.descriptions}\',author=\'${fields.author}\',thumbnail=\'${fields.thumbnail}\',
        content=\'${fields.content}\',typeid=${fields.typename},flags=\'${fields["flags[]"]}\'  where id=${aid} `;
        query(sqlUpdate, function (insertRes, insertFields) {

            var sqlId = `select id,typeid from node_article_content where title=\'${fields.title}\' `;
            query(sqlId, function (sqlid, idfield) {
                let data = sqlid[0];
                console.log("data:", data)
                res.render(`admin/article/success.html`, {data: data})

            })
        })


    }







})  ;


            }else {
                var err = new Error('此文件类型不允许上传');
                res.json({code:-1, message:'此文件类型不允许上传'});
            }

        })

    })

     //后台显示当前栏目的文章
    app.get("/admin/list",function(req,res,next){
                var val;
                if(req.query.tid) {
                    var tid=req.query.tid;
                     val=`where typeid=${tid} `  ;
                }   else {
                    val=''
                }

        var sqlcount=`select count(*) from node_article_content ${val} `;
        query(sqlcount,function(sqlcountres,fields) {
            var total=sqlcountres[0]["count(*)"]
            var userdata=[];
            var num=12;
            var start = (req.query["page"] - 1) * num;
            var sql=`select id,title ,updatetime from node_article_content  ${val}  ORDER BY  id  DESC limit ${start},${num}`;
            query(sql,function(resuls,fields) {
                for(let i =0;i<resuls.length;i++){
                    userdata.push(resuls[i])
                    resuls[i].updatetime=tool.formatdate(resuls[i].updatetime);
                    console.log("date:",resuls[i].updatetime)
                }
                listData = userdata;


                //实现分页功能
                var pagedata={
                    "first":1,
                    "end": Math.round(total/num),
                    "total": total,   // 总的条数
                    "ret_code": num,  //每页的条数
                    "totalPages":Math.round(total/num),  // 总页数
                    "currentPage": req.query.page,   // 当前页数
                }
                return  res.render('admin/list/index.html', { listData: listData ,pagedata:pagedata});
            });
        });








    })

    //删除文章
    app.get("/admin/article/del",function(req,res){

          var arcid=req.query.aid;
         var sqldel=`delete from  node_article_content where id=${arcid}` ;
        console.log("删除成功后:",arcid,sqldel)
        query(sqldel,function(resda,fields){
                          //删除成功后

                     if(resda.affectedRows){
                         var val;
                         if(req.query.tid) {
                             var tid=req.query.tid;
                             val=`where typeid=${tid} `  ;
                         }   else {
                             val=''
                         }
                         var sqlcount=`select count(*) from node_article_content ${val} `;
                         query(sqlcount,function(sqlcountres,fields) {
                             var total=sqlcountres[0]["count(*)"]
                             var userdata=[];
                             var num=12;
                             var start = (req.query["page"] - 1) * num;
                             var sql=`select id,title ,updatetime from node_article_content  ${val}  ORDER BY  id  DESC limit ${start},${num}`;
                             query(sql,function(resuls,fields) {
                                 for(let i =0;i<resuls.length;i++){
                                     userdata.push(resuls[i])
                                     resuls[i].updatetime=tool.formatdate(resuls[i].updatetime);
                                     console.log("date:",resuls[i].updatetime)
                                 }
                                 listData = userdata;


                                 //实现分页功能
                                 var pagedata={
                                     "first":1,
                                     "end": Math.round(total/num),
                                     "total": total,   // 总的条数
                                     "ret_code": num,  //每页的条数
                                     "totalPages":Math.round(total/num),  // 总页数
                                     "currentPage": req.query.page,   // 当前页数
                                 }
                                 return  res.render('admin/list/index.html', { listData: listData ,pagedata:pagedata});
                             });
                         });
                     }



        })











    })



} ;




