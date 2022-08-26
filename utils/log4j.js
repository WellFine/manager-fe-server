const log4js = require('log4js')

const levels = {
  'trace': log4js.levels.TRACE,
  'debug': log4js.levels.DEBUG,
  'info': log4js.levels.INFO,
  'warn': log4js.levels.WARN,
  'error': log4js.levels.ERROR,
  'fatal': log4js.levels.FATAL
}

log4js.configure({
  appenders: {  // appenders 用于定义输出方式，categories 中属性的 appenders 对应的值就是到这里找
    console: { type: 'console' },  // type 是输出形式，这里是直接打印
    info: {
      type: 'file',  // 输出到文件
      filename: 'logs/all-logs.log'
    },
    error: {
      type: 'dateFile',  // 错误输出按日期来存放
      filename: 'logs/log',
      pattern: 'yyyy-MM-dd',
      alwaysIncludePattern: true  // 设置文件名称为 filename + pattern
    }
  },
  categories: {
    default: { appenders: [ 'console' ], level: 'debug' },
    info: { appenders: [ 'info', 'console' ], level: 'info' },
    error: { appenders: [ 'error', 'console' ], level: 'error' }
  }
})

/**
 * 日志输出，level 为 debug
 * @param {string} content 输出信息
 */
exports.debug = content => {
  const logger = log4js.getLogger()
  // logger.level = levels.debug  // 课程中设置了 level，但是 log4js.configure() 的 categories 中已经设置过了，所以可以忽略
  logger.debug(content)
}

/**
 * 日志输出，level 为 info
 * @param {string} content 输出信息
 */
exports.info = content => {
  const logger = log4js.getLogger('info')
  // logger.level = levels.info
  logger.info(content)
}

/**
 * 日志输出，level 为 error
 * @param {string} content 输出信息
 */
exports.error = content => {
  const logger = log4js.getLogger('error')
  // logger.level = levels.error
  logger.error(content)
}
