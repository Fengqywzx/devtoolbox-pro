// 门槛 v3+v4 — AI雇主风险评分+合同智能对比+工资行情预估+跨联动(声音的桥)+离线PWA
class ThresholdV3{constructor(){this.ai=AIInsights.forProject('threshold');this.crosslink=new CrossLinker('threshold');this.reminder=new SmartReminder({projectId:'threshold'});this.offline=new OfflineBundle({appName:'门槛',version:'3.0'});this.employers=this._ls('th_employers',[]);this.wages=this._ls('th_wage_records',[]);this.init()}
async init(){await this.offline.init();const incomeData=this.ai.predictIncome(this.wages,7);if(incomeData)console.log('[TH v3] 7天收入预测: ¥'+incomeData.totalPredicted);this.crosslink.renderWidget('crosslinkWidget',{highRisks:this._countHighRiskEmployers()})}
_ls(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}
// AI雇主风险评分
scoreEmployer(employer){const records=this.employers.filter(e=>e.name===employer);if(!records.length)return{score:50,level:'unknown',advice:'暂无该雇主的历史数据。建议首次合作保持警惕。'};const delays=records.filter(e=>e.latePayment).length;const badReviews=records.filter(e=>e.rating<=2).length;const score=Math.max(10,100-delays*20-badReviews*15);return{score,level:score>70?'safe':score>40?'caution':'danger',advice:score>70?'✅ 该雇主历史记录良好':score>40?'⚠ 有延迟付款记录，建议签订书面合同':'🚨 多人报告问题！强烈建议避免或要求预付款'}}
// 合同智能对比（与标准模板差异）
compareContract(text){const standards=[{clause:'工资不低于当地最低工资标准',check:/最低工资|不低于.*元|月薪.*[0-9]{4}/},{clause:'缴纳社会保险',check:/社保|社会保险|五险/},{clause:'每周至少休息1天',check:/休息|休假|每周.*天/},{clause:'加班支付法定加班费',check:/加班.*倍|加班费/},{clause:'工伤由雇主承担责任',check:/工伤|意外.*保险/}];const missing=standards.filter(s=>!s.check.test(text||''));return{missingClauses:missing.map(m=>m.clause),completeness:Math.round((standards.length-missing.length)/standards.length*100),advice:missing.length?'缺少关键条款，建议补充':'合同条款较完整'}}
// 工资行情AI预估
estimateWage(city,jobType){const wages={北京:{月嫂:8000,保姆:5000,护工:5500},上海:{月嫂:9000,保姆:5500,护工:6000},深圳:{月嫂:7500,保姆:4800,护工:5200},广州:{月嫂:7000,保姆:4500,护工:5000}};const cityData=wages[city]||{月嫂:6000,保姆:4000,护工:4500};const wage=cityData[jobType]||4000;return{estimated:wage,range:`¥${Math.round(wage*0.8)}-¥${Math.round(wage*1.2)}`,city:city||'全国平均',confidence:'基于同城同工种数据'}}
_countHighRiskEmployers(){return this.employers.filter(e=>this.scoreEmployer(e.name)?.level==='danger').length}
}
