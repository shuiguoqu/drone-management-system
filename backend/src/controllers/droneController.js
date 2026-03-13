const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

const createDrone = async (req, res) => {
  try {
    const data = req.validatedData;
    
    const existing = await prisma.drone.findUnique({
      where: { droneCode: data.droneCode },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: '无人机编号已存在',
        code: 'DRONE_CODE_EXISTS',
      });
    }

    const drone = await prisma.drone.create({ data });
    
    logger.info(`无人机已创建: ${drone.droneCode}, 操作人: ${req.user.username}`);
    
    res.status(201).json({
      success: true,
      message: '无人机创建成功',
      data: drone,
    });
  } catch (error) {
    logger.error('创建无人机失败:', error);
    res.status(500).json({
      success: false,
      message: '创建无人机失败',
      code: 'CREATE_DRONE_ERROR',
    });
  }
};

const getDrones = async (req, res) => {
  try {
    const { page, pageSize, keyword, status } = req.validatedQuery;
    
    const where = {};
    
    if (keyword) {
      where.OR = [
        { droneCode: { contains: keyword, mode: 'insensitive' } },
        { name: { contains: keyword, mode: 'insensitive' } },
        { model: { contains: keyword, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      where.status = status;
    }

    const [drones, total] = await Promise.all([
      prisma.drone.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.drone.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        list: drones,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    logger.error('查询无人机列表失败:', error);
    res.status(500).json({
      success: false,
      message: '查询无人机列表失败',
      code: 'QUERY_DRONES_ERROR',
    });
  }
};

const getDroneById = async (req, res) => {
  try {
    const { id } = req.params;
    const droneId = parseInt(id);

    if (isNaN(droneId)) {
      return res.status(400).json({
        success: false,
        message: '无效的ID格式',
        code: 'INVALID_ID',
      });
    }

    const drone = await prisma.drone.findUnique({
      where: { id: droneId },
    });

    if (!drone) {
      return res.status(404).json({
        success: false,
        message: '无人机不存在',
        code: 'DRONE_NOT_FOUND',
      });
    }

    res.json({
      success: true,
      data: drone,
    });
  } catch (error) {
    logger.error('查询无人机详情失败:', error);
    res.status(500).json({
      success: false,
      message: '查询无人机详情失败',
      code: 'GET_DRONE_ERROR',
    });
  }
};

const updateDrone = async (req, res) => {
  try {
    const { id } = req.params;
    const droneId = parseInt(id);
    const data = req.validatedData;

    if (isNaN(droneId)) {
      return res.status(400).json({
        success: false,
        message: '无效的ID格式',
        code: 'INVALID_ID',
      });
    }

    const existing = await prisma.drone.findUnique({
      where: { id: droneId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '无人机不存在',
        code: 'DRONE_NOT_FOUND',
      });
    }

    const drone = await prisma.drone.update({
      where: { id: droneId },
      data,
    });

    logger.info(`无人机已更新: ${drone.droneCode}, 操作人: ${req.user.username}`);

    res.json({
      success: true,
      message: '无人机更新成功',
      data: drone,
    });
  } catch (error) {
    logger.error('更新无人机失败:', error);
    res.status(500).json({
      success: false,
      message: '更新无人机失败',
      code: 'UPDATE_DRONE_ERROR',
    });
  }
};

const deleteDrone = async (req, res) => {
  try {
    const { id } = req.params;
    const droneId = parseInt(id);

    if (isNaN(droneId)) {
      return res.status(400).json({
        success: false,
        message: '无效的ID格式',
        code: 'INVALID_ID',
      });
    }

    const existing = await prisma.drone.findUnique({
      where: { id: droneId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '无人机不存在',
        code: 'DRONE_NOT_FOUND',
      });
    }

    await prisma.drone.delete({
      where: { id: droneId },
    });

    logger.info(`无人机已删除: ${existing.droneCode}, 操作人: ${req.user.username}`);

    res.json({
      success: true,
      message: '无人机删除成功',
    });
  } catch (error) {
    logger.error('删除无人机失败:', error);
    res.status(500).json({
      success: false,
      message: '删除无人机失败',
      code: 'DELETE_DRONE_ERROR',
    });
  }
};

module.exports = {
  createDrone,
  getDrones,
  getDroneById,
  updateDrone,
  deleteDrone,
};
