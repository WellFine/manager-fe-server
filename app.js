const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const log4js = require('./utils/log4j')
const util = require('./utils/util')
const koajwt = require('koa-jwt')

const router = require('koa-router')()
const users = require('./routes/users')
const menus = require('./routes/menus')
const roles = require('./routes/roles')
const depts = require('./routes/depts')

require('./config/db')  // 引入数据库

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// logger
app.use(async (ctx, next) => {
  log4js.info(`get params: ${JSON.stringify(ctx.request.query)}`)
  log4js.info(`post params: ${JSON.stringify(ctx.request.body)}`)
  // next() 就是进入下一个中间件 koa-jwt，如果拦截的 token 失效或无效，就会抛出错误，走到 catch 回调
  await next().catch(err => {
    if (err.status == 401) {
      ctx.status = 200  // 虽然 koa-jwt 抛出了 401，但我们仍希望返回 200，只是提示 token 认证失败
      ctx.body = util.fail('Token 认证失败', util.CODE.AUTH_ERROR)
    }
  })
})

// koa-jwt 中间件在 token 失效或无效时，不会像以往那样抛出 500 错误，而是抛出 401 状态码
app.use(koajwt({ secret: 'imooc' }).unless({
  path: ['/api/users/login']  // 过滤掉不需要验证 token 的接口，否则登录都登录不了
}))

// 路由，在路由前使用 koa-jwt 拦截认证 token
router.prefix('/api')  // 一级路由
router.use(users.routes(), users.allowedMethods())  // 二级路由
router.use(menus.routes(), menus.allowedMethods())
router.use(roles.routes(), roles.allowedMethods())
router.use(depts.routes(), depts.allowedMethods())
app.use(router.routes(), router.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  log4js.error(err.stack)  // 测试 error 输出
});

module.exports = app
