# 带薪噗噗计时器 · 微信小程序前端

根据月薪与每日工时，在「带薪如厕」时间里估算「摸金」金额的趣味计时小程序。使用 **微信原生小程序**（无 npm 构建步骤），用 **微信开发者工具** 打开本目录即可预览与调试。

## 功能概览

| 模块 | 说明 |
|------|------|
| **计时** | 开始/结束一次计时，按设置计算收益并写入本地记录 |
| **日历** | 按自然月展示每日噗噗次数 |
| **噗噗排行榜** | 当前为本地数据 + 示意昵称；好友榜为占位 |
| **结果页** | 单次结束后的统计与分享图 |
| **历史** | 按日期分组的记录列表 |
| **设置** | 月薪、每日工时、清空本地记录 |

## 如何运行

1. 安装并打开 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)。
2. 选择 **导入项目**，目录指向本仓库下的 **`pay_for_shit_frontend`**（包含 `app.json` 的根目录）。
3. 填写你的小程序 **AppID**（测试可使用测试号）。
4. 编译后在模拟器或真机中运行。

本项目 **不包含** `package.json`，无需执行 `npm install`。

## 数据存储

设置与记录保存在客户端 **`wx.setStorageSync`** 中（见 `utils/storage.js` 中的 `pp_user_settings`、`pp_records`）。**当前版本未内置与云后端的 HTTP 对接**；若需账号同步、真周榜等，需在小程序中自行接入后端（例如 `wx.login` 换 token、`wx.request` 调用 API），并与 `pay_for_shit_backend` 的接口约定对齐。

## 目录结构（简要）

```
app.js / app.json          # 小程序入口与全局配置
custom-tab-bar/            # 自定义 tabBar
pages/
  index/                   # 计时首页
  calendar/                # 日历
  rank/                    # 排行榜
  result/                  # 单次结果
  history/                 # 历史
  settings/                # 设置
utils/
  storage.js               # 本地设置与记录
  calc.js                  # 时薪、收益、时长格式化
  monthGrid.js             # 月历格子
  leaderboard.js         # 排行榜数据组装
  quotes.js                # 结果页文案
components/cute-sky/     # 装饰组件
```

## 与后端联调（可选）

后端仓库见同工作区 **`pay_for_shit_backend`**。联调时注意：

- 在公众平台配置 **request 合法域名**（须 **HTTPS**）。
- 开发者工具中可临时勾选 **「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」** 访问本机 HTTP 接口做开发测试。

## 相关配置

- 工程与编译选项见根目录 **`project.config.json`**。
- 基础库版本以开发者工具 / `project.config.json` 中 `libVersion` 为准。
