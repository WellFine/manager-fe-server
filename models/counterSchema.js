/**
 * 维护 userId 自增长表
 */
const mongoose = require('mongoose')

const counterSchema = mongoose.Schema({
  _id: String,  // 要自增的字段名称，例如 'userId'
  sequence_value: Number  // 自增的值
})

module.exports = mongoose.model('counter', counterSchema, 'counters')
