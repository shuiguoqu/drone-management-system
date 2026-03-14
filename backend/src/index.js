const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const logger = require('./utils/logger');
const { authMiddleware } = require('./middleware/auth');
const { validate, validateQuery, createDroneSchema, updateDroneSchema, queryDroneSchema } = require('./middleware/validation');
const authController = require('./controllers/authController');
const droneController = require('./controllers/droneController');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8000;

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: '请求过于频繁，请稍后再试',
    code: 'RATE_LIMIT_EXCEEDED',
  },
});

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: '写操作过于频繁，请稍后再试',
    code: 'WRITE_RATE_LIMIT_EXCEEDED',
  },
});

// 中间件
app.use(cors());
app.use(express.json());
app.use(limiter);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 公开接口
app.post('/api/auth/login', authController.login);

// 受保护接口
app.get('/api/auth/me', authMiddleware, authController.getCurrentUser);

// 无人机管理接口
app.get('/api/drones', authMiddleware, validateQuery(queryDroneSchema), droneController.getDrones);
app.get('/api/drones/:id', authMiddleware, droneController.getDroneById);
app.post('/api/drones', authMiddleware, writeLimiter, validate(createDroneSchema), droneController.createDrone);
app.put('/api/drones/:id', authMiddleware, writeLimiter, validate(updateDroneSchema), droneController.updateDrone);
app.delete('/api/drones/:id', authMiddleware, writeLimiter, droneController.deleteDrone);

  });
});

// 启动服务器
app.listen(PORT, () => {
  logger.info(`服务器启动成功，端口: ${PORT}`);
  
  // 连接 MQTT
  mqttService.connect();
});

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到 SIGTERM 信号，开始关闭...');
  mqttService.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('收到 SIGINT 信号，开始关闭...');
  mqttService.disconnect();
  await prisma.$disconnect();
  process.exit(0);
});
