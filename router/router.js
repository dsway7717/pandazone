//引入db和md5文件
var formidable = require("formidable");
var db = require('../models/db.js');
var md5 = require('../models/md5.js');
var path = require("path");
var fs = require("fs");

var svgCaptcha = require('svg-captcha');

//注册业务
exports.doRegist = function (req, res, next) {
  //得到用户填写的东西
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    //得到表单之后做的事情
    var user = fields.user;
    var name = fields.name;
    var pass = fields.pass;
    var email = fields.email;
    var avatar = fields.avatar || "moren.jpg";
    var sex = fields.sex;
    var born = fields.born;
    var city = fields.city;
    var hobby = fields.hobby;
    var label = fields.label;
    var sign = fields.sign;

    //查询数据库中是不是有这个人
    db.find("users", {"user": user}, function (err, result) {
      if (err) {
        res.send("-3"); //服务器错误
        return;
      }
      if (result.length !== 0) {
        res.send("-1"); //被占用
        return;
      }
      //设置md5加密
      pass = md5(md5(pass) + "考拉");
      //现在可以证明，用户名没有被占用
      db.insertOne("users", {
        "user": user,
        "name": name,
        "pass": pass,
        "email": email,
        "avatar": avatar,
        "sex": sex,
        "born": born,
        "city": city,
        "hobby": hobby,
        "label": label,
        "sign": sign
      }, function (err, result) {
        if (err) {
          res.send("-3"); //服务器错误
          return;
        }

        res.send("1"); //注册成功，写入session
      })
    })
  });
};
// 获取城市列表
exports.getCitys = function (req, res, next) {
  db.find("citys", {}, function (err, result) {
    if (err) {
      res.send("-1"); //服务器错误
      return;
    }
    res.json(result[0].citys);
  });
};
// 生成验证码
exports.getCaptcha = function (req, res, next) {
  var captcha = svgCaptcha.create();
  req.session.captcha = captcha.text;

  res.set('Content-Type', 'image/svg+xml');
  res.status(200).send(captcha.data);
};

exports.checkCaptcha = function (req, res, next) {
  var captcha = req.session.captcha.toLocaleLowerCase();
  res.status(200).json({result: captcha});
};

exports.findUser = function (req, res, next) {
  var user = req.params["user"];
  //查询数据库中是不是有这个人
  db.find("users", {"user": user}, function (err, result) {
    if (err) {
      res.send("-3"); //服务器错误
      return;
    }
    if (result.length !== 0) {
      res.send("-1"); //被占用
    } else {
      res.send("1");
    }
  });
};

// 上传头像
exports.uploadAvatar = function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.uploadDir = path.normalize(__dirname + "/../avatar");
  form.parse(req, function (err, fields, files) {
    // console.log(files);
    var oldpath = files.avatar.path;
    var newName = new Date().getTime() + ".jpg";
    var newpath = path.normalize(__dirname + "/../avatar") + "/" + newName;
    fs.rename(oldpath, newpath, function (err) {
      if (err) {
        res.send("失败");
        return;
      }
      res.send({'id': 101, 'path': '/avatar/' + newName});
    });
  });
};
