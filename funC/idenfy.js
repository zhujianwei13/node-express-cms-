/**
 * Created by Administrator on 2017/11/30.
 */

//验证码功能

  var captchapng = require('captchapng');
function randomcodePngController(req , res , next){
    var code = '0123456789';
    var length = 4;
    var randomcode = '';

    for (var i = 0; i < length; i++) {
        randomcode += code[parseInt(Math.random() * 1000) % code.length];
    }
    // 保存到session
    if (!req.session['idenfy']) {
        req.session['idenfy'] = '';
    }

    req.session['idenfy'] = randomcode;

    // 输出图片
    var p = new captchapng(80,30,parseInt(randomcode)); // width,height,numeric captcha
    p.color(255, 255, 255, 0);  // First color: background (red, green, blue, alpha)
    p.color(80, 80, 80, 255); // Second color: paint (red, green, blue, alpha)
    var img = p.getBase64();
    var imgbase64 = new Buffer(img,'base64');
    res.writeHead(200, {
        'Content-Type': 'image/png'
    });
    res.end(imgbase64);
}

module.exports=randomcodePngController
