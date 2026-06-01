// 通用Canvas图表引擎
// 热力图、趋势线、雷达图——所有项目共用

class DataViz {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.w = this.canvas.width;
    this.h = this.canvas.height;
  }

  // 清空画布
  clear() {
    this.ctx.clearRect(0, 0, this.w, this.h);
  }

  // === 趋势线图 ===
  drawTrendLine(data, options = {}) {
    const ctx = this.ctx;
    const w = this.w; const h = this.h;
    const pad = options.padding || 40;
    const lineColor = options.lineColor || '#0891b2';
    const fillColor = options.fillColor || 'rgba(8,145,178,0.1)';
    const gridColor = options.gridColor || '#e5e7eb';
    const textColor = options.textColor || '#57534e';

    this.clear();

    if (!data || data.length < 2) {
      ctx.fillStyle = textColor;
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('数据不足', w/2, h/2);
      return;
    }

    const maxVal = Math.max(...data.map(d => d.value), 1);
    const stepX = (w - pad * 2) / (data.length - 1);
    const scaleY = (h - pad * 2) / maxVal;

    // 网格线
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = pad + (h - pad * 2) * i / 4;
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
      ctx.fillStyle = textColor;
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(Math.round(maxVal * (1 - i/4)), pad - 6, y + 4);
    }

    // 填充区域
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    data.forEach((d, i) => {
      const x = pad + i * stepX;
      const y = h - pad - d.value * scaleY;
      ctx.lineTo(x, y);
    });
    ctx.lineTo(pad + (data.length - 1) * stepX, h - pad);
    ctx.closePath();
    ctx.fillStyle = fillColor;
    ctx.fill();

    // 折线
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    data.forEach((d, i) => {
      const x = pad + i * stepX;
      const y = h - pad - d.value * scaleY;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // 数据点
    data.forEach((d, i) => {
      const x = pad + i * stepX;
      const y = h - pad - d.value * scaleY;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // X轴标签
    if (options.showLabels !== false) {
      ctx.fillStyle = textColor;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const step = Math.max(1, Math.floor(data.length / 7));
      data.forEach((d, i) => {
        if (i % step === 0 || i === data.length - 1) {
          const x = pad + i * stepX;
          ctx.fillText(d.label || '', x, h - pad + 16);
        }
      });
    }
  }

  // === 热力图 ===
  drawHeatmap(grid, options = {}) {
    const ctx = this.ctx;
    const w = this.w; const h = this.h;
    this.clear();

    if (!grid || !grid.length) return;

    const rows = grid.length;
    const cols = grid[0].length;
    const cellW = w / cols;
    const cellH = h / rows;

    const maxVal = Math.max(...grid.flat().filter(v => v !== null), 1);

    // 颜色映射：绿→黄→橙→红
    const getColor = (val) => {
      if (val === null || val === undefined) return 'rgba(200,200,200,0.3)';
      const ratio = Math.min(val / maxVal, 1);
      if (ratio < 0.25) return `rgba(${Math.round(34+200*ratio*4)},${Math.round(197-100*ratio*4)},${Math.round(94-50*ratio*4)},0.8)`;
      if (ratio < 0.5) return `rgba(${Math.round(234-100*(ratio-0.25)*4)},${Math.round(179-100*(ratio-0.25)*4)},${Math.round(8+100*(ratio-0.25)*4)},0.8)`;
      if (ratio < 0.75) return `rgba(${Math.round(249-50*(ratio-0.5)*4)},${Math.round(115-50*(ratio-0.5)*4)},${Math.round(22+100*(ratio-0.5)*4)},0.8)`;
      return `rgba(${Math.round(220-50*(ratio-0.75)*4)},${Math.round(38-Math.min(38,38*(ratio-0.75)*4))},${Math.round(38-Math.min(38,38*(ratio-0.75)*4))},0.8)`;
    };

    grid.forEach((row, ri) => {
      row.forEach((val, ci) => {
        ctx.fillStyle = getColor(val);
        ctx.fillRect(ci * cellW, ri * cellH, cellW, cellH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(ci * cellW, ri * cellH, cellW, cellH);
        if (val !== null && val !== undefined && options.showValues !== false) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(Math.round(val), ci * cellW + cellW/2, ri * cellH + cellH/2);
        }
      });
    });
  }

  // === 雷达图 ===
  drawRadar(values, labels, options = {}) {
    const ctx = this.ctx;
    const w = this.w; const h = this.h;
    const cx = w / 2; const cy = h / 2;
    const radius = Math.min(cx, cy) - 40;
    const n = values.length;
    const color = options.color || '#7c3aed';

    this.clear();

    // 网格
    for (let level = 1; level <= 4; level++) {
      const r = radius * level / 4;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 轴线
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle));
      ctx.strokeStyle = '#e5e7eb';
      ctx.stroke();
    }

    // 数据区域
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const r = radius * Math.min(values[i] / (options.max || 10), 1);
      const px = cx + r * Math.cos(angle);
      const py = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = color.replace(')', ',0.2)').replace('rgb', 'rgba');
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // 标签
    ctx.fillStyle = '#57534e';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const lr = radius + 20;
      ctx.fillText(labels[i] || '', cx + lr * Math.cos(angle), cy + lr * Math.sin(angle) + 4);
    }
  }
}
