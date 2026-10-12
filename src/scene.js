// ============================================================
// scene.js —— 场景渲染与点击命中
// ============================================================
import { SCENE_DRAWERS, ITEM_DRAWERS } from './painter.js'

// 绘制整关画面：先画场景装饰，再画干扰物（点了算错），最后叠加目标物品
export function drawScene(ctx, level) {
  SCENE_DRAWERS[level.scene](ctx, level.palette)
  // 干扰物与目标混排，视觉上无区别，增加难度
  for (const d of level.decoys || []) {
    ITEM_DRAWERS[d.draw](ctx, d.x, d.y, d.r)
  }
  for (const t of level.targets) {
    ITEM_DRAWERS[t.draw](ctx, t.x, t.y, t.r)
  }
}

// 命中检测：返回被点中的目标配置，未命中返回 null
// 命中半径放宽 10px，提升触屏手感
export function hitTarget(level, x, y) {
  for (const t of level.targets) {
    const dx = x - t.x
    const dy = y - t.y
    const rr2 = t.r + 10
    if (dx * dx + dy * dy <= rr2 * rr2) return t
  }
  return null
}
