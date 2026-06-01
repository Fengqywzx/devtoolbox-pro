"""Enhance buddy-pet cat — no-indent top level, 2-space inside functions."""
path = r'C:\Users\18612\Desktop\万子轩的项目\buddy-pet.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0
S = '  '

# ===== 1. Dialogue (top-level, NO indent) =====
old = '\n'.join([
    '// === 话语库 ===',
    'const COMFORT_MSGS = [',
    "  '别急，慢慢来～','我在呢！','代码写累了吧？摸摸我放松一下','你是最棒的！','今天也很努力呢 ✨',",
    "  '休息一下也没关系','Bug 打不倒你！','我在给你加油 💪','你的努力我都看在眼里','深呼吸，放轻松～',",
    "  '你已经比昨天更厉害了','累了就靠在我身上吧','不管怎样我都陪着你','你写的每一行代码都有意义',",
    "  '抱抱～','你是我的骄傲','不要怀疑自己','这个世界需要你的代码','天塌下来我帮你顶着',",
    '];',
    'const PLAY_MSGS = [',
    "  '嘿嘿，好舒服～','再摸摸嘛！','咕噜咕噜...','嘻嘻，别停！','好开心！',",
    "  '最喜欢你了！','靠在你身边好安心','嗯嗯～还要还要','蹭蹭你～',",
    '];',
    'const FEED_MSGS = [',
    "  '好吃！再来一份！','能量满满！','嗝～好饱','这是我最爱的食物！','吃饱了更有力气陪你！',",
    '];',
    'const TRAIN_MSGS = [',
    "  '变强了！','再来一组！','肌肉在燃烧...','和你一起变强！','冲冲冲！',",
    '];',
    'const EVOLVE_MSGS = [',
    "  '力量在涌动...','新的力量觉醒了！','哇！我变帅了！','进化之光！',",
    '];',
    "const LEVEL_MSGS = ['升级啦！','LEVEL UP！','变得更强了！','谢谢你陪我成长！'];",
    "const SLEEP_MSGS = ['zzz... 好困...','小睡一会儿...','呼...呼...','💤 养精蓄锐中...'];",
    "const WAKE_MSGS = ['啊！你回来了！','睡醒了！精神百倍！','准备好陪你写代码了！','嗯～睡得真好！'];",
])

assert old in content, 'DIALOGUE not found'

new = '\n'.join([
    '// === 话语库（猫语特化） ===',
    'const COMFORT_MSGS = [',
    "  '喵～别急，慢慢来～','我在呢，一直陪着你','代码写累了吧？摸摸我放松一下','你是最棒的铲屎官！','今天也很努力呢 ✨',",
    "  '休息一下也没关系喵','Bug 打不倒你！','我在给你加油喵～','你的努力我都看在眼里','深呼吸，放轻松～',",
    "  '你已经比昨天更厉害了','累了就靠在我身上吧','不管怎样我都陪着你','你写的每一行代码都有意义',",
    "  '抱抱～','你是我的骄傲喵','不要怀疑自己','这个世界需要你的代码','天塌下来我帮你顶着',",
    "  '喵喵喵？要我帮你debug吗','用爪子拍拍你的手','尾巴轻轻扫过你的手臂...','歪着头看着你',",
    "  '你专注的时候最帅了','我帮你踩踩背吧','今天的月光真美，适合写代码','记得喝水呀铲屎的',",
    '];',
    'const PLAY_MSGS = [',
    "  '呼噜呼噜～～好舒服！','再摸摸嘛喵！','咕噜咕噜...不要停','嘻嘻，耳朵酥酥的','好开心！',",
    "  '最喜欢你了！','蹭蹭你的手心～好暖','嗯嗯～还要还要','翻肚皮给你摸！','喵呜呜～太幸福了',",
    "  '用头拱你的手...继续嘛','对，就是那里！','幸福到眯起眼睛','毛都被你摸顺了','爪子不自觉地踩起来...',",
    '];',
    'const FEED_MSGS = [',
    "  '好吃！再来一份喵！','能量满满！','嗝～好饱，舔舔爪子','这是我最爱的！小鱼干！','吃饱了更有力气陪你！',",
    "  '喵呜～真香！','吧唧吧唧...','还有吗还有吗？','尾巴竖起来了！好吃！','幸福到在地上打滚',",
    '];',
    'const TRAIN_MSGS = [',
    "  '变强了喵！','再来一组！','肌肉在燃烧...爪子更有力了','和你一起变强！','冲冲冲！',",
    "  '看我空中转体！','今天的训练量达标！','呼...好累但好爽','猫拳！喵喵喵！','我要保护你！',",
    '];',
    'const EVOLVE_MSGS = [',
    "  '力量在涌动...','新的力量觉醒了！','哇！我变帅了！','进化之光！','毛色在发光...',",
    '];',
    "const LEVEL_MSGS = ['升级啦喵！','LEVEL UP！','变得更强了！','谢谢你陪我成长！','离九命猫妖又近了一步！'];",
    "const SLEEP_MSGS = ['zzz... 好困...呼...','小睡一会儿喵...','呼...呼...尾巴都不动了','💤 养精蓄锐中...','蜷成一团...zzz'];",
    "const WAKE_MSGS = ['啊！你回来了！','睡醒了喵！精神百倍！','准备好陪你写代码了！','嗯～睡得真好！伸个懒腰','打了个大大的哈欠～'];",
])
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Dialogue enhanced')

# ===== 2. Mood system =====
old = "  {key:'snark',label:'SNARK',icon:'😏',color:'#ffb86c'},\n];"
assert old in content, 'STATS_CFG end not found'
new = '''  {key:'snark',label:'SNARK',icon:'😏',color:'#ffb86c'},
];

// === 情绪系统 ===
const MOODS = {
  playful: {name:'贪玩',emoji:'😸',color:'#ffb86c',desc:'想抓东西！',eyeMod:1.2,speedMul:1.4,bubbleChance:0.15},
  sleepy:  {name:'困困',emoji:'😴',color:'#8be9fd',desc:'有点困...',eyeMod:0.5,speedMul:0.5,bubbleChance:0.05},
  curious: {name:'好奇',emoji:'🤔',color:'#50fa7b',desc:'那是什么？',eyeMod:1.1,speedMul:1.1,bubbleChance:0.12},
  hungry:  {name:'饿了',emoji:'🍖',color:'#ff6b9d',desc:'想吃东西...',eyeMod:1.0,speedMul:0.8,bubbleChance:0.18},
  content: {name:'满足',emoji:'😊',color:'#bd93f9',desc:'舒服～',eyeMod:0.8,speedMul:0.6,bubbleChance:0.10},
};
function updateMood(){
  const idleT = idleTimer;
  const hours = new Date().getHours();
  if(isSleeping){ pet.mood='sleepy'; return; }
  if(hours>=22||hours<6){ pet.mood='sleepy'; return; }
  if(idleT>500&&Math.random()<0.01) pet.mood='hungry';
  else if(idleT>350&&Math.random()<0.008) pet.mood='sleepy';
  else if(idleT<60) pet.mood=Math.random()<0.5?'playful':'content';
  else if(Math.random()<0.003){
    const moods=['playful','curious','content','hungry'];
    pet.mood=moods[Math.floor(Math.random()*moods.length)];
  }
  if(!pet.mood||!MOODS[pet.mood]) pet.mood='curious';
}
function moodCfg(){return MOODS[pet.mood]||MOODS.curious;}'''
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Mood system added')

# ===== 3. Behavior =====
old = '\n'.join([
    'function autonomousBehavior(){',
    '  if(isSleeping) return;',
    '',
    '  // 随机切换行为',
    '  actionTimer++;',
    '  const idleT=idleTimer;',
    '',
    '  if(idleT>600){ // 10秒无互动 → 睡觉',
    '    if(!isSleeping){',
    '      isSleeping=true;',
    '      bubble(SLEEP_MSGS[Math.floor(Math.random()*SLEEP_MSGS.length)],4000);',
    '    }',
    '    targetX=0;targetY=0;',
    '    return;',
    '  }',
    '  if(idleT>350){ // 开始犯困',
    '    if(Math.random()<0.02){',
    "      bubble('好困... 你在干嘛呢？',2000);",
    '    }',
    '  }',
    '',
    '  // 每 ~4秒换一次动作',
    '  if(actionTimer>autoActionInterval){',
    '    actionTimer=0;',
    '    const r=Math.random();',
    '',
    '    if(r<0.2){ // 左右走动',
    '      targetX=(Math.random()-0.5)*60;',
    '      targetY=Math.random()*10-5;',
    "      actionState='walk';",
    '    }else if(r<0.35){ // 跳跃',
    '      targetX=(Math.random()-0.5)*40;',
    '      targetY=-20-Math.random()*20;',
    "      actionState='jump';",
    '      setTimeout(()=>{targetY=0;},400);',
    '    }else if(r<0.5){ // 撒娇摇摆',
    '      targetX=0;targetY=0;',
    "      actionState='wiggle';",
    '      if(Math.random()<0.5) bubble(COMFORT_MSGS[Math.floor(Math.random()*COMFORT_MSGS.length)],2500);',
    '    }else if(r<0.6){ // 回到中心',
    '      targetX=0;targetY=0;',
    "      actionState='idle';",
    '      if(Math.random()<0.3) bubble(COMFORT_MSGS[Math.floor(Math.random()*COMFORT_MSGS.length)],2500);',
    '    }else{ // 随机移动',
    '      targetX=(Math.random()-0.5)*40;',
    '      targetY=-5-Math.random()*15;',
    "      actionState='move';",
    '    }',
    '',
    '    autoActionInterval=250+Math.floor(Math.random()*350); // 4-10秒变化',
    '  }',
    '',
    '  // 如果接近目标，准备新动作',
    '  if(Math.abs(petOffsetX-targetX)<3&&Math.abs(petOffsetY-targetY)<3&&actionTimer>150){',
    '    if(Math.random()<0.3) actionTimer=autoActionInterval; // 提前触发新动作',
    '  }',
    '}',
])
assert old in content, 'BEHAVIOR not found'

new = '\n'.join([
    'function autonomousBehavior(){',
    '  if(isSleeping) return;',
    '',
    '  if(Math.random()<0.005) updateMood();',
    '',
    '  actionTimer++;',
    '  const idleT=idleTimer;',
    '  const mc = moodCfg();',
    '',
    '  if(idleT>600){',
    '    if(!isSleeping){',
    "      isSleeping=true; pet.mood='sleepy';",
    '      bubble(SLEEP_MSGS[Math.floor(Math.random()*SLEEP_MSGS.length)],4000);',
    '    }',
    '    targetX=0;targetY=0;',
    '    return;',
    '  }',
    '  if(idleT>350){',
    '    if(Math.random()<0.02){',
    "      bubble('好困... 你在干嘛呢？喵～',2000);",
    '    }',
    '  }',
    '',
    '  if(actionTimer>autoActionInterval){',
    '    actionTimer=0;',
    '    const r=Math.random();',
    "    const isCat=pet.speciesKey==='cat';",
    '',
    '    if(r<0.12&&isCat){',
    '      targetX=Math.sin(Date.now()/200)*15;',
    '      targetY=Math.sin(Date.now()/300)*10;',
    "      actionState='chase_tail';",
    "      if(Math.random()<0.4) bubble(['尾巴！抓住你！','转圈圈～','咦？尾巴在动？','看我转！'][Math.floor(Math.random()*4)],2000);",
    "    }else if(r<0.22&&isCat&&pet.mood==='playful'){",
    '      targetX=(Math.random()-0.5)*50;',
    '      targetY=-15-Math.random()*10;',
    "      actionState='pounce';",
    '      setTimeout(()=>{targetY=0;targetX=0;},350);',
    "      if(Math.random()<0.5) bubble(['抓到你了！','嘿！','虚空中有东西！','扑！'][Math.floor(Math.random()*4)],1800);",
    '    }else if(r<0.30&&isCat){',
    '      targetX=0;targetY=0;',
    "      actionState='groom';",
    "      if(Math.random()<0.35) bubble(['*舔舔爪子*','毛毛要顺顺的','*认真舔毛中*'][Math.floor(Math.random()*3)],2500);",
    "    }else if(r<0.37&&isCat&&pet.mood==='content'){",
    '      targetX=0;targetY=0;',
    "      actionState='knead';",
    "      if(Math.random()<0.4) bubble(['踩踩踩～软软的','咕噜咕噜...踩奶时间','想起小时候...'][Math.floor(Math.random()*3)],2500);",
    '    }else if(r<0.42&&isCat){',
    '      targetY=-25;',
    "      actionState='stretch_cat';",
    '      setTimeout(()=>{targetY=0;},500);',
    '    }else if(r<0.50){',
    '      targetX=(Math.random()-0.5)*60*mc.speedMul;',
    '      targetY=Math.random()*10-5;',
    "      actionState='walk';",
    '    }else if(r<0.62){',
    '      targetX=(Math.random()-0.5)*40;',
    '      targetY=-20-Math.random()*20;',
    "      actionState='jump';",
    '      setTimeout(()=>{targetY=0;},400);',
    '    }else if(r<0.74){',
    '      targetX=0;targetY=0;',
    "      actionState='wiggle';",
    '      if(Math.random()<mc.bubbleChance+0.3) bubble(COMFORT_MSGS[Math.floor(Math.random()*COMFORT_MSGS.length)],2500);',
    '    }else if(r<0.84){',
    '      targetX=0;targetY=0;',
    "      actionState='idle';",
    '      if(Math.random()<mc.bubbleChance+0.15) bubble(COMFORT_MSGS[Math.floor(Math.random()*COMFORT_MSGS.length)],2500);',
    '    }else{',
    '      targetX=(Math.random()-0.5)*40*mc.speedMul;',
    '      targetY=-5-Math.random()*15;',
    "      actionState='move';",
    '    }',
    '',
    '    autoActionInterval=200+Math.floor(Math.random()*400);',
    '  }',
    '',
    '  if(Math.abs(petOffsetX-targetX)<3&&Math.abs(petOffsetY-targetY)<3&&actionTimer>120){',
    '    if(Math.random()<0.25) actionTimer=autoActionInterval;',
    '  }',
    '}',
])
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Behavior enhanced')

# ===== 4. Panel mood =====
old = "  document.getElementById('speciesTag').textContent=`${SPECIES[pet.speciesKey].name} · Lv.${pet.level} · ${pet.shiny?'✨闪光':''}`;"
assert old in content, 'PANEL not found'
new = "  const mc2=moodCfg();\n  document.getElementById('speciesTag').innerHTML=`${SPECIES[pet.speciesKey].name} · Lv.${pet.level} · ${pet.shiny?'✨闪光':''} <span style=\"color:${mc2.color};font-size:12px;\">${mc2.emoji} ${mc2.name}</span>`;"
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Panel mood')

# ===== 5. Cat drawing =====
old = '\n'.join([
    'function drawCat(x,y,c,t){',
    '  const ear=Math.sin(t*4)*1.5;',
    '  ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,y,28,30,0,0,Math.PI*2);ctx.fill();',
    "  ctx.strokeStyle=c;ctx.lineWidth=5;ctx.lineCap='round';",
    '  ctx.beginPath();ctx.moveTo(x+22,y+12);ctx.quadraticCurveTo(x+50,y-8,x+48,y-28);ctx.stroke();',
    '',
    '  ctx.fillStyle=c;',
    '  ctx.beginPath();ctx.moveTo(x-18,y-18);ctx.lineTo(x-22+ear,y-45);ctx.lineTo(x-4,y-22);ctx.fill();',
    '  ctx.beginPath();ctx.moveTo(x+18,y-18);ctx.lineTo(x+22-ear,y-45);ctx.lineTo(x+4,y-22);ctx.fill();',
    '',
    '  ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y-8,16,0,Math.PI*2);ctx.fill();',
    '  drawEyes(x,y-12,eyeLookX,eyeLookY);',
    "  ctx.fillStyle='#ff9999';ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x-2,y-3);ctx.lineTo(x+2,y-3);ctx.closePath();ctx.fill();",
    '  ctx.strokeStyle=darken(c,30);ctx.lineWidth=1;',
    '  ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x-2,y-1);ctx.moveTo(x,y-4);ctx.lineTo(x+2,y-1);ctx.stroke();',
    '  drawCrown(x,y-40,c);',
    '}',
])
assert old in content, 'DRAWCAT not found'

new = '\n'.join([
    'function drawCat(x,y,c,t){',
    '  const ear=Math.sin(t*4)*1.5;',
    '  const mc=moodCfg();',
    "  const isPlayful=pet.mood==='playful';",
    "  const isSleepy=pet.mood==='sleepy';",
    '',
    '  // 尾巴 — 随情绪变化',
    '  let tailWag=Math.sin(t*3)*8;',
    "  if(actionState==='chase_tail') tailWag=Math.sin(t*8)*20;",
    '  if(isPlayful) tailWag=Math.sin(t*5)*12;',
    '  if(isSleepy) tailWag=Math.sin(t*1.5)*4;',
    "  ctx.strokeStyle=c;ctx.lineWidth=5;ctx.lineCap='round';",
    '  ctx.beginPath();ctx.moveTo(x+22,y+12);',
    '  ctx.quadraticCurveTo(x+50,y-8+tailWag*0.5,x+48+tailWag*0.3,y-28+tailWag);',
    '  ctx.stroke();',
    '',
    '  // 身体（动作变形）',
    "  const bodySquash=actionState==='pounce'?1.1:(actionState==='stretch_cat'?0.85:1);",
    '  ctx.fillStyle=c;ctx.beginPath();',
    '  ctx.ellipse(x,y,28*bodySquash,30/bodySquash,0,0,Math.PI*2);ctx.fill();',
    '',
    '  // 肚皮毛',
    "  ctx.fillStyle=lighten(c,40)+'44';ctx.beginPath();",
    '  ctx.ellipse(x,y+6,16,18,0,0,Math.PI*2);ctx.fill();',
    '',
    '  // 耳朵 — 情绪影响角度',
    '  const earMod=isSleepy?-3:(isPlayful?3:0);',
    '  ctx.fillStyle=c;',
    '  ctx.beginPath();ctx.moveTo(x-18,y-18);ctx.lineTo(x-22+ear+earMod,y-45);ctx.lineTo(x-4,y-22);ctx.fill();',
    '  ctx.beginPath();ctx.moveTo(x+18,y-18);ctx.lineTo(x+22-ear-earMod,y-45);ctx.lineTo(x+4,y-22);ctx.fill();',
    "  ctx.fillStyle='#ffb6c1';",
    '  ctx.beginPath();ctx.moveTo(x-17,y-18);ctx.lineTo(x-20+ear*0.7+earMod*0.7,y-40);ctx.lineTo(x-6,y-21);ctx.fill();',
    '  ctx.beginPath();ctx.moveTo(x+17,y-18);ctx.lineTo(x+20-ear*0.7-earMod*0.7,y-40);ctx.lineTo(x+6,y-21);ctx.fill();',
    '',
    '  // 头',
    '  ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y-8,16,0,Math.PI*2);ctx.fill();',
    '',
    '  // 胡须',
    "  ctx.strokeStyle='#ffffffaa';ctx.lineWidth=0.8;",
    '  [-1,1].forEach(side=>{',
    '    const sx=x+side*10,sy=y-6;',
    '    ctx.beginPath();ctx.moveTo(sx,sy);ctx.lineTo(sx+side*18,sy-4);ctx.stroke();',
    '    ctx.beginPath();ctx.moveTo(sx,sy+1);ctx.lineTo(sx+side*18,sy+2);ctx.stroke();',
    '    ctx.beginPath();ctx.moveTo(sx,sy+2);ctx.lineTo(sx+side*16,sy+7);ctx.stroke();',
    '  });',
    '',
    '  // 眼睛 — 情绪影响',
    '  if(isSleepy){',
    '    [-7,7].forEach(ex=>{',
    "      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x+ex,y-12,5,2.5,0,0,Math.PI*2);ctx.fill();",
    "      ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+ex+eyeLookX*0.3,y-12+eyeLookY*0.3,2,0,Math.PI*2);ctx.fill();",
    '    });',
    '  }else{',
    '    const eyeSize=5.5*mc.eyeMod;',
    '    [-7,7].forEach(ex=>{',
    "      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+ex,y-12,Math.max(3,eyeSize),0,Math.PI*2);ctx.fill();",
    "      ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+ex+eyeLookX*mc.eyeMod,y-12+eyeLookY*mc.eyeMod,Math.max(1.5,3*mc.eyeMod),0,Math.PI*2);ctx.fill();",
    "      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+ex+eyeLookX*mc.eyeMod-1,y-12+eyeLookY*mc.eyeMod-1,Math.max(0.6,1*mc.eyeMod),0,Math.PI*2);ctx.fill();",
    '    });',
    '  }',
    '',
    '  // 鼻头 + 嘴',
    "  ctx.fillStyle='#ff9999';ctx.beginPath();ctx.moveTo(x,y-6);ctx.lineTo(x-2,y-3);ctx.lineTo(x+2,y-3);ctx.closePath();ctx.fill();",
    '  ctx.strokeStyle=darken(c,30);ctx.lineWidth=1;',
    '  ctx.beginPath();ctx.moveTo(x,y-4);ctx.lineTo(x-2,y-1);ctx.moveTo(x,y-4);ctx.lineTo(x+2,y-1);ctx.stroke();',
    '',
    '  // 前爪 — 踩奶动画',
    "  if(actionState==='knead'){",
    '    const pawY=Math.sin(t*6)*4;',
    '    ctx.fillStyle=c;',
    '    ctx.beginPath();ctx.ellipse(x-8,y+18+pawY,6,4,0,0,Math.PI*2);ctx.fill();',
    '    ctx.beginPath();ctx.ellipse(x+8,y+18-pawY,6,4,0,0,Math.PI*2);ctx.fill();',
    '  }',
    '',
    '  drawCrown(x,y-40,c);',
    '}',
])
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Cat drawing enhanced')

# ===== 6. GameLoop =====
old = "  // 根据动作状态添加动态效果\n  if(actionState==='wiggle'){\n    targetX=Math.sin(Date.now()/300)*10;\n  }\n  if(actionState==='jump'&&petOffsetY<-10){\n    targetY=0;\n  }"
assert old in content, 'GAMELOOP not found'
new = "  // 动态效果\n  if(actionState==='wiggle'){ targetX=Math.sin(Date.now()/300)*10; }\n  if(actionState==='chase_tail'){ targetX=Math.sin(Date.now()/200)*15; targetY=Math.sin(Date.now()/300)*10; }\n  if(actionState==='knead'){ targetX=Math.sin(Date.now()/400)*4; }\n  if(actionState==='jump'&&petOffsetY<-10){ targetY=0; }"
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] GameLoop')

# ===== 7. Mouse chase =====
old = "document.addEventListener('mousemove',e=>{mouseX=e.clientX;mouseY=e.clientY;});"
assert old in content, 'MOUSE not found'
new = """document.addEventListener('mousemove',e=>{
  mouseX=e.clientX;mouseY=e.clientY;
  if(pet&&pet.mood==='playful'&&!isSleeping&&Math.random()<0.15){
    const r2=canvas.getBoundingClientRect();
    const relX=(e.clientX-r2.left-r2.width/2)/3;
    const relY=(e.clientY-r2.top-r2.height/2)/3;
    targetX=Math.max(-50,Math.min(50,relX));
    targetY=Math.max(-25,Math.min(25,relY));
  }
});"""
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Mouse chase')

# ===== 8. Welcome + console =====
content = content.replace(
    "bubble('你好呀！我会一直陪着你的～ 🐉✨',3500);",
    "bubble('喵～你好呀！我会一直陪着你的～ 🐱✨',3500);"
); changes += 1; print(f'[{changes}] Welcome')
content = content.replace(
    "console.log('🐉 Buddy Pet 已就绪！');",
    "console.log('🐱 Buddy Pet 已就绪！（情绪系统 v2）');"
); changes += 1; print(f'[{changes}] Console')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'\nAll {changes} changes applied!')
