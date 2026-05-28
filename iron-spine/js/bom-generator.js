// 物料清单自动生成器
// 根据设计参数生成完整购物清单

class BOMGenerator {
  constructor() {
    this.materialPrices = {
      '玻纤板': { pricePerUnit: 35, unit: '块 (50cm×10cm)', source: '淘宝搜"玻璃纤维板 FR4"' },
      'PLA': { pricePerUnit: 28, unit: '卷 (1kg)', source: '淘宝搜"PLA+ 3D打印耗材"' },
      'PLA+': { pricePerUnit: 38, unit: '卷 (1kg)', source: '淘宝搜"PLA+ 高强度"' },
      '自行车内胎条': { pricePerUnit: 8, unit: '条', source: '淘宝搜"自行车内胎 废旧"或修车摊' },
      '弹力绳 8mm': { pricePerUnit: 15, unit: '米', source: '淘宝搜"弹力绳 8mm"' },
      '弹力绳 10mm': { pricePerUnit: 22, unit: '米', source: '淘宝搜"弹力绳 10mm"' },
      '尼龙带': { pricePerUnit: 3, unit: '米 (5cm宽)', source: '淘宝搜"尼龙织带 5cm"' },
      '尼龙绑带': { pricePerUnit: 0.5, unit: '根', source: '淘宝搜"尼龙扎带 5x300"' },
      'M5螺栓': { pricePerUnit: 2, unit: '套', source: '淘宝搜"M5 不锈钢螺栓螺母"' },
      'M3螺栓': { pricePerUnit: 1.5, unit: '套', source: '淘宝搜"M3 不锈钢螺栓螺母"' },
      '尼龙垫片': { pricePerUnit: 0.3, unit: '个', source: '淘宝搜"M5 尼龙垫片"' },
      '魔术贴': { pricePerUnit: 5, unit: '米', source: '淘宝搜"魔术贴 背胶"' },
      'EVA泡棉': { pricePerUnit: 12, unit: '张 (30×30cm)', source: '淘宝搜"EVA 泡棉垫 3mm"' },
      '3D打印服务': { pricePerUnit: 45, unit: '件', source: '淘宝搜"3D打印 PLA 代打"' }
    };
  }

  generate(designParams) {
    const items = [];
    const modules = designParams.modules;

    // === 背撑模块（核心） ===
    items.push({
      category: '背撑模块',
      name: '玻纤板（支撑杆）',
      spec: `${designParams.backBarLength}cm × ${designParams.barWidth}cm × ${designParams.barThickness}mm`,
      quantity: 1,
      unit: '块',
      price: this.materialPrices['玻纤板'].pricePerUnit,
      searchKey: this.materialPrices['玻纤板'].source,
      substitutes: '可用竹片（3层粘合）或6061铝合金条替代，性能降低10-15%'
    });

    const bungee = designParams.bungeeSpec;
    items.push({
      category: '背撑模块',
      name: bungee.type,
      spec: `${bungee.diameter} × ${designParams.bungeeLength}cm，${bungee.strands}股并行`,
      quantity: Math.ceil(designParams.bungeeLength / 100),
      unit: '米',
      price: this._bungeePrice(bungee.type),
      searchKey: bungee.searchKey,
      substitutes: '自行车内胎剪条是最便宜的替代方案（修车摊免费拿），但弹性衰减较快需每3-6月更换'
    });

    items.push({
      category: '背撑模块',
      name: '尼龙织带（腰带+肩带）',
      spec: `5cm宽 × ${designParams.strapLengthTotal}cm`,
      quantity: Math.ceil(designParams.strapLengthTotal / 100),
      unit: '米',
      price: this.materialPrices['尼龙带'].pricePerUnit,
      searchKey: this.materialPrices['尼龙带'].source,
      substitutes: '汽车安全带（报废车场拆）或背包带（旧书包）'
    });

    // PLA 打印件
    designParams.plaParts.forEach(part => {
      items.push({
        category: '背撑模块',
        name: `3D打印件：${part.name} (${part.material} ${part.infill})`,
        spec: part.note,
        quantity: part.count,
        unit: '件',
        price: part.material === 'PLA+' ? 50 : 45,
        searchKey: part.material === 'PLA+'
          ? '淘宝搜"3D打印 PLA+ 代打"或自有打印机'
          : '淘宝搜"3D打印 PLA 代打"',
        substitutes: '硬木手工雕刻（有手艺的话）或ABS板热弯'
      });
    });

    // 固定件
    designParams.fasteners.forEach(f => {
      items.push({
        category: '背撑模块',
        name: f.name,
        spec: f.note,
        quantity: f.count,
        unit: '套/个',
        price: this._fastenerPrice(f.name),
        searchKey: f.searchKey
      });
    });

    // 舒适性附件
    items.push({
      category: '背撑模块',
      name: 'EVA泡棉垫（腰部）',
      spec: '3mm厚 × 自裁剪',
      quantity: 1,
      unit: '张',
      price: this.materialPrices['EVA泡棉'].pricePerUnit,
      searchKey: this.materialPrices['EVA泡棉'].source,
      substitutes: '瑜伽垫边角料裁剪'
    });

    items.push({
      category: '背撑模块',
      name: '魔术贴（调节固定）',
      spec: '2.5cm宽',
      quantity: 2,
      unit: '米',
      price: this.materialPrices['魔术贴'].pricePerUnit,
      searchKey: this.materialPrices['魔术贴'].source
    });

    // === 膝撑模块（可选） ===
    if (modules.knee) {
      items.push({
        category: '膝撑模块（可选）',
        name: '弹力绳（膝撑用）',
        spec: `${bungee.diameter} × 60cm，2股`,
        quantity: 1,
        unit: '米',
        price: this._bungeePrice(bungee.type),
        searchKey: bungee.searchKey
      });
      items.push({
        category: '膝撑模块（可选）',
        name: '尼龙织带（膝部绑带）',
        spec: '5cm宽 × 80cm',
        quantity: 1,
        unit: '米',
        price: this.materialPrices['尼龙带'].pricePerUnit,
        searchKey: this.materialPrices['尼龙带'].source
      });
      items.push({
        category: '膝撑模块（可选）',
        name: '3D打印件：膝部铰链座',
        spec: 'PLA+ 50%填充',
        quantity: 2,
        unit: '件',
        price: 50,
        searchKey: '淘宝搜"3D打印 PLA+ 代打"'
      });
      items.push({
        category: '膝撑模块（可选）',
        name: 'EVA泡棉垫（膝窝）',
        spec: '3mm厚',
        quantity: 1,
        unit: '张',
        price: this.materialPrices['EVA泡棉'].pricePerUnit,
        searchKey: this.materialPrices['EVA泡棉'].source
      });
    }

    // === 肩撑模块（可选） ===
    if (modules.shoulder) {
      items.push({
        category: '肩撑模块（可选）',
        name: '弹力绳（肩撑用）',
        spec: `${bungee.diameter} × 80cm，2股`,
        quantity: 1,
        unit: '米',
        price: this._bungeePrice(bungee.type),
        searchKey: bungee.searchKey
      });
      items.push({
        category: '肩撑模块（可选）',
        name: '3D打印件：肩部支架',
        spec: 'PLA+ 40%填充',
        quantity: 2,
        unit: '件',
        price: 48,
        searchKey: '淘宝搜"3D打印 PLA+ 代打"'
      });
    }

    // 工具
    items.push({
      category: '工具（自备）',
      name: '电钻（打孔用）',
      spec: '含3mm/5mm钻头',
      quantity: 1,
      unit: '把',
      price: 0,
      searchKey: '已有则不需要购买，也可用手钻+锉刀替代'
    });
    items.push({
      category: '工具（自备）',
      name: '剪刀/美工刀',
      spec: '',
      quantity: 1,
      unit: '把',
      price: 0,
      searchKey: '用于裁剪尼龙带和泡棉'
    });

    // 计算总价
    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    return {
      items,
      total: parseFloat(total.toFixed(0)),
      currency: 'CNY',
      note: '价格仅供参考，实际以购买时为准。废品站材料可大幅降低成本。'
    };
  }

  _bungeePrice(type) {
    if (type.includes('内胎')) return 8;
    if (type.includes('10mm')) return 22;
    return 15;
  }

  _fastenerPrice(name) {
    if (name.includes('M5螺栓')) return 2;
    if (name.includes('M3螺栓')) return 1.5;
    if (name.includes('垫片')) return 0.3;
    if (name.includes('扎带')) return 0.5;
    return 1;
  }

  // 导出 Markdown 格式购物清单
  exportMarkdown(bom) {
    let md = '# 铁脊柱 — 物料清单\n\n';
    md += `> 总价预估：**¥${bom.total}**\n\n`;

    const categories = {};
    bom.items.forEach(item => {
      if (!categories[item.category]) categories[item.category] = [];
      categories[item.category].push(item);
    });

    for (const [cat, items] of Object.entries(categories)) {
      md += `## ${cat}\n\n`;
      md += '| 物料 | 规格 | 数量 | 预估单价 | 采购方式 |\n';
      md += '|------|------|------|----------|----------|\n';
      items.forEach(i => {
        md += `| ${i.name} | ${i.spec} | ${i.quantity}${i.unit} | ¥${i.price} | ${i.searchKey} |\n`;
      });
      md += '\n';
    }

    md += `---\n*清单生成时间：${new Date().toLocaleDateString('zh-CN')}*\n`;
    md += `*铁脊柱项目 — 开源被动式外骨骼 — 性能降15%，成本降95%*\n`;

    return md;
  }
}
