// 身体参数 → 设计参数生成器
// 基于人体工学和力学计算

class Configurator {
  constructor() {
    // 人体工学参考数据
    this.ref = {
      trunkRatio: 0.47,      // 躯干占身高比例
      trunkMassRatio: 0.45,  // 躯干占体重比例
      l5s1MomentArm: 0.15,   // L5-S1 力矩臂（m，占身高比）
      gravity: 9.81
    };
  }

  // 主计算方法
  calculate(userParams) {
    const { height, weight, waist, posture, intensity } = userParams;
    const H = height / 100; // m
    const W = weight;       // kg
    const waistM = waist / 100;

    // 躯干质量
    const trunkMass = W * this.ref.trunkMassRatio;

    // 弯腰时 L5-S1 承受的力矩 (N·m)
    const momentArm = H * this.ref.l5s1MomentArm;
    const bendingMoment = trunkMass * this.ref.gravity * momentArm;

    // 弹力绳预张力 = 躯干重量的60%（弯腰时能量储存）
    const pretension = trunkMass * this.ref.gravity * 0.6;

    // 弹力绳行程（背撑模块的拉伸长度）
    const stroke = waistM * 0.35;

    // 弹力绳刚度 (N/m)
    const stiffness = pretension / (stroke * 0.5);

    // 背撑杆长度（沿脊柱方向）
    const backBarLength = H * 0.55;

    // 腰带长度
    const beltLength = waistM * 100 + 30; // cm，加30cm调节余量

    // 强度系数
    const intensityFactor = { light: 0.8, medium: 1.0, heavy: 1.3 }[intensity] || 1.0;

    return {
      // 核心参数
      backBarLength: parseFloat((backBarLength * 100).toFixed(1)),      // cm
      pretension: parseFloat(pretension.toFixed(1)),                    // N
      stiffness: parseFloat(stiffness.toFixed(1)),                      // N/m
      stroke: parseFloat((stroke * 100).toFixed(1)),                    // cm
      beltLength: parseFloat(beltLength.toFixed(0)),                    // cm
      bendingMoment: parseFloat(bendingMoment.toFixed(1)),              // N·m

      // 弹力绳规格
      bungeeSpec: this._bungeeSpec(stiffness * intensityFactor),
      bungeeLength: parseFloat((stroke * 100 * 2.5).toFixed(0)),       // cm（2.5倍行程以留余量）

      // 支撑杆规格
      barMaterial: '玻纤板',
      barWidth: parseFloat((waistM * 100 * 0.12).toFixed(1)),          // cm
      barThickness: intensityFactor > 1.1 ? 4 : 3,                     // mm

      // 绑带
      strapWidth: 5,                                                    // cm（标准5cm尼龙带）
      strapLengthTotal: parseFloat((beltLength * 2.2).toFixed(0)),     // cm

      // 3D打印件
      plaParts: this._generatePLAParts(waistM * 100, intensityFactor),

      // 固定件
      fasteners: this._generateFasteners(),

      // 模块配置
      modules: {
        back: true,
        knee: posture === 'kneel' || intensity === 'heavy',
        shoulder: posture === 'lift' || intensity === 'heavy'
      },

      // 工作姿势适配
      postureAdjustment: this._postureAdjustment(posture)
    };
  }

  _bungeeSpec(stiffness) {
    if (stiffness < 800) return { type: '自行车内胎条', diameter: '6mm', strands: 2, searchKey: '自行车内胎 弹力带' };
    if (stiffness < 1500) return { type: '弹力绳', diameter: '8mm', strands: 3, searchKey: '弹力绳 8mm 高弹' };
    return { type: '弹力绳（加粗）', diameter: '10mm', strands: 4, searchKey: '弹力绳 10mm 高强度' };
  }

  _generatePLAParts(waistCm, factor) {
    return [
      {
        name: '腰带扣座',
        count: 2,
        infill: '40%',
        material: 'PLA+',
        note: '承重点，建议用PLA+或PETG'
      },
      {
        name: '弹力绳锚点',
        count: 4,
        infill: '60%',
        material: 'PLA+',
        note: '高应力区，填充率不低于60%'
      },
      {
        name: '杆端连接件',
        count: factor > 1.1 ? 4 : 2,
        infill: '30%',
        material: 'PLA',
        note: '连接玻纤杆与腰带'
      }
    ];
  }

  _generateFasteners() {
    return [
      { name: 'M5螺栓+螺母', count: 8, note: '不锈钢', searchKey: 'M5不锈钢螺栓螺母' },
      { name: 'M3螺栓+螺母', count: 4, note: '不锈钢，固定弹力绳锚点', searchKey: 'M3不锈钢螺栓螺母' },
      { name: '尼龙垫片 M5', count: 16, note: '减少摩擦', searchKey: 'M5尼龙垫片' },
      { name: '尼龙绑带（扎带）', count: 10, note: '5×300mm', searchKey: '尼龙扎带 5x300' }
    ];
  }

  _postureAdjustment(posture) {
    const adjustments = {
      bend: '背撑模块为核心，弹力绳预张力设为标准值。弯腰时储能，起身时释放。',
      stand: '调低预张力20%，以持续支撑为主，爆发力辅助为辅。',
      kneel: '膝撑模块必须加装。背撑与膝撑的弹力绳需同步标定。',
      lift: '肩撑+背撑联动。弹力绳加粗一号，预张力提高30%。搬重物时呼气收紧核心。'
    };
    return adjustments[posture] || adjustments.bend;
  }
}
