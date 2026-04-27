---
name: wxminiapp-cloud-0to1
description: 从 0 到 1 搭建微信小程序（前端 + 云开发后端）的可复用流程。适用于快速做 MVP、从本地原型迁移到云函数、排查云开发超时与索引问题。
---

# WeChat Miniapp Cloud 0-to-1

本 Skill 用于把“从 0 到 1 做出一个可运行、可分享、可迭代的小程序”流程标准化。

## When to Use This Skill

- 新建微信小程序 MVP（功能不大但要快落地）
- 已有本地原型，准备迁移到云开发
- 云函数出现 timeout、数据不一致、排行榜异常
- 需要一份发布前的可执行 checklist

## Core Workflow

### Phase 1: 产品闭环优先（本地可用）

1. 先完成前端主流程与本地存储闭环：
   - 设置
   - 记录
   - 汇总统计
   - 基础榜单展示
2. 所有“用户关键动作”先保证本地立即成功反馈。

### Phase 2: 云化迁移（云函数 + 云数据库）

1. 初始化云环境：
   - `wx.cloud.init({ env, traceUser: true })`
   - `project.config.json` 设置 `cloudfunctionRoot`
2. 建集合：
   - `settings`
   - `records`
   - `profiles`
3. 建索引：
   - `settings._openid` 唯一
   - `profiles._openid` 唯一
   - `records(_openid, endTime)` 非唯一
   - `records(_openid, clientId)` 唯一
   - `records.endTime` 非唯一
4. 云函数采用统一 `api` 入口 + `action` 分发。
5. 前端通过统一 `cloudApi` 调用云函数。

### Phase 3: 一致性与性能

1. 上报记录使用 `clientId` 做幂等去重。
2. 批量写入使用“批量查重 + 分批并发写”。
3. 页面进入时增加“云端下拉同步 -> 回填本地”。
4. 排行榜使用数据库端聚合（不要全量拉取后 JS 聚合）。

### Phase 4: 可分享与可发布

1. 云函数部署到最新版本。
2. 真机走完整链路自测。
3. 给体验成员生成体验码。

## Recommended Cloud Function Contract

- Request:
  - `{ action: string, data?: object }`
- Response:
  - success: `{ ok: true, data: any }`
  - error: `{ ok: false, message: string }`

建议 action：

- `settings.get`
- `settings.put`
- `records.list`
- `records.batchUpsert`
- `records.clear`
- `leaderboard.week`
- `profile.put`

## Debug Playbook

### Symptom: `Error: timeout`

按顺序排查：

1. 云函数是否是最新部署版本；
2. 索引是否齐全；
3. 是否存在全量扫描 + 应用层聚合；
4. 查看云函数日志对应 action 的耗时与错误。

### Symptom: 排行榜时长全 0

1. 检查 `records` 是否有 `durationSeconds`；
2. 检查云函数返回是否包含 `durationSeconds/durationText`；
3. 前端做兼容兜底（缺少 `durationText` 时用 `durationSeconds` 现场格式化）。

### Symptom: 无法部署云函数（未选择云环境）

1. 在开发者工具绑定 cloudfunctionRoot 对应 env；
2. 确保右键部署的是云函数目录而非单文件。

## UX Guidelines (Pragmatic)

- 主流程动作“先本地成功，再异步云同步”；
- 云失败给轻提示，不阻断主流程；
- 设置项可沉淀到 `settings`（例如排行榜显示金额开关）。

## Output Checklist (Done Definition)

- [ ] 集合与索引创建完成
- [ ] 云函数部署完成
- [ ] 设置可保存并落库
- [ ] 记录可上报并落库
- [ ] 历史/日历可读到云同步数据
- [ ] 榜单排序逻辑符合预期
- [ ] 失败场景有兜底与提示

## Reference

- 项目复盘：`docs/wxminiapp-0to1-retrospective.md`