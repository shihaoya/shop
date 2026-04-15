const request = require('supertest');
const app = require('../src/app');
const { createTestUser, generateTestToken, cleanupTestData } = require('./helpers');
const { User, Tenant, UserTenantRelation } = require('../src/models');

describe('用户管理接口测试', () => {
  let operatorUser;
  let operatorToken;
  let tenant;
  let regularUser;

  // 测试前准备数据
  beforeEach(async () => {
    // 创建运营方用户
    operatorUser = await createTestUser({
      username: `operator_${Date.now()}`,
      role: 'operator'
    });

    // 创建租户
    tenant = await Tenant.create({
      userId: operatorUser.id,
      name: '测试租户',
      description: '测试描述',
      status: 'approved'
    });

    // 生成运营方Token
    operatorToken = generateTestToken(operatorUser);

    // 创建普通用户
    regularUser = await createTestUser({
      username: `user_${Date.now()}`,
      role: 'user'
    });

    // 将普通用户添加到租户
    await UserTenantRelation.create({
      userId: regularUser.id,
      tenantId: tenant.id,
      pointsBalance: 100,
      status: 'approved'
    });
  });

  // 每个测试后清理数据
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('GET /api/operator/users - 获取用户列表', () => {
    it('应该成功获取用户列表', async () => {
      const res = await request(app)
        .get('/api/v1/operator/users')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data.list)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('应该支持分页', async () => {
      const res = await request(app)
        .get('/api/v1/operator/users?page=1&pageSize=1')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.list.length).toBeLessThanOrEqual(1);
    });

    it('应该支持按关键词搜索', async () => {
      const res = await request(app)
        .get(`/api/v1/operator/users?keyword=${regularUser.username}`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.list.every(item => 
        item.username.includes(regularUser.username)
      )).toBe(true);
    });
  });

  describe('POST /api/operator/users - 添加用户到租户', () => {
    let newUser;

    beforeEach(async () => {
      newUser = await createTestUser({
        username: `new_user_${Date.now()}`,
        role: 'user'
      });
    });

    it('应该成功添加用户到租户', async () => {
      const res = await request(app)
        .post('/api/v1/operator/users/add-existing')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          username: newUser.username,
          initialPoints: 0
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
    });

    it('用户已在租户中时应该返回错误', async () => {
      const res = await request(app)
        .post('/api/v1/operator/users/add-existing')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          username: regularUser.username,
          initialPoints: 0
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('租户');
    });

    it('用户不存在时应该返回错误', async () => {
      const res = await request(app)
        .post('/api/v1/operator/users/add-existing')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          username: 'nonexistent_user_xyz',
          initialPoints: 0
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/operator/users/create - 创建新用户', () => {
    it('应该成功创建新用户并添加到租户', async () => {
      const userData = {
        username: `created_user_${Date.now()}`,
        password: 'Test123456',
        nickname: '新创建用户',
        initialPoints: 0
      };

      const res = await request(app)
        .post('/api/v1/operator/users/create-new')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(userData);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.username).toBe(userData.username);
    });

    it('用户名已存在时应该返回错误', async () => {
      const res = await request(app)
        .post('/api/v1/operator/users/create-new')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          username: regularUser.username,
          password: 'Test123456'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('DELETE /api/operator/users/:userId - 从租户移除用户', () => {
    it('应该成功从租户移除用户', async () => {
      const res = await request(app)
        .delete(`/api/v1/operator/users/${regularUser.id}`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      
      // 验证关系已被逻辑删除
      const relation = await UserTenantRelation.findOne({
        where: {
          userId: regularUser.id,
          tenantId: tenant.id
        }
      });
      expect(relation.isDeleted).toBe(1);
    });

    it('用户不在租户中时应该返回错误', async () => {
      const otherUser = await createTestUser({
        username: `other_${Date.now()}`,
        role: 'user'
      });

      const res = await request(app)
        .delete(`/api/v1/operator/users/${otherUser.id}`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /api/operator/users/recycle-bin - 获取回收站用户', () => {
    beforeEach(async () => {
      // 先移除一个用户（逻辑删除）
      await UserTenantRelation.update(
        { isDeleted: 1 },
        {
          where: {
            userId: regularUser.id,
            tenantId: tenant.id
          }
        }
      );
    });

    it('应该成功获取回收站用户列表', async () => {
      const res = await request(app)
        .get('/api/v1/operator/users/trash/list')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data.list)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('POST /api/operator/users/:userId/restore - 恢复用户', () => {
    beforeEach(async () => {
      // 先移除用户
      await UserTenantRelation.update(
        { isDeleted: 1 },
        {
          where: {
            userId: regularUser.id,
            tenantId: tenant.id
          }
        }
      );
    });

    it('应该成功恢复用户', async () => {
      const res = await request(app)
        .post(`/api/v1/operator/users/${regularUser.id}/restore`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      
      // 验证关系已恢复
      const relation = await UserTenantRelation.findOne({
        where: {
          userId: regularUser.id,
          tenantId: tenant.id
        }
      });
      expect(relation.isDeleted).toBe(0);
    });
  });
});

