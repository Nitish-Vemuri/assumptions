(function(root) {
  'use strict';
  const processes = ['isothermal', 'isobaric', 'isochoric', 'adiabatic', 'polytropic'];
  const fields = ['P1', 'V1', 'T1', 'P2', 'V2', 'T2', 'gamma', 'n'];
  const interpretationPolicy = Object.freeze({
    scope: 'Closed, fixed-mass ideal gas; single-stage equilibrium paths; constant heat capacities.',
    defaultAssumptions: ['ideal gas', 'closed system', 'quasi-static mechanical path', 'constant heat capacities'],
    assumptionHandling: 'Apply these displayed teaching defaults when the user is silent. Do not ask for confirmation of ideal gas, quasi-static behavior, or reversibility for a supported textbook example. For polytropic boundary work, the quasi-static mechanical path is sufficient; do not require the entire heat-transfer process to be reversible.',
    adiabatic: 'The supported adiabatic template is reversible with PV^gamma constant. Use this disclosed teaching default unless the user explicitly contradicts it.',
    conflicts: 'Do not override an explicit real-gas, irreversible, non-quasi-static, variable-specific-heat, phase-change, spring, stop, open-system or multiple-stage description. Explain the scope limitation and leave the model unchanged.',
    processes,
    initialFields: ['P1', 'V1', 'T1'],
    finalConditions: { isothermal: ['P2', 'V2'], isobaric: ['V2', 'T2'], isochoric: ['P2', 'T2'], adiabatic: ['P2', 'V2', 'T2'], polytropic: ['P2', 'V2', 'T2'] },
    finalConditionNote: 'For polytropic n=0 pressure is fixed; for n=1 temperature is fixed. A fixed quantity alone cannot specify the final state.',
    defaults: { gamma: 1.4 },
    polytropic: 'For a new polytropic example request n if missing; for an edit retain the existing exponent unless changed.'
  });
  const defaults = { process:'isobaric', P1:500, V1:0.03, T1:300, gamma:1.4, n:1.3, endpoint:{quantity:'T2', value:450} };
  const copy = x => JSON.parse(JSON.stringify(x));
  function positive(x, label) { if(typeof x !== 'number' || !Number.isFinite(x) || x <= 0) throw Error(`${label} must be a positive finite number.`); }
  function solve(model) {
    if (!model || !processes.includes(model.process)) throw Error('Choose a supported ideal-gas process.');
    for(const key of ['P1','V1','T1','gamma']) positive(model[key],key);
    if(model.gamma <= 1 || model.gamma > 2) throw Error('Gamma must be greater than 1 and no greater than 2.');
    if(typeof model.n !== 'number' || !Number.isFinite(model.n) || Math.abs(model.n)>10) throw Error('Polytropic n must be between -10 and 10.');
    const e = model.endpoint;
    if(!e || !['P2','V2','T2'].includes(e.quantity)) throw Error('Choose a final pressure, volume, or temperature.');
    positive(e.value,e.quantity);
    const {P1,V1,T1,process} = model;
    let ratio, T2, P2;
    const exponent = process==='isothermal'?1:process==='adiabatic'?model.gamma:process==='isobaric'?0:model.n;
    if(process==='isochoric') {
      if(e.quantity==='V2') throw Error('Fixed volume does not determine the final state. Specify final pressure or temperature.');
      ratio=1; T2=e.quantity==='T2'?e.value:T1*e.value/P1; P2=P1*T2/T1;
    } else {
      if(e.quantity==='V2') ratio=e.value/V1;
      if(e.quantity==='P2') {
        if(exponent===0) throw Error('Pressure is constant. Specify final volume or temperature.');
        ratio=(P1/e.value)**(1/exponent);
      }
      if(e.quantity==='T2') {
        if(exponent===1) throw Error('Temperature is constant. Specify final volume or pressure.');
        ratio=(e.value/T1)**(1/(1-exponent));
      }
      P2=P1*ratio**(-exponent); T2=T1*ratio**(1-exponent);
    }
    const V2=V1*ratio;
    for(const [k,v] of Object.entries({P2,V2,T2})) positive(v,k);
    if(ratio<0.05 || ratio>20 || T2>10000 || T1>10000 || P2>1e7 || P1>1e7) throw Error('This state exceeds the teaching visualizer range (volume ratio 0.05–20, temperature ≤10000 K).');
    const W = process==='isochoric'?0:Math.abs(exponent-1)<1e-8?P1*V1*Math.log(ratio):(P2*V2-P1*V1)/(1-exponent);
    // Fixed mass ideal gas: mR=P1 V1/T1. Constant heat capacities with cv=R/(gamma-1).
    const deltaU=P1*V1/T1/(model.gamma-1)*(T2-T1);
    return {P2,V2,T2,W,deltaU,Q:deltaU+W};
  }
  function sample(model, progress) {
    const f=solve(model), t=Math.max(0,Math.min(1,progress));
    const endpoint = model.process==='isochoric'
      ? {quantity:'T2',value:model.T1+(f.T2-model.T1)*t}
      : {quantity:'V2',value:model.V1+(f.V2-model.V1)*t};
    const s=solve({...model,endpoint});
    return {P:s.P2,V:s.V2,T:s.T2,W:s.W,Q:s.Q,deltaU:s.deltaU};
  }
  function apply(model, command) {
    if(!command || !['create','edit'].includes(command.action)) throw Error('Expected a model edit.');
    const next=copy(command.action==='create'?defaults:model), previous=solve(model);
    const changes=command.changes || {};
    if(Object.keys(changes).some(k=>!fields.includes(k))) throw Error('Unknown model parameter.');
    const provided=Object.entries(changes).filter(([,v])=>v!==null);
    if(provided.some(([,v])=>typeof v!=='number'||!Number.isFinite(v))) throw Error('Model parameters must be finite numbers.');
    if(command.process!==null && command.process!==undefined) {
      if(!processes.includes(command.process)) throw Error('Unsupported process.');
      next.process=command.process;
    }
    for(const key of ['P1','V1','T1','gamma','n']) if(changes[key]!=null) next[key]=changes[key];
    if(command.action==='create' && next.process==='polytropic' && changes.n==null) throw Error('Specify the polytropic exponent n for the new example.');
    const ends=['P2','V2','T2'].filter(k=>changes[k]!=null);
    if(ends.length) {
      const priority=next.process==='isochoric'?['T2','P2']:next.process==='isobaric'?['V2','T2']:next.process==='isothermal'||(next.process==='polytropic'&&next.n===1)?['V2','P2']:['V2','T2','P2'];
      const key=priority.find(k=>ends.includes(k));
      if(!key) throw Error('That final value is fixed by the process. Supply an independent final pressure, volume, or temperature.');
      next.endpoint={quantity:key,value:changes[key]};
    } else if(next.process!==model.process && command.action!=='create') {
      next.endpoint=next.process==='isothermal'||(next.process==='polytropic'&&next.n===1)
        ? {quantity:'V2',value:previous.V2}
        : {quantity:'T2',value:previous.T2};
    } else if(command.action==='create' && !ends.length) {
      throw Error('Describe an initial pressure, volume and temperature, and an independent final condition.');
    }
    if(command.action==='create' && (!command.process || ['P1','V1','T1'].some(k=>changes[k]==null))) throw Error('A new example needs a process and initial P, V and T. You can ask to use the displayed example values.');
    const result=solve(next);
    for(const key of ends) if(Math.abs(result[key]-changes[key])>1e-6*Math.max(1,Math.abs(changes[key]))) throw Error(`${key} conflicts with the other conditions and ${next.process} constraint.`);
    return next;
  }
  const api={processes,fields,defaults,interpretationPolicy,solve,sample,apply};
  if(typeof module!=='undefined') module.exports=api;
  root.TeachingEngine=api;
})(typeof window==='undefined'?globalThis:window);
