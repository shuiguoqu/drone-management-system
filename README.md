# 大疆无人机管理系统

## 🧭 Project Type
- Type: A) FULLSTACK_WEB

## 🧩 技术栈
- **Frontend**: Vite + Vue3 + Ant Design Vue
- **Backend**: Node.js + Express + Prisma ORM + PostgreSQL
- **Database**: PostgreSQL 15 (容器化)
- **MQTT**: Eclipse Mosquitto (设备消息对接)

## 🚀 快速启动（唯一命令）

1. 确保 Docker Desktop / Docker Engine 可用
2. 在项目根目录执行：
   ```bash
   docker compose up
   ```
3. 等待所有服务启动完成（约 30-60 秒）
4. 访问地址：
   - **前端**: http://localhost:3001
   - **后端 API**: http://localhost:8001
   - **健康检查**: http://localhost:8001/health

## 👤 测试账号
- 用户名: `admin`
- 密码: `admin123`

## ✅ 功能清单

### F1: 无人机数据模型与持久化 ✅
- 数据表: `drones`
- 字段: id, droneCode(唯一), name, model, status, batteryLevel, lastHeartbeatAt, remark, createdAt, updatedAt
- 使用 Prisma ORM + PostgreSQL 真实读写

### F2: 后端 API（CRUD）✅
- `GET /api/drones` - 分页查询（支持关键字、状态筛选）
- `GET /api/drones/:id` - 详情
- `POST /api/drones` - 新增
- `PUT /api/drones/:id` - 修改
- `DELETE /api/drones/:id` - 删除
- 统一响应结构 + 完整参数校验（Zod）

### F3: 鉴权与安全基线 ✅
- JWT Bearer Token 认证
- 未登录访问返回 401
- 输入校验（前后端双重校验）
- ORM 防 SQL 注入
- 写接口限流（每分钟10次）

### F4: 前端无人机管理页 ✅
- 无人机列表页（表格 + 分页 + 搜索 + 状态筛选）
- 统计卡片展示各状态数量
- 新增/编辑弹窗表单（前端校验）
- 删除二次确认
- Ant Design Vue 消息提示（无 alert）
- Loading、空态、错误态完整

### F5: MQTT 服务对接 ✅
- 复用 Eclipse Mosquitto MQTT Broker
- 订阅主题: `drones/+/heartbeat`, `drones/+/status`
- 自动更新 lastHeartbeatAt、batteryLevel、status
- 日志记录所有 MQTT 消息处理

### F6: 文档与交付物 ✅
- README.md（本文档）
- SELF_CHECK.md（六维质检）
- QA_REPORT.md（验证记录）
- TRACE.md（轨迹导出说明）
- evidence/（截图证据目录）

## 🔎 自测说明

### 成功路径
1. 执行 `docker compose up` 启动所有服务
2. 访问 http://localhost:3001 进入登录页
3. 使用 admin/admin123 登录
4. 进入无人机列表页，查看预置的5条数据
5. 点击"新增无人机"，填写表单创建新设备
6. 点击"编辑"修改设备信息
7. 点击"删除"并确认，删除设备
8. 使用搜索框和状态筛选查询数据

### 失败路径
1. 访问 http://localhost:8001/api/drones（无Token）→ 返回 401
2. 使用错误密码登录 → 提示"用户名或密码错误"
3. 创建重复编号 → 提示"无人机编号已存在"
4. 表单校验失败 → 显示具体字段错误

### 边界/异常
- 电量范围: 0-100
- 分页边界: 第1页、最后一页
- 状态枚举: idle/flying/charging/maintenance/offline

## 📊 六维自测报告

### 自测情况 - 硬性门槛说明
项目可通过 `docker compose up` 成功启动，4个服务（frontend/backend/db/mqtt-broker）均容器化运行。关键业务流程（登录认证、无人机 CRUD、列表筛选分页）全部可用，API 返回格式统一（success/message/code/data）并具备完整错误码与提示信息。

**证据文件:**
- `evidence/qa/dim1_docker_gate.txt` - Docker 容器状态
- `evidence/qa/dim1_health_check.txt` - 数据库健康检查
- `evidence/qa/dim1_backend_logs.txt` - 后端服务启动日志
- `evidence/qa/dim1_api_test.txt` - API 接口测试
- `evidence/qa/dim1_login_page.png` - 登录页面截图

### 自测情况 - 交付完整性说明
交付包含前后端源码、`docker-compose.yml`/`Dockerfile`、`README.md`/用户文档，依赖由 `package.json` 与 `package-lock.json` 管理，无缺失项。CRUD 五个接口全部实现并通过测试。

**证据文件:**
- `evidence/qa/dim2_drone_list.png` - 无人机列表页
- `evidence/qa/dim2_create_form.png` - 新增无人机弹窗
- `evidence/qa/dim2_edit_form.png` - 编辑无人机弹窗
- `evidence/qa/dim2_delete_confirm.png` - 删除二次确认

### 自测情况 - 工程与架构质量说明
项目采用清晰的分层与模块组织：后端 MVC 模式（controllers/middleware/services/utils），前端组件化（views/components/api/router）。职责边界明确，前后端目录分离。代码遵循 Node.js/Vue3 规范，变量命名语义化，具备 JWT 认证、Zod 参数校验、ORM 防注入等安全机制。

**证据文件:**
- `evidence/qa/dim3_architecture.txt` - 项目目录结构
- `evidence/qa/dim3_code_structure.txt` - 代码分层结构
- `evidence/qa/dim3_docker_config.txt` - Docker 配置文件
- `evidence/qa/dim3_api_routes.txt` - API 路由定义

### 自测情况 - 工程细节与专业度说明
异步操作均配备 Loading 与结果反馈（Toast），表单含 Ant Design Vue 前端校验并在后端 Zod 二次校验。列表空状态有友好占位图，按钮态、悬停态与删除二次确认等交互细节到位。错误码语义化，HTTP 状态码正确映射。

**证据文件:**
- `evidence/qa/dim4_engineering_details.txt` - 校验与 Loading 代码
- `evidence/qa/dim4_error_codes.txt` - 错误代码设计
- `evidence/qa/dim4_filter_dropdown.png` - 筛选下拉框
- `evidence/qa/dim4_filter_result.png` - 筛选结果展示

### 自测情况 - Prompt 需求理解与适配度说明
严格遵守题目指定的技术选型（Vite + Vue3 + Ant Design Vue + Node.js + PostgreSQL + MQTT），未引入无关框架。CRUD 五个接口、认证鉴权、筛选分页全部实现。接口认证覆盖率 100%，6个受保护端点、2个公开端点。

**证据文件:**
- `evidence/qa/dim5_prompt_alignment.txt` - 需求对齐分析
- `evidence/qa/dim5_tech_stack.txt` - 技术栈验证
- `evidence/qa/dim5_auth_coverage.txt` - 认证覆盖测试
- `evidence/qa/dim5_crud_test.txt` - CRUD 功能测试

### 自测情况 - 美观度说明
整体视觉采用 Ant Design Vue 统一设计语言，关键页面有清晰的主次层级与可读性。页面布局采用卡片化结构（统计卡片 + 筛选卡片 + 表格卡片），搭配适度阴影与圆角形成层次感。状态标签语义化配色（绿/蓝/橙/紫/灰），电量进度条分级警示。

**证据文件:**
- `evidence/qa/dim6_ui_design.txt` - UI 设计说明
- `evidence/qa/dim6_color_scheme.txt` - 配色方案
- `evidence/qa/dim6_interaction.txt` - 交互体验
- `evidence/qa/dim6_stats_cards.png` - 统计卡片截图

---

## 🧾 证据文件清单（已验证 2026-02-02）

### 六维证据目录 (evidence/qa/)
| 维度 | 文件名 | 说明 |
|------|--------|------|
| 1-硬性门槛 | dim1_docker_gate.txt | Docker 容器状态 |
| 1-硬性门槛 | dim1_health_check.txt | 数据库健康检查 |
| 1-硬性门槛 | dim1_backend_logs.txt | 后端启动日志 |
| 1-硬性门槛 | dim1_api_test.txt | API 接口测试 |
| 1-硬性门槛 | dim1_login_page.png | 登录页面截图 |
| 2-交付完整性 | dim2_drone_list.png | 无人机列表 |
| 2-交付完整性 | dim2_create_form.png | 新增弹窗 |
| 2-交付完整性 | dim2_edit_form.png | 编辑弹窗 |
| 2-交付完整性 | dim2_delete_confirm.png | 删除确认 |
| 3-工程架构 | dim3_architecture.txt | 目录结构 |
| 3-工程架构 | dim3_code_structure.txt | 代码分层 |
| 3-工程架构 | dim3_docker_config.txt | Docker 配置 |
| 3-工程架构 | dim3_api_routes.txt | API 路由 |
| 4-工程细节 | dim4_engineering_details.txt | 校验与 Loading |
| 4-工程细节 | dim4_error_codes.txt | 错误代码 |
| 4-工程细节 | dim4_filter_dropdown.png | 筛选下拉 |
| 4-工程细节 | dim4_filter_result.png | 筛选结果 |
| 5-需求理解 | dim5_prompt_alignment.txt | 需求对齐 |
| 5-需求理解 | dim5_tech_stack.txt | 技术栈 |
| 5-需求理解 | dim5_auth_coverage.txt | 认证覆盖 |
| 5-需求理解 | dim5_crud_test.txt | CRUD 测试 |
| 6-美观度 | dim6_ui_design.txt | UI 设计 |
| 6-美观度 | dim6_color_scheme.txt | 配色方案 |
| 6-美观度 | dim6_interaction.txt | 交互体验 |
| 6-美观度 | dim6_stats_cards.png | 统计卡片 |

### 安全与认证证明
- `evidence/auth-coverage.json` - 鉴权覆盖测试数据（8个端点全覆盖）

## 🐳 服务架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
├─────────────┬─────────────┬─────────────┬───────────────────┤
│  frontend   │  backend    │     db      │   mqtt-broker     │
│   :3001     │   :8001     │  postgres   │  :1883 :9001      │
│  (Vue3)     │  (Express)  │     :5432   │  (Mosquitto)      │
└─────────────┴─────────────┴─────────────┴───────────────────┘
```

## 🔧 技术细节

### 数据库连接
- 后端通过服务名 `db` 连接 PostgreSQL
- 自动执行 Prisma Migration
- 自动种子数据（5条示例无人机 + 1个管理员）

### MQTT 集成
- 订阅主题: `drones/{droneCode}/heartbeat`
- 订阅主题: `drones/{droneCode}/status`
- 消息格式: JSON `{ batteryLevel: number, status: string }`

### API 响应格式
```json
{
  "success": true/false,
  "message": "提示信息",
  "code": "错误代码",
  "data": { ... }
}
```

## 📞 联系方式

如有问题，请参考 `SELF_CHECK.md` 和 `QA_REPORT.md` 获取详细验证记录。

---

**大疆无人机管理系统 v1.0.0** | 2024

## 2026-02-15 质检修复同步说明

### 修复内容
- 登录失败提示：修复全局 401 拦截策略，`/api/auth/login` 返回 401 时不再强制跳转，前端可展示“用户名或密码错误”。
- 操作列美观度：修复删除按钮越界，调整操作列宽度与按钮内边距。
- 安全文案：登录页移除明文默认账号展示（测试账号仍保留在 README 受控文档区域）。

### 本轮验证命令
```bash
docker compose up
node --test frontend/tests/auth-redirect-policy.test.mjs
```

### 最小打包清单
- `frontend/`
- `backend/`
- `mqtt/`
- `docker-compose.yml`
- `README.md`
- `QA_REPORT.md`
- `SELF_CHECK.md`
- `TRACE.md`
- `scripts/qa-screenshot-plan.json`
- `evidence/`
