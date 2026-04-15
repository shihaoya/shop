const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, requireRole } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// 所有商品接口都需要operator角色
router.use(authMiddleware);
router.use(requireRole('operator'));

// 商品CRUD
router.post('/', upload.single('image'), productController.createProduct);
router.get('/', productController.getProducts);

// 回收站（必须在 /:id 之前）
router.get('/trash/list', productController.getTrashProducts);

// 带参数的路由放在最后
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.put('/:id/status', productController.updateProductStatus);
router.delete('/:id', productController.deleteProduct);
router.post('/:id/restore', productController.restoreProduct);

module.exports = router;
