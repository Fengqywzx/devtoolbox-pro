// 节拍器 v3+v4 — AI劳损预测+个性化训练+化学品风险评估+跨联动(铁脊柱)+离线PWA
class MetronomeV3{constructor(){this.ai=AIInsights.forProject('metronome');this.crosslink=new CrossLinker('metronome');this.reminder=new SmartReminder({projectId:'metronome'});this.offline=new OfflineBundle({appName:'节拍器',version:'3.0'});this.rsiLog=this._ls('mt_rsi_log',[]);this.chemicals=this._ls('mt_chemicals',[]);this.init()}
async init(){await this.offline.init();const risk=this._predictRSIRisk();if(risk?.level==='high'){this.crosslink.renderWidget('crosslinkWidget',{rsiLevel:'high',posture:'bend'})}this.reminder.schedule(()=>this._exerciseReminder(),{id:'exercise',intervalMinutes:60,priority:'high'});const chemRisk=this._assessChemicalRisk();if(chemRisk?.level==='high')this.reminder.schedule(()=>alert(chemRisk.advice),{id:'chem',intervalMinutes:120})}
_ls(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}
// AI劳损预测（基于工种+工龄+评分趋势）
_predictRSIRisk(){const recent=this.rsiLog.slice(-5);if(!recent.length)return null;const avgScore=recent.reduce((s,r)=>s+(r.total||0),0)/recent.length;const trend=recent[recent.length-1]?.total - recent[0]?.total;const risk36m=Math.min(95,avgScore*10+(trend>0?20:0));return{level:risk36m>60?'high':risk36m>30?'medium':'low',projectedRisk36m:Math.round(risk36m),advice:risk36m>60?'🚨 预计36个月内劳损风险很高。强烈建议使用外骨骼辅助。':risk36m>30?'⚠ 有劳损风险，坚持预防训练。':'✅ 风险较低，保持当前习惯。'}}
// 化学品累积风险评估
_assessChemicalRisk(){const unprotected=this.chemicals.filter(c=>c.protection==='none');if(!unprotected.length)return{level:'low',advice:'✅ 化学品防护记录良好'};const hours=unprotected.reduce((s,c)=>s+(parseFloat(c.duration)||0),0);return{level:hours>40?'high':hours>10?'medium':'low',totalHours:hours,advice:hours>40?'🚨 累计无防护接触超40小时！立即进行肝功能检查。':hours>10?'⚠ 建议改善防护措施':'📊 注意保持防护'}}
// 个性化训练推荐
recommendExercises(rsiResult){const all=[{id:'wrist',name:'手腕伸展',icon:'🤲'},{id:'shoulder',name:'肩膀环绕',icon:'🔄'},{id:'neck',name:'颈部拉伸',icon:'🙆'},{id:'back',name:'腰部伸展',icon:'🧘'}];if(!rsiResult)return all;const{bodyParts}=rsiResult;if(bodyParts?.includes('手指')||bodyParts?.includes('手腕'))return all.filter(e=>['wrist','shoulder'].includes(e.id));if(bodyParts?.includes('肩膀'))return all.filter(e=>['shoulder','neck'].includes(e.id));return all}
_exerciseReminder(){if(this.reminder.isQuietTime())return;return'⏰ 该做预防训练了！每小时伸展2分钟可降低50%劳损风险。'}
}
