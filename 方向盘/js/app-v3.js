// 方向盘 v3+v4 — AI收入优化+疲劳曲线建模+保费预估+跨联动+离线PWA
class SteeringWheelV3{constructor(){this.ai=AIInsights.forProject('steering-wheel');this.crosslink=new CrossLinker('steering-wheel');this.reminder=new SmartReminder({projectId:'steering-wheel'});this.offline=new OfflineBundle({appName:'方向盘',version:'3.0'});this.incomes=this._ls('sw_incomes',[]);this.init()}
async init(){await this.offline.init();const pred=this.ai.predictIncome(this.incomes,7);if(pred)console.log('[SW v3] 7天收入预测: ¥'+pred.totalPredicted);this.reminder.schedule(()=>this._fatigueCheck(),{id:'fatigue',intervalMinutes:30,priority:'high'});const data=await this.offline.getRecords(100)}
_ls(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}
// 收入优化：最佳出车时段推荐
optimizeSchedule(){const slots={};for(let h=0;h<24;h++)slots[h]={total:0,count:0};this.incomes.forEach(r=>{const h=new Date(r.date).getHours();slots[h].total+=(r.amount||0);slots[h].count++});return Object.entries(slots).map(([h,d])=>({hour:parseInt(h),avg:d.count?Math.round(d.total/d.count):0,count:d.count})).filter(s=>s.count>=3).sort((a,b)=>b.avg-a.avg).slice(0,5)}
// 疲劳曲线个人建模
personalizedFatigueModel(){const sessions=this.incomes.filter(r=>r.hours);if(sessions.length<5)return null;const maxSafe=Math.min(12,sessions.reduce((s,r)=>s+(r.hours||0),0)/sessions.length*1.3);return{safeLimit:Math.round(maxSafe*10)/10,pattern:maxSafe>8?'耐力型司机':'标准型',advice:`你的安全驾驶上限约${Math.round(maxSafe)}小时/天。超过后事故风险指数上升。`}}
_fatigueCheck(){const today=this.incomes.filter(r=>new Date(r.date).toDateString()===new Date().toDateString());const hrs=today.reduce((s,r)=>s+(r.hours||0),0);if(hrs>8)return'🚨 今日驾驶已超8小时！请立即收车休息。';if(hrs>5)return'⚠ 已驾驶5小时，建议30分钟后休息。';return null}
}
