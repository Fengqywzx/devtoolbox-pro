// 法律文书生成器 v2
// 使用 DocumentRenderer 生成 HTML 格式文书
// 同时保留纯文本输出用于下载

class DocumentGenerator {
  constructor(cityData) {
    this.cityInfo = cityData || null;
    this._loadCityData();
  }

  async _loadCityData() {
    if (this.cityInfo) return;
    try {
      const resp = await fetch('data/city-venues.json');
      this.cityInfo = await resp.json();
    } catch {
      console.warn('[DocGen] Failed to load city data, using defaults');
      this.cityInfo = { cities: {} };
    }
  }

  // 生成所有类型文档
  generateAll(facts) {
    return {
      arbitration: this.generate(facts, 'arbitration'),
      evidence: this.generate(facts, 'evidence'),
      flowchart: this.generate(facts, 'flowchart'),
      actionPlan: this.generate(facts, 'actionPlan')
    };
  }

  // 生成单个文档（HTML 格式）
  generate(facts, docType) {
    return DocumentRenderer.render(facts, docType, this.cityInfo);
  }

  // 生成纯文本版本（用于下载）
  generatePlainText(facts, docType) {
    const html = this.generate(facts, docType);
    return this._htmlToPlainText(html);
  }

  // 生成全部文档的纯文本合集
  generateAllPlainText(facts) {
    const docs = this.generateAll(facts);
    let output = '';
    const titles = {
      arbitration: '劳动仲裁申请书',
      evidence: '证据清单',
      flowchart: '维权流程图',
      actionPlan: '行动指引'
    };

    for (const [type, html] of Object.entries(docs)) {
      output += `\n${'='.repeat(50)}\n`;
      output += `  ${titles[type]}\n`;
      output += `${'='.repeat(50)}\n\n`;
      output += this._htmlToPlainText(html);
      output += '\n\n';
    }

    return output;
  }

  _htmlToPlainText(html) {
    // 简单的 HTML → 纯文本转换
    const div = document.createElement('div');
    div.innerHTML = html;

    // 处理特殊元素
    div.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
    div.querySelectorAll('li').forEach(li => { li.textContent = '• ' + li.textContent + '\n'; });
    div.querySelectorAll('p').forEach(p => { p.textContent = p.textContent + '\n'; });
    div.querySelectorAll('h2, h3, h4').forEach(h => { h.textContent = '\n' + h.textContent + '\n'; });
    div.querySelectorAll('tr').forEach(tr => { tr.textContent = tr.textContent + '\n'; });
    div.querySelectorAll('.flow-arrow').forEach(el => el.remove());
    div.querySelectorAll('.flow-number').forEach(el => { el.textContent = '[' + el.textContent + '] '; });
    div.querySelectorAll('.placeholder').forEach(el => { el.textContent = '________'; });
    div.querySelectorAll('input[type="checkbox"]').forEach(el => { el.replaceWith('☐ '); });

    return div.textContent.replace(/\n{3,}/g, '\n\n').trim();
  }
}
