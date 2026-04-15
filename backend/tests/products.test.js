const request = require('supertest');
const app = require('../src/app');
const { createTestUser, generateTestToken, cleanupTestData } = require('./helpers');
const { User, Tenant, Product } = require('../src/models');

describe('商品管理接口测试', () => {
  let operatorUser;
  let operatorToken;
  let tenant;

  // 测试前准备运营方用户和租户
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

    // 生成Token
    operatorToken = generateTestToken(operatorUser);
  });

  // 每个测试后清理数据
  afterEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/operator/products - 创建商品', () => {
    it('应该成功创建商品', async () => {
      const productData = {
        name: '测试商品',
        description: '商品描述',
        pointsRequired: 100,
        stock: 50,
        category: '礼品',
        imageUrl: 'http://example.com/image.jpg'
      };

      const res = await request(app)
        .post('/api/v1/operator/products')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(productData);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(res.body.data.name).toBe(productData.name);
      expect(res.body.data.pointsRequired).toBe(productData.pointsRequired);
    });

    it('未认证时应该返回401', async () => {
      const productData = {
        name: '测试商品',
        pointsRequired: 100,
        stock: 50
      };

      const res = await request(app)
        .post('/api/v1/operator/products')
        .send(productData);

      expect(res.statusCode).toBe(401);
    });

    it('缺少必填参数时应该返回错误', async () => {
      const productData = {
        description: '缺少名称和积分'
      };

      const res = await request(app)
        .post('/api/v1/operator/products')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(productData);

      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/operator/products - 获取商品列表', () => {
    beforeEach(async () => {
      // 创建几个测试商品
      await Product.bulkCreate([
        {
          tenantId: tenant.id,
          name: '商品1',
          pointsRequired: 100,
          stock: 10,
          status: 'on_shelf'
        },
        {
          tenantId: tenant.id,
          name: '商品2',
          pointsRequired: 200,
          stock: 20,
          status: 'off_shelf'
        }
      ]);
    });

    it('应该成功获取商品列表', async () => {
      const res = await request(app)
        .get('/api/v1/operator/products')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.code).toBe(200);
      expect(Array.isArray(res.body.data.list)).toBe(true);
      expect(res.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('应该支持分页', async () => {
      const res = await request(app)
        .get('/api/v1/operator/products?page=1&pageSize=1')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.list.length).toBe(1);
    });

    it('应该支持按状态筛选', async () => {
      const res = await request(app)
        .get('/api/v1/operator/products?status=on_shelf')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.list.every(item => item.status === 'on_shelf')).toBe(true);
    });
  });

  describe('PUT /api/operator/products/:id - 更新商品', () => {
    let product;

    beforeEach(async () => {
      product = await Product.create({
        tenantId: tenant.id,
        name: '原商品',
        pointsRequired: 100,
        stock: 10
      });
    });

    it('应该成功更新商品', async () => {
      const updateData = {
        name: '更新后的商品',
        pointsRequired: 150
      };

      const res = await request(app)
        .put(`/api/v1/operator/products/${product.id}`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send(updateData);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.name).toBe(updateData.name);
      expect(res.body.data.pointsRequired).toBe(updateData.pointsRequired);
    });

    it('更新不存在的商品应该返回错误', async () => {
      const res = await request(app)
        .put('/api/v1/operator/products/99999')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ name: '测试' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/operator/products/:id - 删除商品', () => {
    let product;

    beforeEach(async () => {
      product = await Product.create({
        tenantId: tenant.id,
        name: '待删除商品',
        pointsRequired: 100,
        stock: 10
      });
    });

    it('应该成功删除商品（逻辑删除）', async () => {
      const res = await request(app)
        .delete(`/api/v1/operator/products/${product.id}`)
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.statusCode).toBe(200);
      
      // 验证商品已被逻辑删除
      const deletedProduct = await Product.findByPk(product.id);
      expect(deletedProduct.isDeleted).toBe(1);
    });
  });

  describe('PUT /api/operator/products/:id/status - 更新商品状态', () => {
    let product;

    beforeEach(async () => {
      product = await Product.create({
        tenantId: tenant.id,
        name: '状态测试商品',
        pointsRequired: 100,
        stock: 10,
        status: 'off_shelf'
      });
    });

    it('应该成功上架商品', async () => {
      const res = await request(app)
        .put(`/api/v1/operator/products/${product.id}/status`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'on_shelf' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('on_shelf');
    });

    it('应该成功下架商品', async () => {
      // 先上架
      await product.update({ status: 'on_shelf' });

      const res = await request(app)
        .put(`/api/v1/operator/products/${product.id}/status`)
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'off_shelf' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.status).toBe('off_shelf');
    });
  });
});
