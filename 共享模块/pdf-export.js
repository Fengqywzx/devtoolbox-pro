// 通用PDF/证据包导出引擎
// 生成可打印的文本报告，支持时间线、表格、证据链

class PDFExporter {
  // 生成通用报告头
  static header(title) {
    const now = new Date().toLocaleString('zh-CN');
    return [
      '═══════════════════════════════════',
      `  ${title}`,
      `  导出时间：${now}`,
      '═══════════════════════════════════',
      ''
    ].join('\n');
  }

  // 生成时间线
  static timeline(events, title = '事件时间线') {
    let text = `\n── ${title} ──\n\n`;
    events.forEach((e, i) => {
      const d = new Date(e.date || e.timestamp);
      text += `【${i + 1}】${d.toLocaleString('zh-CN')}\n`;
      for (const [k, v] of Object.entries(e)) {
        if (k === 'date' || k === 'timestamp' || k === 'id') continue;
        text += `  ${k}：${v}\n`;
      }
      text += '\n';
    });
    return text;
  }

  // 生成统计表格
  static table(rows, headers) {
    const colWidths = headers.map((h, i) =>
      Math.max(h.length, ...rows.map(r => String(r[i] || '').length)) + 2
    );
    const sep = '+' + colWidths.map(w => '-'.repeat(w)).join('+') + '+';
    let text = '\n' + sep + '\n';
    text += '|' + headers.map((h, i) => h.padEnd(colWidths[i])).join('|') + '|\n';
    text += sep + '\n';
    rows.forEach(row => {
      text += '|' + row.map((cell, i) => String(cell || '').padEnd(colWidths[i])).join('|') + '|\n';
    });
    text += sep + '\n';
    return text;
  }

  // 生成证据链
  static evidenceChain(items) {
    let text = '\n── 证据清单 ──\n\n';
    const types = {
      photo: '📷 照片', audio: '🎙 录音', video: '🎬 视频',
      doc: '📄 文件', location: '📍 位置', other: '📌 其他'
    };
    items.forEach((item, i) => {
      text += `${i + 1}. [${types[item.type] || item.type}] ${item.description}\n`;
      text += `   时间：${new Date(item.date).toLocaleString('zh-CN')}\n`;
      if (item.note) text += `   备注：${item.note}\n`;
      text += '\n';
    });
    return text;
  }

  // 生成法律参考（劳动法相关）
  static legalReference(laws) {
    let text = '\n── 法律依据 ──\n\n';
    laws.forEach(law => {
      text += `📜 ${law.title}\n`;
      text += `   条款：${law.article}\n`;
      text += `   内容：${law.content}\n\n`;
    });
    return text;
  }

  // 生成署名/声明
  static footer(disclaimer = '') {
    return [
      '',
      '═══════════════════════════════════',
      '  本文件由AI辅助生成，仅供参考',
      '  建议咨询专业律师获取法律意见',
      disclaimer ? `  ${disclaimer}` : '',
      '═══════════════════════════════════'
    ].join('\n');
  }

  // 统一下载
  static download(content, filename) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 完整报告生成器
  static fullReport({ title, events, rows, headers, evidence, laws, disclaimer }) {
    let report = PDFExporter.header(title);
    if (events) report += PDFExporter.timeline(events);
    if (rows && headers) report += PDFExporter.table(rows, headers);
    if (evidence) report += PDFExporter.evidenceChain(evidence);
    if (laws) report += PDFExporter.legalReference(laws);
    report += PDFExporter.footer(disclaimer);
    return report;
  }
}
