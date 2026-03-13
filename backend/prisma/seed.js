const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('开始种子数据...');

  // 创建默认管理员用户
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
    },
  });
  console.log('管理员用户已创建:', admin.username);

  // 创建示例无人机数据
  const drones = [
    {
      droneCode: 'DJI-001',
      name: '御3行业版-01',
      model: 'DJI Mavic 3 Enterprise',
      status: 'idle',
      batteryLevel: 85,
      remark: '主巡查无人机',
    },
    {
      droneCode: 'DJI-002',
      name: '御3行业版-02',
      model: 'DJI Mavic 3 Enterprise',
      status: 'flying',
      batteryLevel: 62,
      lastHeartbeatAt: new Date(),
      remark: '正在执行航线任务',
    },
    {
      droneCode: 'DJI-003',
      name: '精灵4RTK-01',
      model: 'DJI Phantom 4 RTK',
      status: 'charging',
      batteryLevel: 45,
      remark: '测绘专用',
    },
    {
      droneCode: 'DJI-004',
      name: 'M30T-01',
      model: 'DJI Matrice 30T',
      status: 'maintenance',
      batteryLevel: 0,
      remark: '定期维护中',
    },
    {
      droneCode: 'DJI-005',
      name: 'M350 RTK-01',
      model: 'DJI Matrice 350 RTK',
      status: 'offline',
      batteryLevel: 0,
      remark: '备用设备',
    },
  ];

  for (const drone of drones) {
    await prisma.drone.upsert({
      where: { droneCode: drone.droneCode },
      update: {},
      create: drone,
    });
  }
  console.log('示例无人机数据已创建:', drones.length, '条');

  console.log('种子数据完成！');
}

main()
  .catch((e) => {
    console.error('种子数据失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
