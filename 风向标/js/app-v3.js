// 风信标 v3+v4 — AI骑行预测+收入优化+疲劳建模+跨联动+离线PWA
class WindvaneV3{constructor(){this.ai=AIInsights.forProject('windvane');this.crosslink=new CrossLinker('windvane');this.reminder=new SmartReminder({projectId:'windvane'});this.offline=new OfflineBundle({appName:'风信标',version:'3.0'});this.rides=this._ls('wv_rides',[]);this.riskZones=this._ls('wv_zones',[]);this.init()}
async init(){await this.offline.init();this.reminder.schedule(()=>this._fatigueCheck(),{id:'fatigue',intervalMinutes:30,priority:'high'});this.reminder.schedule(()=>this._restReminder(),{id:'rest',intervalMinutes:120,priority:'normal'});this.crosslink.renderWidget('crosslinkWidget',{fatigue:this._getFatigueLevel()})}
_ls(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}
_predictCrashRisk(loc){const near=this.riskZones.filter(z=>Math.abs(z.lat-(loc?.lat||0))<0.01&&Math.abs(z.lng-(loc?.lng||0))<0.01);return near.length>0?{risk:'high',msg:`前方${near.length}个事故高发点，请减速慢行`,zones:near}:{risk:'low',msg:'当前路段安全'}}
_optimizeIncome(history){if(!history||history.length<3)return null;const hours={};history.forEach(r=>{const h=new Date(r.date).getHours();if(!hours[h])hours[h]=[];hours[h].push(r.amount||0)});const best=Object.entries(hours).map(([h,amts])=>({hour:parseInt(h),avg:amts.reduce((a,b)=>a+b,0)/amts.length,count:amts.length})).sort((a,b)=>b.avg-a.avg).slice(0,3);return{bestHours:best,advice:`最佳出车时段: ${best.map(b=>`${b.hour}:00`).join('、')}`}}
_getFatigueLevel(){const recent=this.rides.slice(-10);const totalMin=recent.reduce((s,r)=>s+(r.duration||0),0);return totalMin>360?'critical':totalMin>240?'high':totalMin>120?'medium':'low'}
_fatigueCheck(){const lvl=this._getFatigueLevel();if(lvl==='critical'){if(Notification.permission==='granted')new Notification('风信标',{body:'🚨 疲劳程度极高！请立即休息至少30分钟。',icon:'../assets/icon-192.png'})}}
_restReminder(){return'⏰ 连续骑行2小时，建议休息10分钟。前方500米有休息点。'}
}
