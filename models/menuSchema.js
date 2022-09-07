const mongoose = require('mongoose')

const menuSchema = mongoose.Schema({
  menuType: Number,  // 菜单类型
  menuName: String,  // 菜单名称
  menuCode: String,  // 权限标识
  path: String,  // 路由地址
  icon: String,  // 图标
  component: String,  // 组件地址
  menuState: Number,  // 菜单状态
  parentId: [mongoose.Types.ObjectId],  // 数组，存放父菜单 id，id 是 ObjectId 类型
  createTime: {  // 创建时间
    type: Date,
    default: Date.now()
  },
  updateTime: {  // 更新时间
    type: Date,
    default: Date.now()
  }
})

module.exports = mongoose.model('menu', menuSchema, 'menus')
