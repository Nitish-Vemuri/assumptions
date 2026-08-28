const slider = document.getElementById('stateSlider');
const stateLabel = document.getElementById('stateLabel');
const pressureStat = document.getElementById('pressureStat');
const temperatureStat = document.getElementById('temperatureStat');
const volumeStat = document.getElementById('volumeStat');
const statePill = document.getElementById('statePill');
const result = document.getElementById('result');
const questionContext = document.getElementById('questionContext');
const stage = document.getElementById('stage');
const p1Input = document.getElementById('p1Input');
const t1Input = document.getElementById('t1Input');
const t2Input = document.getElementById('t2Input');
const volumeInput = document.getElementById('volumeInput');
const playBtn = document.getElementById('playBtn');
const stepBtn = document.getElementById('stepBtn');
const resetBtn = document.getElementById('resetBtn');
const ptCanvas = document.getElementById('ptCanvas');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

const viewer = document.getElementById('viewer');
const fallbackGas = document.getElementById('fallbackGas');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfff8ed);
scene.fog = new THREE.Fog(0xfff8ed, 14, 30);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
viewer.appendChild(renderer.domElement);
const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, .1, 100);
camera.position.set(7.4, 4.2, 9.2);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 6; controls.maxDistance = 18; controls.target.set(0, 0, 0);
scene.add(new THREE.AmbientLight(0xffffff, 1.15));
const key = new THREE.DirectionalLight(0xffffff, 1.45); key.position.set(6, 7, 8); scene.add(key);
const fill = new THREE.DirectionalLight(0xbad7ff, .55); fill.position.set(-6, -3, -5); scene.add(fill);

const tank = new THREE.Group(); scene.add(tank);
const shellMaterial = new THREE.MeshPhysicalMaterial({ color:0x6f9fb5, transparent:true, opacity:.32, side:THREE.DoubleSide, roughness:.28, metalness:.14 });
const rimMaterial = new THREE.MeshStandardMaterial({ color:0x365569, roughness:.38, metalness:.5 });
const gasMaterial = new THREE.MeshPhysicalMaterial({ color:0x42b8c5, transparent:true, opacity:.42, roughness:.15, metalness:.08 });
const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.85,2.85,6.5,64,1,true),shellMaterial); tank.add(shell);
const top = new THREE.Mesh(new THREE.CylinderGeometry(2.87,2.87,.24,64),rimMaterial); top.position.y=3.25; tank.add(top);
const bottom = new THREE.Mesh(new THREE.CylinderGeometry(2.87,2.87,.24,64),rimMaterial); bottom.position.y=-3.25; tank.add(bottom);
const gas = new THREE.Mesh(new THREE.CylinderGeometry(2.35,2.35,5.85,64),gasMaterial); gas.position.y=-.18; tank.add(gas);
const gauge = new THREE.Mesh(new THREE.TorusGeometry(.67,.11,16,48),new THREE.MeshStandardMaterial({color:0x334155,metalness:.55,roughness:.28})); gauge.position.set(3.25,1.5,0); gauge.rotation.y=Math.PI/2; scene.add(gauge);
const gaugeNeedle = new THREE.Mesh(new THREE.BoxGeometry(.08,.62,.08),new THREE.MeshStandardMaterial({color:0xd9472f})); gaugeNeedle.position.set(3.27,1.5,0); gaugeNeedle.rotation.z=-.65; scene.add(gaugeNeedle);
const heatArrow = new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(-5.1,.35,0),2.05,0xf59e0b,.7,.35); scene.add(heatArrow);
const workCross = new THREE.Group();
const crossMaterial = new THREE.LineBasicMaterial({color:0x68737c,linewidth:2});
for (const rotation of [Math.PI/4,-Math.PI/4]) { const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-.55,0,0),new THREE.Vector3(.55,0,0)]),crossMaterial); line.rotation.z=rotation; line.position.set(0,-4.1,0); workCross.add(line); } scene.add(workCross);

const particles = [];
const particleGeometry = new THREE.SphereGeometry(.075,10,10);
for (let i=0;i<52;i++) {
  const particle = new THREE.Mesh(particleGeometry,new THREE.MeshStandardMaterial({color:0xd9fbff,emissive:0x1b7e89,emissiveIntensity:.22}));
  let x, z; do { x=(Math.random()-.5)*4.2; z=(Math.random()-.5)*4.2; } while (x*x+z*z>4.25);
  particle.position.set(x,(Math.random()-.5)*5.3,z);
  particle.userData.velocity=new THREE.Vector3((Math.random()-.5)*.035,(Math.random()-.5)*.035,(Math.random()-.5)*.035);
  tank.add(particle); particles.push(particle);
}

let model = { P1:100, T1:300, P2:200, T2:600, V:.2, target:'P2', source:'' };
let running=false, lastTime=null;
const finite=(value,fallback)=>Number.isFinite(Number(value))&&Number(value)>0?Number(value):fallback;
const message=(role,text)=>{ const node=document.createElement('div'); node.className=`message ${role}`; node.textContent=text; chatWindow.appendChild(node); chatWindow.scrollTop=chatWindow.scrollHeight; };

const syncInputs=()=>{ p1Input.value=model.P1; t1Input.value=model.T1; t2Input.value=model.T2; volumeInput.value=model.V||''; };
const currentState=()=>{ const progress=Number(slider.value); return { progress, P:model.P1+(model.P2-model.P1)*progress, T:model.T1+(model.T2-model.T1)*progress }; };
const targetText=()=>{ const values={P1:[model.P1,'kPa'],P2:[model.P2,'kPa'],T1:[model.T1,'K'],T2:[model.T2,'K'],W:[0,'kJ']}; const [value,unit]=values[model.target]||values.P2; const label=model.target==='W'?'Boundary work':model.target; return `<strong>Requested ${label}:</strong> ${Number(value).toFixed(unit==='kPa'?2:unit==='K'?1:0)} ${unit}.<br><span style="color:#5e5e63">Rigid boundary: V = constant, so W<sub>boundary</sub> = 0.</span>`; };

const drawPT=()=>{
  const rect=ptCanvas.getBoundingClientRect(), width=Math.max(280,Math.round(rect.width)), height=130, dpr=Math.min(window.devicePixelRatio,2);
  ptCanvas.width=width*dpr; ptCanvas.height=height*dpr; const ctx=ptCanvas.getContext('2d'); ctx.scale(dpr,dpr); ctx.clearRect(0,0,width,height);
  const pad={left:37,right:10,top:12,bottom:25}; const minT=Math.min(model.T1,model.T2)*.9, maxT=Math.max(model.T1,model.T2)*1.1, minP=Math.min(model.P1,model.P2)*.86, maxP=Math.max(model.P1,model.P2)*1.14;
  const x=(t)=>pad.left+(t-minT)/(maxT-minT)*(width-pad.left-pad.right), y=(p)=>height-pad.bottom-(p-minP)/(maxP-minP)*(height-pad.top-pad.bottom);
  ctx.strokeStyle='#8b8b91'; ctx.beginPath(); ctx.moveTo(pad.left,pad.top);ctx.lineTo(pad.left,height-pad.bottom);ctx.lineTo(width-pad.right,height-pad.bottom);ctx.stroke();
  ctx.fillStyle='#6e6e73';ctx.font='10px system-ui';ctx.fillText('P',10,17);ctx.fillText('T',width-12,height-8);
  ctx.strokeStyle='#0071e3';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x(model.T1),y(model.P1));ctx.lineTo(x(model.T2),y(model.P2));ctx.stroke();
  const state=currentState();ctx.beginPath();ctx.arc(x(state.T),y(state.P),4.5,0,Math.PI*2);ctx.fillStyle='#f97316';ctx.fill();
};

const updateModel=()=>{
  const state=currentState(); const heating=state.T>=model.T1; const pressureRatio=state.P/model.P1; const warmth=Math.min(1,Math.abs((state.T-model.T1)/(model.T2-model.T1||1)));
  if (fallbackGas) fallbackGas.style.background=heating
    ? `linear-gradient(180deg, rgba(245, ${Math.round(184 - warmth * 80)}, ${Math.round(77 - warmth * 35)}, .58), rgba(220, 83, 48, .85))`
    : 'linear-gradient(180deg,rgba(91,158,210,.58),rgba(35,104,173,.85))';
  const gasColor=new THREE.Color(heating?0x42b8c5:0x42b8c5);
  gasColor.lerp(new THREE.Color(heating?0xf06449:0x347fb3),Math.max(.08,warmth*.82)); gasMaterial.color.copy(gasColor);
  gasMaterial.emissive.copy(new THREE.Color(heating?0xffa000:0x2f83bd)); gasMaterial.emissiveIntensity=.12+.2*warmth;
  heatArrow.visible=true; heatArrow.setDirection(new THREE.Vector3(heating?1:-1,0,0)); heatArrow.position.x=heating?-5.1:-3.05; heatArrow.setColor(heating?0xe59a00:0x2f83bd); heatArrow.setLength(1.25+warmth*.9,.7,.35);
  gaugeNeedle.rotation.z=-.65+Math.max(-.55,Math.min(.95,(pressureRatio-1)*1.1));
  const speed=.55+state.T/model.T1*.8; particles.forEach((particle)=>{ const v=particle.userData.velocity; particle.position.addScaledVector(v,speed); const r2=particle.position.x**2+particle.position.z**2; if(r2>4.55){v.x*=-1;v.z*=-1;} if(Math.abs(particle.position.y)>2.78)v.y*=-1; particle.material.color.copy(gasColor); });
  pressureStat.textContent=`${state.P.toFixed(1)} kPa`; temperatureStat.textContent=`${state.T.toFixed(1)} K`; volumeStat.textContent=model.V?`${model.V.toFixed(3)} m³`:'constant';
  stateLabel.textContent=state.progress<.02?'Initial':state.progress>.98?'Final':`${Math.round(state.progress*100)}%`;
  statePill.textContent=heating?'Heat added: P and T rise; V stays fixed':'Heat removed: P and T fall; V stays fixed';
  statePill.style.background=heating?'rgba(245,158,11,.12)':'rgba(47,131,189,.12)';
  if(state.progress<.02) stage.textContent='Initial state: the sealed tank prevents any volume change.';
  else if(state.progress>.98) stage.textContent='Final state: pressure changed in direct proportion to absolute temperature; boundary work remains zero.';
  else stage.textContent='During the process: the wall stays fixed while particle activity, temperature, and pressure change together.';
  result.innerHTML=targetText(); drawPT();
};

const configureContract=(contract)=>{
  const s=contract.states; model={P1:s.P1,T1:s.T1,P2:s.P2,T2:s.T2,V:s.V||.2,target:contract.target||'P2',source:contract.source};
  slider.value=0; running=false; playBtn.textContent='Play heating/cooling'; syncInputs(); questionContext.textContent=`Matched question: ${contract.source}`; updateModel();
};
const readInputs=()=>{ model.P1=finite(p1Input.value,model.P1); model.T1=finite(t1Input.value,model.T1); model.T2=finite(t2Input.value,model.T2); model.V=finite(volumeInput.value,model.V); model.P2=model.P1*model.T2/model.T1; updateModel(); };
const handlePrompt=(text)=>{
  const contract=RigidTankRules.solveRigidTankContract(RigidTankRules.buildRigidTankContract(text));
  if(contract.result.status==='solved'){ configureContract(contract); message('bot',`Loaded the matched rigid-tank model. ${contract.target==='W'?'Boundary work is zero because the tank is rigid.':`The requested ${contract.target} is ${contract.result.value.toFixed(2)} ${contract.result.units}.`}`); return; }
  if(RigidTankRules.isRigidTankQuestion(text)){ message('bot',`To build this model, add: ${contract.result.missing.join(', ')}.`); return; }
  if(/why.*work|work.*zero/.test(text.toLowerCase())){ message('bot','Boundary work is zero because work requires a moving boundary, and a rigid tank has fixed volume.'); return; }
  message('bot','This screen models rigid tanks. Paste a question that names a rigid tank, vessel, or sealed rigid container.');
};

slider.addEventListener('input',updateModel);
playBtn.addEventListener('click',()=>{ if(Number(slider.value)>.99)slider.value=0; running=!running; playBtn.textContent=running?'Pause process':'Play heating/cooling'; updateModel(); });
stepBtn.addEventListener('click',()=>{ slider.value=Math.min(1,Number(slider.value)+.1);updateModel(); });
resetBtn.addEventListener('click',()=>{running=false;playBtn.textContent='Play heating/cooling';slider.value=0;updateModel();});
[p1Input,t1Input,t2Input,volumeInput].forEach((input)=>input.addEventListener('change',readInputs));
chatSend.addEventListener('click',()=>{const text=chatInput.value.trim();if(!text)return;message('user',text);handlePrompt(text);chatInput.value='';});
chatInput.addEventListener('keydown',(event)=>{if(event.key==='Enter')chatSend.click();});
function animate(now){requestAnimationFrame(animate); if(running){const dt=lastTime?(now-lastTime)/1000:0;const next=Number(slider.value)+dt*.28;slider.value=Math.min(1,next);updateModel();if(next>=1){running=false;playBtn.textContent='Replay process';}}lastTime=now;controls.update();renderer.render(scene,camera);}
window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
const prompt=new URLSearchParams(window.location.search).get('prompt'); if(prompt){message('user',prompt);handlePrompt(prompt);} else {const sample='A rigid tank contains air at 100 kPa and 300 K. It is heated to 600 K. Find final pressure.'; configureContract(RigidTankRules.solveRigidTankContract(RigidTankRules.buildRigidTankContract(sample)));}
animate();
