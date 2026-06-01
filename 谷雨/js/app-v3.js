// 谷雨 v3+v4 — AI农活匹配+工价预测+农药风险累积评估+极端天气预警+离线PWA
class GrainRainV3{constructor(){this.ai=AIInsights.forProject('grain-rain');this.crosslink=new CrossLinker('grain-rain');this.reminder=new SmartReminder({projectId:'grain-rain'});this.offline=new OfflineBundle({appName:'谷雨',version:'3.0'});this.wages=this._ls('gr_wages',[]);this.pesticides=this._ls('gr_pest',[]);this.init()}
async init(){await this.offline.init();const pred=this.ai.predictIncome(this.wages,14);if(pred)console.log('[GR v3] 14天收入预测: ¥'+pred.totalPredicted);const chemRisk=this._assessCumulativeChemRisk();if(chemRisk?.level==='critical')this.reminder.schedule(()=>alert('🚨 农药累积暴露风险极高！'),{id:'chem',intervalMinutes:240});this.reminder.schedule(()=>this._weatherAlert(),{id:'weather',intervalMinutes:180,priority:'high'})}
_ls(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}
// 农活工价预测
predictSeasonalWage(crop,region,month){const baseWages={wheat:{'河北':280,'河南':250,'山东':300},rice:{'湖南':220,'江西':200,'湖北':240},corn:{'吉林':260,'黑龙江':250,'内蒙古':270},fruit:{'陕西':200,'新疆':250,'山东':220}};const cropBase=baseWages[crop]||{};return{estimated:cropBase[region]||200,season:month>=5&&month<=8?'旺季':'淡季',advice:month>=5&&month<=8?'当前为农忙旺季，工价较高，建议抓紧接活':'当前为淡季，工价偏低。可考虑跨区域务工。'}}
// 农药累积风险评估
_assessCumulativeChemRisk(){if(!this.pesticides.length)return null;const totalHours=this.pesticides.reduce((s,p)=>s+(parseFloat(p.duration)||0),0);const unprotected=this.pesticides.filter(p=>p.protection==='none').reduce((s,p)=>s+(parseFloat(p.duration)||0),0);const ratio=totalHours>0?unprotected/totalHours:0;return{totalHours,unprotectedHours:unprotected,protectionRatio:Math.round((1-ratio)*100),level:unprotected>100?'critical':unprotected>40?'high':unprotected>10?'medium':'low',advice:unprotected>100?'🚨 无防护接触超100小时！立即体检。':unprotected>40?'⚠ 改善防护措施':ratio<0.2?'✅ 防护良好':'📊 注意保持防护'}}
_weatherAlert(){const m=new Date().getMonth();return m>=5&&m<=8?'🌡 夏季高温预警：避开11-15点田间作业。':m>=10||m<=1?'🥶 冬季低温预警：注意防冻保暖。':'🌤 天气适宜农作，注意劳逸结合。'}
}
