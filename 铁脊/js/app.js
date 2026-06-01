// 铁脊柱 — 主控制器
// 管理四步配置流程：参数 → 设计 → 物料 → 组装

class IronSpine {
  constructor() {
    this.configurator = new Configurator();
    this.bomGenerator = new BOMGenerator();
    this.viewer = new DesignViewer('design-canvas');

    this.designParams = null;
    this.bom = null;
    this.selectedModules = new Set(['back']);

    this._bindEvents();
  }

  _bindEvents() {
    // 步骤1：计算
    document.getElementById('btn-calculate')?.addEventListener('click', () => {
      this._calculate();
    });

    // 步骤2：模块选择
    document.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('click', () => {
        const module = card.dataset.module;
        if (module === 'back') return; // 背撑不可取消
        if (this.selectedModules.has(module)) {
          this.selectedModules.delete(module);
          card.classList.remove('selected');
        } else {
          this.selectedModules.add(module);
          card.classList.add('selected');
        }
        this.designParams.modules[module] = this.selectedModules.has(module);
        this._updateDesignView();
      });
    });

    // 步骤2 → 步骤3
    document.getElementById('btn-to-bom')?.addEventListener('click', () => {
      this._generateBOM();
      this._showStep(3);
    });

    // 返回步骤1
    document.getElementById('btn-back-params')?.addEventListener('click', () => {
      this._showStep(1);
    });

    // 步骤3 → 返回步骤2
    document.getElementById('btn-back-design')?.addEventListener('click', () => {
      this._showStep(2);
    });

    // 步骤3 → 步骤4
    document.getElementById('btn-to-build')?.addEventListener('click', () => {
      this._renderBuildGuide();
      this._showStep(4);
    });

    // 返回步骤3
    document.getElementById('btn-back-bom')?.addEventListener('click', () => {
      this._showStep(3);
    });

    // 导出 BOM
    document.getElementById('btn-export-bom')?.addEventListener('click', () => {
      if (!this.bom) return;
      const md = this.bomGenerator.exportMarkdown(this.bom);
      const blob = new Blob([md], { type: 'text/markdown;charset=UTF-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `铁脊柱_物料清单_${new Date().toISOString().slice(0, 10)}.md`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // 重新开始
    document.getElementById('btn-reset')?.addEventListener('click', () => {
      this._showStep(1);
    });

    // 步骤导航点
    document.querySelectorAll('.step-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const step = parseInt(dot.dataset.step);
        if (step === 2 && !this.designParams) return;
        if (step === 3 && !this.bom) return;
        if (step === 4 && !this.bom) return;
        this._showStep(step);
      });
    });
  }

  _calculate() {
    const params = {
      height: parseFloat(document.getElementById('param-height').value) || 170,
      weight: parseFloat(document.getElementById('param-weight').value) || 70,
      waist: parseFloat(document.getElementById('param-waist').value) || 85,
      posture: document.getElementById('param-posture').value,
      intensity: document.getElementById('param-intensity').value
    };

    this.designParams = this.configurator.calculate(params);

    // 更新模块选择
    this.selectedModules = new Set(['back']);
    if (this.designParams.modules.knee) this.selectedModules.add('knee');
    if (this.designParams.modules.shoulder) this.selectedModules.add('shoulder');

    document.querySelectorAll('.module-card').forEach(card => {
      const mod = card.dataset.module;
      if (mod === 'back') {
        card.classList.add('selected');
      } else if (this.selectedModules.has(mod)) {
        card.classList.add('selected');
      } else {
        card.classList.remove('selected');
      }
    });

    this._updateDesignView();
    this._showStep(2);
  }

  _updateDesignView() {
    // 显示设计参数
    const container = document.getElementById('design-params');
    if (!container || !this.designParams) return;

    const items = [
      ['支撑杆长度', `${this.designParams.backBarLength} cm`],
      ['弹力绳规格', `${this.designParams.bungeeSpec.type} ${this.designParams.bungeeSpec.diameter}`],
      ['弹力绳股数', `${this.designParams.bungeeSpec.strands} 股`],
      ['弹力绳长度', `${this.designParams.bungeeLength} cm`],
      ['预张力', `${this.designParams.pretension} N (~${(this.designParams.pretension / 9.81).toFixed(1)} kg)`],
      ['腰带长度', `${this.designParams.beltLength} cm`],
      ['杆材', `${this.designParams.barMaterial} ${this.designParams.barThickness}mm`],
      ['工作姿势', this.designParams.postureAdjustment.slice(0, 30) + '…']
    ];

    container.innerHTML = items.map(([label, value]) => `
      <div class="design-param-item">
        <span class="param-label">${label}</span>
        <span class="param-value">${value}</span>
      </div>
    `).join('');

    // 渲染设计图
    this.viewer.render(this.designParams, 'back');
  }

  _generateBOM() {
    if (!this.designParams) return;
    this.bom = this.bomGenerator.generate(this.designParams);

    const container = document.getElementById('bom-content');
    if (!container) return;

    // 按分类分组
    const categories = {};
    this.bom.items.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    let html = '';
    for (const [cat, items] of Object.entries(categories)) {
      html += `<h3 style="margin:16px 0 8px; color:#b45309;">${cat}</h3>`;
      html += '<table class="bom-table"><thead><tr>';
      html += '<th>物料</th><th>规格</th><th>数量</th><th>单价</th><th>采购方式</th>';
      html += '</tr></thead><tbody>';

      items.forEach(i => {
        html += '<tr>';
        html += `<td><strong>${i.name}</strong></td>`;
        html += `<td style="font-size:12px;">${i.spec}</td>`;
        html += `<td>${i.quantity} ${i.unit || ''}</td>`;
        html += `<td class="cost-col">¥${i.price}</td>`;
        html += `<td style="font-size:11px;color:#6b6b6b;">${i.searchKey}</td>`;
        html += '</tr>';
        if (i.substitutes) {
          html += `<tr><td colspan="5" style="font-size:11px;color:#6b6b6b;padding-top:0;">💡 替代方案：${i.substitutes}</td></tr>`;
        }
      });

      html += '</tbody></table>';
    }

    container.innerHTML = html;

    document.getElementById('total-cost').innerHTML = `
      💰 预估总价：<strong>¥${this.bom.total}</strong>
      <div style="font-size:12px;color:#6b6b6b;margin-top:4px;">
        对比商用外骨骼（$3,000+ ≈ ¥21,000），成本降低约 ${((1 - this.bom.total / 400) * 100).toFixed(0)}%
      </div>
    `;
  }

  _renderBuildGuide() {
    const container = document.getElementById('build-guide-content');
    if (!container || !this.designParams) return;

    const p = this.designParams;

    container.innerHTML = `
<h3>准备工具</h3>
<ul>
  <li>电钻 + 3mm/5mm钻头（或手钻+锉刀）</li>
  <li>剪刀/美工刀</li>
  <li>卷尺</li>
  <li>打火机（处理尼龙带切口防脱线）</li>
  <li>六角扳手（M3/M5）</li>
  <li>砂纸（200目，打磨玻纤板边缘）</li>
</ul>

<h3>第一步：裁切材料</h3>
<ul>
  <li>玻纤板裁切为 ${p.backBarLength}cm × ${p.barWidth}cm（用钢锯或角磨机）</li>
  <li>弹力绳裁剪 ${p.bungeeLength}cm × ${p.bungeeSpec.strands} 根</li>
  <li>尼龙织带裁剪 ${p.strapLengthTotal}cm 总长</li>
  <li>EVA泡棉按腰带轮廓裁剪</li>
</ul>
<p style="color:#d97706;">⚠ 安全提醒：裁切玻纤板时戴口罩和护目镜，玻纤碎屑刺激皮肤和呼吸道。</p>

<h3>第二步：组装背撑模块</h3>
<ul>
  <li>在玻纤板两端各打 2 个 M5 孔（距边缘 3cm）</li>
  <li>安装弹力绳锚点到杆两端（M5螺栓固定）</li>
  <li>将弹力绳穿入锚点，两端打结或用绳夹固定</li>
  <li>将腰带扣座固定到玻纤板中部（M3螺栓）</li>
  <li>尼龙带穿过腰带扣座</li>
</ul>

<h3>第三步：调试弹力</h3>
<ul>
  <li>穿上背撑，系紧腰带</li>
  <li>慢慢弯腰——感受弹力绳的拉力</li>
  <li>如果太紧：松开弹力绳结，放长1-2cm</li>
  <li>如果太松：缩短弹力绳，增加预张力</li>
  <li>理想状态：弯腰45°时弹力绳刚好开始拉伸，起身时明显感到助力</li>
</ul>

${this.designParams.modules.knee ? `
<h3>第四步（可选）：组装膝撑模块</h3>
<ul>
  <li>膝部铰链座安装在大腿和小腿绑带上</li>
  <li>弹力绳连接铰链座，与背撑弹力绳平行安装</li>
  <li>调试时先跪姿测试，确保膝关节活动范围不受限</li>
</ul>
` : ''}

${this.designParams.modules.shoulder ? `
<h3>第五步（可选）：组装肩撑模块</h3>
<ul>
  <li>肩部支架通过弹力绳连接至背部腰带</li>
  <li>肩垫位置需在肩胛骨上方</li>
  <li>搬重物时，肩撑分担手臂负重约30%</li>
</ul>
` : ''}

<h3>日常维护</h3>
<ul>
  <li>弹力绳（内胎条）每3-6个月检查弹性衰减，必要时更换</li>
  <li>螺栓每月检查一次是否松动</li>
  <li>尼龙带如有磨损立即更换（磨损处断裂风险高）</li>
  <li>PLA打印件避免暴晒（60°C以上会软化变形）</li>
</ul>

<p style="color:#d97706;margin-top:16px;">💡 穿戴提示：外骨骼是工具，不是盔甲。前3天每天只用2小时，让身体适应新的发力方式。</p>
`;
  }

  _showStep(stepNum) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    document.getElementById(`step-${['params','design','bom','build'][stepNum-1]}`)?.classList.add('active');

    // 更新步骤导航
    document.querySelectorAll('.step-dot').forEach((dot, i) => {
      dot.classList.remove('active', 'done');
      if (i + 1 === stepNum) dot.classList.add('active');
      if (i + 1 < stepNum) dot.classList.add('done');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new IronSpine();
});
