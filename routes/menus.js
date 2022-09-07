const router = require('koa-router')()
const util = require('../utils/util')
const Menu = require('../models/menuSchema')

router.prefix('/menu')

// 菜单创建、编辑、删除
router.post('/operate', async ctx => {
  const { _id, action, ...params } = ctx.request.body
  let res, info

  try {
    if (action === 'add') {
      res = await Menu.create(params)
      info = '创建成功'
    } else if (action === 'edit') {
      params.updateTime = Date.now()
      res = await Menu.findByIdAndUpdate(_id, params)
      info = '编辑成功'
    } else {
      res = await Menu.findByIdAndRemove(_id)
      /**
       * 删除时要将删除目标下的子菜单或子按钮也删除
       * $all 表示只要 parentId 中存在 _id 的值就符合条件
       */
      await Menu.deleteMany({ parentId: { $all: [ _id ] } })
      info = '删除成功'
    }
    ctx.body = util.success('', info)
  } catch (err) {
    ctx.body = util.fail(`操作失败：${err.stack}`)
  }
})

module.exports = router
