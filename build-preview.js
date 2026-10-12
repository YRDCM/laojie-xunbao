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
  'src/share.js',
  'src/main.js'
]

// 剥离 ESM 语法：删 import/export{} 行，export 声明降级为普通声明
function strip(code) {
  return code.split('\n').map(line => {
    const t = line.trim()
    if (t.startsWith('import ')) return ''
    if (t.startsWith('export {')) return ''
    return line.replace(/^export\s+(?=(const|let|var|function|class)\b)/, '')
  }).join('\n')
}

const bundle = ORDER.map(f =>
  `\n// ======== ${f} ========\n` + strip(fs.readFileSync(path.join(ROOT, f), 'utf8'))
).join('\n') + '\n// ======== 启动游戏 ========\nnew Game().start()\n'

const tpl = fs.readFileSync(path.join(ROOT, 'preview.template.html'), 'utf8')
const html = tpl.replace('/*__GAME_BUNDLE__*/', () => bundle)
fs.writeFileSync(path.join(ROOT, 'preview.html'), html)
console.log('preview.html 生成完成（' + html.length + ' 字节）')
