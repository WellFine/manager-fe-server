const router = require('koa-router')()
const User = require('../models/userSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')

router.prefix('/users')

router.post('/login', async ctx => {
  try {
    const { userName, userPwd } = ctx.request.body
    const res = await User.findOne({
      userName,
      userPwd
    })
    const data = res._doc  // 查出来的字段信息都在 res._doc 中，如果直接将 res 返回给前端，返回的其实也是 res._doc

    const token = jwt.sign({
      data  // token 携带的就是查出来的用户信息
    }, 'imooc', {  // imooc 是加密的密钥
      expiresIn: 30  // token 过期时间
    })

    if (res) {
      data.token = token
      // ctx.body 就是要返回给前端的数据，这里调用封装好的请求成功方法，返回统一的响应体结构对象
      ctx.body = util.success(data)
    } else {
      ctx.body = util.fail('账号或密码不正确')
    }
  } catch (error) {
    ctx.body = util.fail(error.msg)
  }
})

module.exports = router
