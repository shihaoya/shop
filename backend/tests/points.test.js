const request = require('supertest');
const app = require('../src/app');
const { createTestUser, generateTestToken, cleanupTestData } = require('./helpers');
const { User, Tenant, UserTenantRelation, PointTransaction } = require('../src/models');

describe('积分管理接口测试', () => {
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

  describe('POST /api/operator/points/:userId/add - 增加积分', () => {
    it('应该成功增加积分', async () => {
      const res = await request(app)
        .post(`/api/v1/operator/points/${regularUser.id}/add`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          points: 50,
          reason: '测试加分'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.pointsChange).toBe(50);
      expect(res.body.data.newBalance).toBe(150);
    });

    it('积分数为负数时应该返回错误', async () => {
      const res = await request(app)
        .post(`/api/v1/operator/points/${regularUser.id}/add`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          points: -50,
          reason: '测试'
        });

      expect(res.statusCode).toBe(400);
    });

    it('用户不在租户中时应该返回错误', async () => {
      const otherUser = await createTestUser({
        username: `other_${Date.now()}`,
        role: 'user'
      });

      const res = await request(app)
        .post(`/api/v1/operator/points/${otherUser.id}/add`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          points: 50,
          reason: '测试'
        });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/operator/points/:userId/subtract - 扣除积分', () => {
    it('应该成功扣除积分', async () => {
      const res = await request(app)
        .post(`/api/v1/operator/points/${regularUser.id}/subtract`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          points: 30,
          reason: '测试扣分'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.pointsChange).toBe(-30);
      expect(res.body.data.newBalance).toBe(70);
    });

    it('扣除后积分不足时应该返回错误', async () => {
      const res = await request(app)
        .post(`/api/v1/operator/points/${regularUser.id}/subtract`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          points: 200,
          reason: '测试'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('余额不足');
    });
  });

  describe('POST /api/operator/points/:userId/modify - 修改积分', () => {
    it('应该成功修改积分', async () => {
      const res = await request(app)
        .post(`/api/v1/operator/points/${regularUser.id}/modify`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          newPoints: 500,
          reason: '积分调整'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.newBalance).toBe(500);
    });

    it('设置为负数时应该返回错误', async () => {
      const res = await request(app)
        .post(`/api/v1/operator/points/${regularUser.id}/modify`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          newPoints: -100,
          reason: '测试'
        });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/operator/points/:userId/transactions - 获取积分流水', () => {
    beforeEach(async () => {
      // 创建几条积分流水记录
      await PointTransaction.bulkCreate([
        {
          userId: regularUser.id,
          tenantId: tenant.id,
          transactionType: 'add',
          pointsChange: 50,
          balanceAfter: 150,
          reason: '测试流水1'
        },
        {
          userId: regularUser.id,
          tenantId: tenant.id,
          transactionType: 'subtract',
          pointsChange: -20,
          balanceAfter: 130,
          reason: '测试流水2'
        }
      ]);
    });

    it('应该成功获取积分流水', async () => {
      const res = await request(app)
        .get(`/api/v1/operator/points/${regularUser.id}/transactions`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data.list)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('应该支持分页', async () => {
      const res = await request(app)
        .get(`/api/v1/operator/points/${regularUser.id}/transactions?page=1&pageSize=1`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.list.length).toBe(1);
    });

    it('应该支持按类型筛选', async () => {
      const res = await request(app)
        .get(`/api/v1/operator/points/${regularUser.id}/transactions?transactionType=add`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.list.every(item => item.transactionType === 'add')).toBe(true);
    });
  });

  describe('POST /api/operator/points/batch-adjust - 批量调整积分', () => {
    let user2;

    beforeEach(async () => {
      // 创建第二个用户
      user2 = await createTestUser({
        username: `user2_${Date.now()}`,
        role: 'user'
      });

      // 将第二个用户添加到租户
      await UserTenantRelation.create({
        userId: user2.id,
        tenantId: tenant.id,
        pointsBalance: 100,
        status: 'approved'
      });
    });

    it('应该成功批量调整积分', async () => {
      const res = await request(app)
        .post('/api/v1/operator/points/batch-adjust')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          userIds: [regularUser.id, user2.id],
          adjustType: 'add',
          points: 50,
          reason: '批量调整'
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.success).toBe(2);
    });

    it('缺少必填参数时应该返回错误', async () => {
      const res = await request(app)
        .post('/api/v1/operator/points/batch-adjust')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          userIds: [],
          points: 50
        });

      expect(res.statusCode).toBe(400);
    });
  });
});
