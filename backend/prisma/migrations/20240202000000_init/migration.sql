CREATE TABLE "drones" (
    "id" SERIAL NOT NULL,
    "droneCode" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "batteryLevel" INTEGER NOT NULL DEFAULT 100,
    "lastHeartbeatAt" TIMESTAMP(3),
    "remark" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drones_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "drones_droneCode_key" ON "drones"("droneCode");
CREATE INDEX "drones_status_idx" ON "drones"("status");
CREATE INDEX "drones_droneCode_idx" ON "drones"("droneCode");

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(50) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "role" VARCHAR(20) NOT NULL DEFAULT 'operator',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
