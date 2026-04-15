const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有商品接口都需要operator角色
router.use(authMiddleware);
router.use(requireRole('operator'));

// 商品CRUD
router.post('/', productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', productController.updateProduct);
router.put('/:id/status', productController.updateProductStatus);
router.delete('/:id', productController.deleteProduct);

// 回收站
router.get('/trash/list', productController.getTrashProducts);
router.post('/:id/restore', productController.restoreProduct);

module.exports = router;
