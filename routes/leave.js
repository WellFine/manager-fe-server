const router = require('koa-router')()
const Leave = require('../models/leaveSchema')
const util = require('../utils/util')

router.prefix('/leave')

// 查询用户个人的申请列表
router.get('/list', async ctx => {
  const { applyState } = ctx.request.query
  const { page, skipIndex } = util.pager(ctx.request.query)
  // 加密 token 时是 { data } 这种形式，所以拿 token 数据时解构 data 出来
  const { data } = util.decoded(ctx.request.headers.authorization)
  const params = {
    // 查询是否有某条文档的 applyUser 对象下的 userId 值与 data.userId 相同
    'applyUser.userId': data.userId
  }
  if (applyState) params.applyState = applyState

  try {
    const query = Leave.find(params)
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Leave.countDocuments(params)
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (err) {
    ctx.body = util.fail(`查询申请列表失败：${err.stack}`)
  }
})

module.exports = router
