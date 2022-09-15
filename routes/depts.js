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

// 部门树形列表
router.get('/list', async ctx => {
  const { deptName } = ctx.request.query
  const params = {}
  if (deptName) params.deptName = deptName

  try {
    const rootList = await Dept.find(params)
    if (deptName) {  // deptName 有值则是搜索部门
      ctx.body = util.success(rootList)
    } else {  // 不是搜索的话则组装树形结构返回
      const treeList = getTreeDept(rootList, null)
      ctx.body = util.success(treeList)
    }
  } catch (error) {
    ctx.body = util.fail(`获取部门树形列表失败：${error.stack}`)
  }
})

function getTreeDept (rootList, parentId) {
  const list = []
  for (let i = 0; i < rootList.length; i++) {
    const item = rootList[i]._doc
    console.log(item)
    if (String(item.parentId.slice().pop()) === String(parentId)) {
      item.children = getTreeDept(rootList, item._id)
      if (item.children.length === 0) delete item.children
      list.push(item)
    }
  }
  return list
}

module.exports = router
