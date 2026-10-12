// ============================================================
// build-preview.js —— 生成单文件浏览器预览 preview.html
// 原理：把 src/ 下的 ES Module 源码剥离 import/export 后，
// 按依赖顺序拼接进 preview.template.html（其中含 wx shim），
// 这样双击 preview.html 即可试玩（file:// 下浏览器不允许模块加载）。
// 改了 src/ 任何文件后重新执行：node build-preview.js
// ============================================================
const fs = require('fs')
const path = require('path')

const ROOT = __dirname
// 依赖顺序：被依赖的模块在前
const ORDER = [
  'src/levels.js',
  'src/painter.js',
  'src/scene.js',
  'src/ui.js',
  'src/audio.js',
  'src/share.js',
  'src/main.js'
]

// 剥离 ESM 语法：删 import/export{} 行（含多行 import），export 声明降级为普通声明
function strip(code) {
  const out = []
  let inImport = false // 多行 import 块内
  for (const line of code.split('\n')) {
    const t = line.trim()
    if (inImport) {
      if (t.includes(' from ') || t.endsWith('.js\'') || t.endsWith('.js"')) inImport = false
      continue
    }
    if (t.startsWith('import ')) {
      if (!t.includes(' from ')) inImport = true // import { ... 跨行
      continue
    }
    if (t.startsWith('export {')) continue
    out.push(line.replace(/^export\s+(?=(const|let|var|function|class)\b)/, ''))
  }
  return out.join('\n')
}

const bundle = ORDER.map(f =>
  `\n// ======== ${f} ========\n` + strip(fs.readFileSync(path.join(ROOT, f), 'utf8'))
).join('\n') + '\n// ======== 启动游戏 ========\nnew Game().start()\n'

const tpl = fs.readFileSync(path.join(ROOT, 'preview.template.html'), 'utf8')
const html = tpl.replace('/*__GAME_BUNDLE__*/', () => bundle)
fs.writeFileSync(path.join(ROOT, 'preview.html'), html)
console.log('preview.html 生成完成（' + html.length + ' 字节）')
