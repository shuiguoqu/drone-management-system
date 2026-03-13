const mqtt = require('mqtt');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

class MqttService {
  constructor() {
    this.client = null;
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://mqtt-broker:1883';
  }

  connect() {
    this.client = mqtt.connect(this.brokerUrl);

    this.client.on('connect', () => {
      logger.info('MQTT 连接成功');
      
      // 订阅无人机心跳主题
      this.client.subscribe('drones/+/heartbeat', (err) => {
        if (err) {
          logger.error('订阅主题失败:', err);
        } else {
          logger.info('已订阅主题: drones/+/heartbeat');
        }
      });

      // 订阅无人机状态主题
      this.client.subscribe('drones/+/status', (err) => {
        if (err) {
          logger.error('订阅主题失败:', err);
        } else {
          logger.info('已订阅主题: drones/+/status');
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        await this.handleMessage(topic, data);
      } catch (error) {
        logger.error('处理 MQTT 消息失败:', error);
      }
    });

    this.client.on('error', (error) => {
      logger.error('MQTT 连接错误:', error);
    });

    this.client.on('disconnect', () => {
      logger.warn('MQTT 连接断开');
    });
  }

  async handleMessage(topic, data) {
    const topicParts = topic.split('/');
    const droneCode = topicParts[1];

    if (!droneCode) {
      logger.warn('无效的无人机编码:', topic);
      return;
    }

    const drone = await prisma.drone.findUnique({
      where: { droneCode },
    });

    if (!drone) {
      logger.warn(`无人机 ${droneCode} 不存在，跳过更新`);
      return;
    }

    const updateData = {
      lastHeartbeatAt: new Date(),
    };

    if (data.batteryLevel !== undefined) {
      updateData.batteryLevel = Math.max(0, Math.min(100, data.batteryLevel));
    }

    if (data.status && ['idle', 'flying', 'charging', 'maintenance', 'offline'].includes(data.status)) {
      updateData.status = data.status;
    }

    await prisma.drone.update({
      where: { droneCode },
      data: updateData,
    });

    logger.info(`无人机 ${droneCode} 状态已更新:`, updateData);
  }

  disconnect() {
    if (this.client) {
      this.client.end();
    }
  }
}

module.exports = new MqttService();
