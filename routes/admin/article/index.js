/**
 * Created by Administrator on 2018/1/2.
 */
var config=require(`${process.cwd()}/config.js`);  //配置文件
var ROOT= config.ROOT;
var randomcodePngController=require(`${ROOT}/funC/idenfy.js`) ;
var {query}=require(`${ROOT}/sql/mysql.js`) ;
var tool=require(`${ROOT}/funC/func.js`) ;
var formidable = require('formidable');
var  util = require('util');
var fs=require("fs");
var path=require("path")
var mime=require("mime")
module .exports=function(app){

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
                                res.render(`admin/article/success.html`, {data: data})

                            })
                        })


                    }







                })  ;




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
            var sql=`select typeid, id,title ,updatetime ,author from node_article_content  ${val}  ORDER BY  id  DESC limit ${start},${num}`;
            query(sql,function(resuls,fields) {
                for(let i =0;i<resuls.length;i++){
                    userdata.push(resuls[i])
                    resuls[i].updatetime=tool.formatdate(resuls[i].updatetime);

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





}
