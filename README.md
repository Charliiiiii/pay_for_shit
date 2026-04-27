# 带薪噗噗计算器 · 微信小程序前端

一个微信原生小程序（无 npm 构建），支持计时、收益计算、历史/日历、周榜和分享图。当前版本已切换到 **微信云开发**（云函数 + 云数据库），并保留本地缓存兜底。

## 功能概览

| 模块 | 说明 |
|------|------|
| **计时** | 开始/结束一次计时，实时显示收益并写入记录 |
| **历史 / 日历** | 按日期回看记录，统计每日噗噗次数 |
| **排行榜（全部）** | 按本周累计时长排序，金额可选显示 |
| **排行榜（好友）** | 入口预留（当前仍为占位） |
| **设置** | 月薪、每日工时、排行榜是否显示金额、清空记录 |
| **结果页** | 单次结束后的统计和分享图 |

## 技术与架构

- 前端：微信原生小程序
- 后端：微信云开发
  - 云函数：`cloudfunctions/api`
  - 云数据库：`settings`、`records`、`profiles`
- 本地缓存：`utils/storage.js`（离线兜底 + 云同步落地）

## 快速开始

1. 安装并打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 导入目录：`pay_for_shit_frontend`（含 `app.json`）。
3. 使用你的小程序 `AppID` 打开项目。
4. 在开发者工具中开通并绑定云开发环境（`env`）。
5. 右键 `cloudfunctions/api` -> **上传并部署：云端安装依赖**。
6. 编译运行。

> 本项目无 `package.json`，无需 `npm install`。

## 云开发初始化与配置

- 云初始化位置：`app.js`
- 云函数根目录：`project.config.json` 中 `cloudfunctionRoot: "cloudfunctions"`

若部署时报错 “请在编辑器云函数根目录选择一个云环境”，请先在开发者工具里为 `cloudfunctions` 绑定云环境再部署。

## 数据集合与索引（必须）

### 集合

- `settings`
- `records`
- `profiles`

### 索引建议

- `settings`：`_openid`（唯一）
- `profiles`：`_openid`（唯一）
- `records`：
  - `(_openid, endTime)` 非唯一
  - `(_openid, clientId)` 唯一（幂等）
  - `endTime` 非唯一（周榜聚合性能）

## 排行榜说明

- 全部用户榜：按本周累计时长降序排序（`durationSeconds`）。
- 金额展示：由设置页开关控制（`rankShowAmount`）。
- 好友榜：当前仅保留入口，后续可接 `friend_links` 关系链。

## 目录结构（简要）

```text
app.js / app.json
cloudfunctions/
  api/                     # 云函数统一入口（action 分发）
pages/
  index/                   # 计时
  history/                 # 历史
  calendar/                # 日历
  rank/                    # 排行榜
  result/                  # 结果页
  settings/                # 设置
utils/
  cloudApi.js              # 云函数调用封装
  cloudSync.js             # 云端记录下拉同步
  storage.js               # 本地缓存（设置 + 记录）
  leaderboard.js           # 本地榜单回退逻辑
components/cute-sky/       # 顶部装饰组件
docs/                      # 项目复盘文档
```

## 常见问题

- **排行榜时长全是 0**  
  通常是云函数未部署到最新版本；重新部署 `cloudfunctions/api` 并确认 `records` 含 `durationSeconds` 字段。

- **云函数 timeout**  
  检查索引是否齐全，优先确认 `records.endTime` 索引与周榜聚合逻辑。

- **云端和本地数据不一致**  
  进入首页/历史/日历会自动触发下拉同步；若仍异常，查看云函数日志和集合数据。

## 经验沉淀

- 详细复盘：`docs/wxminiapp-0to1-retrospective.md`
- 可复用 Skill：`.agents/skills/wxminiapp-cloud-0to1/SKILL.md`
