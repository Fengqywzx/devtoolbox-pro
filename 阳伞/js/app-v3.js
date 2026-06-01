// 遮阳伞 v3+v4 — AI销售策略+巡查预测+收入趋势+跨联动(声音的桥)+离线PWA
class ParasolV3{constructor(){this.ai=AIInsights.forProject('parasol');this.crosslink=new CrossLinker('parasol');this.reminder=new SmartReminder({projectId:'parasol'});this.offline=new OfflineBundle({appName:'遮阳伞',version:'3.0'});this.biz=this._ls('ps_biz',[]);this.conflicts=this._ls('ps_conf',[]);this.init()}
async init(){await this.offline.init();const pred=this.ai.predictIncome(this.biz.filter(b=>b.type==='income'),7);if(pred)console.log('[PS v3] 7天收入预测: ¥'+pred.totalPredicted);if(this.conflicts.length>=3){this.crosslink.renderWidget('crosslinkWidget',{conflicts:this.conflicts.length})}this.reminder.schedule(()=>this._strategyReminder(),{id:'strategy',intervalMinutes:360,priority:'normal'})}
_ls(k,d){try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}}
// AI销售策略
generateStrategy(season,weather){const h=new Date().getHours();const m=new Date().getMonth();const strategies=[];if(h<10)strategies.push({tip:'🌅 早市：早餐/蔬菜/日用品好卖',confidence:85});if(h>=17&&h<=21)strategies.push({tip:'🌙 夜市：小吃/饮品/小商品好卖',confidence:90});if(m>=5&&m<=8){strategies.push({tip:'☀ 夏季：冷饮/遮阳伞/小风扇热销',confidence:88});strategies.push({tip:'📌 雨天带伞套/雨衣/防水袋更赚钱',confidence:75})}if(m>=10||m<=1)strategies.push({tip:'🥶 冬季：暖宝宝/手套/热饮好卖',confidence:85});return strategies}
// 巡查时段预测（基于历史众包数据）
predictPatrolTimes(patrolLog){if(!patrolLog||!patrolLog.length)return null;const slots={};patrolLog.forEach(p=>{const h=new Date(p.date).getHours();slots[h]=(slots[h]||0)+1});const risks=Object.entries(slots).sort((a,b)=>b[1]-a[1]).slice(0,3);return{highRiskHours:risks.map(r=>parseInt(r[0])),advice:`历史数据显示${risks.map(r=>r[0]+':00').join('、')}时段巡查较多，注意规避。`}}
_strategyReminder(){const tips=['📊 查看今日销售策略建议','💡 热门商品：季节性商品周转快','📍 周末和节假日是销售高峰'];return tips[Math.floor(Math.random()*tips.length)]}
}
