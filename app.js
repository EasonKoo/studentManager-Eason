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
//引入工具
let myT = require(path.join(__dirname, "tools/myT.js"))
//引入首页的模块
let indexRouter = require("./router/indexRoute.js")




//模块--------------------------------
//生成app
let app = express();

//把art-template设置为模板引擎
app.engine('html', require('express-art-template'));
//时候设置art文件的路劲
app.set('views', '/static/views');

//中间件-----------------------------------

//开启静态服务器资源托管
app.use(express.static("static"));
//开启session
app.use(session({
    secret: 'keyboard cat',
}))
//解析传递过来的post数据
app.use(bodyParser.urlencoded({
    extended: false
}))
//首页的路由中间件
app.use("/index",indexRouter)

//中间件-----------------------------------

//路由----------------------------------------
//路由1.
app.get("/login", (req, res) => {
    //请求过来的时候可以用session
    //console.log(req.session);
    res.sendFile(path.join(__dirname, "static/views/login.html"));
})
//路由2
// 使用post 提交数据过来 验证用户登陆,验证成功的话就创建session,并跳转到/index,
//浏览器跳转至后马上就会发起请求,执行中间件
app.post("/login", (req, res) => {
    //console.log(req);
    let userName = req.body.userName;
    let userPass = req.body.userPass;
    let code = req.body.code;
    if (code == req.session.captcha) {
        //接着验证用户名和密码
        myT.find("user", {
            userName,
            userPass
        }, (err, docs) => {
            if (docs.length == 1) {
                //如果成功的话
                req.session.userInfo = {
                    userName,
                }
                //去首页
                res.redirect("/index");
            }else{
                myT.mess(res,"验证失败,请重试","/login")
            }

        })

    } else {
        myT.mess(res,"验证失败,请重试","/login")
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
        myT.mess(res, "请登录", "/login")
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

    myT.find("user", {
        userName
    }, (err, docs) => {
        if (docs.length == 0) {
            //没有
            myT.insert("user", {
                userName,
                userPass
            }, (err, results) => {


                if (!err) myT.mess(res, "欢迎入坑", "/login")
            })
        } else {
            //有
            myT.mess(res, "已被注册,换一个", "/register")
        }
    })



})



//监听
app.listen(8848, "127.0.0.1")