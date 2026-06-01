// v3 跨项目联动引擎
// 12个项目互相引用、数据共享、智能推荐

const CROSSLINKS = {
  // 铁脊柱外骨骼 ← 与其他项目联动
  'iron-spine': {
    from: [
      { project: 'metronome', trigger: 'rsi_high', action: 'RSI高风险→推荐外骨骼背撑模块', link: '../iron-spine/index.html?module=back' },
      { project: 'scaffold', trigger: 'heavy_lifting', action: '建筑重物提举→推荐肩撑模块', link: '../iron-spine/index.html?module=shoulder' },
      { project: 'thermometer', trigger: 'back_pain', action: '护理员腰椎劳损→推荐背撑模块', link: '../iron-spine/index.html' },
    ]
  },
  // 声音的桥 ← 法律需求从其他项目来
  'bridge-of-voices': {
    from: [
      { project: 'threshold', trigger: 'contract_risk_high', action: '合同高风险→生成仲裁申请书', link: '../bridge-of-voices/index.html' },
      { project: 'scaffold', trigger: 'wage_arrears', action: '建筑欠薪→启动维权流程', link: '../bridge-of-voices/index.html?type=wage_arrears' },
      { project: 'parasol', trigger: 'conflict_recorded', action: '城管冲突→法律维权指导', link: '../bridge-of-voices/index.html' },
    ]
  },
  // 门槛 ← 雇主评价/合同风险跨项目共享
  'threshold': {
    from: [
      { project: 'grain-rain', trigger: 'employer_rated', action: '农业雇主评价同步', link: null },
      { project: 'scaffold', trigger: 'contractor_rated', action: '包工头评价同步', link: null },
    ]
  },
  // 方向盘 ← 与其他项目共享疲劳数据
  'steering-wheel': {
    from: [
      { project: 'windvane', trigger: 'fatigue_warning', action: '骑行疲劳→影响驾驶安全', link: null },
    ]
  }
};

class CrossLinker {
  constructor(currentProject) {
    this.current = currentProject;
    this.links = CROSSLINKS[currentProject] || { from: [] };
  }

  // 检查是否有来自其他项目的联动触发
  checkIncoming() {
    const triggers = [];
    Object.entries(CROSSLINKS).forEach(([project, config]) => {
      config.from.forEach(link => {
        if (link.project === this.current) {
          triggers.push({ from: project, ...link });
        }
      });
    });
    return triggers;
  }

  // 获取当前项目可以推荐的其他项目
  getRecommendations(data) {
    const recs = [];
    this.links.from.forEach(link => {
      // 检查触发条件
      if (this._checkTrigger(link.trigger, data)) {
        recs.push(link);
      }
    });
    return recs;
  }

  _checkTrigger(trigger, data) {
    if (trigger === 'rsi_high' && data?.rsiLevel === 'high') return true;
    if (trigger === 'contract_risk_high' && data?.highRisks > 0) return true;
    if (trigger === 'wage_arrears' && data?.unpaid) return true;
    if (trigger === 'conflict_recorded' && data?.conflicts > 0) return true;
    if (trigger === 'heavy_lifting' && data?.posture === 'lift') return true;
    if (trigger === 'back_pain' && data?.backPain) return true;
    return false;
  }

  // 渲染联动推荐卡片
  renderWidget(containerId, data) {
    const recs = this.getRecommendations(data);
    const container = document.getElementById(containerId);
    if (!container || !recs.length) return;

    container.innerHTML = `
      <div class="card" style="border-left:5px solid #7c3aed;margin-bottom:16px">
        <div class="card-header"><span class="card-icon">🔗</span><h2>相关工具推荐</h2></div>
        ${recs.map(r => `
          <div style="padding:12px;background:var(--bg, #f5f3ff);border-radius:10px;margin-bottom:8px;cursor:pointer"
               onclick="${r.link ? `location.href='${r.link}'` : ''}">
            <strong>${r.action}</strong>
            <div style="font-size:14px;color:var(--text2, #57534e)">来自：${this._projectName(r.project)}</div>
          </div>
        `).join('')}
      </div>`;
  }

  _projectName(id) {
    const names = {
      'bridge-of-voices': '🔉 声音的桥', 'windvane': '🎏 风信标', 'iron-spine': '🦴 铁脊柱',
      'orange-jacket': '🍊 橘子衣', 'threshold': '🚪 门槛', 'metronome': '🎵 节拍器',
      'steering-wheel': '🚗 方向盘', 'scaffold': '🏗 脚手架', 'thermometer': '🌡 温度计',
      'grain-rain': '🌾 谷雨', 'parasol': '☂ 遮阳伞', 'ferry-bridge': '🌉 渡桥'
    };
    return names[id] || id;
  }
}
