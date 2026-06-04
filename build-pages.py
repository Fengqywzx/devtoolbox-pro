#!/usr/bin/env python3
"""Build all frontend pages with API-first + embedded data fallback."""
import json, os, re

REPO = r'C:\Users\18612\Desktop\万子轩的项目'

def load_json(name):
    with open(os.path.join(REPO, name), 'r', encoding='utf-8') as f:
        return json.load(f)

def save_html(name, content):
    with open(os.path.join(REPO, name), 'w', encoding='utf-8') as f:
        f.write(content)
    size = os.path.getsize(os.path.join(REPO, name))
    print(f"  ✅ {name} written ({size//1024}KB)")

works = load_json('portfolio-data.json')
novel_data = load_json('novel-content.json')
works_js = json.dumps(works, ensure_ascii=False)
novel_js = json.dumps(novel_data, ensure_ascii=False)

# ═══════════════════════════════════════════════
# 1. portfolio.html - API first, embedded fallback
# ═══════════════════════════════════════════════
print("=== portfolio.html ===")
html = open(os.path.join(REPO, 'portfolio.html'), 'r', encoding='utf-8').read()

# Replace the load() function
NEW_LOAD = """function load(){
  var g=document.getElementById('grid');

  // 1. Try API (works when deployed with server)
  fetch('/api/works?limit=1000').then(function(r){return r.json();}).then(function(d){
    if(d && d.works && d.works.length) {
      WORKS = d.works;
      g.innerHTML = ''; updateStats(); render(); DATA_LOADED = true;
      return;
    }
    throw new Error('no data');
  }).catch(function(){
    // 2. Embedded data (works on file:// and GitHub Pages)
    if (typeof PORTFOLIO_DATA !== 'undefined' && PORTFOLIO_DATA && PORTFOLIO_DATA.length) {
      WORKS = PORTFOLIO_DATA;
      g.innerHTML = ''; updateStats(); render(); DATA_LOADED = true;
    } else {
      g.innerHTML = '<div class="empty">⚠ 无法连接服务器</div>';
    }
  });
}"""

# Find the current load function and replace it
m = re.search(r'function load\(\)\{[\s\S]*?(?:DATA_LOADED[^}]+?\}|g\.innerHTML[^}]+?\})[^}]*?\}', html)
if m:
    html = html[:m.start()] + NEW_LOAD + html[m.end():]
    print("  ✅ Replaced load()")
else:
    print("  ❌ Could not find load()")
    idx = html.find('function load(){')
    print(f"  Found at: {idx}")

# Ensure PORTFOLIO_DATA is embedded
if 'var PORTFOLIO_DATA' not in html:
    injection = f'<script>var PORTFOLIO_DATA = {works_js};\nvar DATA_LOADED = false;\n</script>\n'
    html = html.replace('</style>', '</style>\n' + injection)
    print("  ✅ Added PORTFOLIO_DATA")

save_html('portfolio.html', html)

# ═══════════════════════════════════════════════
# 2. admin.html - API-first
# ═══════════════════════════════════════════════
print("\n=== admin.html ===")
html = open(os.path.join(REPO, 'admin.html'), 'r', encoding='utf-8').read()

# Replace tryServerFirst to also try cloud API first
OLD_TRY = """function tryServerFirst() {
  fetch('/api/evolve/status').then(function(r){return r.json();}).then(function(evolve){"""

NEW_TRY = """function tryServerFirst() {
  // Try cloud portfolio API first
  fetch('/api/works?limit=1').then(function(r){return r.json();}).then(function(d){
    if (d && d.works) {
      document.getElementById('statusBadge').innerHTML = '<span class="status-dot dot-green"></span>● API在线';
      document.getElementById('statusBadge').className = 'status-badge badge-green';
      loadStaticData();
      return;
    }
    throw new Error('no works');
  }).catch(function(){
    // Fallback: local evolve server
    fetch('/api/evolve/status').then(function(r){return r.json();}).then(function(evolve){"""

if OLD_TRY in html:
    html = html.replace(OLD_TRY, NEW_TRY)
    print("  ✅ Updated tryServerFirst")
else:
    print("  ⚠ tryServerFirst pattern not found")

if 'var PORTFOLIO_DATA' not in html:
    injection = f'<script>var PORTFOLIO_DATA = {works_js};\nvar STATIC_MODE = false;\n</script>\n'
    html = html.replace('</style>', '</style>\n' + injection)
    print("  ✅ Added PORTFOLIO_DATA")

save_html('admin.html', html)

# ═══════════════════════════════════════════════
# 3. novel.html - API-first
# ═══════════════════════════════════════════════
print("\n=== novel.html ===")
html = open(os.path.join(REPO, 'novel.html'), 'r', encoding='utf-8').read()

NEW_VIEW = """function viewChapter(idx){
  var ch = NOVEL.chapters[idx];
  document.getElementById('modalChapterTitle').textContent = '第' + ch.num + '章 · ' + ch.title;
  document.getElementById('modalChapterBody').textContent = '(正在加载完整内容...)';
  document.getElementById('modalOverlay').classList.add('show');

  // 1. Try cloud API
  fetch('/api/novel/chapter/' + ch.date).then(function(r){return r.json();}).then(function(d){
    if (d && d.content) { document.getElementById('modalChapterBody').textContent = d.content; return; }
    throw new Error('no content');
  }).catch(function(){
    // 2. Fallback: embedded content
    if (NOVEL_CONTENT && NOVEL_CONTENT[ch.date]) {
      document.getElementById('modalChapterBody').textContent = NOVEL_CONTENT[ch.date];
    } else {
      document.getElementById('modalChapterBody').textContent = '第' + ch.num + '章 · ' + ch.title + ' (' + ch.wc + '字)\\n\\n(需连接服务器查看完整内容)';
    }
  });
}"""

m = re.search(r'function viewChapter\(idx\)\{[\s\S]*?\}\}', html)
if m:
    html = html[:m.start()] + NEW_VIEW + html[m.end():]
    print("  ✅ Replaced viewChapter()")
else:
    print("  ❌ Could not find viewChapter")

if 'var NOVEL_CONTENT_DATA' not in html:
    injection = f'<script>var NOVEL_CONTENT_DATA = {novel_js};\n</script>\n'
    html = html.replace('</style>', '</style>\n' + injection)
    print("  ✅ Added NOVEL_CONTENT_DATA")

save_html('novel.html', html)

# ═══════════════════════════════════════════════
# 4. live.html - API-first
# ═══════════════════════════════════════════════
print("\n=== live.html ===")
html = open(os.path.join(REPO, 'live.html'), 'r', encoding='utf-8').read()

# Remove old tryServer first and replace loadStatic
OLD_LIVE_START = """function tryServer"""
# Find and replace the whole section
m = re.search(r'function tryServer\(\)\s*\{[\s\S]*?loadStatic\(\);\s*\}', html)
if m:
    old_try_server = m.group()

    NEW_TRY_SERVER = """function tryServer() {
  // Try API first
  fetch('/api/works?limit=1000').then(function(r){return r.json();}).then(function(d){
    if (d && d.works && d.works.length) {
      document.getElementById('modeBadge').textContent = 'API在线';
      document.getElementById('modeBadge').className = 'status-badge on';
      renderFromData(d.works);
      return;
    }
    throw new Error('no data');
  }).catch(function(){
    // Fallback: embedded
    if (typeof PORTFOLIO_DATA !== 'undefined' && PORTFOLIO_DATA && PORTFOLIO_DATA.length) {
      document.getElementById('modeBadge').textContent = '静态数据';
      document.getElementById('modeBadge').className = 'status-badge on';
      renderFromData(PORTFOLIO_DATA);
    } else {
      document.getElementById('wsTotal').textContent = '❌';
      document.getElementById('typeDistrib').innerHTML = '<div style="color:var(--red);text-align:center;padding:10px;">无法连接</div>';
    }
  });
}"""

    html = html[:m.start()] + NEW_TRY_SERVER + html[m.end():]
    print("  ✅ Replaced tryServer()")

    # Now rename loadStatic to renderFromData, or replace it
    if 'function loadStatic()' in html:
        html = html.replace('function loadStatic()', 'function renderFromData(works)')
        # Remove the first line inner fetch
        html = html.replace('  if (typeof PORTFOLIO_DATA', '  // works already passed in')
        print("  ✅ Renamed loadStatic -> renderFromData")
else:
    print("  ⚠ tryServer() pattern not found")

if 'var PORTFOLIO_DATA' not in html:
    injection = f'<script>var PORTFOLIO_DATA = {works_js};\n</script>\n'
    html = html.replace('</style>', '</style>\n' + injection)
    print("  ✅ Added PORTFOLIO_DATA")

save_html('live.html', html)

print("\n=== ALL DONE ===")
