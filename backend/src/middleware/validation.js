const { z } = require('zod');

const droneStatusEnum = ['idle', 'flying', 'charging', 'maintenance', 'offline'];

const createDroneSchema = z.object({
  droneCode: z.string().min(1, '无人机编号不能为空').max(50, '编号过长'),
  name: z.string().min(1, '名称不能为空').max(100, '名称过长'),
  model: z.string().min(1, '机型不能为空').max(100, '机型过长'),
  status: z.enum(droneStatusEnum, {
    errorMap: () => ({ message: '无效的状态值' }),
  }).default('idle'),
  batteryLevel: z.number().int().min(0).max(100).default(100),
  remark: z.string().max(500, '备注过长').optional(),
});

const updateDroneSchema = z.object({
  name: z.string().min(1, '名称不能为空').max(100, '名称过长').optional(),
  model: z.string().min(1, '机型不能为空').max(100, '机型过长').optional(),
  status: z.enum(droneStatusEnum, {
    errorMap: () => ({ message: '无效的状态值' }),
  }).optional(),
  batteryLevel: z.number().int().min(0).max(100).optional(),
  remark: z.string().max(500, '备注过长').optional(),
});

const queryDroneSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(10),
  keyword: z.string().optional(),
  status: z.enum(droneStatusEnum).optional(),
});

const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.parse(req.query);
      req.validatedQuery = result;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: '查询参数校验失败',
          code: 'QUERY_VALIDATION_ERROR',
          errors,
        });
      }
      next(error);
    }
  };
};

module.exports = {
  createDroneSchema,
  updateDroneSchema,
  queryDroneSchema,
  validate,
  validateQuery,
  droneStatusEnum,
};
