const { Product, Tenant, UserTenantRelation, Upload } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../middlewares/logger');
const { success, error } = require('../utils/response');
const config = require('../config');
const path = require('path');

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
 * 创建商品
 */
exports.createProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description, pointsRequired, stock, category } = req.body;
    
    // 验证必填字段
    if (!name || !pointsRequired || stock === undefined) {
      return error(res, '商品名称、所需积分和库存为必填项', 400);
    }

    // 验证数据合法性
    if (pointsRequired < 0) {
      return error(res, '所需积分不能为负数', 400);
    }
    if (stock < 0) {
      return error(res, '库存不能为负数', 400);
    }

    // 获取租户ID
    const tenantId = await getOperatorTenantId(userId);

    // 创建商品（先不设置图片）
    const product = await Product.create({
      tenantId,
      name,
      description: description || null,
      imageUrl: null, // 文件ID，稍后更新
      pointsRequired,
      stock,
      category: category || null,
      status: 'off_shelf', // 默认下架
      sortOrder: 0
    });

    // 如果有上传的图片，记录到 uploads 表并更新商品
    let imageFileId = null;
    
    if (req.file) {
      // 通过文件上传
      const filePath = path.resolve('uploads', req.file.filename);
      
      // 记录文件上传信息
      const uploadRecord = await Upload.create({
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: filePath,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        module: 'product',
        relatedId: product.id,
        relatedType: 'product'
      });
      
      imageFileId = uploadRecord.id;
      logger.info(`运营方 ${userId} 上传商品图片，文件ID: ${imageFileId}`);
    } else if (req.body.imageFileId) {
      // 通过文件ID提交（先上传后提交的情况）
      imageFileId = parseInt(req.body.imageFileId);
    }
    
    // 更新商品的文件ID
    if (imageFileId) {
      await product.update({ imageUrl: imageFileId });
    }

    logger.info(`运营方 ${userId} 创建商品: ${product.id}`);

    return success(res, product, '商品创建成功');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`创建商品失败: ${errorMsg}`);
    console.error(err);
    return error(res, errorMsg || '创建失败', 500);
  }
};

/**
 * 商品列表
 */
exports.getProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, status, category, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(userId);

    // 构建查询条件
    const where = {
      tenantId,
      isDeleted: 0
    };

    if (status && ['on_shelf', 'off_shelf'].includes(status)) {
      where.status = status;
    }
    if (category) {
      where.category = category;
    }
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Upload,
          as: 'imageFile',
          attributes: ['id', 'fileName'],
          required: false
        }
      ],
      order: [['sortOrder', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });

    // 处理数据，添加图片URL
    const list = rows.map(row => {
      const data = row.get({ plain: true });
      // 从关联的 imageFile 中获取文件ID
      if (data.imageFile) {
        data.imageFileId = data.imageFile.id;
        data.imageUrl = `/uploads/${data.imageFile.fileName}`;
      } else {
        data.imageFileId = null;
        data.imageUrl = null;
      }
      delete data.imageFile;
      return data;
    });

    return success(res, {
      list,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取商品列表失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 商品详情
 */
exports.getProductById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const tenantId = await getOperatorTenantId(userId);

    const product = await Product.findOne({
      where: { id, tenantId, isDeleted: 0 }
    });

    if (!product) {
      return error(res, '商品不存在或无权访问', 404);
    }

    return success(res, product);
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取商品详情失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 更新商品
 */
exports.updateProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, description, pointsRequired, stock, category } = req.body;

    const tenantId = await getOperatorTenantId(userId);

    const product = await Product.findOne({
      where: { id, tenantId, isDeleted: 0 }
    });

    if (!product) {
      return error(res, '商品不存在或无权访问', 404);
    }

    // 验证数据
    if (pointsRequired !== undefined && pointsRequired < 0) {
      return error(res, '所需积分不能为负数', 400);
    }
    if (stock !== undefined && stock < 0) {
      return error(res, '库存不能为负数', 400);
    }

    // 准备更新数据
    const updateData = {
      name: name !== undefined ? name : product.name,
      description: description !== undefined ? description : product.description,
      pointsRequired: pointsRequired !== undefined ? pointsRequired : product.pointsRequired,
      stock: stock !== undefined ? stock : product.stock,
      category: category !== undefined ? category : product.category
    };
    
    // 只有当 imageFileId 有有效值时才更新图片
    if (req.body.imageFileId !== undefined && req.body.imageFileId !== null && req.body.imageFileId !== '') {
      updateData.imageUrl = parseInt(req.body.imageFileId);
    }
    // 如果 imageFileId 为 null/空字符串，保持原图片不变

    // 如果有上传新图片（通过文件上传）
    if (req.file) {
      const filePath = path.resolve('uploads', req.file.filename);
      
      // 记录新的文件上传信息
      const uploadRecord = await Upload.create({
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: filePath,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        module: 'product',
        relatedId: product.id,
        relatedType: 'product'
      });
      
      updateData.imageUrl = uploadRecord.id;
      
      logger.info(`运营方 ${userId} 更新商品图片，文件ID: ${uploadRecord.id}`);
    }

    // 更新商品
    await product.update(updateData);

    logger.info(`运营方 ${userId} 更新商品: ${id}`);

    return success(res, product, '商品更新成功');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`更新商品失败: ${errorMsg}`);
    return error(res, errorMsg || '更新失败', 500);
  }
};

/**
 * 上架/下架商品
 */
exports.updateProductStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!['on_shelf', 'off_shelf'].includes(status)) {
      return error(res, '状态值无效', 400);
    }

    const tenantId = await getOperatorTenantId(userId);

    const product = await Product.findOne({
      where: { id, tenantId, isDeleted: 0 }
    });

    if (!product) {
      return error(res, '商品不存在或无权访问', 404);
    }

    await product.update({ status });

    logger.info(`运营方 ${userId} ${status === 'on_shelf' ? '上架' : '下架'}商品: ${id}`);

    return success(res, product, `商品已${status === 'on_shelf' ? '上架' : '下架'}`);
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`更新商品状态失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 500);
  }
};

/**
 * 删除商品（逻辑删除）
 */
exports.deleteProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const tenantId = await getOperatorTenantId(userId);

    const product = await Product.findOne({
      where: { id, tenantId, isDeleted: 0 }
    });

    if (!product) {
      return error(res, '商品不存在或无权访问', 404);
    }

    // 逻辑删除
    await product.update({
      isDeleted: 1,
      deletedAt: new Date()
    });

    logger.info(`运营方 ${userId} 删除商品: ${id}`);

    return success(res, null, '商品已删除');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`删除商品失败: ${errorMsg}`);
    return error(res, errorMsg || '删除失败', 500);
  }
};

/**
 * 回收站 - 已删除商品列表
 */
exports.getTrashProducts = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const tenantId = await getOperatorTenantId(userId);

    const { count, rows } = await Product.findAndCountAll({
      where: {
        tenantId,
        isDeleted: 1
      },
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
    logger.error(`获取回收站商品失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 恢复商品
 */
exports.restoreProduct = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const tenantId = await getOperatorTenantId(userId);

    const product = await Product.findOne({
      where: { id, tenantId, isDeleted: 1 }
    });

    if (!product) {
      return error(res, '商品不存在或不属于回收站', 404);
    }

    // 恢复商品
    await product.update({
      isDeleted: 0,
      deletedAt: null
    });

    logger.info(`运营方 ${userId} 恢复商品: ${id}`);

    return success(res, product, '商品已恢复');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`恢复商品失败: ${errorMsg}`);
    return error(res, errorMsg || '恢复失败', 500);
  }
};

