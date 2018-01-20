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
//友情链接模块请求
module .exports=function(app){

    app.get("/admin/flink",function(req,res){

        const findSql=`select id,webname,url,datetimes from flink` ;
        query(findSql,function(fdata,field){
            fdata.forEach(v=>{
                v.datetimes=tool.formatdate(v.datetimes)

            })
            res.render("admin/flink/index.html",{data:fdata})
        })
    })
   //增加
    app.get("/admin/flink/add",function(req,res){

        res.render("admin/flink/add.html")
    })
    //插入
    app.post("/admin/flink/add",function(req,res){
        var data=req.body;

        //去除空格

        for(var k in data){
            data[k]=data[k].trim()
        }



        const sqlInsert=`insert into flink(webname,url,contact) values(\"${data['webname']}\",\"${data['url']}\",\"${data['contact']}\")`;
        query(sqlInsert,function(insertDatas,field){
            res.redirect("/admin/flink")

        })


        //   res.end("1")
    })


        //  更改
    app.get("/admin/flink/update",function(req,res){

       const getSql=`select id,webname,url,contact from flink where id=${req.query.id}`  ;

        query(getSql,function(data,field){

            console.log("更新:",data,getSql)

            res.render("admin/flink/update.html",{data:data[0]})
        })


    })


    app.post("/admin/flink/update",function(req,res){
          var  gdata=req.body;

        const muSql=`update flink set webname=\"${gdata["webname"]}\" ,url=\"${gdata["url"]}\",contact=\"${gdata["contact"]}\"
        where id=${gdata["gid"]}`  ;
        console.log("更新post:",muSql)

        console.log("更新id:",gdata['gid'])

     query(muSql,function(data,field){

     console.log("更新更改:",data)
     if(data.affectedRows){
     res.redirect("/admin/flink") ;
     }


     })

    })

    //删除友情链接
    app.get("/admin/flink/del",function(req,res){

        const del=`delete from flink where id=${req.query.id}` ;
        query(del,function(deldata,field){
            if(deldata.affectedRows){
                res.redirect("/admin/flink")
            }
        })

    })



}
