const router = require('koa-router')()
const Leave = require('../models/leaveSchema')
const Dept = require('../models/deptSchema')
const util = require('../utils/util')

router.prefix('/leave')

// 查询用户个人的申请列表
router.get('/list', async ctx => {
  const { applyState, type } = ctx.request.query
  const { page, skipIndex } = util.pager(ctx.request.query)
  // 加密 token 时是 { data } 这种形式，所以拿 token 数据时解构 data 出来
  const { data } = util.decoded(ctx.request.headers.authorization)

  let params = {}
  if (type === 'approve') {  // 查询用户待审批列表
    // 查询待审核的单子时，当前审批负责人是用户自己
    if (applyState == 1 || applyState == 2) {  // 查询待审核以及审核中状态时当前审批人是自己
      params.curAuditUserName = data.userName
      params.$or = [{ applyState: 1 }, { applyState: 2 }]
    } else if (applyState > 2) {  // 查询审核通过、审核拒绝、作废
      params = { 'auditFlows.userId': data.userId, applyState }
    } else {  // 查询全部
      params['auditFlows.userId'] = data.userId
    }
  } else {  // 查询用户个人申请列表
    // 查询是否有某条文档的 applyUser 对象下的 userId 值与 data.userId 相同
    params['applyUser.userId'] = data.userId
    if (applyState) params.applyState = applyState
  }

  try {
    const query = Leave.find(params)
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Leave.countDocuments(params)
    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list
    })
  } catch (err) {
    ctx.body = util.fail(`查询申请列表失败：${err.stack}`)
  }
})

router.post('/operate', async ctx => {
  const { _id, action, ...params } = ctx.request.body
  const { data } = util.decoded(ctx.request.headers.authorization)

  try {
    if (action === 'add') {
      // 生成申请单号
      let orderNo = 'XJ'
      orderNo += util.formateDate(new Date(), 'yyyy-MM-dd')
      const total = await Leave.countDocuments()
      params.orderNo = orderNo + total  // 公司内部使用，所以编号可以不用那么严谨

      // 获取用户当前部门 ID
      const id = data.deptId.pop()
      // 查找当前部门信息，内含负责人信息
      const dept = await Dept.findById(id)
      // 获取人事部门和财务部门负责人信息
      const userList = await Dept.find({ deptName: { $in: ['人事部门', '财务部门'] } })

      // 当前审批负责人
      const curAudtiUserName = dept.userName
      // 组装审批用户与审批流程，当前部门负责人 -> 人事部门负责人 -> 财务部门负责人
      let auditUsers = curAudtiUserName
      const auditFlows = [{
        userId: dept.userId, userName: dept.userName, userEmail: dept.userEmail
      }]
      userList.map(item => {
        auditUsers += `，${item.userName}`
        auditFlows.push({
          userId: item.userId, userName: item.userName, userEmail: item.userEmail
        })
      })

      params.auditUsers = auditUsers
      params.curAuditUserName = dept.userName
      params.auditFlows = auditFlows
      params.auditLogs = []  // 各个负责人审批后会产生一条日志插入数组中
      params.applyUser = {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail
      }

      await Leave.create(params)
      ctx.body = util.success({}, '申请成功')
    } else {
      // 软删除，将申请状态改为作废即可
      await Leave.findByIdAndUpdate(_id, { applyState: 5 })
      ctx.body = util.success({}, '作废成功')
    }
  } catch (error) {
    ctx.body = util.fail(`操作失败：${error.stack}`)
  }
})

router.post('/approve', async ctx => {
  const { _id, action, remark } = ctx.request.body
  const { data } = util.decoded(ctx.request.headers.authorization)
  const params = {}  // applyState: 1待审批，2审批中，3审批拒绝，4审批通过，5作废

  try {
    const doc = await Leave.findById(_id)
    params.auditLogs = doc.auditLogs || []

    if (action === 'refuse') params.applyState = 3
    else if (action === 'pass') {
      // 本系统中 auditFlows 审核流程与 auditLogs 审核日志是一一对应的
      if (doc.auditFlows.length === doc.auditLogs.length) {  // 审核流程已满
        ctx.body = util.success('当前申请单已处理，请勿重复提交')
        return
      } else if (doc.auditFlows.length === doc.auditLogs.length + 1) {  // 最后一级审批
        params.applyState = 4  // 审批通过
      } else if (doc.auditFlows.length > doc.auditLogs.length) {
        params.applyState = 2
        params.curAuditUserName = doc.auditFlows[doc.auditLogs.length + 1].userName
      }
    } else {
      ctx.body = util.fail('action 参数错误')
      return
    }

    params.auditLogs.push({
      userId: data.userId,
      userName: data.userName,
      createTime: Date.now(),
      remark,
      action: action === 'refuse' ? '审核拒绝' : '审核通过'
    })

    await Leave.findByIdAndUpdate(_id, params)
    ctx.body = util.success({}, '处理成功')
  } catch (error) {
    ctx.body = util.fail(`审核失败：${error.stack}`)
  }
})

router.get('/count', async ctx => {
  const { data } = util.decoded(ctx.request.headers.authorization), params = {}
  try {
    params.curAuditUserName = data.userName
    params.$or = [{ applyState: 1 }, { applyState: 2 }]
    const total = await Leave.countDocuments(params)
    ctx.body = util.success(total)
  } catch (error) {
    ctx.body = util.fail(`查询审核列表条数失败：${error.stack}`)
  }
})

module.exports = router
