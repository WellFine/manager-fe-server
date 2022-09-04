const router = require('koa-router')()
const User = require('../models/userSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')

router.prefix('/users')

// 用户登录
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

// 用户列表
router.get('/list', async ctx => {
  const { userId, userName, state } = ctx.request.query
  const { page, skipIndex } = util.pager(ctx.request.query)
  const params = {}

  if (userId) params.userId = userId
  if (userName) params.userName = userName
  if (state && state != '0') params.state = state

  try {
    // 根据条件查询所有用户列表，返回数据中删除 _id 和 userPwd 字段
    const query = User.find(params, { _id: 0, userPwd: 0 })
    // MongoDB 的分页要先查出数据，然后再根据数据来分页，skip() 跳过，limit() 限制查询条数
    const list = await query.skip(skipIndex).limit(page.pageSize)
    // countDocuments() 获取总条数
    const total = await User.countDocuments(params)

    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (err) {
    console.log(err)
    ctx.body = util.fail(`查询用户列表失败：${err.stack}`)
  }
})

// 用户删除，这里并不是硬删除，而是将用户状态改为离职
router.post('/delete', async ctx => {
  const { userIds } = ctx.request.body
  
  try {
    /**
     * updateMany 有两种用法，一种通过 $or，一种通过 $in，$in 更简单
     * User.updateMany({ $or: [{ userId: 100001 }, { userId: 100002 }] }, { state: 2 })
     */
    const res = await User.updateMany({
      userId: { $in: userIds }  // 在 userIds 中的 userId 都会被 update
    }, { state: 2 })

    if (res.modifiedCount) {
      ctx.body = util.success(res, `共删除${res.modifiedCount}条数据`)
      /**
       * 可以提前结束就提前结束，不用走 if-else，性能好一丢丢
       * 另外注意 ctx.body 的赋值并没有结束执行的功能，所以还需要 return
       */
      return
    }
    ctx.body = util.fail('删除失败')
  } catch (err) {
    ctx.body = util.fail(`删除失败：${err}`)
  }
})

module.exports = router
