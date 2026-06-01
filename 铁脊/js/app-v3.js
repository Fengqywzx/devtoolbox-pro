// 铁脊柱 v3+v4 — AI受力模拟+材料智能推荐+社区反馈聚合+磨损预测+离线PWA
class IronSpineV3{constructor(){this.ai=AIInsights.forProject('iron-spine');this.crosslink=new CrossLinker('iron-spine');this.reminder=new SmartReminder({projectId:'iron-spine'});this.offline=new OfflineBundle({appName:'铁脊柱',version:'3.0'});this.feedback=this._ls('is_feedback',[]);this.init()}
async init(){await this.offline.init();const triggers=this.crosslink.checkIncoming();if(triggers.length)console.log('[IS v3] 来自其他项目的联动触发:',triggers.length)}
_ls(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}
// AI材料推荐
recommendMaterial(params){const{weight,posture,intensity}=params||{};const w=weight||70;const i=intensity||'medium';if(w>90||i==='heavy')return{type:'弹力绳（加粗）',diameter:'10mm',strands:4,reason:'体重较重+高强度作业，需要更强的支撑力'};if(w>70||posture==='bend')return{type:'弹力绳',diameter:'8mm',strands:3,reason:'中等需求，标准弹力绳即可'};return{type:'自行车内胎条',diameter:'6mm',strands:2,reason:'轻度需求，可用废品站材料替代，成本降低80%'}}
// 磨损预测
predictWear(usageDays,hoursPerDay){const totalHours=usageDays*hoursPerDay;const bungeeLife=6*30*8;const barLife=24*30*8;return{bungeeRemaining:Math.max(0,Math.round((bungeeLife-totalHours)/8)),barRemaining:Math.max(0,Math.round((barLife-totalHours)/8)),advice:totalHours>bungeeLife*0.8?'⚠ 弹力绳即将需要更换，请提前准备备用':'✅ 各部件状态良好'}}
// 社区反馈→设计优化
aggregateFeedback(){const feedbacks=this.feedback;if(!feedbacks.length)return null;const issues={};feedbacks.forEach(f=>{const kw=f.text||'';if(kw.includes('弹力绳')||kw.includes('松'))issues.bungee=(issues.bungee||0)+1;if(kw.includes('卡扣')||kw.includes('裂'))issues.clip=(issues.clip||0)+1;if(kw.includes('磨')||kw.includes('不舒服'))issues.comfort=(issues.comfort||0)+1});const top=Object.entries(issues).sort((a,b)=>b[1]-a[1])[0];return top?{topIssue:top[0],count:top[1],advice:`社区反馈最多的问题：${top[0]==='bungee'?'弹力绳松动':'需要优化'}`}:null}
}
