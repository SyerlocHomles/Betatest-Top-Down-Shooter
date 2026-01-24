(function() {
const c=document.getElementById('g'),ctx=c.getContext('2d');
const uScore=document.getElementById('ui-score'),uHP=document.getElementById('ui-hp'),
uBar=document.getElementById('skill-bar'),uStage=document.getElementById('ui-stage');
const energyUI=document.getElementById('energy-status'),energyTimer=document.getElementById('energy-timer');
const tripleUI=document.getElementById('triple-status'),tripleCount=document.getElementById('triple-count');
const rBtn=document.getElementById('restart-btn');
const transEl=document.getElementById('stage-transition');
const transText=document.getElementById('transition-text');
const transSub=document.getElementById('transition-subtitle');

// Mengambil data dari variabel heroStats yang dikirim Python
const pData = typeof heroStats !== 'undefined' ? heroStats : {hp:3, spd:6.5, col:'#ffa500', type:'roket'};

let score=0,health=pData.hp,gameOver=false;
let keys={},bullets=[],enemies=[],particles=[],bosses=[],items=[];
let chapter=1,stage=1,stageState='combat',transTimer=0,lastBossScore=0;

let pl={x:300,y:200,r:12,speed:pData.spd,baseSpeed:pData.spd,
type:pData.type,color:pData.col,sT:0,sM:100,shield:false,
dmg:5,inv:0,kills:0,tripleShot:0,energyTime:0};

function spawnExplosion(x,y,col,ct=15){
for(let i=0;i<ct;i++)particles.push({
x,y,vx:(Math.random()-.5)*15,vy:(Math.random()-.5)*15,
life:Math.random()*30+10,c:col
});
}

function spawnItem(x,y){
let r=Math.random();
if(r<.3){
let t=Math.random();
if(t<.3)items.push({x,y,type:'medkit',c:'#f44',label:'✚'});
else if(t<.6)items.push({x,y,type:'energy',c:'#4ef',label:'⚡'});
else items.push({x,y,type:'triple',c:'#ff4',label:'Ⅲ'});
}
}

function triggerRespawn(){
health--;
spawnExplosion(pl.x,pl.y,"#fff");
pl.inv=180;
if(health<=0){gameOver=true;rBtn.style.display="block"}
}

function drawHex(x,y,sz,col){
ctx.fillStyle=col;
ctx.beginPath();
for(let i=0;i<6;i++)ctx.lineTo(x+sz*Math.cos(i*Math.PI/3),y+sz*Math.sin(i*Math.PI/3));
ctx.closePath();
ctx.fill();
}

function showTrans(title,sub,dur=180){
transEl.style.display='block';
transText.innerText=title;
transSub.innerText=sub;
transTimer=dur;
pl.inv=dur;
enemies=[];
bullets=bullets.filter(b=>b.p);
}

function spawnMiniBoss(enh=false){
let hp=enh?1200:800;
let sp=enh?1.3:1;
bosses.push({
x:300,y:-50,s:35,hp,mH:hp,c:'#9b59b6',sp,
shieldActive:false,shieldTimer:0,nextShield:600,
fireRate:enh?30:60,fireTimer:0,
dashTimer:enh?600:0,dashCD:enh?600:0,
type:'mini',variant:enh?'enhanced':'basic'
});
}

function spawnMainBoss(){
bosses.push({
x:300,y:-50,s:60,hp:5000,mH:5000,c:'#8B0000',sp:.8,
shieldActive:false,shieldTimer:0,nextShield:800,
fireRate:40,fireTimer:0,
summonTimer:200,summonCD:500,
type:'main',phase:1,glow:0
});
}

function advanceStage(){
stage=1; chapter++; stageState='combat'; lastBossScore=0;
health=Math.min(health+3,10);
spawnItem(300,200);
}

window.onkeydown=e=>{keys[e.code]=true;if(e.code==='Space')useUlt()};
window.onkeyup=e=>keys[e.code]=false;
let mx=0,my=0;
c.onmousemove=e=>{const r=c.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top};

function useUlt(ft=null){
let t=ft||pl.type;
if(!ft&&(pl.sT<pl.sM||gameOver))return;
if(!ft){pl.sT=0;pl.kills=0}

if(t==='tank'){
pl.shield=true;
let sh=0;
let iv=setInterval(()=>{
for(let a=0;a<Math.PI*2;a+=Math.PI/6)fire(pl.x,pl.y,a,false,true,80);
sh++; if(sh>=3)clearInterval(iv);
},500);
setTimeout(()=>pl.shield=false,10000);
}
else if(t==='scout'){
if(bosses.length>0){
let b=bosses[0];
let ab=Math.atan2(b.y-pl.y,b.x-pl.x);
pl.x=b.x+Math.cos(ab)*40; pl.y=b.y+Math.sin(ab)*40;
pl.inv=120; if(!b.shieldActive)b.hp-=400;
spawnExplosion(b.x,b.y,"#0f0",40);
}else{
let a=Math.atan2(my-pl.y,mx-pl.x);
pl.x+=Math.cos(a)*150; pl.y+=Math.sin(a)*150;
pl.inv=60; spawnExplosion(pl.x,pl.y,pl.color);
}
}
else if(t==='bomber'){
let rad=350; spawnExplosion(pl.x,pl.y,"#ff0",150);
enemies.forEach(e=>{if(Math.hypot(e.x-pl.x,e.y-pl.y)<rad)e.hp-=500});
bosses.forEach(b=>{if(Math.hypot(b.x-pl.x,b.y-pl.y)<rad&&!b.shieldActive)b.hp-=800});
}
else if(t==='roket'){
for(let i=0;i<6;i++){
let sa=(Math.PI*2/6)*i;
bullets.push({x:pl.x,y:pl.y,vx:Math.cos(sa)*5,vy:Math.sin(sa)*5,r:10,c:'#fa0',p:true,rk:true,target:null,life:300,d:150});
}
}
else if(t==='assault'){
for(let i=0;i<15;i++)setTimeout(()=>fire(pl.x,pl.y,Math.atan2(my-pl.y,mx-pl.x),true,true,40),i*80);
}
else if(t==='joker'){
const pool=['tank','scout','bomber','roket','assault'];
useUlt(pool[Math.floor(Math.random()*pool.length)]);
}
}

c.onmousedown=()=>{
if(gameOver)return;
let a=Math.atan2(my-pl.y,mx-pl.x);
fire(pl.x,pl.y,a,false,true,pl.dmg);
if(pl.tripleShot>0){
fire(pl.x,pl.y,a+.2,false,true,pl.dmg);
fire(pl.x,pl.y,a-.2,false,true,pl.dmg);
pl.tripleShot--;
}
};

function fire(x,y,a,isSp,isPl,dmg){
let ox=x+Math.cos(a)*20,oy=y+Math.sin(a)*20;
bullets.push({
x:ox,y:oy,vx:Math.cos(a)*(isSp?18:15),vy:Math.sin(a)*(isSp?18:15),
r:isSp?8:4,c:isPl?pl.color:'#F00',p:isPl,rk:false,d:dmg||pl.dmg
});
}

function update(){
if(gameOver)return;

if(stageState==='transition'){
transTimer--;
if(transTimer<=0){transEl.style.display='none'; stageState='combat'; if(stage===5)spawnMainBoss();}
return;
}

if(pl.energyTime>0){
pl.energyTime--; pl.speed=pl.baseSpeed*1.5;
energyUI.style.display="block"; energyTimer.innerText=(pl.energyTime/60).toFixed(1);
}else{
pl.speed=pl.baseSpeed; energyUI.style.display="none";
}

if(pl.tripleShot>0){tripleUI.style.display="block"; tripleCount.innerText=pl.tripleShot;}
else tripleUI.style.display="none";

let s=pl.speed,nx=pl.x,ny=pl.y;
if(keys['KeyW'])ny-=s; if(keys['KeyS'])ny+=s;
if(keys['KeyA'])nx-=s; if(keys['KeyD'])nx+=s;
if(nx>pl.r&&nx<600-pl.r)pl.x=nx; if(ny>pl.r&&ny<400-pl.r)pl.y=ny;

// Logic Recharge Ultimate Sesuai Modul Asli
if(pl.type==='roket'&&bosses.length>0)pl.sT=Math.min(100,pl.sT+(100/(5*60)));
else if(pl.type==='roket')pl.sT=(pl.kills/8)*100;
else if(pl.type==='tank'||pl.type==='bomber')pl.sT=Math.min(100,pl.sT+(100/(15*60)));
else if(pl.type==='scout')pl.sT=Math.min(100,pl.sT+(bosses.length>0?100/(6*60):100/(10*60)));
else if(pl.type==='joker')pl.sT=(pl.kills/15)*100;
else if(pl.type==='assault')pl.sT=Math.min(100,pl.sT+.1);
uBar.style.width=Math.min(100,pl.sT)+'%';

for(let i=items.length-1;i>=0;i--){
let it=items[i];
if(Math.hypot(pl.x-it.x,pl.y-it.y)<pl.r+15){
if(it.type==='medkit')health=Math.min(health+1,10);
else if(it.type==='energy')pl.energyTime+=300;
else if(it.type==='triple')pl.tripleShot+=20;
items.splice(i,1);
}
}

bullets=bullets.filter(b=>{
if(b.rk){
if(!b.target||b.target.hp<=0){
let cand=[...bosses,...enemies], mD=Infinity;
cand.forEach(e=>{let d=Math.hypot(e.x-b.x,e.y-b.y); if(d<mD){mD=d;b.target=e}});
}
if(b.target){
let a=Math.atan2(b.target.y-b.y,b.target.x-b.x);
b.vx+=Math.cos(a)*1.2; b.vy+=Math.sin(a)*1.2;
}
let sp=Math.hypot(b.vx,b.vy);
if(sp>10){b.vx=(b.vx/sp)*10; b.vy=(b.vy/sp)*10}
}
b.x+=b.vx; b.y+=b.vy;

if(b.p){
for(let i=bosses.length-1;i>=0;i--){
let boss=bosses[i];
if(Math.hypot(boss.x-b.x,boss.y-b.y)<boss.s+b.r){
if(!boss.shieldActive)boss.hp-=b.d;
spawnExplosion(b.x,b.y,'#fff',5); return false;
}
}
for(let i=enemies.length-1;i>=0;i--){
let e=enemies[i];
if(Math.hypot(e.x-b.x,e.y-b.y)<e.s/2+b.r){
e.hp-=b.d;
if(e.hp<=0){pl.kills++; score+=e.val; spawnExplosion(e.x,e.y,e.c,15); spawnItem(e.x,e.y); enemies.splice(i,1);}
return false;
}
}
} else {
if(Math.hypot(pl.x-b.x,pl.y-b.y)<pl.r+b.r && pl.inv<=0 && !pl.shield) triggerRespawn();
}
return b.x>-100&&b.x<700&&b.y>-100&&b.y<500;
});

for(let i=bosses.length-1;i>=0;i--){
let boss=bosses[i];
let a=Math.atan2(pl.y-boss.y,pl.x-boss.x);
boss.x+=Math.cos(a)*boss.sp; boss.y+=Math.sin(a)*boss.sp;
if(Math.hypot(pl.x-boss.x,pl.y-boss.y)<pl.r+boss.s && pl.inv<=0 && !pl.shield) triggerRespawn();

boss.nextShield--;
if(boss.nextShield<=0 && !boss.shieldActive){ boss.shieldActive=true; boss.shieldTimer=180; }
if(boss.shieldActive){
boss.shieldTimer--; boss.hp=Math.min(boss.mH, boss.hp+0.5);
if(boss.shieldTimer<=0){ boss.shieldActive=false; boss.nextShield=600+Math.random()*200; }
}

boss.fireTimer++;
if(boss.fireTimer>=boss.fireRate){
boss.fireTimer=0;
if(boss.variant==='enhanced'){
for(let j=0;j<3;j++)fire(boss.x,boss.y,a+(j-1)*.15,false,false,1);
}else fire(boss.x,boss.y,a,false,false,1);
}

if(boss.type==='main'){
boss.summonTimer--;
if(boss.summonTimer<=0){
let sCt=boss.phase===2?2:1;
for(let k=0;k<sCt;k++){
let ang=(Math.PI*2/sCt)*k;
bosses.push({x:boss.x+Math.cos(ang)*80,y:boss.y+Math.sin(ang)*80,s:30,hp:600,mH:600,c:'rgba(155,89,182,0.7)',sp:1.1,shieldActive:false,shieldTimer:0,nextShield:999999,fireRate:80,fireTimer:0,type:'summon',variant:'summoned'});
}
boss.summonTimer=boss.summonCD;
}
if(boss.hp<=boss.mH*.5&&boss.phase===1){boss.phase=2; boss.sp=1.2; boss.fireRate=25; boss.summonCD=400; spawnExplosion(boss.x,boss.y,'#FD7',50);}
boss.glow=(boss.glow+.05)%(Math.PI*2);
}

if(boss.hp<=0){
score += boss.type==='main'?1500:500;
spawnExplosion(boss.x,boss.y,boss.c,boss.type==='main'?100:50);
bosses.splice(i,1);
if(bosses.length===0&&!gameOver&&boss.type==='main'){showTrans('BIG BOSS DEFEATED!','Advancing to next chapter!',180); setTimeout(advanceStage,3000);}
}
}

if(pl.inv>0)pl.inv--;

// Logic Stage Progresi Sesuai Modul Asli
let currentStage=Math.min(Math.floor(score/1000)+1,5);
if(currentStage!==stage&&bosses.length===0&&stageState==='combat')stage=currentStage;

if(score>=1000&&score<5000&&score%1000<10&&bosses.length===0&&stageState==='combat'&&!gameOver&&score>lastBossScore){
lastBossScore=score; spawnMiniBoss(stage>=3);
}

if(score>=5000&&bosses.length===0&&stageState==='combat'&&!gameOver&&lastBossScore<5000){
lastBossScore=5000; stage=5; showTrans('⚠️ STAGE 1-5 ⚠️','BIG BOSS INCOMING!',240); stageState='transition';
}

if(bosses.length===0&&!gameOver&&enemies.length<8){
let rand=Math.random(), eType;
if(stage===1) eType=rand<.33?{c:'#2e7',hp:15,val:15,sp:.6,s:30}:(rand<.66?{c:'#95b',hp:5,val:10,sp:1.8,s:15}:{c:'#e74',hp:5,val:5,sp:1.2,s:22});
else if(stage===2) eType=rand<.66?(rand<.33?{c:'#2e7',hp:15,val:15,sp:.6,s:30}:{c:'#95b',hp:5,val:10,sp:1.8,s:15}):{c:'#e74',hp:8,val:8,sp:1.4,s:22,canShoot:true,shootCD:120,shootTimer:0};
else if(stage>=3) eType={c:'#2e7',hp:25,val:25,sp:.9,s:30,canShoot:true,shootCD:90,shootTimer:0};
// ... (Logika eType lainnya dari modul asli)

let ex,ey,dist; do{ex=Math.random()*600; ey=Math.random()*400; dist=Math.hypot(ex-pl.x,ey-pl.y);}while(dist<200);
enemies.push({x:ex,y:ey,s:eType.s,sp:eType.sp,hp:eType.hp,c:eType.c,val:eType.val,canShoot:eType.canShoot,shootCD:eType.shootCD,shootTimer:0});
}

enemies.forEach(e => {
let a=Math.atan2(pl.y-e.y,pl.x-e.x);
e.x+=Math.cos(a)*e.sp; e.y+=Math.sin(a)*e.sp;
if(e.canShoot){e.shootTimer++; if(e.shootTimer>=e.shootCD){e.shootTimer=0; fire(e.x,e.y,a,false,false,1);}}
if(Math.hypot(pl.x-e.x,pl.y-e.y)<pl.r+e.s/2 && pl.inv<=0 && !pl.shield) triggerRespawn();
});

particles.forEach((pt,i)=>{ pt.x+=pt.vx; pt.y+=pt.vy; pt.life--; if(pt.life<=0)particles.splice(i,1); });

uScore.innerText="Skor: "+score;
uHP.innerText="❤️".repeat(Math.max(0,health));
uStage.innerText=bosses.length>0?(bosses[0].type==='main'?"⚠️ BOSS BATTLE! ⚠️":`STAGE: ${chapter}-${stage}`):`STAGE: ${chapter}-${stage}`;
}

function draw(){
ctx.clearRect(0,0,600,400);
items.forEach(it=>{ctx.fillStyle=it.c; ctx.beginPath(); ctx.arc(it.x,it.y,10,0,7); ctx.fill(); ctx.fillStyle='white'; ctx.font='bold 12px Arial'; ctx.textAlign='center'; ctx.fillText(it.label,it.x,it.y+4);});
bullets.forEach(b=>{
if(b.rk){
let ang=Math.atan2(b.vy,b.vx); ctx.save(); ctx.translate(b.x,b.y); ctx.rotate(ang); ctx.fillStyle=b.c; ctx.beginPath(); ctx.moveTo(b.r,0); ctx.lineTo(-b.r,-b.r/1.5); ctx.lineTo(-b.r/2,0); ctx.lineTo(-b.r,b.r/1.5); ctx.closePath(); ctx.fill(); ctx.restore();
}else{ctx.fillStyle=b.c; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,7); ctx.fill();}
});
enemies.forEach(e=>{ctx.fillStyle=e.c; ctx.fillRect(e.x-e.s/2,e.y-e.s/2,e.s,e.s);});
bosses.forEach(boss=>{
if(boss.shieldActive){ctx.strokeStyle='#fd7'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(boss.x,boss.y,boss.s+10,0,7); ctx.stroke();}
drawHex(boss.x,boss.y,boss.s,boss.c);
ctx.fillStyle='#333'; ctx.fillRect(boss.x-40,boss.y-65,80,8); ctx.fillStyle='#f00'; ctx.fillRect(boss.x-40,boss.y-65,(boss.hp/boss.mH)*80,8);
});
particles.forEach(pt=>{ctx.fillStyle=pt.c; ctx.globalAlpha=pt.life/25; ctx.fillRect(pt.x,pt.y,3,3); ctx.globalAlpha=1;});
if(pl.inv<=0||(pl.inv%10<5)){
let ang=Math.atan2(my-pl.y,mx-pl.x); ctx.save(); ctx.translate(pl.x,pl.y); ctx.rotate(ang); ctx.fillStyle=pl.color; ctx.beginPath(); ctx.moveTo(18,0); ctx.lineTo(-12,-12); ctx.lineTo(-7,0); ctx.lineTo(-12,12); ctx.closePath(); ctx.fill(); ctx.restore();
if(pl.shield){ctx.strokeStyle='#0ef'; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(pl.x,pl.y,25,0,7); ctx.stroke();}
}
if(gameOver){ctx.fillStyle='white'; ctx.font='40px Arial'; ctx.textAlign='center'; ctx.fillText("GAME OVER",300,200);}
}

function loop(){update();draw();if(!gameOver)requestAnimationFrame(loop)}
loop();
})();
