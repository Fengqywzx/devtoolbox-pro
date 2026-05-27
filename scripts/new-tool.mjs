// new-tool — scaffold a new HTML tool page
// Usage: node scripts/new-tool.mjs <工具名>
import { join } from 'path';
import { writeFileSync, existsSync } from 'fs';

const PROJECT = join(import.meta.dirname, '..');
const name = process.argv[2];
if (!name) {
  console.error('[new-tool] Usage: node scripts/new-tool.mjs <工具名>');
  process.exit(1);
}

const slug = name.replace(/\s+/g, '-').replace(/[^\w一-龥-]/g, '');
const file = join(PROJECT, `${slug}.html`);
if (existsSync(file)) {
  console.error('[new-tool] File already exists:', file);
  process.exit(1);
}

const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} — 万子轩的工具箱</title>
<style>
:root{--bg:#0a0a1a;--panel:rgba(10,10,30,0.92);--gold:#FFD700;--text:#e0e0e0;}
*{margin:0;padding:0;box-sizing:border-box;}
body{background:var(--bg);color:var(--text);font-family:'Segoe UI','Microsoft YaHei',sans-serif;
  display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;}
.container{width:90%;max-width:800px;background:var(--panel);border-radius:16px;padding:32px;
  box-shadow:0 0 40px rgba(0,0,0,0.5);border:1px solid rgba(255,255,255,0.08);}
h1{color:var(--gold);margin-bottom:16px;text-align:center;}
.desc{text-align:center;opacity:0.7;margin-bottom:24px;}
.actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;}
button{padding:10px 20px;border:none;border-radius:8px;background:linear-gradient(135deg,#667eea,#764ba2);
  color:#fff;cursor:pointer;font-size:14px;transition:transform .2s,box-shadow .2s;}
button:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(102,126,234,0.4);}
.output{margin-top:24px;padding:16px;background:rgba(0,0,0,0.3);border-radius:8px;min-height:60px;}
</style>
</head>
<body>
<div class="container">
  <h1>${name}</h1>
  <p class="desc">在这里描述这个工具的用途。</p>
  <div class="actions">
    <button onclick="demoAction()">示例动作</button>
    <button onclick="clearOutput()">清空</button>
  </div>
  <div class="output" id="output">等待操作...</div>
</div>
<script>
function demoAction(){
  document.getElementById('output').textContent='你好，万子轩！这是 ${name} 的示例输出。';
}
function clearOutput(){
  document.getElementById('output').textContent='等待操作...';
}
</script>
</body>
</html>
`;

writeFileSync(file, html, 'utf8');
console.log('[new-tool] Created:', file);
console.log('[new-tool] 打开方式: 用浏览器打开', `${slug}.html`);
