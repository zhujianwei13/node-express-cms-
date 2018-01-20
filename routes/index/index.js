

var config=require(`${process.cwd()}/config.js`);  //配置文件
var ROOT= config.ROOT;
var {query}=require(`${ROOT}/sql/mysql.js`) ;
var  util = require('util');
var fs=require("fs");
var path=require("path")
var tool=require(`${ROOT}/funC/func.js`) ;

module.exports =function(app){
   app.locals.webappName = "南京仁康医院";

//导航
app.use(function(req, res, next){
       //获取所有的栏目
       let cateSql=`select * from  node_category limit 0,5 ` ;
       query(cateSql,function(cateData,field){
          app.locals.cateData=cateData;
           next();
       })
   })
//友情链接
app.use(function(req, res, next){
        //获取所有的栏目
        let Sql=`select * from  flink ` ;
        query(Sql,function(data,field){
            app.locals.flinkData=data;
            next();
        })
    })

app.get('/', function(req, res, next) {
     var all=`select * from node_article_content`
      query(all,function(data,field){
          var  data3=[],data4=[],data5=[],data18=[],data22=[],data24=[],data26=[],data23=[],data35=[],data38=[],data39=[],data41=[];
          data.forEach(function(val,index,arr){
              val["date"]=tool.formatdate(val["date"]);
                switch (val.typeid){
                    case 3:
                        data3.push(val);
                        break;
                    case 4:
                        data4.push(val);
                        break;
                    case 5:
                        data5.push(val);
                        break;
                    case 18:
                        data18.push(val);
                        break;
                    case 22:
                        data22.push(val);
                        break;
                    case 24:
                        data24.push(val);
                        break;
                    case 26:
                        data26.push(val);
                        break;
                    case 23:
                        data23.push(val);
                        break;
                    case 35:
                        data35.push(val);
                        break;
                    case 38:
                        data38.push(val);
                        break;
                    case 39:
                        data39.push(val);
                        break;
                    case 41:
                        data41.push(val);
                        break ;


                }
          })
          var   indexData={
              data3:data3, //权威专家
              data4:data4, //医师风采
              data5:data5, //最新技术
              data39:data39,          //医院公告
              data41:data41 ,           //媒体报道
              data35:data35, //失眠症
              data23:data23, //躁狂症
              data24:data24, //精神分裂
              data22:data22, //强迫症
              data26:data26, //精神障碍
              data38:data38, //焦虑症
              data18:data18, //神经衰弱
          }
          res.render('index/index.html', {Data:indexData });

      })
  });

app.use("/index/",function(req,res,next){
           var tid=req.query.tid  ;
    const sql=`SELECT * FROM node_article_content WHERE typeid=${tid} order BY id DESC  LIMIT 0,1 ` ;
    query(sql,function(data,field){;
            app.locals["rightData"]=data[0]

              next();
    } )


})

//列表页
app.get('/index/list', function(req, res, next) {
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
            var num=6;
            var start = (req.query["page"] - 1) * num;
            var sql=`select * from node_article_content  ${val}  ORDER BY  id  DESC limit ${start},${num}`;
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

                var catesql=`select id,typename from node_category where id=${tid}`
                query(catesql,function(cateData,field){
                    return  res.render('index/list.html', { listData: listData ,pagedata:pagedata,currentCate:cateData[0]});
                })


            });
        });


    });

//查看文章页
app.get('/index/article', function(req, res, next) {
           //获取文章数据
     var aid=req.query.aid;
     var arcSql=`select * from node_article_content where id=${aid}` ;
    query(arcSql,function(resData,field){
           // console.log("获取的文章数据:",resData) ;
            var data=resData[0]
            var typeId=data.typeid;

      //获取当前栏目
      var cateSql=`select id , typename from node_category where id=${typeId}`

      query(cateSql,function(typename,field){
        var  typedata=typename[0]

        res.render('index/article.html', { data:data,typedata:typedata });
      })


    })





  });

 app.get("/search",function(req,res){
       // res.render("index/search.html")
        //  res.end("111")
        res.sendFile("index/search/response.html")
    })

//搜索功能
 app.post("/search",function(req,res){
        var data=req.body;
     const sql=`select * from node_article_content where title like \"%${data["keyword"]}%\"`
     query(sql,function(r,f){
         if(r.length){

             console.log("搜索数据:",sql,r)
          res.render("index/search.html",{listData:r})
         }else {
             res.sendFile(`${ROOT}/views/index/search/response.html`)
         }

     })
 })

//表单挂号
 app.post("/admin/order",function(req,res){
     var data=req.body;
     //去空格
     for (var k in data){
         if(typeof  data[k]=="string") {
             data[k]=data[k].trim();
         }
     }

        const sql=`insert into orders(Name,tel,description) values(\"${data['name']}\",\"${data['tel']}\",\"${data['des']}\") `
        query(sql,function(insertData,field){
            ;

            res.redirect(`${data["url"]}`)
        })
    })

} ;
