const Upload = require('../models/Upload');
const path = require('path');
const fs = require('fs').promises;
const { logger } = require('../middlewares/logger');

class UploadService {
  /**
   * 记录文件上传信息
   * @param {Object} fileInfo - 文件信息
   * @param {String} fileInfo.fileName - 文件名
   * @param {String} fileInfo.originalName - 原始文件名
   * @param {String} fileInfo.filePath - 文件路径
   * @param {Number} fileInfo.fileSize - 文件大小
   * @param {String} fileInfo.fileType - 文件类型
   * @param {String} fileInfo.module - 所属模块
   * @param {Number} [fileInfo.relatedId] - 关联业务ID
   * @param {String} [fileInfo.relatedType] - 关联业务类型
   * @returns {Promise<Object>} 上传记录
   */
  static async recordUpload(fileInfo) {
    try {
      const upload = await Upload.create({
        fileName: fileInfo.fileName,
        originalName: fileInfo.originalName,
        filePath: fileInfo.filePath,
        fileSize: fileInfo.fileSize,
        fileType: fileInfo.fileType,
        module: fileInfo.module,
        relatedId: fileInfo.relatedId || null,
        relatedType: fileInfo.relatedType || null
      });
      
      return upload;
    } catch (error) {
      logger.error('记录文件上传信息失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件记录
   * @param {Number} id - 文件ID
   * @returns {Promise<Object|null>} 文件记录
   */
  static async getFileRecord(id) {
    return Upload.findByPk(id, {
      where: { isDeleted: 0 }
    });
  }

  /**
   * 根据路径获取文件记录
   * @param {String} filePath - 文件路径
   * @returns {Promise<Object|null>} 文件记录
   */
  static async getFileByPath(filePath) {
    return Upload.findOne({
      where: {
        filePath,
        isDeleted: 0
      }
    });
  }

  /**
   * 更新文件关联信息
   * @param {Number} fileId - 文件ID
   * @param {Object} relationInfo - 关联信息
   * @param {Number} relationInfo.relatedId - 关联业务ID
   * @param {String} relationInfo.relatedType - 关联业务类型
   * @returns {Promise<Object>} 更新后的文件记录
   */
  static async updateFileRelation(fileId, relationInfo) {
    const file = await Upload.findByPk(fileId);
    if (!file) {
      throw new Error('文件记录不存在');
    }
    
    return file.update({
      relatedId: relationInfo.relatedId,
      relatedType: relationInfo.relatedType
    });
  }

  /**
   * 删除文件（软删除）
   * @param {Number} fileId - 文件ID
   * @returns {Promise<Object>} 删除后的文件记录
   */
  static async deleteFile(fileId) {
    const file = await Upload.findByPk(fileId);
    if (!file) {
      throw new Error('文件记录不存在');
    }
    
    // 软删除记录
    await file.update({ isDeleted: 1 });
    
    // 尝试删除物理文件
    try {
      const fullPath = path.resolve(file.filePath);
      await fs.unlink(fullPath);
      logger.info(`已删除物理文件: ${fullPath}`);
    } catch (error) {
      logger.warn(`删除物理文件失败: ${file.filePath}`, error);
    }
    
    return file;
  }

  /**
   * 批量删除文件
   * @param {Array} fileIds - 文件ID数组
   * @returns {Promise<Number>} 删除的文件数量
   */
  static async batchDeleteFiles(fileIds) {
    const files = await Upload.findAll({
      where: {
        id: fileIds,
        isDeleted: 0
      }
    });
    
    let deletedCount = 0;
    for (const file of files) {
      try {
        await this.deleteFile(file.id);
        deletedCount++;
      } catch (error) {
        logger.error(`删除文件 ${file.id} 失败:`, error);
      }
    }
    
    return deletedCount;
  }

  /**
   * 根据模块和关联ID获取文件列表
   * @param {String} module - 模块名称
   * @param {Number} relatedId - 关联业务ID
   * @param {String} relatedType - 关联业务类型
   * @returns {Promise<Array>} 文件列表
   */
  static async getFilesByRelation(module, relatedId, relatedType) {
    return Upload.findAll({
      where: {
        module,
        relatedId,
        relatedType,
        isDeleted: 0
      },
      order: [['created_at', 'DESC']]
    });
  }

  /**
   * 清理孤立文件（无关联的文件）
   * @param {Number} days - 保留天数，默认30天
   * @returns {Promise<Number>} 清理的文件数量
   */
  static async cleanupOrphanedFiles(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const orphanedFiles = await Upload.findAll({
      where: {
        relatedId: null,
        relatedType: null,
        isDeleted: 0,
        created_at: {
          [require('sequelize').Op.lt]: cutoffDate
        }
      }
    });
    
    let deletedCount = 0;
    for (const file of orphanedFiles) {
      try {
        await this.deleteFile(file.id);
        deletedCount++;
      } catch (error) {
        logger.error(`清理孤立文件 ${file.id} 失败:`, error);
      }
    }
    
    logger.info(`清理孤立文件完成，共删除 ${deletedCount} 个文件`);
    return deletedCount;
  }
}

module.exports = UploadService;

