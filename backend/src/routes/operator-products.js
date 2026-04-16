const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');
const UploadService = require('../services/uploadService');
const path = require('path');

// 所有商品接口都需要operator角色
router.use(authMiddleware);
router.use(requireRole('operator'));

// 图片上传
router.post('/upload', (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      // multer 错误处理
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          code: 400,
          message: '文件大小不能超过 5MB'
        });
      }
      return res.status(400).json({
        code: 400,
        message: err.message || '上传失败'
      });
    }
    
    try {
      if (!req.file) {
        return res.status(400).json({
          code: 400,
          message: '请上传图片文件'
        });
      }

      // 返回图片访问URL
      const imageUrl = `/uploads/${req.file.filename}`;
      
      // 记录文件上传信息到数据库
      const filePath = path.resolve('uploads', req.file.filename);
      const uploadRecord = await UploadService.recordUpload({
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: filePath,
        fileSize: req.file.size,
        fileType: req.file.mimetype,
        module: 'product',
        relatedId: null,
        relatedType: null
      });
      
      res.json({
        code: 200,
        message: '上传成功',
        data: {
          id: uploadRecord.id,
          url: imageUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size
        }
      });
    } catch (error) {
      console.error('图片上传失败:', error);
      res.status(500).json({
        code: 500,
        message: '上传失败'
      });
    }
  });
});

// 商品CRUD
router.post('/', upload.single('image'), productController.createProduct);
router.get('/', productController.getProducts);

// 回收站（必须在 /:id 之前）
router.get('/trash/list', productController.getTrashProducts);

// 带参数的路由放在最后
router.get('/:id', productController.getProductById);
router.put('/:id', upload.single('image'), productController.updateProduct);
router.put('/:id/status', productController.updateProductStatus);
router.delete('/:id', productController.deleteProduct);
router.post('/:id/restore', productController.restoreProduct);

module.exports = router;
