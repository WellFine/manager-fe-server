const router = require('koa-router')()
const util = require('../utils/util')
const Dept = require('../models/deptSchema')

router.prefix('/dept')

// 部门操作：创建、编辑、删除
router.post('/operate', async ctx => {
  const { _id, action, ...params } = ctx.request.body
  let info

  try {
    if (action === 'add') {
      await Dept.create(params)
      info = '创建成功'
    } else if (action === 'edit') {
      if (_id) {
        params.updateTime = Date.now()
        await Dept.findByIdAndUpdate(_id, params)
        info = '编辑成功'
      } else {
        ctx.body = util.fail('缺少参数 params: _id')
        return
      }
    } else if (action === 'delete') {
      if (_id) {
        await Dept.findByIdAndRemove(_id)
        await Dept.deleteMany({ parentId: { $all: [_id] } })
        info = '删除成功'
      } else {
        ctx.body = util.fail('缺少参数 params: _id')
        return
      }
    } else {
      ctx.body = util.fail('部门操作类型异常')
      return
    }
    ctx.body = util.success({}, info)
  } catch (error) {
    ctx.body = util.fail(`部门操作失败：${error.stack}`)
  }
})

module.exports = router
