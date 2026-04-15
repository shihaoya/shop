const express = require('express');
const router = express.Router();
const operatorUserController = require('../controllers/operatorUserController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有用户管理接口都需要operator角色
router.use(authMiddleware);
router.use(requireRole('operator'));

// 用户管理（静态路由在前）
router.get('/', operatorUserController.getUsers);
router.post('/add-existing', operatorUserController.addExistingUser);
router.post('/create-new', operatorUserController.createNewUser);
router.get('/trash/list', operatorUserController.getTrashUsers);

// 申请审核
router.get('/applications/pending', operatorUserController.getPendingApplications);
router.post('/applications/:relationId/approve', operatorUserController.approveApplication);
router.post('/applications/:relationId/reject', operatorUserController.rejectApplication);

// 带参数的路由放在最后
router.get('/:userId', operatorUserController.getUserDetail);
router.delete('/:userId', operatorUserController.removeUser);
router.post('/:userId/restore', operatorUserController.restoreUser);

module.exports = router;
