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
    }, 'userId userName userEmail state role deptId roleList')  // 只返回这些用空格隔开的字段
    /**
     * 除了用空格隔开的字符串，还有以下两种方式可以限制返回字段
     * 1. { userId: 1, userName: 1, _id: 0 } 对象形式，1 表示返回，0 可以限制 _id 这些自带的字段
     * 2. User.findOne().select('userId userName') 用 select 来选择字段
     */

    const data = res._doc  // 查出来的字段信息都在 res._doc 中，如果直接将 res 返回给前端，返回的其实也是 res._doc

    const token = jwt.sign({
      data  // token 携带的就是查出来的用户信息
    }, 'imooc', {  // imooc 是加密的密钥
      expiresIn: '1h'  // token 1 小时过期
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
