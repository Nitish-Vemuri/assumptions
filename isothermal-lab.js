(function(root) {
  const number = '(\\d+(?:\\.\\d+)?)';
  const pressurePattern = new RegExp(`${number}\\s*(mpa|kpa|pa)\\b`, 'gi');
  const volumePattern = new RegExp(`${number}\\s*(m\\^?3|m³|cm\\^?3|cm³|(?:cubic\\s*)?(?:meters?|metres?)\\s*(?:cube|cubed)|l|liters?|litres?)`, 'gi');

  const toKPa = (value, unit) => unit.toLowerCase() === 'mpa' ? value * 1000 : unit.toLowerCase() === 'pa' ? value / 1000 : value;
  const toM3 = (value, unit) => {
    const u = unit.toLowerCase().replace(/\s+/g, '');
    if (u === 'l' || u.startsWith('liter') || u.startsWith('litre')) return value / 1000;
    if (u.startsWith('cm')) return value / 1000000;
    return value;
  };
  const extract = (text, pattern, convert) => [...text.matchAll(pattern)].map((m) => convert(Number(m[1]), m[2]));

  function solveIsothermalQuestion(question) {
    const text = String(question || '').toLowerCase();
    if (!/isothermal|constant temperature|constant temp/.test(text)) return { error: 'This focused lab accepts only isothermal ideal-gas piston-cylinder questions.' };
    const pressures = extract(text, pressurePattern, toKPa);
    const volumes = extract(text, volumePattern, toM3);
    const asksWork = /work|work done|work output|work input/.test(text);
    const asksPressure = /(?:final|ending)\s+pressure|find\s+(?:the\s+)?(?:final\s+)?pressure|\bp2\b/.test(text);
    const asksVolume = /(?:final|ending)\s+volume|find\s+(?:the\s+)?(?:final\s+)?volume|find\s+v2|\bv2\b/.test(text);
    if (!(pressures[0] > 0 && volumes[0] > 0)) return { error: 'Please include an initial pressure and initial volume with units.' };
    const p1 = pressures[0], v1 = volumes[0];
    let p2 = pressures[1] || null;
    let v2 = volumes[1] || null;
    if (!v2 && p2) v2 = p1 * v1 / p2;
    if (!p2 && v2) p2 = p1 * v1 / v2;
    if (!(p2 > 0 && v2 > 0)) return { error: 'Please include either a final pressure or a final volume so the other final-state value can be derived.' };
    const target = asksWork ? 'work' : asksPressure ? 'pressure' : asksVolume ? 'volume' : 'pressure';
    const workKJ = p1 * v1 * Math.log(v2 / v1);
    return { p1, v1, p2, v2, workKJ, target };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { solveIsothermalQuestion };
  if (typeof document === 'undefined') return;

  const $ = (id) => document.getElementById(id);
  const questionInput = $('questionInput'), message = $('message'), lesson = $('lesson'), progress = $('progress');
  let state = null, animation = null;
  const format = (value, digits = 2) => Number(value).toFixed(digits);

  const prepareCanvas = (canvas, height) => {
    const width = Math.max(260, Math.round(canvas.getBoundingClientRect().width));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr; canvas.height = height * dpr;
    const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); return { ctx, width, height };
  };

  function drawPiston(t) {
    const { ctx, width, height } = prepareCanvas($('pistonCanvas'), 390);
    ctx.clearRect(0, 0, width, height);
    const pistonY = 92 + t * 145;
    ctx.fillStyle = '#fff7e8'; ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(33,182,199,.58)'; ctx.fillRect(width * .24, pistonY + 16, width * .52, height - pistonY - 68);
    ctx.strokeStyle = '#237e7f'; ctx.lineWidth = 7; ctx.strokeRect(width * .22, 50, width * .56, height - 100);
    ctx.fillStyle = '#243b53'; ctx.fillRect(width * .19, pistonY, width * .62, 17);
    ctx.fillStyle = '#243b53'; ctx.fillRect(width * .47, 27, width * .06, pistonY - 27);
    ctx.strokeStyle = '#ef7d32'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(width * .14, pistonY + 85); ctx.lineTo(width * .14, pistonY + 25); ctx.stroke();
    ctx.fillStyle = '#ef7d32'; ctx.beginPath(); ctx.moveTo(width * .14, pistonY + 15); ctx.lineTo(width * .11, pistonY + 33); ctx.lineTo(width * .17, pistonY + 33); ctx.fill();
    ctx.fillStyle = '#2563a8'; ctx.font = '700 15px system-ui'; ctx.fillText('P₍gas₎', width * .04, pistonY + 105);
    ctx.fillStyle = '#167c80'; ctx.fillText('Qᵢₙ', width * .68, 78);
    ctx.fillStyle = '#17212b'; ctx.font = '700 16px system-ui'; ctx.fillText('T = constant', width * .34, height - 25);
  }

  function drawGraph(canvas, type, t) {
    const { ctx, width, height } = prepareCanvas(canvas, 152);
    const pad = { l:34, r:10, t:14, b:25 }; const { p1, v1, v2 } = state;
    const minV = Math.min(v1,v2)*.86, maxV = Math.max(v1,v2)*1.12;
    const x = (v) => pad.l + (v-minV)/(maxV-minV)*(width-pad.l-pad.r);
    const y = (value, min, max) => height-pad.b-(value-min)/(max-min)*(height-pad.t-pad.b);
    ctx.strokeStyle='#9caeb5'; ctx.lineWidth=1; ctx.beginPath(); ctx.moveTo(pad.l,pad.t); ctx.lineTo(pad.l,height-pad.b); ctx.lineTo(width-pad.r,height-pad.b); ctx.stroke();
    ctx.fillStyle='#556270'; ctx.font='10px system-ui'; ctx.fillText(type === 'pv' ? 'P' : 'T', 8, 16); ctx.fillText('V',width-12,height-7);
    if (type === 'pv') {
      const minP = Math.min(p1, state.p2)*.82, maxP = Math.max(p1,state.p2)*1.15;
      ctx.strokeStyle='#2563a8'; ctx.lineWidth=2.5; ctx.beginPath();
      for(let i=0;i<=60;i++){ const v=v1+(v2-v1)*i/60; const p=p1*v1/v; i?ctx.lineTo(x(v),y(p,minP,maxP)):ctx.moveTo(x(v),y(p,minP,maxP)); } ctx.stroke();
      const v=v1+(v2-v1)*t, p=p1*v1/v; ctx.fillStyle='#ef7d32'; ctx.beginPath();ctx.arc(x(v),y(p,minP,maxP),4,0,Math.PI*2);ctx.fill();
    } else {
      const temp=300, minT=250,maxT=350, lineY=y(temp,minT,maxT); ctx.strokeStyle='#167c80';ctx.lineWidth=2.5;ctx.beginPath();ctx.moveTo(x(v1),lineY);ctx.lineTo(x(v2),lineY);ctx.stroke();ctx.fillStyle='#167c80';ctx.fillText('T = constant',x(v1)+5,lineY-7); const v=v1+(v2-v1)*t;ctx.fillStyle='#ef7d32';ctx.beginPath();ctx.arc(x(v),lineY,4,0,Math.PI*2);ctx.fill();
    }
  }

  function render() {
    const t = Number(progress.value); const v = state.v1 + (state.v2 - state.v1) * t; const p = state.p1 * state.v1 / v;
    drawPiston(t); drawGraph($('pvCanvas'),'pv',t); drawGraph($('tvCanvas'),'tv',t);
    $('liveState').textContent = `Now: V = ${format(v,5)} m³, P = ${format(p)} kPa`;
  }
  function replay() { cancelAnimationFrame(animation); const start = performance.now(); const duration = 2300; progress.value = 0; const step=(now)=>{ progress.value=Math.min(1,(now-start)/duration); render(); if(Number(progress.value)<1) animation=requestAnimationFrame(step); }; animation=requestAnimationFrame(step); }
  function load() {
    state = solveIsothermalQuestion(questionInput.value);
    if (state.error) { message.textContent = state.error; message.classList.remove('hidden'); lesson.classList.add('hidden'); return; }
    message.classList.add('hidden'); lesson.classList.remove('hidden');
    const answer = state.target === 'pressure' ? `P₂ = ${format(state.p2)} kPa` : state.target === 'volume' ? `V₂ = ${format(state.v2,5)} m³` : `W = ${format(state.workKJ)} kJ`;
    const reason = state.target === 'pressure' ? 'At constant temperature, decreasing volume raises pressure so P₁V₁ = P₂V₂.' : state.target === 'volume' ? 'At constant temperature, the lower final pressure requires a larger volume: P₁V₁ = P₂V₂.' : 'For a quasi-static isothermal ideal-gas path, W = P₁V₁ ln(V₂/V₁).';
    $('answerValue').textContent = answer; $('answerReason').textContent = reason;
    $('initialState').textContent = `P₁ = ${format(state.p1)} kPa; V₁ = ${format(state.v1,5)} m³; T₁ = constant`;
    $('finalState').textContent = `P₂ = ${format(state.p2)} kPa; V₂ = ${format(state.v2,5)} m³; T₂ = T₁`;
    progress.value = 0; render(); window.setTimeout(replay, 350);
  }
  $('loadButton').addEventListener('click', load); $('sampleButton').addEventListener('click', () => { questionInput.value = 'A piston-cylinder contains an ideal gas at 100 kPa and 0.4 m³. It is compressed isothermally to 0.1 m³. Find the final pressure.'; load(); }); progress.addEventListener('input', () => { cancelAnimationFrame(animation); render(); }); window.addEventListener('resize', () => { if(state) render(); }); load();
})(typeof window !== 'undefined' ? window : globalThis);
