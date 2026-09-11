(function(root) {
  'use strict';
  // Recording edits a draft only. Submission belongs to the form, never onend.
  function createVoiceCapture({Recognition,input,onStatus,onState}) {
    const recognition=new Recognition();
    recognition.lang='en-US';recognition.interimResults=true;recognition.continuous=true;
    let state='idle',prefix='',failed=false;
    function setState(value){state=value;onState(value);}
    recognition.onstart=()=>{setState('recording');onStatus('Listening. Take your time; click Stop recording when finished. Nothing is sent automatically.');};
    recognition.onresult=event=>{
      const transcript=Array.from(event.results,result=>result[0].transcript).join(' ').trim();
      input.value=[prefix,transcript].filter(Boolean).join(' ');
    };
    recognition.onerror=event=>{failed=true;onStatus(`Speech stopped (${event.error}). Your draft is preserved. You can edit it or continue with Speak.`);};
    recognition.onend=()=>{setState('idle');if(!failed)onStatus('Recording stopped. Review your draft and click Apply command, or Speak to add more.');};
    return {
      toggle(){
        try {
          if(state==='recording'){setState('stopping');recognition.stop();return;}
          if(state!=='idle')return;
          prefix=input.value.trim();failed=false;setState('starting');recognition.start();
        } catch(error){setState('idle');onStatus(`Could not use microphone: ${error.message}. Your draft is preserved.`);}
      },
      get active(){return state!=='idle';}
    };
  }
  if(typeof module!=='undefined')module.exports={createVoiceCapture};
  root.TeachingVoice={createVoiceCapture};
})(typeof window==='undefined'?globalThis:window);
