'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {createVoiceCapture}=require('./teaching-voice');
const E=require('./teaching-engine');
const vm=require('node:vm'),fs=require('node:fs');
function recorder(initial=''){
 let instance;const input={value:initial},states=[],messages=[];
 class Recognition{constructor(){instance=this;}start(){this.onstart();}stop(){this.onend();}}
 const controller=createVoiceCapture({Recognition,input,onState:x=>states.push(x),onStatus:x=>messages.push(x)});
 function result(...texts){instance.onresult({results:texts.map(text=>[{transcript:text}])});}
 return {controller,input,states,messages,get recognition(){return instance;},result};
}
test('speech pauses preserve the full draft and never submit',()=>{
 const r=recorder();r.controller.toggle();assert.equal(r.recognition.continuous,true);
 r.result('A gas at 110 kilopascals');assert.equal(r.controller.active,true);
 r.result('A gas at 110 kilopascals','and 353.15 kelvin');
 assert.equal(r.input.value,'A gas at 110 kilopascals and 353.15 kelvin');
 r.recognition.onend();assert.equal(r.controller.active,false);
 assert.match(r.messages.at(-1),/Review your draft/);
 r.controller.toggle();r.result('compresses to 2.5 cubic metres');r.controller.toggle();
 assert.equal(r.input.value,'A gas at 110 kilopascals and 353.15 kelvin compresses to 2.5 cubic metres');
});
test('recognition revisions do not duplicate text; microphone error preserves draft',()=>{
 const r=recorder('Existing draft.');r.controller.toggle();r.result('five');r.result('five cubic metres');
 assert.equal(r.input.value,'Existing draft. five cubic metres');
 r.recognition.onerror({error:'network'});r.recognition.onend();
 assert.equal(r.input.value,'Existing draft. five cubic metres');assert.match(r.messages.at(-1),/network/);
});
test('submit clears input, retains question in history, and blocks while recording',async()=>{
 const elements=new Map();const get=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:'',disabled:false,append(){},scrollTop:0,scrollHeight:0});return elements.get(id);};
 const context={TeachingEngine:E,structuredClone,console,document:{getElementById:get,createElement:()=>({})}};
 vm.createContext(context);
 const source=fs.readFileSync('teaching.js','utf8').split("$('commandForm').addEventListener")[0];
 vm.runInContext(source+"\nlet voice={active:false};",context);
 get('command').value='Set initial pressure to 200 kPa';
 await vm.runInContext("send(document.getElementById('command').value)",context);
 assert.equal(get('command').value,'');assert.equal(vm.runInContext('history[0].text',context),'Set initial pressure to 200 kPa');
 get('command').value='Still dictating';vm.runInContext('voice.active=true',context);
 await vm.runInContext("send(document.getElementById('command').value)",context);
 assert.equal(get('command').value,'Still dictating');
});
test('polytropic example uses declared n and does not need an assumption confirmation',()=>{
 const m=E.apply(E.defaults,{action:'create',process:'polytropic',changes:{P1:110,V1:5,T1:353.15,gamma:1.4,n:1.2,V2:2.5}});
 const f=E.solve(m);assert.ok(Math.abs(f.P2-110*2**1.2)<1e-8);assert.ok(f.W<0);
 assert.throws(()=>E.apply(E.defaults,{action:'create',process:'polytropic',changes:{P1:110,V1:5,T1:353.15,V2:2.5}}),/exponent/);
});
