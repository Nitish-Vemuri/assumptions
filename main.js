'use strict';
const tabs=Array.from(document.querySelectorAll('[role="tab"]'));
function selectTab(name,updateHash=false){
  const selected=name==='voice'?'voice':'existing';
  for(const tab of tabs){
    const active=tab.id===selected+'-tab';
    tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;
    document.getElementById(tab.getAttribute('aria-controls')).hidden=!active;
  }
  if(updateHash&&location.hash!=='#'+selected)location.hash=selected;
}
for(const [index,tab] of tabs.entries()){
  tab.addEventListener('click',()=>selectTab(tab.id.replace('-tab',''),true));
  tab.addEventListener('keydown',event=>{
    let next;
    if(event.key==='ArrowRight')next=(index+1)%tabs.length;
    if(event.key==='ArrowLeft')next=(index+tabs.length-1)%tabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=tabs.length-1;
    if(next!==undefined){event.preventDefault();tabs[next].focus();selectTab(tabs[next].id.replace('-tab',''),true);}
  });
}
window.addEventListener('hashchange',()=>selectTab(location.hash.slice(1)));
selectTab(location.hash.slice(1));
fetch('/api/status').then(response=>{if(!response.ok)throw Error('No teaching server');return response.json();}).then(status=>{
  document.getElementById('serverStatus').textContent=status.configured
    ? 'An API key is configured on this teaching server. Open the voice lab to use it.'
    : 'Teaching server is running. Start it with an API key to enable AI interpretation.';
}).catch(()=>{document.getElementById('serverStatus').textContent='You are using a static preview. Start the teaching server below to enable AI commands.';});
