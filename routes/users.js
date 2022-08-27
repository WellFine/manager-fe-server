const router = require('koa-router')()
const User = require('../models/userSchema')
const util = require('../utils/util')

router.prefix('/users')

router.post('/login', async ctx => {
  try {
    const { userName, userPwd } = ctx.request.body
    const res = await User.findOne({
      userName,
      userPwd
    })

    if (res) {
      // ctx.body 就是要返回给前端的数据，这里调用封装好的请求成功方法，返回统一的响应体结构对象
      ctx.body = util.success(res)
    } else {
      ctx.body = util.fail('账号或密码不正确')
    }
  } catch (error) {
    ctx.body = util.fail(error.msg)
  }
})

module.exports = router
