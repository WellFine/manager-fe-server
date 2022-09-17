const router = require('koa-router')()
const User = require('../models/userSchema')
const Counter = require('../models/counterSchema')
const Menu = require('../models/menuSchema')
const Role = require('../models/roleSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')
const md5 = require('md5')

router.prefix('/users')

// 用户登录
router.post('/login', async ctx => {
  try {
    const { userName, userPwd } = ctx.request.body
    const res = await User.findOne({
      userName,
      userPwd: md5(userPwd)
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

// 用户新增/编辑
router.post('/operate', async ctx => {
  const { userId, userName, userEmail, mobile, job, state, roleList, deptId, action } = ctx.request.body

  if (action === 'add') {
    // 新增操作 userName、userEmail 和 deptId 不能为空
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util.CODE.PARAM_ERROR)
      return
    }
    try {
      // userName 和 userEmail 不能相同
      const res = await User.findOne({
        $or: [{ userName }, { userEmail }]
      }, '_id userName userEmail')

      if (res) {
        ctx.body = util.fail(`系统检测到有重复用户：${res.userName} - ${res.userEmail}`)
        return
      }

      const doc = await Counter.findOneAndUpdate({ _id: 'userId' }, {
        $inc: { sequence_value: 1 }  // $inc 设置 sequence_value 字段自增
      }, { new: true })  // new: true 设置返回 update 后的值，如果没有设置则返回 update 前的值

      const user = new User({
        userId: doc.sequence_value,  // userId 是 counters 集合自增后的值
        userName,
        userPwd: md5('123456'),  // 初始密码就是 123456，通过 md5 加密
        userEmail, mobile, job, state,
        role: 1,  // 默认是普通用户，系统管理员不需要太多
        roleList, deptId
      })
      user.save()
      ctx.body = util.success({}, '用户创建成功')
    } catch (err) {
      ctx.body = util.fail(`用户创建失败：${err.stack}`)
    }
  } else {
    // 编辑操作 deptId 不能为空
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARAM_ERROR)
      return
    }
    try {
      await User.findOneAndUpdate({ userId }, { mobile, job, state, roleList, deptId })
      // 编辑不需要返回字段，返回一个空对象即可
      ctx.body = util.success({}, '编辑成功')
    } catch (err) {
      ctx.body = util.fail(`编辑失败：${err.stack}`)
    }
  }
})

// 获取全部在职用户列表
router.get('/all/list', async ctx => {
  try {
    const list = await User.find({
      state: 1
    }, 'userId userName userEmail')
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(`获取在职用户失败：${error.stack}`)
  }
})

// 获取用户对应的权限菜单
router.get('/getPermissionList', async ctx => {
  const { data } = util.decoded(ctx.request.headers.authorization)
  const menuList = await getMenuList(data.role, data.roleList)
  // 用 JSON 来深拷贝，slice() 是浅拷贝
  const actionList = getActionList(JSON.parse(JSON.stringify(menuList)))
  ctx.body = util.success({
    menuList,
    actionList
  })
})

async function getMenuList (userRole, roleKeys) {
  let list = []
  if (userRole == 0) {  // 管理员，获取全量菜单
    list = await Menu.find({}) || []
  } else {  // 普通用户，根据用户角色来获取权限列表，然后获取菜单
    const roleList = await Role.find({ _id: { $in: roleKeys } })
    let permissionList = []
    roleList.map(role => {
      const { checkedKeys, halfCheckedKeys } = role.permissionList
      permissionList = permissionList.concat([...checkedKeys, ...halfCheckedKeys])
    })
    // 获取所有权限后进行去重
    permissionList = [...new Set(permissionList)]
    list = await Menu.find({ _id: { $in: permissionList } })
  }
  return util.getTreeMenu(list, null)
}

function getActionList (list) {
  const actionList = []
  const deep = arr => {
    while (arr.length) {
      const item = arr.pop()
      if (item.action) {
        item.action.map(action => {
          actionList.push(action.menuCode)
        })
      }
      if (item.children && !item.action) {
        deep(item.children)
      }
    }
  }
  deep(list)
  return actionList
}

module.exports = router
