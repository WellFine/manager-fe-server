const mongoose = require('mongoose')

const deptSchema = mongoose.Schema({
  deptName: String,
  userId: String,
  userName: String,
  userEmail: String,
  parentId: [ mongoose.Types.ObjectId ],
  createTime: {
    type: Date,
    default: Date.now()
  },
  updateTime: {
    type: Date,
    default: Date.now()
  }
})

module.exports = mongoose.model('depts', deptSchema, 'depts')
