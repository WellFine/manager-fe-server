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

// 菜单列表查询
router.get('/list', async ctx => {
  const { menuName, menuState } = ctx.request.query
  const params = {}
  if (menuName) params.menuName = menuName
  if (menuState) params.menuState = menuState

  const rootList = await Menu.find(params) || []
  const permissionList = getTreeMenu(rootList, null)
  ctx.body = util.success(permissionList)
})

// 递归拼接树形菜单列表
function getTreeMenu (rootList, parentId) {
  const list = []
  for (let i = 0; i < rootList.length; i++) {
    // rootList[i] 是一个 mongoose 查询对象，其中就有暴露出来的字段，但还是需要通过 _doc 拿到集合中真正的数据
    const item = rootList[i]._doc
    /**
     * id 是 ObjectId 类型的，这个类型是 Buffer 形式，所以需要先转 String 再来比较
     * 只要 item.parentId 的最后一个与当前传入的 parentId 相同，那么 item 就属于 children，放入 list 返回出去
     */
    if (String(item.parentId[item.parentId.length - 1]) == String(parentId)) {
      item.children = getTreeMenu(rootList, item._id)
      // 如果没有子项，则将 children 属性删除
      if (item.children.length === 0) delete item.children
      else if (item.children[0].menuType === 2) {
        // action 用于快速区分按钮和菜单，用于后期做菜单按钮权限控制
        item.action = item.children
      }
      list.push(item)
    }
  }
  return list
}

module.exports = router
