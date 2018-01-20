/**
 * Created by Administrator on 2017/12/6.
 */

  var moment=require("moment");
var tool={
    //获取当前时间
    getDate:function(){
        let timestarp=new Date();
        let y=timestarp.getFullYear();
        let m=timestarp.getMonth()+1;
        let d=timestarp.getDay();
        let h=timestarp.getHours();
        let i=timestarp.getMinutes();
        var s=timestarp.getSeconds();

        return `${y}-${m}-${d};${h}:${i}:${s}`;

    }  ,
    //获取cookie
    getCookie:function(name)
    {
        var arr,reg=new RegExp("(^| )"+name+"=([^;]*)(;|$)");
        if(arr=document.cookie.match(reg))
            return unescape(arr[2]);
        else
            return null;
    }            ,
    //删除cookie
    delCookie:function (name)
{
    var exp = new Date();
    exp.setTime(exp.getTime() - 1);
    var cval=getCookie(name);
    if(cval!=null)
        document.cookie= name + "="+cval+";expires="+exp.toGMTString();
}    ,
    //设置cookie
    setCookie: function (name,value)
{
    var Days = 30;
    var exp = new Date();
    exp.setTime(exp.getTime() + Days*24*60*60*1000);
    document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString();
} ,
    //去除数组空值
    ClearNullArr:function (arr){
    for(var i=0,len=arr.length;i<len;i++){
        if(!arr[i]||arr[i]==''||arr[i] === undefined){
            arr.splice(i,1);
            len--;
            i--;
        }
    }
    return arr;
}   ,
    //字符串去空格
trim:function(strings){
    var re=new RegExp("/s+","gi");
        return strings.replace(re,"")
},
    formatdate:   function (date){
    let odate=new Date(date) ;
    var year=odate.getFullYear();
    var mon=odate.getMonth()+1;
    var day=odate.getDate();
    var hour=odate.getHours();
    var min=odate.getMinutes();
    var second=odate.getSeconds();
    return year+":"+mon+":"+day+";"+hour+":"+min+":"+second;
}
}


module.exports=tool;
