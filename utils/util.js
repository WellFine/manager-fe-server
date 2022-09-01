const log4js = require('./log4j')

const CODE = {
  SUCCESS: 200,
  PARAM_ERROR: 10001,  // 参数不正确
  USER_ACCOUNT_ERROR: 20001,  // 用户账号密码错误
  USER_LOGIN_ERROR: 20002,  // 用户未登录
  BUSINESS_ERROR: 30001,  // 业务请求失败
  AUTH_ERROR: 40001  // 认证失败或 token 过期
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
    pageSize *= 10
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
  CODE
}
