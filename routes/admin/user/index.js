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
    app.get('/admin/user', function(req, res, next) {
        res.locals= req.session.userinfo;
        var data={
            title:"用户管理"
        }
        //删除用户
        if(req.query['del']){

            var del=`delete  from users where id= ${req.query['del']} `;

            query(del,function(resuls,fields) {



                if(resuls.affectedRows){
                    //1 获取数据的总数
                    var sqlcount=`select count(*) from users`;
                    query(sqlcount,function(sqlcountres,fields) {
                        var total=sqlcountres[0]["count(*)"]
                        var userdata = [];
                        var num = 6;
                        var start = 0;
                        var sqlalls = `select * from users  limit ${start},${num} `;

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

}
