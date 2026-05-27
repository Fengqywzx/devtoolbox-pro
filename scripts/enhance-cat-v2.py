"""v2: More dynamics — blink, purr, zoomies, paw pads, faster actions, more dialogue."""
path = r'C:\Users\18612\Desktop\万子轩的项目\buddy-pet.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

changes = 0

# ===== 1. Add blinking state variable =====
old = "let isSleeping=false;"
new = "let isSleeping=false;\nlet blinkTimer=0, blinkState=0; // 眨眼状态"
assert old in content, 'isSleeping not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Blink state added')

# ===== 2. Add purr effect variable =====
old = "let eyeLookX=0, eyeLookY=0;"
new = "let eyeLookX=0, eyeLookY=0;\nlet purrIntensity=0; // 呼噜强度 0-1"
assert old in content, 'eyeLookX not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Purr state added')

# ===== 3. Make actions faster (reduce interval) =====
old = "    autoActionInterval=200+Math.floor(Math.random()*400);"
new = "    autoActionInterval=120+Math.floor(Math.random()*250); // 更快：2-6秒换动作"
assert old in content, 'autoActionInterval not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Action interval reduced')

# ===== 4. Add more cat-specific actions in behavior =====
old = "    }else if(r<0.42&&isCat){\n      targetY=-25;\n      actionState='stretch_cat';\n      setTimeout(()=>{targetY=0;},500);\n    }else if(r<0.50){"
new = "    }else if(r<0.43&&isCat&&pet.mood==='playful'){\n      // zoomies! 疯狂乱跑\n      targetX=(Math.random()-0.5)*80;\n      targetY=(Math.random()-0.5)*40;\n      actionState='zoomies';\n      setTimeout(()=>{targetX=(Math.random()-0.5)*60;},200);\n      setTimeout(()=>{targetX=0;targetY=0;},500);\n      if(Math.random()<0.5) bubble(['喵呜！！！','冲冲冲！','我很快！','嗖——'][Math.floor(Math.random()*4)],1500);\n    }else if(r<0.45&&isCat){\n      targetY=-25;\n      actionState='stretch_cat';\n      setTimeout(()=>{targetY=0;},500);\n    }else if(r<0.50){"
assert old in content, 'stretch_cat action not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Zoomies action added')

# ===== 5. Add eye blinking in drawFrame =====
old = "  ctx.save();"
new = "  ctx.save();\n\n  // 眨眼逻辑\n  blinkTimer++;\n  if(blinkTimer>60+Math.random()*120){ blinkState=1; blinkTimer=0; }\n  if(blinkState>0){ blinkState+=0.15; if(blinkState>4) blinkState=0; }"
assert old in content, 'ctx.save() not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Blink logic in drawFrame')

# ===== 6. Enhance cat drawing with paw pads, purr, blink =====
old = "  // 前爪 — 踩奶动画\n  if(actionState==='knead'){\n    const pawY=Math.sin(t*6)*4;\n    ctx.fillStyle=c;\n    ctx.beginPath();ctx.ellipse(x-8,y+18+pawY,6,4,0,0,Math.PI*2);ctx.fill();\n    ctx.beginPath();ctx.ellipse(x+8,y+18-pawY,6,4,0,0,Math.PI*2);ctx.fill();\n  }\n\n  drawCrown(x,y-40,c);\n}"

new = "  // 前爪 — 踩奶动画\n  if(actionState==='knead'){\n    const pawY=Math.sin(t*6)*4;\n    ctx.fillStyle=c;\n    ctx.beginPath();ctx.ellipse(x-8,y+18+pawY,6,4,0,0,Math.PI*2);ctx.fill();\n    ctx.beginPath();ctx.ellipse(x+8,y+18-pawY,6,4,0,0,Math.PI*2);ctx.fill();\n    // 粉色肉垫\n    ctx.fillStyle='#ffb6c1';\n    ctx.beginPath();ctx.arc(x-9,y+19+pawY,2,0,Math.PI*2);ctx.fill();\n    ctx.beginPath();ctx.arc(x+7,y+19-pawY,2,0,Math.PI*2);ctx.fill();\n  }\n\n  // 呼噜特效 — 身体微微震动\n  if(actionState==='groom'||pet.mood==='content'){\n    purrIntensity=Math.min(1,purrIntensity+0.02);\n  }else{\n    purrIntensity=Math.max(0,purrIntensity-0.03);\n  }\n  if(purrIntensity>0.3){\n    const purrShake=Math.sin(t*12)*purrIntensity*1.5;\n    ctx.fillStyle='#ffb6c122';\n    ctx.beginPath();ctx.arc(x+purrShake,y-30,20+purrIntensity*4,0,Math.PI*2);ctx.fill();\n  }\n\n  // 尾巴尖 — 稍深色\n  ctx.fillStyle=darken(c,15);\n  ctx.beginPath();ctx.arc(x+48+Math.sin(t*3)*8,y-28+Math.sin(t*3)*8,4,0,Math.PI*2);ctx.fill();\n\n  drawCrown(x,y-40,c);\n}"

assert old in content, 'drawCrown in drawCat not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Paw pads + purr + tail tip')

# ===== 7. Enhance eyes with blink =====
old = "  // 眼睛 — 情绪影响\n  if(isSleepy){\n    [-7,7].forEach(ex=>{\n      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x+ex,y-12,5,2.5,0,0,Math.PI*2);ctx.fill();\n      ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+ex+eyeLookX*0.3,y-12+eyeLookY*0.3,2,0,Math.PI*2);ctx.fill();\n    });\n  }else{"

new = "  // 眼睛 — 情绪影响 + 眨眼\n  const blinkClose=blinkState>0.5&&blinkState<2.5?Math.sin((blinkState-0.5)*Math.PI):1;\n  if(isSleepy){\n    [-7,7].forEach(ex=>{\n      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x+ex,y-12,5,2.5*blinkClose,0,0,Math.PI*2);ctx.fill();\n      if(blinkClose>0.3){\n        ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+ex+eyeLookX*0.3,y-12+eyeLookY*0.3,2,0,Math.PI*2);ctx.fill();\n      }\n    });\n  }else{"

assert old in content, 'sleepy eyes block not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Blink in sleepy eyes')

# ===== 8. Normal eyes also blink =====
old = "    const eyeSize=5.5*mc.eyeMod;\n    [-7,7].forEach(ex=>{\n      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+ex,y-12,Math.max(3,eyeSize),0,Math.PI*2);ctx.fill();\n      ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+ex+eyeLookX*mc.eyeMod,y-12+eyeLookY*mc.eyeMod,Math.max(1.5,3*mc.eyeMod),0,Math.PI*2);ctx.fill();\n      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+ex+eyeLookX*mc.eyeMod-1,y-12+eyeLookY*mc.eyeMod-1,Math.max(0.6,1*mc.eyeMod),0,Math.PI*2);ctx.fill();\n    });"

new = "    const eyeSize=5.5*mc.eyeMod;\n    [-7,7].forEach(ex=>{\n      const eyeH=Math.max(1,eyeSize*blinkClose);\n      ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(x+ex,y-12,Math.max(3,eyeSize),eyeH,0,0,Math.PI*2);ctx.fill();\n      if(blinkClose>0.3){\n        ctx.fillStyle='#111';ctx.beginPath();ctx.arc(x+ex+eyeLookX*mc.eyeMod,y-12+eyeLookY*mc.eyeMod,Math.max(1.5,3*mc.eyeMod),0,Math.PI*2);ctx.fill();\n        ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(x+ex+eyeLookX*mc.eyeMod-1,y-12+eyeLookY*mc.eyeMod-1,Math.max(0.6,1*mc.eyeMod),0,Math.PI*2);ctx.fill();\n      }\n    });"

assert old in content, 'normal eyes block not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Blink in normal eyes')

# ===== 9. More frequent dialogue (auto bubble) =====
old = "// 持续飘爱心\nfunction autoHearts(){\n  heartTimer++;\n  if(heartTimer>90&&!isSleeping){\n    heartTimer=0;\n    const r=canvas.getBoundingClientRect();\n    const cx2=r.left+r.width/2+petOffsetX;\n    const cy2=r.top+r.height/2-20+petOffsetY;\n    if(Math.random()<0.3){\n      const h=document.createElement('span');\n      h.className='particle';h.textContent=['❤️','💕','💖','✨','💫'][Math.floor(Math.random()*5)];"

new = "// 持续飘爱心 + 随机猫语\nfunction autoHearts(){\n  heartTimer++;\n  if(heartTimer>90&&!isSleeping){\n    heartTimer=0;\n    const r=canvas.getBoundingClientRect();\n    const cx2=r.left+r.width/2+petOffsetX;\n    const cy2=r.top+r.height/2-20+petOffsetY;\n    // 随机猫语\n    if(Math.random()<0.08&&pet.speciesKey==='cat'){\n      const casual=['喵～','喵呜','呼噜呼噜...','嗯？','咪～','喵！','呜...好无聊','陪我玩嘛','你最好啦','盯着你看...'][Math.floor(Math.random()*10)];\n      bubble(casual,1800);\n    }\n    if(Math.random()<0.3){"

assert old in content, 'autoHearts not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Random cat dialogue in autoHearts')

# ===== 10. Add zoomies gameLoop =====
old = "  if(actionState==='knead'){ targetX=Math.sin(Date.now()/400)*4; }"
new = "  if(actionState==='knead'){ targetX=Math.sin(Date.now()/400)*4; }\n  if(actionState==='zoomies'){ targetX=Math.sin(Date.now()/150)*30; targetY=Math.sin(Date.now()/200)*15; }"
assert old in content, 'knead gameloop not found'
content = content.replace(old, new, 1)
changes += 1; print(f'[{changes}] Zoomies gameLoop')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print(f'\nAll {changes} v2 changes applied!')
