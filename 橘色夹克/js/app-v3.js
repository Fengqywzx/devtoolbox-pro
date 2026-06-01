// 橘子衣 v3+v4 — AI中暑预测+健康异常检测+智能饮水+跨联动(铁脊柱)+离线PWA
class OrangeJacketV3{constructor(){this.ai=AIInsights.forProject('orange-jacket');this.crosslink=new CrossLinker('orange-jacket');this.reminder=new SmartReminder({projectId:'orange-jacket'});this.offline=new OfflineBundle({appName:'橘子衣',version:'3.0'});this.healthLog=this._ls('oj_health_history',[]);this.init()}
async init(){await this.offline.init();const healthRisk=this.ai.predictHealthRisk(this.healthLog,{temp:parseInt(document.getElementById('weatherMain')?.textContent)||22});if(healthRisk?.risk==='high')this.reminder.schedule(()=>alert(healthRisk.advice),{id:'health_alert',intervalMinutes:60,priority:'high'});this.reminder.schedule(()=>this._waterReminder(),{id:'water',intervalMinutes:45,priority:'normal'});this.crosslink.renderWidget('crosslinkWidget',{backPain:this.healthLog.some(h=>h.pain>=2)})}
_ls(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}
// AI中暑风险预测
predictHeatstroke(temp,humidity,hours,age){const risk=Math.min(100,(temp-30)*5+(humidity-50)*0.5+hours*3+(age>55?20:0));return{risk,level:risk>70?'critical':risk>40?'high':risk>20?'medium':'low',advice:risk>70?'🚨 极高风险！建议停止户外作业':risk>40?'⚠ 注意防暑，每30分钟休息':'✅ 风险较低，保持补水'}}
// 智能饮水计划
generateWaterPlan(temp,weight){const base=weight*0.03;const extra=Math.max(0,(temp-25)*0.2);return{totalLiters:(base+extra).toFixed(1),schedule:['5:00 - 500ml','8:00 - 500ml','10:00 - 500ml','12:00 - 500ml','14:00 - 500ml','16:00 - 500ml','18:00 - 500ml'],tip:'每小时至少饮水一次，不要等到渴了再喝。'}}
// 健康异常检测
detectAnomalies(){const scores=this.healthLog.map(h=>h.totalScore||0);return TrendAnalyzer.detectAnomalies(scores,2)}
_waterReminder(){if(this.reminder.isQuietTime())return;const temp=28;const plan=this.generateWaterPlan(temp,70);return`💧 今日建议饮水${plan.totalLiters}L`}
}
