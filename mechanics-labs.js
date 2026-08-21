// Textbook-aligned introductory mechanics labs. All calculations use SI units.
(function (root) {
  const G = 9.81;
  const labIds = new Set(['kinematics-1d', 'work-energy', 'collisions', 'circular-motion', 'rotation', 'statics', 'gravitation', 'fluids']);

  const templates = {
    'kinematics-1d': {
      assumptions: 'One-dimensional motion with constant acceleration.',
      controls: [['Initial position x₀ (m)', 'x0', -10, 10, 0, 0.5], ['Initial velocity v₀ (m/s)', 'v0', -10, 10, 2, 0.5], ['Acceleration a (m/s²)', 'a', -5, 5, 1, 0.25], ['Time t (s)', 't', 0, 8, 3, 0.25]]
    },
    'work-energy': {
      assumptions: 'Point mass near Earth; constant kinetic-friction force on a horizontal surface.',
      controls: [['Mass m (kg)', 'm', 0.5, 10, 2, 0.5], ['Height h (m)', 'h', 0, 20, 5, 0.5], ['Speed v (m/s)', 'v', 0, 20, 5, 0.5], ['Friction work magnitude (J)', 'wf', 0, 300, 30, 5]]
    },
    collisions: {
      assumptions: 'One-dimensional isolated system; external impulse is negligible during collision.',
      controls: [['Mass m₁ (kg)', 'm1', 0.5, 10, 2, 0.5], ['Velocity v₁ (m/s)', 'v1', -10, 10, 5, 0.5], ['Mass m₂ (kg)', 'm2', 0.5, 10, 3, 0.5], ['Velocity v₂ (m/s)', 'v2', -10, 10, -1, 0.5]],
      select: ['Collision type', 'type', [['elastic', 'Elastic'], ['inelastic', 'Perfectly inelastic']]]
    },
    'circular-motion': {
      assumptions: 'Uniform circular motion in a horizontal plane; the displayed net force is centripetal.',
      controls: [['Mass m (kg)', 'm', 0.1, 10, 1, 0.1], ['Speed v (m/s)', 'v', 0.5, 30, 8, 0.5], ['Radius r (m)', 'r', 0.5, 20, 4, 0.5]]
    },
    rotation: {
      assumptions: 'Rigid disk about a fixed axis with constant net torque.',
      controls: [['Moment of inertia I (kg·m²)', 'I', 0.1, 10, 2, 0.1], ['Net torque τ (N·m)', 'tau', -20, 20, 8, 0.5], ['Angular speed ω (rad/s)', 'omega', 0, 30, 6, 0.5]]
    },
    statics: {
      assumptions: 'Rigid, massless simply supported beam in static equilibrium.',
      controls: [['Beam length L (m)', 'L', 2, 12, 6, 0.5], ['Load W (N)', 'W', 10, 500, 200, 10], ['Load position x (fraction of L)', 'x', 0, 1, 0.5, 0.05]]
    },
    gravitation: {
      assumptions: 'Newtonian two-body system with a circular orbit; satellite mass is negligible.',
      controls: [['Central mass (Earth masses)', 'M', 0.5, 10, 1, 0.5], ['Orbital radius (Earth radii)', 'r', 1.1, 12, 2, 0.1]]
    },
    fluids: {
      assumptions: 'Incompressible, steady, nonviscous fluid; pipe is horizontal for the continuity calculation.',
      controls: [['Fluid density ρ (kg/m³)', 'rho', 500, 1400, 1000, 50], ['Depth h (m)', 'h', 0, 30, 5, 0.5], ['Pipe area A (m²)', 'A', 0.01, 1, 0.2, 0.01], ['Flow speed v (m/s)', 'v', 0, 20, 3, 0.5]]
    }
  };

  const fmt = (value, digits = 2) => Number(value).toFixed(digits);
  const values = (host) => Object.fromEntries([...host.querySelectorAll('[data-key]')].map((input) => [input.dataset.key, input.value]));
  const numberValues = (host) => Object.fromEntries(Object.entries(values(host)).map(([key, value]) => [key, Number(value)]));

  function calculate(id, p) {
    switch (id) {
      case 'kinematics-1d': {
        const x = p.x0 + p.v0 * p.t + 0.5 * p.a * p.t ** 2;
        const v = p.v0 + p.a * p.t;
        return { primary: `x = ${fmt(x)} m`, rows: [['Position', `${fmt(x)} m`], ['Velocity', `${fmt(v)} m/s`], ['Displacement', `${fmt(x - p.x0)} m`]], formula: 'x = x₀ + v₀t + ½at²;  v = v₀ + at' };
      }
      case 'work-energy': {
        const ug = p.m * G * p.h, k = 0.5 * p.m * p.v ** 2, total = ug + k - p.wf;
        return { primary: `E = ${fmt(total)} J`, rows: [['Kinetic energy', `${fmt(k)} J`], ['Gravitational potential', `${fmt(ug)} J`], ['Mechanical energy after friction', `${fmt(total)} J`]], formula: 'K = ½mv²;  U_g = mgh;  ΔE_mech = W_nonconservative' };
      }
      case 'collisions': {
        const pi = p.m1 * p.v1 + p.m2 * p.v2;
        let v1f, v2f;
        if (p.type === 'elastic') { v1f = ((p.m1 - p.m2) * p.v1 + 2 * p.m2 * p.v2) / (p.m1 + p.m2); v2f = (2 * p.m1 * p.v1 + (p.m2 - p.m1) * p.v2) / (p.m1 + p.m2); }
        else { v1f = v2f = pi / (p.m1 + p.m2); }
        const ki = .5 * p.m1 * p.v1 ** 2 + .5 * p.m2 * p.v2 ** 2;
        const kf = .5 * p.m1 * v1f ** 2 + .5 * p.m2 * v2f ** 2;
        return { primary: `p = ${fmt(pi)} kg·m/s`, rows: [['Final v₁', `${fmt(v1f)} m/s`], ['Final v₂', `${fmt(v2f)} m/s`], ['Kinetic-energy change', `${fmt(kf - ki)} J`]], formula: 'm₁v₁ + m₂v₂ = m₁v₁′ + m₂v₂′' };
      }
      case 'circular-motion': {
        const ac = p.v ** 2 / p.r, fc = p.m * ac;
        return { primary: `F_c = ${fmt(fc)} N`, rows: [['Centripetal acceleration', `${fmt(ac)} m/s²`], ['Period', `${fmt(2 * Math.PI * p.r / p.v)} s`], ['Angular speed', `${fmt(p.v / p.r)} rad/s`]], formula: 'a_c = v²/r;  F_c = mv²/r' };
      }
      case 'rotation': {
        const alpha = p.tau / p.I, k = .5 * p.I * p.omega ** 2;
        return { primary: `α = ${fmt(alpha)} rad/s²`, rows: [['Angular acceleration', `${fmt(alpha)} rad/s²`], ['Rotational kinetic energy', `${fmt(k)} J`], ['Angular momentum', `${fmt(p.I * p.omega)} kg·m²/s`]], formula: 'τ_net = Iα;  K_rot = ½Iω²;  L = Iω' };
      }
      case 'statics': {
        const rb = p.W * p.x, ra = p.W - rb;
        return { primary: `R_A = ${fmt(ra)} N`, rows: [['Left support reaction R_A', `${fmt(ra)} N`], ['Right support reaction R_B', `${fmt(rb)} N`], ['Net torque about A', '0.00 N·m']], formula: 'ΣF_y = 0;  Στ_A = 0;  R_B L − Wx = 0' };
      }
      case 'gravitation': {
        const earthRadius = 6.371e6, earthMass = 5.972e24, Gconst = 6.67430e-11;
        const radius = p.r * earthRadius, mu = Gconst * p.M * earthMass;
        const speed = Math.sqrt(mu / radius), period = 2 * Math.PI * Math.sqrt(radius ** 3 / mu);
        return { primary: `v = ${fmt(speed / 1000)} km/s`, rows: [['Orbital speed', `${fmt(speed / 1000)} km/s`], ['Orbital period', `${fmt(period / 60)} min`], ['Orbital radius', `${fmt(radius / 1000, 0)} km`]], formula: 'v = √(GM/r);  T = 2π√(r³/GM)' };
      }
      case 'fluids': {
        const gauge = p.rho * G * p.h, flow = p.A * p.v;
        return { primary: `P_g = ${fmt(gauge / 1000)} kPa`, rows: [['Gauge pressure', `${fmt(gauge / 1000)} kPa`], ['Volume flow rate', `${fmt(flow)} m³/s`], ['Mass flow rate', `${fmt(p.rho * flow)} kg/s`]], formula: 'P_g = ρgh;  Q = Av;  ṁ = ρQ' };
      }
    }
  }

  function draw(id, canvas, p) {
    const ctx = canvas.getContext('2d'), w = canvas.width = canvas.clientWidth * devicePixelRatio, h = canvas.height = 260 * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio); const W = canvas.clientWidth, H = 260;
    ctx.fillStyle = '#f5f5f7'; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = '#1d1d1f'; ctx.fillStyle = '#0071e3'; ctx.lineWidth = 3;
    if (id === 'kinematics-1d') { const y = H / 2; ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(W - 30, y); ctx.stroke(); const x = Math.max(35, Math.min(W - 35, W / 2 + p.x0 * 12 + (p.v0 * p.t + .5 * p.a * p.t ** 2) * 12)); ctx.beginPath(); ctx.arc(x, y, 16, 0, 2 * Math.PI); ctx.fill(); }
    else if (id === 'work-energy') { const base = H - 35, height = Math.min(170, p.h * 8); ctx.fillStyle = '#8ec5ff'; ctx.fillRect(40, base - height, W - 80, height); ctx.fillStyle = '#0071e3'; ctx.fillRect(W * .55, base - height - 30, 38, 30); }
    else if (id === 'collisions') { const y = H / 2; [[W*.3, p.m1, '#0071e3'], [W*.7, p.m2, '#ff9500']].forEach(([x,m,c]) => {ctx.fillStyle=c;ctx.beginPath();ctx.arc(x,y,12+m*2,0,2*Math.PI);ctx.fill();}); ctx.strokeStyle='#6e6e73';ctx.beginPath();ctx.moveTo(25,y+45);ctx.lineTo(W-25,y+45);ctx.stroke(); }
    else if (id === 'circular-motion') { const r = Math.min(90, p.r * 12), cx=W/2,cy=H/2; ctx.strokeStyle='#0071e3';ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.stroke();ctx.fillStyle='#ff9500';ctx.beginPath();ctx.arc(cx+r,cy,12,0,2*Math.PI);ctx.fill(); }
    else if (id === 'rotation') { const r=80,cx=W/2,cy=H/2;ctx.fillStyle='#8ec5ff';ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.fill();ctx.strokeStyle='#0071e3';ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+r*.7,cy-r*.35);ctx.stroke(); }
    else if (id === 'statics') { const x1=60,x2=W-60,y=130,lx=x1+(x2-x1)*p.x;ctx.strokeStyle='#1d1d1f';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(x1,y);ctx.lineTo(x2,y);ctx.stroke();ctx.fillStyle='#ff9500';ctx.fillRect(lx-8,y-50,16,50);ctx.fillStyle='#0071e3';[[x1,y+7],[x2,y+7]].forEach(([x,yy])=>{ctx.beginPath();ctx.moveTo(x-18,yy+35);ctx.lineTo(x+18,yy+35);ctx.lineTo(x,yy);ctx.fill();}); }
    else if (id === 'gravitation') { const cx=W/2,cy=H/2,r=Math.min(95,p.r*14);ctx.fillStyle='#0071e3';ctx.beginPath();ctx.arc(cx,cy,28,0,2*Math.PI);ctx.fill();ctx.strokeStyle='#8ec5ff';ctx.beginPath();ctx.arc(cx,cy,r,0,2*Math.PI);ctx.stroke();ctx.fillStyle='#ff9500';ctx.beginPath();ctx.arc(cx+r,cy,8,0,2*Math.PI);ctx.fill(); }
    else if (id === 'fluids') { const y=H/2;ctx.fillStyle='#8ec5ff';ctx.fillRect(35,y-50,W-70,100);ctx.fillStyle='#0071e3';ctx.fillRect(35,y-50,W-70,20);ctx.strokeStyle='#1d1d1f';ctx.strokeRect(35,y-50,W-70,100); }
  }

  function render(id, host) {
    const spec = templates[id]; if (!spec || !host) return;
    const controls = spec.controls.map(([label,key,min,max,value,step]) => `<label class="parameter-item"><div class="parameter-label"><span>${label}</span><span class="parameter-value" id="lab-${key}">${value}</span></div><input data-key="${key}" type="range" min="${min}" max="${max}" value="${value}" step="${step}"></label>`).join('');
    const select = spec.select ? `<label class="parameter-item"><div class="parameter-label"><span>${spec.select[0]}</span></div><select data-key="${spec.select[1]}" class="lab-select">${spec.select[2].map(([v,l])=>`<option value="${v}">${l}</option>`).join('')}</select></label>` : '';
    host.innerHTML = `<section class="graph-section mechanics-lab"><div class="lab-intro"><p><strong>Textbook assumptions:</strong> ${spec.assumptions}</p></div><div class="lab-grid"><div class="canvas-wrapper"><canvas class="lab-canvas" aria-label="${id} diagram"></canvas><div class="lab-primary"></div></div><div class="panel"><h3>Parameters</h3>${controls}${select}</div><div class="panel"><h3>Math model</h3><div class="equation-display lab-formula"></div><div class="lab-results"></div></div></div></section>`;
    const update = () => { const p = numberValues(host); const selector = host.querySelector('select[data-key]'); if(selector) p[selector.dataset.key] = selector.value; host.querySelectorAll('input[data-key]').forEach(input => { const label = host.querySelector(`#lab-${input.dataset.key}`); if (label) label.textContent = input.value; }); const result=calculate(id,p); host.querySelector('.lab-primary').textContent=result.primary; host.querySelector('.lab-formula').textContent=result.formula; host.querySelector('.lab-results').innerHTML=result.rows.map(([a,b])=>`<div class="result-row"><span class="result-label">${a}</span><span class="result-value">${b}</span></div>`).join(''); draw(id,host.querySelector('.lab-canvas'),p); };
    host.querySelectorAll('[data-key]').forEach(control => control.addEventListener('input', update));
    update();
  }
  root.mechanicsLabs = { has: (id) => labIds.has(id), render };
})(window);
