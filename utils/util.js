const log4js = require('./log4j')
const jwt = require('jsonwebtoken')

const CODE = {
  SUCCESS: 200,
  PARAM_ERROR: 10001,  // 参数不正确
  USER_ACCOUNT_ERROR: 20001,  // 用户账号密码错误
  USER_LOGIN_ERROR: 20002,  // 用户未登录
  BUSINESS_ERROR: 30001,  // 业务请求失败
  AUTH_ERROR: 50001  // 认证失败或 token 过期
}

module.exports = {
  /**
   * 分页结构封装
   * @param {number} pageNum 页码
   * @param {number} pageSize 一页多少数据
   * @returns 一个通用的分页结构对象
   */
  pager ({ pageNum = 1, pageSize = 10 }) {
    pageNum *= 1  // 确保为数字类型
    pageSize *= 1
    const skipIndex = (pageNum - 1) * pageSize
    return {
      page: {
        pageNum,
        pageSize
      },
      skipIndex
    }
  },
  success (data = '', msg = '', code = CODE.SUCCESS) {
    log4js.debug(data)
    return {
      code,
      data,
      msg
    }
  },
  fail (msg = '', code = CODE.BUSINESS_ERROR, data = '') {
    log4js.debug(msg)
    return {
      code,
      data,
      msg
    }
  },
  CODE,
  decoded (authorization) {
    const token = authorization.split(' ')[1]
    return jwt.verify(token, 'imooc')
  },
  // 递归拼接树形菜单列表
  getTreeMenu (rootList, parentId) {
    const list = []
    for (let i = 0; i < rootList.length; i++) {
      // rootList[i] 是一个 mongoose 查询对象，其中就有暴露出来的字段，但还是需要通过 _doc 拿到集合中真正的数据
      const item = rootList[i]._doc
      /**
       * id 是 ObjectId 类型的，这个类型是 Buffer 形式，所以需要先转 String 再来比较
       * 只要 item.parentId 的最后一个与当前传入的 parentId 相同，那么 item 就属于 children，放入 list 返回出去
       */
      if (String(item.parentId[item.parentId.length - 1]) == String(parentId)) {
        item.children = this.getTreeMenu(rootList, item._id)
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
}
