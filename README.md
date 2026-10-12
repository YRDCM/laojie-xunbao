# 老街寻宝（微信小游戏 v1.0）

市井找物休闲小游戏：主菜单 → 关卡选择（3 主题 × 3 难度共 9 关）→ 在菜市场、修表铺、中药房三幅手绘场景里，根据顶部目标栏找出藏着的 5 件老物件。纯 Canvas 程序绘制，JavaScript ES Module，6 个 AI 生成短音效。

- AppID：`wxfb0920d0d6a26ca4`
- 设计分辨率：750×1334（竖屏，等比缩放居中适配）
- 难度递进：目标半径 26~30 → 22 → 18，限时 90s → 75s → 60s，干扰物 0 → 3 → 5
- 按顺序解锁（前一关通过才解锁下一关），每关最佳成绩与 S/A/B 评级本地存档
- 首次游玩第 1 关出新手引导（3 秒或点击消失，该局点错不扣时间），点错正常扣 3 秒
- 音效带静音开关（主菜单/选关页右上角喇叭，状态存本地）

## 目录结构

```
game/
├── game.js                小游戏入口
├── game.json              小游戏配置（竖屏 portrait）
├── project.config.json    开发者工具项目配置（含 appid）
├── assets/audio/          6 个短音效 mp3（correct/wrong/win/fail/tick/tap）
├── src/
│   ├── main.js            主控制器：状态机 menu/levelselect/play/win/fail、计时、点击分发、新手引导、渲染循环
│   ├── scene.js           场景渲染（装饰 + 干扰物 + 目标）与点击命中检测
│   ├── levels.js          9 关配置（目标子集/坐标/半径/限时/干扰物，坐标手工排布避开装饰）
│   ├── painter.js         全部手绘函数：18 个物品图标 + 3 个关卡场景 + 主菜单老街背景 + 引导手指图标
│   ├── ui.js              主菜单 / 关卡选择九宫格 / HUD / 胜负结算弹层 / 新手引导层
│   ├── audio.js           音效封装（wx.createInnerAudioContext + 静音开关，浏览器降级 HTMLAudio）
│   └── share.js           分享（离屏绘制 5:4 分享卡片图）+ 激励视频/插屏广告封装（占位 adUnitId）
├── preview.template.html  浏览器预览模板（含 wx API shim，音频降级为 HTMLAudio）
├── build-preview.js       打包脚本：src 源码 → 单文件 preview.html（支持多行 import）
├── smoke-test.js          Node 冒烟测试：桩掉 Canvas/wx 跑全部状态与点击路径
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

直接双击打开 `preview.html` 即可完整试玩（用鼠标点击代替触屏，音效走 HTMLAudio）。

> 浏览器禁止 file:// 下的 ES Module 加载，因此 `preview.html` 是把 `src/` 源码剥离模块语法后打包的单文件。
> **改动 `src/` 后请重新执行 `node build-preview.js` 再刷新浏览器。**

调试截图钩子（备案/宣传用）：`preview.html?shot=menu / levelselect / guide / win / winA / winB / fail / mid / hint / revive / level1 ~ level9`

冒烟测试：`node smoke-test.js`（无需浏览器，覆盖菜单/选关/对局/胜负/引导/广告降级全路径）。

## 正式接入要改的位置

- **广告**：`src/share.js` 顶部 `AD_UNIT_ID`（激励视频）与 `INTERSTITIAL_AD_UNIT_ID`（插屏）占位常量 `'adunit-xxxxxxxxxxxxxxxx'`，换成微信后台真实广告位 ID 即可；奖励回调逻辑（提示高亮 / 加时 30 秒）在 `src/main.js` 的 `Game.watchAd()`，插屏在每 3 关通关回选关页时由 `backToSelectWithAd()` 触发。
- **分享图**：`src/share.js` 的 `buildShareCard()` 已用离屏 canvas 绘制 5:4 分享图并经 `toTempFilePathSync` 生成；想换设计直接改这个函数。
- **图片素材替换程序绘制**：`src/painter.js` 的 `ITEM_DRAWERS`（物品图标）与 `SCENE_DRAWERS`（场景装饰）换成贴图绘制即可，坐标与命中逻辑不变（在 `src/levels.js` 配置）。
- **音效替换**：`assets/audio/` 下替换同名 mp3 即可；新增音效在 `src/audio.js` 的 `SOUND_FILES` 里登记。

## 合规说明

- 激励广告失败时降级为演示模式直接发奖励，不强制广告、不阻断流程；插屏广告创建/展示失败一律静默。
- 画面顶部常驻游戏名「老街寻宝」，主菜单大标题与选关页底部也有游戏名，满足备案截图要求。
