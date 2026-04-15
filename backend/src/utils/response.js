/**
 * 统一响应格式
 */

const success = (res, data = null, message = '操作成功') => {
  return res.json({
    code: 200,
    message,
    data
  });
};

const error = (res, message = '操作失败', code = 400, data = null) => {
  return res.status(code).json({
    code,
    message,
    data
  });
};

const notFound = (res, message = '资源不存在') => {
  return error(res, message, 404);
};

const unauthorized = (res, message = '未授权') => {
  return error(res, message, 401);
};

const forbidden = (res, message = '禁止访问') => {
  return error(res, message, 403);
};

module.exports = {
  success,
  error,
  notFound,
  unauthorized,
  forbidden
};
