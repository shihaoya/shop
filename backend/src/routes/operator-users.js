const express = require('express');
const router = express.Router();
const operatorUserController = require('../controllers/operatorUserController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有用户管理接口都需要operator角色
router.use(authMiddleware);
router.use(requireRole('operator'));

// 用户管理
router.post('/add-existing', operatorUserController.addExistingUser);
router.post('/create-new', operatorUserController.createNewUser);
router.get('/', operatorUserController.getUsers);
router.get('/:userId', operatorUserController.getUserDetail);
router.delete('/:userId', operatorUserController.removeUser);
router.post('/:userId/restore', operatorUserController.restoreUser);
router.get('/trash/list', operatorUserController.getTrashUsers);

module.exports = router;
