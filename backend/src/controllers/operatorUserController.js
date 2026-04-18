const { User, Tenant, UserTenantRelation, sequelize } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { logger } = require('../middlewares/logger');
const { success, error } = require('../utils/response');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

/**
 * 辅助函数：获取运营方的租户ID
 */
async function getOperatorTenantId(userId) {
  const tenant = await Tenant.findOne({
    where: { userId, isDeleted: 0 }
  });
  
  if (!tenant) {
    throw new Error('您还没有关联的租户');
  }
  
  return tenant.id;
}

/**
 * 获取可添加的用户列表（用于下拉选择）
 */
exports.getAvailableUsers = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { keyword, pageSize = 20 } = req.query;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 获取已在此租户中的用户ID
    const existingRelations = await UserTenantRelation.findAll({
      where: {
        tenantId,
        isDeleted: 0
      },
      attributes: ['userId']
    });
    const existingUserIds = existingRelations.map(r => r.userId);

    // 构建查询条件
    const where = {
      isDeleted: 0,
      id: {
        [Op.notIn]: existingUserIds.length > 0 ? existingUserIds : [0]
      }
    };

    // 关键词搜索
    if (keyword) {
      where.username = { [Op.like]: `%${keyword}%` };
    }

    // 查询用户
    const users = await User.findAll({
      where,
      attributes: ['id', 'username', 'nickname'],
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });

    return success(res, {
      list: users,
      total: users.length
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取可添加用户失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 创建新用户（简化版：只需要用户名、昵称、积分）
 */
exports.createNewUser = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { username, nickname, initialPoints } = req.body;

    // 验证参数
    if (!username || initialPoints === undefined || initialPoints === null) {
      return error(res, '用户名和初始积分为必填项', 400);
    }

    if (username.length < 3 || username.length > 50) {
      return error(res, '用户名长度必须在3-50个字符之间', 400);
    }

    if (initialPoints < 0) {
      return error(res, '初始积分不能为负数', 400);
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return error(res, '用户名已存在', 400);
    }

    // 生成随机密码（8位包含字母和数字）
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // 创建用户
    const user = await User.create({
      username,
      password: hashedPassword,
      nickname: nickname || null,
      role: 'user'
    });

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 创建关联（自动approved状态）
    await UserTenantRelation.create({
      userId: user.id,
      tenantId,
      status: 'approved',
      pointsBalance: initialPoints
    });

    logger.info(`运营方 ${operatorId} 创建新用户 ${user.id}`);

    return success(res, {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      password: randomPassword // 返回随机密码供运营方告知用户
    }, '用户创建成功');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`创建新用户失败: ${errorMsg}`);
    return error(res, errorMsg || '创建失败', 500);
  }
};

/**
 * 用户列表
 */
exports.getUsers = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { page = 1, pageSize = 20, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 构建查询条件
    const where = {
      tenantId,
      isDeleted: 0
    };

    // 关键词搜索
    let includeWhere = {};
    if (keyword) {
      includeWhere.username = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await UserTenantRelation.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: includeWhere,
          attributes: ['id', 'username', 'nickname']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });

    return success(res, {
      list: rows.map(item => ({
        ...item.toJSON(),
        username: item.user?.username,
        nickname: item.user?.nickname
      })),
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取用户列表失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 用户详情
 */
exports.getUserDetail = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userId } = req.params;

    const tenantId = await getOperatorTenantId(operatorId);

    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        isDeleted: 0
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'role', 'status']
        }
      ]
    });

    if (!relation) {
      return error(res, '用户不存在或不属于此租户', 404);
    }

    return success(res, relation);
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取用户详情失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 移除用户（逻辑删除）
 */
exports.removeUser = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userId } = req.params;

    // 前端传的是 UserTenantRelation 关系表的 ID，不是用户 ID
    // 所以直接用关系 ID 查询
    const relation = await UserTenantRelation.findByPk(userId);

    console.log('[DEBUG] removeUser - 关系 ID:', userId, '关系数据:', relation ? { id: relation.id, userId: relation.userId, tenantId: relation.tenantId, isDeleted: relation.isDeleted } : null);

    if (!relation) {
      return error(res, '用户不存在或不属于此租户', 404);
    }

    // 如果已经被删除，直接返回成功（幂等操作）
    if (relation.isDeleted === 1) {
      return success(res, null, '用户已移除');
    }

    // 逻辑删除
    await relation.update({
      isDeleted: 1,
      deletedAt: new Date()
    });

    logger.info(`运营方 ${operatorId} 移除用户 ${relation.userId} 从租户 ${relation.tenantId}`);

    return success(res, null, '用户已移除');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`移除用户失败: ${errorMsg}`);
    return error(res, errorMsg || '移除失败', 500);
  }
};

/**
 * 恢复用户
 */
exports.restoreUser = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userId } = req.params;

    const tenantId = await getOperatorTenantId(operatorId);

    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        isDeleted: 1
      }
    });

    if (!relation) {
      return error(res, '用户不存在或不属于回收站', 404);
    }

    // 恢复
    await relation.update({
      isDeleted: 0,
      deletedAt: null
    });

    logger.info(`运营方 ${operatorId} 恢复用户 ${userId}`);

    return success(res, null, '用户已恢复');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`恢复用户失败: ${errorMsg}`);
    return error(res, errorMsg || '恢复失败', 500);
  }
};

/**
 * 回收站 - 已移除用户列表
 */
exports.getTrashUsers = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const tenantId = await getOperatorTenantId(operatorId);

    const { count, rows } = await UserTenantRelation.findAndCountAll({
      where: {
        tenantId,
        isDeleted: 1
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname']
        }
      ],
      order: [['deletedAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });

    return success(res, {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取回收站用户失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 重置用户密码（生成随机密码）
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userId } = req.params;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 验证用户是否属于当前租户
    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        isDeleted: 0
      }
    });

    if (!relation) {
      return error(res, '用户不存在或不属于此租户', 404);
    }

    // 生成随机密码（8位包含字母和数字）
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // 更新密码
    await User.update(
      { password: hashedPassword },
      { where: { id: userId } }
    );

    logger.info(`运营方 ${operatorId} 重置用户 ${userId} 的密码`);

    return success(res, {
      password: randomPassword
    }, '密码重置成功');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`重置密码失败: ${errorMsg}`);
    return error(res, errorMsg || '重置失败', 500);
  }
};

/**
 * 获取待审核的申请列表
 */
exports.getPendingApplications = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    const { count, rows } = await UserTenantRelation.findAndCountAll({
      where: {
        tenantId,
        status: 'pending',
        isDeleted: 0
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });

    return success(res, {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取待审核申请失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 审核通过
 */
exports.approveApplication = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { relationId } = req.params;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 查找申请记录
    const relation = await UserTenantRelation.findOne({
      where: {
        id: relationId,
        tenantId,
        status: 'pending',
        isDeleted: 0
      }
    });

    if (!relation) {
      return error(res, '申请记录不存在', 404);
    }

    // 更新状态
    await relation.update({
      status: 'approved',
      pointsBalance: 0
    });

    logger.info(`运营方 ${operatorId} 审核通过用户 ${relation.userId} 的申请`);

    return success(res, null, '审核通过');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`审核通过失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 500);
  }
};

/**
 * 审核拒绝
 */
exports.rejectApplication = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { relationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return error(res, '请填写拒绝理由', 400);
    }

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 查找申请记录
    const relation = await UserTenantRelation.findOne({
      where: {
        id: relationId,
        tenantId,
        status: 'pending',
        isDeleted: 0
      }
    });

    if (!relation) {
      return error(res, '申请记录不存在', 404);
    }

    // 更新状态和拒绝理由
    await relation.update({
      status: 'rejected',
      rejectReason: reason
    });

    logger.info(`运营方 ${operatorId} 拒绝用户 ${relation.userId} 的申请`);

    return success(res, null, '已拒绝');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`审核拒绝失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 500);
  }
};

/**
 * 下载导入模板
 */
exports.downloadTemplate = async (req, res) => {
  try {
    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 创建数据（仅表头）
    const data = [
      ['用户名', '昵称', '积分']
    ];
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // 设置列宽
    worksheet['!cols'] = [
      { wch: 15 }, // 用户名
      { wch: 15 }, // 昵称
      { wch: 10 }  // 积分
    ];
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '用户导入模板');
    
    // 生成 Excel 文件缓冲区
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 设置响应头（文件名需要 URL 编码）
    const fileName = encodeURIComponent('用户导入模板.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${fileName}`);
    res.setHeader('Content-Length', buffer.length);
    
    // 发送文件
    res.send(buffer);
    
    logger.info(`运营方 ${req.user.id} 下载了用户导入模板`);
  } catch (err) {
    const errorMsg = err.message || '未知错误';
    logger.error(`下载模板失败: ${errorMsg}`);
    return error(res, errorMsg || '下载失败', 500);
  }
};

/**
 * 解析 Excel/CSV 文件内容
 */
function parseExcelFile(filePath) {
  try {
    // 读取工作簿
    const workbook = XLSX.readFile(filePath);
    
    // 获取第一个工作表
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      throw new Error('Excel 文件中没有工作表');
    }
    
    const worksheet = workbook.Sheets[sheetName];
    
    // 转换为 JSON（第一行作为表头）
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length < 2) {
      throw new Error('文件格式不正确，至少需要表头和一行数据');
    }
    
    // 提取表头
    const headers = jsonData[0].map(h => String(h).trim());
    
    // 验证必要的列
    const requiredHeaders = ['用户名', '积分'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`缺少必要的列：${missingHeaders.join(', ')}`);
    }
    
    // 转换数据
    const data = [];
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      if (!row || row.length === 0) continue; // 跳过空行
      
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] !== undefined ? String(row[index]).trim() : '';
      });
      data.push(obj);
    }
    
    return data;
  } catch (err) {
    throw new Error(`Excel 文件解析失败: ${err.message}`);
  }
}

/**
 * 导入用户
 */
exports.importUsers = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const operatorId = req.user.id;
    
    if (!req.file) {
      return error(res, '请上传文件', 400);
    }

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 读取并解析 Excel/CSV 文件
    let userData;
    try {
      userData = parseExcelFile(req.file.path);
    } catch (parseErr) {
      // 删除临时文件
      fs.unlinkSync(req.file.path);
      return error(res, parseErr.message, 400);
    }

    if (userData.length === 0) {
      fs.unlinkSync(req.file.path);
      return error(res, '文件中没有有效数据', 400);
    }

    // 先验证所有数据，如果有错误直接返回
    const errors = [];
    for (let i = 0; i < userData.length; i++) {
      const row = userData[i];
      const rowNum = i + 2; // 从第2行开始（第1行是表头）

      const username = row['用户名'];
      const nickname = row['昵称'] || null;
      const points = row['积分'];

      // 验证必填字段
      if (!username) {
        errors.push({
          row: rowNum,
          username: '',
          error: '用户名不能为空'
        });
        continue;
      }

      if (points === undefined || points === null || points === '') {
        errors.push({
          row: rowNum,
          username: username || '',
          error: '积分不能为空'
        });
        continue;
      }

      const pointsBalance = parseInt(points);
      if (isNaN(pointsBalance) || pointsBalance < 0) {
        errors.push({
          row: rowNum,
          username: username || '',
          error: '积分必须是非负整数'
        });
        continue;
      }

      // 检查用户名是否已存在（过滤已删除的用户）
      const existingUser = await User.findOne({
        where: { 
          username,
          isDeleted: 0  // 只查询未删除的用户
        },
        transaction
      });

      if (existingUser) {
        errors.push({
          row: rowNum,
          username: username || '',
          error: '用户名已存在'
        });
      }
    }

    // 如果有错误，直接返回
    if (errors.length > 0) {
      fs.unlinkSync(req.file.path);
      await transaction.rollback();
      return error(res, `数据验证失败，共 ${errors.length} 个错误`, 400, errors);
    }

    // 所有数据验证通过，开始批量创建
    const createdUsers = [];
    
    for (let i = 0; i < userData.length; i++) {
      const row = userData[i];
      const username = row['用户名'];
      const nickname = row['昵称'] || null;
      const pointsBalance = parseInt(row['积分']);

      // 生成随机密码
      const randomPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      // 创建用户
      const user = await User.create({
        username,
        password: hashedPassword,
        nickname: nickname || null,
        role: 'user'
      }, { transaction });

      // 创建关联
      await UserTenantRelation.create({
        userId: user.id,
        tenantId,
        status: 'approved',
        pointsBalance
      }, { transaction });

      createdUsers.push({
        username,
        nickname: nickname || '',
        password: randomPassword,
        pointsBalance
      });

      logger.info(`运营方 ${operatorId} 导入新用户 ${user.id}: ${username}`);
    }

    // 提交事务
    await transaction.commit();

    // 删除临时文件
    fs.unlinkSync(req.file.path);

    logger.info(`运营方 ${operatorId} 成功导入 ${createdUsers.length} 个用户`);

    return success(res, {
      count: createdUsers.length,
      users: createdUsers
    }, `成功导入 ${createdUsers.length} 个用户`);
  } catch (err) {
    // 回滚事务
    await transaction.rollback();

    // 确保删除临时文件
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        logger.error(`删除临时文件失败: ${e.message}`);
      }
    }

    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`导入用户失败: ${errorMsg}`);
    return error(res, `导入失败：${errorMsg}`, 500);
  }
};

/**
 * 下载导入结果（Excel 格式）
 */
exports.downloadImportResult = async (req, res) => {
  try {
    const { users } = req.body;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return error(res, '没有可下载的数据', 400);
    }

    // 创建工作簿
    const workbook = XLSX.utils.book_new();
    
    // 准备数据（表头 + 数据）
    const data = [
      ['用户名', '昵称', '密码', '初始积分']
    ];
    
    users.forEach(user => {
      data.push([
        user.username || '',
        user.nickname || '',
        user.password || '',
        user.pointsBalance || 0
      ]);
    });
    
    // 创建工作表
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // 设置列宽
    worksheet['!cols'] = [
      { wch: 15 }, // 用户名
      { wch: 15 }, // 昵称
      { wch: 15 }, // 密码
      { wch: 10 }  // 初始积分
    ];
    
    // 添加工作表到工作簿
    XLSX.utils.book_append_sheet(workbook, worksheet, '导入结果');
    
    // 生成 Excel 文件缓冲区
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    // 设置响应头（文件名需要 URL 编码）
    const fileName = encodeURIComponent(`用户导入结果_${Date.now()}.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"; filename*=UTF-8''${fileName}`);
    res.setHeader('Content-Length', buffer.length);
    
    // 发送文件
    res.send(buffer);
    
    logger.info(`运营方 ${req.user.id} 下载了导入结果，共 ${users.length} 个用户`);
  } catch (err) {
    const errorMsg = err.message || '未知错误';
    logger.error(`下载导入结果失败: ${errorMsg}`);
    return error(res, errorMsg || '下载失败', 500);
  }
};

