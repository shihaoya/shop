const request = require('supertest');
const app = require('../src/app');
const { createTestUser, cleanupTestData } = require('./helpers');
const { User } = require('../src/models');

describe('认证接口测试', () => {
  // 每个测试后清理数据
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/auth/register - 用户注册', () => {
    it('应该成功注册普通用户', async () => {
      const userData = {
        username: 'testuser001',
        password: 'Test123456',
        nickname: '测试用户',
        role: 'user'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.username).toBe(userData.username);
      expect(res.body.data.role).toBe('user');
    });

    it('应该成功注册运营方', async () => {
      const userData = {
        username: 'operator001',
        password: 'Test123456',
        nickname: '测试运营方',
        role: 'operator',
        description: '测试描述'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.role).toBe('operator');
    });

    it('用户名已存在时应该返回错误', async () => {
      // 先创建一个用户
      await createTestUser({ username: 'duplicate_user' });

      const userData = {
        username: 'duplicate_user',
        password: 'Test123456',
        role: 'user'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('用户名已存在');
    });

    it('密码强度不足时应该返回错误', async () => {
      const userData = {
        username: 'weakpass',
        password: '123',
        role: 'user'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(userData);

      expect(res.statusCode).toBe(400);
    });

    it('缺少必填参数时应该返回错误', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ username: 'test' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login - 用户登录', () => {
    let testUser;

    beforeEach(async () => {
      testUser = await createTestUser({
        username: 'login_test_user',
        password: 'Test123456'
      });
    });

    it('应该成功登录', async () => {
      const loginData = {
        username: 'login_test_user',
        password: 'Test123456'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.username).toBe('login_test_user');
    });

    it('密码错误时应该返回错误', async () => {
      const loginData = {
        username: 'login_test_user',
        password: 'WrongPassword123'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toContain('用户名或密码错误');
    });

    it('用户不存在时应该返回错误', async () => {
      const loginData = {
        username: 'nonexistent_user',
        password: 'Test123456'
      };

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send(loginData);

      expect(res.statusCode).toBe(401);
    });

    it('缺少参数时应该返回错误', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ username: 'test' });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/logout - 退出登录', () => {
    it('应该成功退出', async () => {
      const res = await request(app)
        .post('/api/v1/auth/logout');

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
    });
  });
});
