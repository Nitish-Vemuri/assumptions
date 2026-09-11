'use strict';
const E=TeachingEngine, $=id=>document.getElementById(id);
let model=structuredClone(E.defaults), progress=0, running=false, graphs=true, busy=false, token='', configured=false;
const history=[], undo=[];
function say(text,role='assistant'){const p=document.createElement('p');p.textContent=text;p.className=role;$('conversation').append(p);$('conversation').scrollTop=$('conversation').scrollHeight;history.push({role:role==='user'?'user':'assistant',text});if(history.length>8)history.shift();}
function snapshot(){undo.push({model:structuredClone(model),progress,graphs});if(undo.length>30)undo.shift();$('undo').disabled=false;}
function sync(){for(const [id,key] of [['p1','P1'],['v1','V1'],['t1','T1'],['gamma','gamma'],['n','n']])$(id).value=model[key];$('process').value=model.process;$('endpoint').value=model.endpoint.quantity;$('endValue').value=model.endpoint.value;}
const format=x=>Number(x.toPrecision(5)).toLocaleString('en-US',{maximumSignificantDigits:5});
function commit(next,message){E.solve(next);snapshot();model=next;progress=0;running=false;sync();render();say(message);}
function action(name){if(name==='undo'){const s=undo.pop();if(!s){say('Nothing to undo.');return;}model=s.model;progress=s.progress;graphs=s.graphs;running=false;sync();$('undo').disabled=!undo.length;}else if(name==='play'){if(progress>=1)progress=0;running=true;}else if(name==='pause')running=false;else if(name==='reset'){snapshot();progress=0;running=false;}else if(name==='show_graphs'||name==='hide_graphs'){snapshot();graphs=name==='show_graphs';}render();}
function change(c){const next=E.apply(model,c),f=E.solve(next);commit(next,`${c.message?c.message+' ':''}Applied ${next.process}. Initial pressure ${format(next.P1)} kPa; final V ${format(f.V2)} m³, T ${format(f.T2)} K, P ${format(f.P2)} kPa. Boundary work ${format(f.W)} kJ. ${next.process==='isochoric'?'The piston is locked.':''}`);}
function localCommand(text){const t=text.toLowerCase().replace(/[.!]/g,'').trim();return ({play:'play','play process':'play',pause:'pause',reset:'reset',undo:'undo','hide graphs':'hide_graphs','show graphs':'show_graphs'})[t];}
async function send(text){if(busy||(voice&&voice.active)||!text.trim())return;text=text.trim();$('command').value='';const context=history.slice();say(text,'user');const local=localCommand(text);if(local){action(local);say(`Applied: ${local.replace('_',' ')}.`);return;}
  if(!configured){say('AI is not connected. Set OPENAI_API_KEY on the teaching server and restart it. You can use the direct value editor and playback controls now.','error');return;}
  busy=true;running=false;$('send').disabled=true;$('mic').disabled=true;$('editForm').inert=true;$('undo').disabled=true;$('send').textContent='Interpreting…';
  try{const response=await fetch('/api/command',{method:'POST',headers:{'Content-Type':'application/json','X-Teaching-Token':token},signal:AbortSignal.timeout(35000),body:JSON.stringify({text,model,history:context})});const data=await response.json();if(!response.ok)throw Error(data.error||'Command failed.');const c=data.command;if(c.action==='clarify')say(c.message);else if(['create','edit'].includes(c.action))change(c);else{action(c.action);say(c.message||'Done.');}}catch(e){say(e.name==='TimeoutError'?'The request timed out. Model unchanged.':e.message,'error');}finally{busy=false;$('send').disabled=false;$('mic').disabled=!voice;$('editForm').inert=false;$('undo').disabled=!undo.length;$('send').textContent='Apply command';}}
$('commandForm').addEventListener('submit',e=>{e.preventDefault();send($('command').value);});
$('play').onclick=()=>action(running?'pause':'play');$('reset').onclick=()=>action('reset');$('undo').onclick=()=>{if(!busy)action('undo');};
$('progress').oninput=()=>{progress=Number($('progress').value);running=false;render();};
$('editForm').onsubmit=e=>{e.preventDefault();try{const changes=Object.fromEntries([['p1','P1'],['v1','V1'],['t1','T1'],['gamma','gamma'],['n','n']].map(([id,key])=>[key,Number($(id).value)]));changes[$('endpoint').value]=Number($('endValue').value);change({action:'edit',process:$('process').value,changes,message:'Updated the example.'});}catch(err){say(err.message,'error');}};
$('process').onchange=()=>{try{const next=E.apply(model,{action:'edit',process:$('process').value,changes:{}});$('endpoint').value=next.endpoint.quantity;$('endValue').value=next.endpoint.value;}catch(e){say(e.message,'error');}};
const Speech=window.SpeechRecognition||window.webkitSpeechRecognition;
let voice=null;
if(Speech){
  voice=TeachingVoice.createVoiceCapture({
    Recognition:Speech,input:$('command'),
    onStatus:text=>{$('voiceStatus').textContent=text;},
    onState:state=>{
      const active=state!=='idle';
      $('mic').textContent=active?'Stop recording':'Speak';
      $('mic').setAttribute('aria-pressed',String(active));
      $('mic').disabled=busy||state==='starting'||state==='stopping';
      $('send').disabled=busy||active;
      $('command').readOnly=active;
    }
  });
  $('mic').onclick=()=>voice.toggle();
}else{$('mic').disabled=true;$('voiceStatus').textContent='Speech recognition is unavailable in this browser. Try Chrome or Edge, or type a command.';}
let view=null;
try{
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xeeefea);const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));$('scene').prepend(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(40,1,.1,100);camera.position.set(6,4,8);const controls=new THREE.OrbitControls(camera,renderer.domElement);controls.target.set(0,1.5,0);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=18;
 scene.add(new THREE.HemisphereLight(0xffffff,0x667078,1.6));const light=new THREE.DirectionalLight(0xffffff,1.4);light.position.set(4,7,4);scene.add(light);
 const material=new THREE.MeshStandardMaterial({color:0x497b85,transparent:true,opacity:.2,side:THREE.DoubleSide});const wall=new THREE.Mesh(new THREE.CylinderGeometry(1.3,1.3,4,48,1,true),material);wall.position.y=2;scene.add(wall);
 const gas=new THREE.Mesh(new THREE.CylinderGeometry(1.13,1.13,1,40),new THREE.MeshStandardMaterial({color:0x4cabb4,transparent:true,opacity:.65}));scene.add(gas);
 const piston=new THREE.Mesh(new THREE.CylinderGeometry(1.22,1.22,.16,48),new THREE.MeshStandardMaterial({color:0x46515a,metalness:.55,roughness:.35}));scene.add(piston);
 const base=new THREE.Mesh(new THREE.CylinderGeometry(1.35,1.35,.13,48),new THREE.MeshStandardMaterial({color:0x6a7478}));scene.add(base);
 const force=new THREE.ArrowHelper(new THREE.Vector3(0,1,0),new THREE.Vector3(-1.65,.3,0),1,0xab361f,.22,.12);scene.add(force);
 const heat=new THREE.ArrowHelper(new THREE.Vector3(1,0,0),new THREE.Vector3(-2.7,1,0),1.3,0xc37010,.22,.12);scene.add(heat);
 const labels=[];function label(text){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=80;const ctx=canvas.getContext('2d'),texture=new THREE.CanvasTexture(canvas),sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(2.5,.39,1);scene.add(sprite);const item={sprite,text:null,set(value){if(value===this.text)return;this.text=value;ctx.clearRect(0,0,512,80);ctx.fillStyle='#ffffff';ctx.fillRect(0,0,512,80);ctx.fillStyle='#28383d';ctx.font='32px system-ui';ctx.textAlign='center';ctx.fillText(value,256,52);texture.needsUpdate=true;}};item.set(text);labels.push(item);return item;}
 const pressureLabel=label('Pgas ↑'),heatLabel=label('Q in'),lockLabel=label('');
 new ResizeObserver(()=>{const w=$('scene').clientWidth,h=$('scene').clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();}).observe($('scene'));
 view={update(s,final){const h=3.5*s.V/Math.max(model.V1,final.V2);gas.scale.y=h;gas.position.y=h/2+.08;piston.position.y=h+.16;
 const change=Math.log(s.P/model.P1);gas.material.color.set(0x4cabb4);gas.material.color.lerp(new THREE.Color(change>=0?0xdb6a41:0x6e9dc4),Math.min(.85,Math.abs(change)));
 force.position.set(1.65,.2,0);force.setLength(Math.min(2.3,.6+s.P/model.P1*.5),.22,.12);pressureLabel.sprite.position.set(2.2,2.9,0);pressureLabel.set(`Pgas ${format(s.P)} kPa ↑`);
 heat.visible=Math.abs(final.Q)>1e-8;heatLabel.sprite.visible=heat.visible;const inward=final.Q>0;heat.setDirection(new THREE.Vector3(inward?1:-1,0,0));heat.position.set(inward?-2.8:-1.45,1.2,0);heat.setColor(new THREE.Color(inward?0xc37010:0x2369a0));heatLabel.set(inward?'Q in →':'← Q out');heatLabel.sprite.position.set(-2,1.7,0);lockLabel.set(model.process==='isochoric'?'Piston locked · W = 0':'Moving boundary');lockLabel.sprite.position.set(0,4.35,0);},draw(){controls.update();renderer.render(scene,camera);}};
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('renderError').hidden=false;$('renderError').textContent='3D context lost. Reload to restore the model. Calculations remain available.';});
}catch(e){$('renderError').hidden=false;$('renderError').textContent=`3D could not start: ${e.message}. Calculations and graphs are still available.`;}
function plot(id,key){const canvas=$(id),w=Math.max(250,canvas.clientWidth),h=170,dpr=Math.min(devicePixelRatio,2);canvas.width=w*dpr;canvas.height=h*dpr;const c=canvas.getContext('2d');c.scale(dpr,dpr);const points=Array.from({length:81},(_,i)=>E.sample(model,i/80));const xs=points.map(p=>p.V),ys=points.map(p=>p[key]);let loX=Math.min(...xs),hiX=Math.max(...xs),loY=Math.min(...ys),hiY=Math.max(...ys);const dx=Math.max((hiX-loX)*.1,hiX*.05),dy=Math.max((hiY-loY)*.1,hiY*.05);loX-=dx;hiX+=dx;loY-=dy;hiY+=dy;const x=v=>48+(v-loX)/(hiX-loX)*(w-64),y=v=>h-28-(v-loY)/(hiY-loY)*(h-44);c.strokeStyle='#9ba8aa';c.beginPath();c.moveTo(48,12);c.lineTo(48,h-28);c.lineTo(w-10,h-28);c.stroke();c.fillStyle='#52636a';c.font='10px system-ui';c.fillText(format(hiY),2,18);c.fillText(format(loY),2,h-29);c.fillText(format(Math.min(...xs)),48,h-8);c.fillText(format(Math.max(...xs)),w-60,h-8);c.strokeStyle='#276278';c.lineWidth=2;c.beginPath();points.forEach((p,i)=>i?c.lineTo(x(p.V),y(p[key])):c.moveTo(x(p.V),y(p[key])));c.stroke();const s=E.sample(model,progress);c.fillStyle='#c35928';c.beginPath();c.arc(x(s.V),y(s[key]),4,0,Math.PI*2);c.fill();}
function render(){const s=E.sample(model,progress),f=E.solve(model);$('progress').value=progress;$('percent').textContent=`${Math.round(progress*100)}%`;$('play').textContent=running?'Pause':progress>=1?'Replay':'Play';$('graphs').hidden=!graphs;
 $('stats').replaceChildren(...[['Pressure',s.P,'kPa'],['Volume',s.V,'m³'],['Temperature',s.T,'K'],['Work by gas',s.W,'kJ'],['Heat into gas',s.Q,'kJ']].map(([label,value,unit])=>{const div=document.createElement('div');div.className='stat';const name=document.createElement('span'),val=document.createElement('strong');name.textContent=label;val.textContent=`${format(value)} ${unit}`;div.append(name,val);return div;}));
 const rule={isothermal:'T constant; P·V constant.',isobaric:'P constant; V/T constant.',isochoric:'V constant; P/T constant; boundary work is zero.',adiabatic:'Reversible adiabatic: P·V^γ constant; Q = 0.',polytropic:`P·V^n constant; n = ${model.n}.`}[model.process];$('rule').textContent=`${model.process}: ${rule} γ = ${model.gamma}. Positive work is by the gas; positive heat enters the gas.`;$('answer').textContent=`Final state: P₂ ${format(f.P2)} kPa · V₂ ${format(f.V2)} m³ · T₂ ${format(f.T2)} K · W ${format(f.W)} kJ`;
 if(view)view.update(s,f);if(graphs){plot('pv','P');plot('tv','T');}}
let last=0;function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;if(running){progress=Math.min(1,progress+dt/6);if(progress===1)running=false;render();}if(view)view.draw();requestAnimationFrame(frame);}
sync();render();requestAnimationFrame(frame);window.addEventListener('resize',()=>render());
fetch('/api/status').then(r=>{if(!r.ok)throw Error('No teaching server');return r.json();}).then(s=>{token=s.token;configured=s.configured;$('connection').textContent=configured?'AI connected · commands are sent to OpenAI':'AI not configured · direct editor and playback available';}).catch(()=>{$('connection').textContent='Open this page through the teaching server on port 8001 to enable AI commands.';});
