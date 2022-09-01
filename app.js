const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const log4js = require('./utils/log4j')

const router = require('koa-router')()
const users = require('./routes/users')

const jwt = require('jsonwebtoken')

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
  await next()
})

// routes
router.prefix('/api')  // 一级路由
router.use(users.routes(), users.allowedMethods())  // 二级路由
app.use(router.routes(), router.allowedMethods())

// 测试 token 有效性
router.get('/leave/count', ctx => {
  const token = ctx.request.headers.authorization.split(' ')[1]
  const payload = jwt.verify(token, 'imooc')
  ctx.body = payload
})

// error-handling
app.on('error', (err, ctx) => {
  log4js.error(err.stack)  // 测试 error 输出
});

module.exports = app
