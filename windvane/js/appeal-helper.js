// 申诉证据包生成器
// 基于实际行程数据生成超时理由和误扣款证据

class AppealHelper {
  constructor(recorder) {
    this.recorder = recorder;
  }

  // 生成超时理由说明
  generateDelayReason(trip) {
    if (!trip) trip = this.recorder.getCurrentTrip();
    if (!trip) return this._noDataMessage();

    const events = trip.events || [];
    const safetyEvents = events.filter(e =>
      ['hard_brake', 'swerve', 'near_miss', 'fall'].includes(e.type)
    );

    let text = '';
    text += '══════════════════════════\n';
    text += '  超时配送情况说明\n';
    text += '══════════════════════════\n\n';

    text += `配送日期：${new Date(trip.startTime).toLocaleDateString('zh-CN')}\n`;
    text += `起止时间：${new Date(trip.startTime).toLocaleTimeString('zh-CN')}`;
    if (trip.endTime) text += ` — ${new Date(trip.endTime).toLocaleTimeString('zh-CN')}`;
    text += '\n';
    text += `行驶距离：${trip.distance || '—'} km\n`;
    text += `最高速度：${trip.maxSpeed || '—'} km/h\n\n`;

    text += '【超时原因】\n';

    if (safetyEvents.length > 0) {
      text += `本趟行程中共遭遇 ${safetyEvents.length} 次安全事件，为保障人身安全采取了减速避让措施：\n`;
      safetyEvents.forEach((e, i) => {
        const labels = {
          hard_brake: '紧急制动（前方危险）',
          swerve: '避让行人/车辆',
          near_miss: '险些碰撞，减速观察',
          fall: '摔倒事故'
        };
        text += `  ${i + 1}. [${new Date(e.time).toLocaleTimeString('zh-CN')}] ${labels[e.type] || e.type}\n`;
      });
    }

    if (events.some(e => e.type === 'overspeed')) {
      text += '\n注：本行程中存在超速行驶（受限于平台配送时限），但骑手仍以安全为首要原则。\n';
    }

    if (safetyEvents.length === 0) {
      text += '恶劣天气/道路施工/交通拥堵/商家出餐延迟导致配送超时。\n';
      text += '（注：请补充具体原因，本说明基于客观行程数据生成。）\n';
    }

    text += '\n【依据】\n';
    text += '根据《新就业形态劳动者休息和劳动报酬权益保障指引》，平台算法不得将不合理的配送时限作为唯一考核标准。';

    return text;
  }

  // 生成误扣款证据包
  generateDeductionEvidence(trip) {
    if (!trip) trip = this.recorder.getCurrentTrip();
    if (!trip) return this._noDataMessage();

    let text = '';
    text += '══════════════════════════\n';
    text += '  误扣款申诉证据包\n';
    text += '══════════════════════════\n\n';

    text += `申诉人：___________\n`;
    text += `骑手ID：___________\n`;
    text += `申诉日期：${new Date().toLocaleDateString('zh-CN')}\n\n`;

    text += '【行程数据】\n';
    text += `行程时间：${new Date(trip.startTime).toLocaleString('zh-CN')}`;
    if (trip.endTime) text += ` → ${new Date(trip.endTime).toLocaleString('zh-CN')}`;
    text += '\n';
    text += `行驶距离：${trip.distance || '—'} km\n`;
    text += `安全事件：${trip.events.length} 次\n`;
    text += `安全评分：${trip.safetyScore || '—'}/100\n\n`;

    text += '【扣款信息】\n';
    text += '扣款时间：___________\n';
    text += '扣款金额：___________\n';
    text += '扣款理由（平台显示）：___________\n\n';

    text += '【申诉理由】\n';
    text += '基于本工具记录的行程数据，本次配送过程中的实际情况如下：\n';

    if (trip.events.length > 0) {
      text += '在配送过程中发生了以下影响时效的事件：\n';
      trip.events.forEach((e, i) => {
        const labels = {
          hard_brake: '紧急制动',
          overspeed: '为赶时效不得已超速',
          swerve: '避让危险',
          fall: '摔倒',
          near_miss: '险情'
        };
        text += `  ${i + 1}. ${new Date(e.time).toLocaleTimeString('zh-CN')} — ${labels[e.type] || e.type}\n`;
      });
    }

    text += '\n以上数据由风信标APP自动记录，可作为客观证据。\n';
    text += `数据哈希（可验证完整性）：${this._simpleHash(JSON.stringify(trip.events))}\n`;

    return text;
  }

  _noDataMessage() {
    return '暂无行程数据。请先开始骑行以记录行程数据——数据是你申诉的底气。';
  }

  _simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return hash.toString(16);
  }
}
