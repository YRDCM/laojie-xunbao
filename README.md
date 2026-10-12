# 老街寻宝（微信小游戏 Demo）

市井找物休闲小游戏：在菜市场、修表铺、中药房三幅手绘场景里，根据顶部目标栏找出藏着的 5 件老物件。纯 Canvas 程序绘制，无图片资源，JavaScript ES Module。

- AppID：`wxfb0920d0d6a26ca4`
- 设计分辨率：750×1334（竖屏，等比缩放居中适配）
- 每关限时 90 秒，点错扣 3 秒；找齐结算用时与 S/A/B 评价，历史最佳本地存档

## 目录结构

```
game/
├── game.js                小游戏入口
├── game.json              小游戏配置（竖屏 portrait）
├── project.config.json    开发者工具项目配置（含 appid）
├── src/
│   ├── main.js            主控制器：状态机、计时、点击分发、渲染循环
│   ├── scene.js           场景渲染与点击命中检测
│   ├── levels.js          关卡配置（3 关 × 5 个目标物品的坐标/半径/绘制函数名）
│   ├── painter.js         全部手绘函数：15 个物品图标 + 3 个场景装饰
│   ├── ui.js              HUD（标题/时间条/目标栏）与胜利/失败弹层
│   └── share.js           分享与激励视频广告封装（占位 adUnitId）
├── preview.template.html  浏览器预览模板（含 wx API shim）
├── build-preview.js       打包脚本：src 源码 → 单文件 preview.html
└── preview.html           生成的浏览器预览（双击即玩）
```

## 微信开发者工具导入

1. 打开微信开发者工具，选择「导入项目」。
2. 目录选择本 `game` 文件夹；AppID 已写入 `project.config.json`（`wxfb0920d0d6a26ca4`），若无权限可改用测试号。
3. 项目名称「老街寻宝」，确认后自动编译进入模拟器预览。

## 扫码真机预览

1. 开发者工具顶部工具栏点「预览」。
2. 微信扫描二维码即可在手机上试玩。

## 浏览器预览（无需开发者工具）

直接双击打开 `preview.html` 即可完整试玩（用鼠标点击代替触屏）。

> 浏览器禁止 file:// 下的 ES Module 加载，因此 `preview.html` 是把 `src/` 源码剥离模块语法后打包的单文件。
> **改动 `src/` 后请重新执行 `node build-preview.js` 再刷新浏览器。**

## 正式接入要改的位置

- **广告**：`src/share.js` 顶部 `AD_UNIT_ID` 占位常量 `'adunit-xxxxxxxxxxxxxxxx'`，换成微信后台真实广告位 ID 即可；奖励回调逻辑（提示高亮 / 加时 30 秒）在 `src/main.js` 的 `Game.watchAd()`。
- **分享图**：`src/share.js` 的 `setupShare()` / `shareResult()` 中 `imageUrl` 为空，正式版填分享图地址。
- **图片素材替换程序绘制**：`src/painter.js` 的 `ITEM_DRAWERS`（物品图标）与 `SCENE_DRAWERS`（场景装饰）换成贴图绘制即可，坐标与命中逻辑不变（在 `src/levels.js` 配置）。
- **音效**：`preview.html` shim 已含 `createInnerAudioContext` 空实现，可直接在游戏内调用该 API 播放音效。

## 合规说明

- 激励广告失败时降级为演示模式直接发奖励，不强制广告、不阻断流程。
- 画面顶部常驻游戏名「老街寻宝」，满足备案截图要求。
