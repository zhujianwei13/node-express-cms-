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
module.exports=function(app){
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

            //计算当前栏目下文档的个数

            /*
             *   var sqlcount=`select count(*) from node_article_content ${val} `;
             query(sqlcount,function(sqlcountres,fields) {
             })*/

            let sqlall=`select * from node_category`  ;
            query(sqlall,function(resus,files){


                var promises=resus.map(function(item){
                    const promise = new Promise(function(resolve, reject){
                        let sqlcount=`select count(*) from node_article_content where typeid=${item.id} `;
                        query(sqlcount,function(sqlcountres,fields) {
                            item['count']=sqlcountres[0]["count(*)"];
                            resolve(item);
                        })
                    });


                    return     promise

                })


                Promise.all(promises).then(function (promise) {


                    return res.render("admin/category/index.html",{alldata:promise});
                }).catch(function(reason){
                    console.log("请求错误",reason)
                });



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

   //增加子级栏目
app.get("/admin/category/add",function(req,res){
    var  rid=req.query.typeid;

        res.render("admin/category/addSecondaryCate.html",{rid:rid})
})
app.post("/admin/category/add",function(req,res){
        var  rid=req.body.rid;

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


        var insertSql=`insert into node_recategory(typename,keywords,description,sort,idenfy,rid)
        values(\'${data['typename']}\',\'${data['keywords']}\',\'${data['description']}\',${data['sort']},${data['idenfy']},${data['rid']} )`

        query(insertSql,function(insdata,field){
               if(insdata.affectedRows) {
                   console.log("二级栏目:",req.body,insdata)
                   res.render("admin/category/addSecondaryCate.html",{rid:rid})
                 //  res.end(util.inspect(req.body))
               //    res.redirect("/admin/category/add")
               }else {
                   res.render("admin/category/addSecondaryCate.html",{rid:rid})
               }

        })


       // res.render("admin/category/addSecondaryCate.html",{rid:rid})


    })
}
