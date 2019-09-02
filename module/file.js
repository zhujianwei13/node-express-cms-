/**
 * Created by Administrator on 2017/12/12.
 */

var path = require("path");
var moment = require("moment");
var multer  = require('multer');

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname,"/../public/uploads"));
    },
    filename: function (req, file, cb) {
        var date = new Date();
        cb(null, "("+moment().format("YYYY-MM-DD")+")"+file.originalname);
    }
});



var upload = multer({ storage: storage })

module .exports=upload;
