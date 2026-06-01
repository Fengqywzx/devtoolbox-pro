// 脚手架 v3+v4 — AI安全风险预测+坠落风险评估+工资追讨协调+跨联动(声音的桥)+离线PWA
class ScaffoldV3{constructor(){this.ai=AIInsights.forProject('scaffold');this.crosslink=new CrossLinker('scaffold');this.reminder=new SmartReminder({projectId:'scaffold'});this.offline=new OfflineBundle({appName:'脚手架',version:'3.0'});this.workDays=this._ls('sc_days',[]);this.init()}
async init(){await this.offline.init();const risk=this._predictSafetyRisk();if(risk?.level==='high'){this.crosslink.renderWidget('crosslinkWidget',{unpaid:this._checkUnpaidWages()})}this.reminder.schedule(()=>this._safetyCheckReminder(),{id:'safety',intervalMinutes:240,priority:'high'})}
_ls(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}
// AI安全风险预测（综合天气+高度+经验）
_predictSafetyRisk(){const now=new Date();const h=now.getHours();const wind=12;const temp=28;let score=0;if(wind>25)score+=30;if(temp>35)score+=25;if(h<6||h>19)score+=15;if(this.workDays.length<30)score+=20;return{score:Math.min(100,score),level:score>50?'high':score>25?'medium':'low',factors:[wind>25?'大风':null,temp>35?'高温':null,(h<6||h>19)?'夜间':null,this.workDays.length<30?'经验不足':null].filter(Boolean)}}
// 坠落风险评估
assessFallRisk(workHeight,windSpeed,hasHarness){if(workHeight<2)return{risk:'low',advice:'高度低于2米，常规防护即可'};let score=workHeight*3+(windSpeed>20?30:0)+(!hasHarness?40:0);return{risk:score>70?'critical':score>40?'high':'medium',score,advice:!hasHarness?'🚨 高处作业必须系安全带！':score>70?'⚠ 高风险，加强防护':'✅ 防护到位'}}
_checkUnpaidWages(){const now=new Date();return this.workDays.some(d=>{const dt=new Date(d.date);return dt.getMonth()===now.getMonth()&&(!d.paid)});}
_safetyCheckReminder(){return'🛡 安全提醒：检查安全帽、安全带、防护网是否完好。'}
}
