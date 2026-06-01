// 加班费权益计算器
// 基于《劳动法》和《工资支付暂行规定》

class OvertimeCalculator {
  // 月计薪天数 = (365-104) / 12 = 21.75天
  static WORK_DAYS_PER_MONTH = 21.75;
  static WORK_HOURS_PER_DAY = 8;

  // 计算时薪
  static hourlyRate(monthlySalary) {
    return monthlySalary / (this.WORK_DAYS_PER_MONTH * this.WORK_HOURS_PER_DAY);
  }

  // 计算加班费
  static calculate(monthlySalary, weekdayHours, weekendHours, holidayHours) {
    const rate = this.hourlyRate(monthlySalary);

    // 工作日加班：1.5倍
    const weekdayPay = rate * 1.5 * weekdayHours;

    // 休息日加班：2倍（且不能调休时必须付）
    const weekendPay = rate * 2 * weekendHours;

    // 法定节假日：3倍
    const holidayPay = rate * 3 * holidayHours;

    const total = weekdayPay + weekendPay + holidayPay;

    return {
      hourlyRate: Math.round(rate * 100) / 100,
      breakdown: [
        { label: '工作日加班 (×1.5)', hours: weekdayHours, rate: Math.round(rate * 1.5 * 100) / 100, amount: Math.round(weekdayPay * 100) / 100 },
        { label: '休息日加班 (×2)', hours: weekendHours, rate: Math.round(rate * 2 * 100) / 100, amount: Math.round(weekendPay * 100) / 100 },
        { label: '法定节假日加班 (×3)', hours: holidayHours, rate: Math.round(rate * 3 * 100) / 100, amount: Math.round(holidayPay * 100) / 100 },
      ],
      total: Math.round(total * 100) / 100,
      tips: OvertimeCalculator._getTips(weekdayHours, weekendHours, holidayHours, monthlySalary)
    };
  }

  static _getTips(weekday, weekend, holiday, salary) {
    const tips = [];

    if (weekday > 36) {
      tips.push('⚠ 法律规定每月加班不超过36小时！你的工作日加班已超过此限制。你有权拒绝超时加班。');
    }

    if (weekend > 0) {
      tips.push('📌 休息日加班：雇主应优先安排补休。如果不能补休，才支付2倍工资。如果你更想要休息时间而非加班费，可以向雇主提出调休。');
    }

    if (holiday > 0) {
      tips.push('📌 法定节假日加班必须支付3倍工资，不可用调休替代！');
    }

    if (salary < 2420) {
      tips.push('⚠ 你的月工资低于北京最低工资标准（2420元）。如果实际工时满，可以向劳动监察部门投诉。');
    }

    if (weekday + weekend + holiday > 80) {
      tips.push('🚨 本月加班已超80小时——这对你的健康非常危险。长期超时加班会导致不可逆的身体损伤。请考虑向劳动监察部门反映。');
    }

    return tips;
  }
}
