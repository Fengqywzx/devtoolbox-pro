// 设计图查看器
// 在 Canvas 上渲染 2D 外骨骼设计图

class DesignViewer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.currentModule = 'back';
  }

  render(designParams, module = 'back') {
    this.currentModule = module;
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // 背景网格
    ctx.strokeStyle = '#e8e5e1';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 30) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 30) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    switch (module) {
      case 'back': this._drawBackModule(designParams, w, h); break;
      case 'knee': this._drawKneeModule(designParams, w, h); break;
      case 'shoulder': this._drawShoulderModule(designParams, w, h); break;
    }

    // 标题
    ctx.fillStyle = '#2c2c2c';
    ctx.font = 'bold 14px "PingFang SC", "Microsoft YaHei", sans-serif';
    const titles = { back: '背撑模块 — 正视图', knee: '膝撑模块 — 侧视图', shoulder: '肩撑模块 — 正视图' };
    ctx.fillText(titles[module], 12, 22);
  }

  _drawBackModule(params, w, h) {
    const ctx = this.ctx;
    const cx = w / 2;
    const top = 50;
    const barH = params.backBarLength * 1.5; // 缩放到画布

    // 人体轮廓（虚线）
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // 头
    ctx.arc(cx, top + 20, 18, 0, Math.PI * 2);
    ctx.stroke();
    // 躯干
    ctx.beginPath();
    ctx.moveTo(cx, top + 38);
    ctx.lineTo(cx, top + barH + 30);
    ctx.stroke();
    // 手臂
    ctx.beginPath();
    ctx.moveTo(cx, top + 60);
    ctx.lineTo(cx - 40, top + 140);
    ctx.moveTo(cx, top + 60);
    ctx.lineTo(cx + 40, top + 140);
    ctx.stroke();

    // 支撑杆（粗实线）
    ctx.setLineDash([]);
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx, top + 80);
    ctx.lineTo(cx, top + barH - 20);
    ctx.stroke();

    // 弹力绳（曲线）
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - 15, top + 90);
    ctx.quadraticCurveTo(cx - 30, top + barH / 2, cx - 15, top + barH - 40);
    ctx.moveTo(cx + 15, top + 90);
    ctx.quadraticCurveTo(cx + 30, top + barH / 2, cx + 15, top + barH - 40);
    ctx.stroke();
    ctx.setLineDash([]);

    // 腰带
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - 50, top + barH - 20);
    ctx.lineTo(cx + 50, top + barH - 20);
    ctx.stroke();

    // 标注
    ctx.fillStyle = '#2c2c2c';
    ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(`杆长: ${params.backBarLength}cm`, cx + 10, top + 100);
    ctx.fillText(`${params.bungeeSpec.diameter}`, cx - 55, top + barH / 2);
    ctx.fillText(`腰带: ${params.beltLength}cm`, cx - 45, top + barH - 8);

    // 弹力绳锚点标记
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(cx - 15, top + 90, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 15, top + 90, 4, 0, Math.PI * 2); ctx.fill();
  }

  _drawKneeModule(params, w, h) {
    const ctx = this.ctx;
    const cx = w / 2;
    const top = 60;

    // 腿部轮廓
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, top);
    ctx.lineTo(cx - 10, top + 180);
    ctx.moveTo(cx, top + 80);
    ctx.lineTo(cx + 5, top + 280);
    ctx.stroke();

    // 膝关节位置
    ctx.setLineDash([]);
    ctx.fillStyle = '#d97706';
    ctx.beginPath(); ctx.arc(cx, top + 90, 10, 0, Math.PI * 2); ctx.fill();

    // 膝撑支撑杆
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx, top + 60);
    ctx.lineTo(cx, top + 130);
    ctx.stroke();

    // 弹力绳
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - 18, top + 65);
    ctx.quadraticCurveTo(cx - 35, top + 100, cx - 18, top + 125);
    ctx.stroke();
    ctx.setLineDash([]);

    // 绑带
    ctx.strokeStyle = '#78716c';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 35, top + 65);
    ctx.lineTo(cx + 35, top + 65);
    ctx.moveTo(cx - 35, top + 130);
    ctx.lineTo(cx + 35, top + 130);
    ctx.stroke();

    ctx.fillStyle = '#2c2c2c';
    ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('尼龙绑带', cx + 20, top + 68);
    ctx.fillText('弹力绳', cx - 50, top + 100);
    ctx.fillText('铰链轴 (膝关节)', cx + 12, top + 92);
  }

  _drawShoulderModule(params, w, h) {
    const ctx = this.ctx;
    const cx = w / 2;
    const top = 50;

    // 上半身轮廓
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // 头
    ctx.arc(cx, top + 20, 15, 0, Math.PI * 2);
    ctx.stroke();
    // 躯干
    ctx.beginPath();
    ctx.moveTo(cx, top + 35);
    ctx.lineTo(cx, top + 160);
    ctx.stroke();
    // 水平肩线
    ctx.beginPath();
    ctx.moveTo(cx - 55, top + 50);
    ctx.lineTo(cx + 55, top + 50);
    ctx.stroke();
    ctx.setLineDash([]);

    // 肩撑支架
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 50, top + 50);
    ctx.lineTo(cx - 20, top + 80);
    ctx.lineTo(cx, top + 130);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 50, top + 50);
    ctx.lineTo(cx + 20, top + 80);
    ctx.lineTo(cx, top + 130);
    ctx.stroke();

    // 弹力绳
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(cx - 48, top + 55);
    ctx.quadraticCurveTo(cx - 15, top + 120, cx - 5, top + 140);
    ctx.moveTo(cx + 48, top + 55);
    ctx.quadraticCurveTo(cx + 15, top + 120, cx + 5, top + 140);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#2c2c2c';
    ctx.font = '11px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('肩垫', cx - 70, top + 52);
    ctx.fillText('弹力绳', cx - 20, top + 75);
    ctx.fillText('连接至腰带', cx + 8, top + 148);
  }
}
