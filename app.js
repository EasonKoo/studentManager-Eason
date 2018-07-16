//引入模块--------------------------
//引入express 和生成验证码的模块
let express = require("express")

let svgCaptcha = require('svg-captcha');

//引入path模块
let path = require("path");
//引入session模块
let session = require('express-session')
//引入bodyParser模块
let bodyParser = require('body-parser')
//引入mongoDB模块
let MongoClient = require('mongodb').MongoClient;

//模块--------------------------------

//生成app
let app = express();
// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'test';

//中间件-----------------------------------

//开启静态服务器资源托管
app.use(express.static("static"));
//开启session
app.use(session({
    secret: 'keyboard cat',
}))
//解析传递过来的表单数据
app.use(bodyParser.urlencoded({
    extended: false
}))


//中间件-----------------------------------

//路由----------------------------------------
//路由1.
app.get("/login", (req, res) => {
    //请求过来的时候可以用session
    //console.log(req.session);
    res.sendFile(path.join(__dirname, "static/views/login.html"));
})
//路由2
// 使用post 提交数据过来 验证用户登陆
app.post("/login", (req, res) => {
    //console.log(req);

    let userName = req.body.userName;
    let userPass = req.body.userPass;
    let code = req.body.code;
    if (code == req.session.captcha) {
        //如果成功的话
        req.session.userInfo = {
            userName,
            userPass
        }
        //去首页
        res.redirect("/index");

    } else {
        res.setHeader("content-type", "text/html");
        res.send('<script>alert("验证失败,请重试");window.location.href="/login"</script>')
    }

})
//路由3-------------------------------------------
app.get("/login/captcha.png", (req, res) => {

    let captcha = svgCaptcha.create();
    //req.session.captcha = captcha.text;
    //把生成的验证码搞出来用session保存起来
    req.session.captcha = captcha.text.toLocaleLowerCase();
    // console.log(req.session.captcha);


    res.type('svg'); // 使用ejs等模板时如果报错 res.type('html')
    res.status(200).send(captcha.data);

})
//路由4
//首页的逻辑,首页有session,就读取首页返回,没有的话达到登录页
app.get("/index", (req, res) => {
    if (req.session.userInfo) {
        res.sendFile(path.join(__dirname, "static/views/index.html"))
    } else {
        res.setHeader("content-type", "text/html");
        res.send('<script>alert("请登录");window.location.href="/login"</script>')
    }
})

//路由5
//首页点击退出,删除session的userInfo,然后到登录页
app.get("/logout", (req, res) => {
    delete req.session.userInfo; //js中的方法,删除对象的属性
    res.redirect("./login")
})

//路由6 
//点击注册展示登录页面
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "static/views/register.html"));
})

//路由7
//点击注册按钮连接数据库,往数据库里面添加数据
app.post("/register", (req, res) => {
    //获取到用户名和密码
    let userName = req.body.userName;
    let userPass = req.body.userPass;

    MongoClient.connect(url, function (err, client) {

        let db = client.db(dbName);
        let collection = db.collection('user');
        collection.find({
            userName: userName
        }).toArray((err, result) => {
            console.log(result);
            
            if (result.length == 0) {
                //说明没有重复的
                collection.insertOne({
                    userName,
                    userPass
                }, (err, results) => {
                    //console.log("添加成功");
                    res.setHeader("content-type", "text/html");
                    res.send('<script>alert("添加成功");window.location.href="/login"</script>')
                })
            } else {
                //有重复的话就
                res.setHeader("content-type", "text/html");
                res.send('<script>alert("用户名已经存在,请再次输入");window.location.href="/register"</script>')
                 // 关闭数据库连接即可
                 client.close();

            }

        })


        //client.close();
    });




})



//监听
app.listen(8848, "127.0.0.1")