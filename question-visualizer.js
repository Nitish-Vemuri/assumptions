const sampleQuestions = [
  'A piston-cylinder contains a gas at 100 kPa and 0.4 m³. It is compressed isothermally to 0.1 m³. Find the work done by the gas.',
  'A rigid tank contains air at 100 kPa and 300 K. It is heated to 600 K. Find final pressure.',
  'A heat engine operates between 600 K and 300 K. Find its maximum efficiency.',
  'An ideal gas is compressed adiabatically. Explain what happens to pressure and temperature.',
  'A piston-cylinder system undergoes isobaric expansion at constant pressure while 400 J of heat is added.',
  'A system experiences entropy change during a reversible process; calculate the entropy transfer.'
];

const hasAny = (text, words) => words.some((word) => text.includes(word));

const parseQuestion = (text = '') => {
  const lower = String(text).toLowerCase();
  const isRigidTank = !/piston|moving\s+boundary/.test(lower) && /(?:rigid|sealed|closed|fixed[-\s]?volume)\s+(?:tank|vessel|container)|\b(?:tank|vessel)\b/.test(lower);
  const hasPistonStops = /piston.*\bstop|\bstop(?:s|ped)?\b.*piston/.test(lower);

  let process = 'general physics problem';
  let template = 'general';

  if (hasPistonStops) {
    process = 'piston with stops: constant-pressure motion, then constant volume';
    template = 'piston-stops';
  } else if (isRigidTank) {
    process = 'rigid-tank constant-volume process';
    template = 'rigid-tank';
  } else if (hasAny(lower, ['isothermal', 'constant temperature', 'constant temp'])) {
    process = 'isothermal process';
    template = 'isothermal';
  } else if (hasAny(lower, ['adiabatic', 'no heat', 'heat exchange'])) {
    process = 'adiabatic process';
    template = 'adiabatic';
  } else if (hasAny(lower, ['isobaric', 'constant pressure', 'pressure remains constant'])) {
    process = 'isobaric process';
    template = 'isobaric';
  } else if (hasAny(lower, ['isochoric', 'constant volume', 'volume remains constant'])) {
    process = 'isochoric process';
    template = 'isochoric';
  } else if (lower.includes('polytropic')) {
    process = 'polytropic process';
    template = 'polytropic';
  } else if (hasAny(lower, ['heat engine', 'engine efficiency', 'maximum efficiency', 'carnot'])) {
    process = 'heat engine / efficiency problem';
    template = 'engine';
  } else if (hasAny(lower, ['entropy', 'second law', 'reversible process'])) {
    process = 'entropy and second-law process';
    template = 'entropy';
  } else if (hasAny(lower, ['incline', 'ramp', 'friction', 'coefficient of friction'])) {
    process = 'Newton’s laws with friction'; template = 'ramp';
  } else if (hasAny(lower, ['projectile', 'launch angle', 'range of the projectile'])) {
    process = 'two-dimensional projectile motion'; template = 'projectile';
  } else if (hasAny(lower, ['free fall', 'falling object', 'terminal velocity'])) {
    process = 'free-fall motion'; template = 'free-fall';
  } else if (lower.includes('pendulum')) {
    process = 'pendulum oscillation'; template = 'pendulum';
  } else if (hasAny(lower, ['spring', 'simple harmonic motion', 'oscillation'])) {
    process = 'mass-spring oscillation'; template = 'mass-spring';
  } else if (hasAny(lower, ['collision', 'momentum', 'impulse'])) {
    process = 'momentum and collision problem'; template = 'collisions';
  } else if (hasAny(lower, ['centripetal', 'circular motion'])) {
    process = 'uniform circular motion'; template = 'circular-motion';
  } else if (hasAny(lower, ['torque', 'rotational inertia', 'angular acceleration'])) {
    process = 'fixed-axis rotational motion'; template = 'rotation';
  } else if (hasAny(lower, ['static equilibrium', 'equilibrium', 'beam', 'lever'])) {
    process = 'static equilibrium'; template = 'statics';
  } else if (hasAny(lower, ['orbit', 'orbital', 'gravitation', 'gravity'])) {
    process = 'gravitation and orbital motion'; template = 'gravitation';
  } else if (hasAny(lower, ['fluid', 'buoyancy', 'bernoulli', 'hydrostatic'])) {
    process = 'fluid mechanics'; template = 'fluids';
  } else if (hasAny(lower, ['position', 'velocity', 'acceleration', 'constant acceleration'])) {
    process = 'one-dimensional kinematics'; template = 'kinematics-1d';
  } else if (hasAny(lower, ['work', 'kinetic energy', 'potential energy', 'conservation of energy'])) {
    process = 'work and energy'; template = 'work-energy';
  }

  let system = template === 'general' ? 'physical system' : 'closed gas system';
  if (isRigidTank) system = 'rigid tank system';
  else if (lower.includes('piston')) system = 'piston-cylinder system';
  if (lower.includes('engine')) system = 'heat engine';
  if (lower.includes('reservoir')) system = 'thermal reservoir system';
  if (template === 'ramp') system = 'block and inclined surface';
  if (template === 'collisions') system = 'two-object collision system';
  if (template === 'circular-motion') system = 'object in circular motion';
  if (template === 'rotation') system = 'rigid body about a fixed axis';
  if (template === 'statics') system = 'rigid body in equilibrium';
  if (template === 'gravitation') system = 'central body and orbiting object';
  if (template === 'fluids') system = 'fluid system';

  let target = 'work, pressure, or energy';
  if (hasAny(lower, ['efficiency', 'maximum efficiency', 'η'])) {
    target = 'efficiency';
  } else if (hasAny(lower, ['entropy', 'second law'])) {
    target = 'entropy';
  } else if (hasAny(lower, ['final pressure', 'find the pressure'])) {
    target = 'final pressure';
  } else if (hasAny(lower, ['final volume', 'find v2', 'find the volume'])) {
    target = 'final volume';
  } else if (hasAny(lower, ['final temperature', 'find the temperature'])) {
    target = 'final temperature';
  } else if (hasAny(lower, ['work', 'done by the gas', 'find the work'])) {
    target = 'work';
  } else if (hasAny(lower, ['temperature', 'pressure', 'heat'])) {
    target = 'temperature change';
  }

  const variables = [];
  if (hasAny(lower, ['volume', 'litre', 'liter', 'l'])) variables.push('Volume (V)');
  if (hasAny(lower, ['temperature', 'kelvin', 'k'])) variables.push('Temperature (T)');
  if (hasAny(lower, ['pressure', 'p'])) variables.push('Pressure (P)');
  if (hasAny(lower, ['work', 'done by'])) variables.push('Work (W)');
  if (hasAny(lower, ['heat', 'q'])) variables.push('Heat (Q)');
  if (hasAny(lower, ['entropy', 's'])) variables.push('Entropy (S)');
  if (variables.length === 0) variables.push('Problem variables extracted from the question');

  const assumptions = ['ideal gas assumptions', 'closed system'];
  if (template === 'rigid-tank') assumptions.push('rigid boundary: volume remains constant', 'boundary work is zero');
  if (template === 'isothermal') assumptions.push('temperature remains constant');
  if (template === 'adiabatic') assumptions.push('no heat exchange');
  if (template === 'engine') assumptions.push('heat flows between thermal reservoirs');
  if (template === 'isobaric') assumptions.push('pressure remains constant');
  if (template === 'isochoric') assumptions.push('volume remains constant');
  if (template === 'entropy') assumptions.push('reversible or near-equilibrium path');
  if (template === 'ramp') assumptions.push('uniform gravitational field');
  if (template === 'collisions') assumptions.push('negligible external impulse');
  if (template === 'circular-motion') assumptions.push('constant speed and radius');
  if (template === 'rotation') assumptions.push('fixed rotation axis');
  if (template === 'statics') assumptions.push('net force and net torque are zero');
  if (template === 'gravitation') assumptions.push('Newtonian two-body approximation');
  if (template === 'fluids') assumptions.push('steady incompressible flow');

  return { process, system, target, variables, assumptions, template };
};

const getExplanation = (info = {}) => {
  const template = info.template || 'general';

  if (template === 'isothermal') {
    return {
      formula: 'W = nRT ln(V2 / V1)',
      explanation: 'In an isothermal process, temperature stays constant, so the gas does work while absorbing or releasing heat to maintain that constant temperature. The area under the PV curve represents the useful work done.'
    };
  }

  if (template === 'adiabatic') {
    return {
      formula: 'PV^γ = constant',
      explanation: 'In an adiabatic process, no heat is exchanged with the surroundings. The gas does work by using its internal energy, so compression raises temperature and expansion lowers it.'
    };
  }

  if (template === 'engine') {
    return {
      formula: 'η = 1 − (Tc / Th)',
      explanation: 'A heat engine converts heat from a hot reservoir into work, but some heat must be rejected to the cold reservoir. That rejection is why a real engine can never reach 100% efficiency.'
    };
  }

  if (template === 'isobaric') {
    return {
      formula: 'W = PΔV',
      explanation: 'At constant pressure, the gas does work proportional to the change in volume. Heat added to the gas raises temperature while the process continues at fixed pressure.'
    };
  }

  if (template === 'isochoric') {
    return {
      formula: 'Q = nCvΔT',
      explanation: 'Because the volume is fixed, no boundary work is done. Any heat supplied changes the internal energy and therefore the temperature.'
    };
  }

  if (template === 'entropy') {
    return {
      formula: 'ΔS = ∫ δQ_rev / T',
      explanation: 'Entropy measures how energy disperses in a process. For a reversible path, the entropy change is linked to the heat transferred divided by the absolute temperature.'
    };
  }

  const mechanicsExplanations = {
    ramp: ['a = g(sin theta - mu_k cos theta)', 'Resolve gravity parallel to the ramp, then subtract kinetic friction when the block is sliding.'],
    projectile: ['x = v0 cos(theta)t; y = v0 sin(theta)t - 1/2 gt^2', 'Horizontal and vertical motion are analyzed separately when air resistance is neglected.'],
    'free-fall': ['v = v0 + gt', 'Near Earth, gravity gives a constant downward acceleration in the ideal model.'],
    pendulum: ['T = 2pi sqrt(L/g)', 'For small angles, a pendulum undergoes approximately simple harmonic motion.'],
    'mass-spring': ['F = -kx; T = 2pi sqrt(m/k)', 'A spring’s restoring force is proportional to its displacement from equilibrium.'],
    collisions: ['sum(p_initial) = sum(p_final)', 'Momentum is conserved for an isolated system during a collision.'],
    'circular-motion': ['a_c = v^2/r; F_c = mv^2/r', 'The required net force points inward, toward the center of the circular path.'],
    rotation: ['tau_net = I alpha', 'Net torque produces angular acceleration, just as net force produces linear acceleration.'],
    statics: ['sum(F) = 0; sum(tau) = 0', 'A body in static equilibrium has no linear or angular acceleration.'],
    gravitation: ['F = GMm/r^2', 'Newtonian gravity provides the inward force for an ideal circular orbit.'],
    fluids: ['P_g = rho gh; Q = Av', 'Fluid pressure increases with depth; continuity relates area and flow speed.'],
    'kinematics-1d': ['x = x0 + v0t + 1/2 at^2', 'For constant acceleration, position and velocity change predictably with time.'],
    'work-energy': ['W_net = Delta K', 'Net work changes kinetic energy; conservative forces can be represented by potential energy.']
  };
  if (mechanicsExplanations[template]) {
    return { formula: mechanicsExplanations[template][0], explanation: mechanicsExplanations[template][1] };
  }

  return {
    formula: 'ΔU = Q − W',
    explanation: 'This is a general thermodynamics problem. The central idea is the balance between heat added to the system, work done by the system, and the resulting change in internal energy.'
  };
};

const getMatchedModelUrl = (info = {}, question = '') => {
  const prompt = encodeURIComponent(question);
  if (info.template === 'rigid-tank') return `rigid-tank.html?v=rigid-tank-v3&prompt=${prompt}`;
  const pistonProcess = ['isothermal', 'adiabatic', 'isobaric', 'isochoric', 'polytropic', 'piston-stops'].includes(info.template);
  if (pistonProcess) return `cylinder-3d.html?v=trust-polish&prompt=${prompt}`;

  const modelMap = {
    engine: 'second-law',
    entropy: 'second-law',
    isobaric: 'thermo',
    isochoric: 'thermo',
    ramp: 'ramp', projectile: 'projectile', 'free-fall': 'free-fall', pendulum: 'pendulum', 'mass-spring': 'mass-spring',
    collisions: 'collisions', 'circular-motion': 'circular-motion', rotation: 'rotation', statics: 'statics',
    gravitation: 'gravitation', fluids: 'fluids', 'kinematics-1d': 'kinematics-1d', 'work-energy': 'work-energy',
    general: 'thermo'
  };
  return `index.html?model=${modelMap[info.template] || 'thermo'}`;
};

const getRigidTankRules = () => {
  if (typeof RigidTankRules !== 'undefined') return RigidTankRules;
  if (typeof require === 'function') return require('./rigid-tank-rules.js');
  return null;
};

const getPistonRules = () => {
  if (typeof PistonCylinderRules !== 'undefined') return PistonCylinderRules;
  if (typeof require === 'function') return require('./piston-cylinder-rules.js');
  return null;
};

const getModelReadiness = (text, info) => {
  if (info.template === 'general') {
    return { ready: false, message: 'I could not identify a supported physics process. Please name the process or describe the physical situation more clearly.' };
  }
  if (info.template === 'rigid-tank') {
    const rules = getRigidTankRules();
    if (!rules) return { ready: false, message: 'The rigid-tank rules did not load. Please refresh and try again.' };
    const contract = rules.solveRigidTankContract(rules.buildRigidTankContract(text));
    return contract.result.status === 'solved'
      ? { ready: true, message: '' }
      : { ready: false, message: `To build this rigid-tank model, add: ${contract.result.missing.join(', ')}.` };
  }
  const thermalProcess = ['isothermal', 'adiabatic', 'isobaric', 'isochoric', 'polytropic', 'piston-stops'].includes(info.template);
  if (info.system !== 'piston-cylinder system' && !thermalProcess) return { ready: true, message: '' };
  const pistonRules = getPistonRules();
  if (pistonRules) {
    const contract = pistonRules.solvePistonContract(pistonRules.buildPistonContract(text, { classroomMode: true }));
    if (contract.result.status === 'solved') return { ready: true, message: '' };
    return { ready: false, message: `To build this model, add: ${contract.result.missing.join(', ')}.` };
  }
  const parsed = typeof parsePrompt === 'function' ? parsePrompt(text, {}) : null;
  if (parsed && parsed.problem) return { ready: true, message: '' };
  return {
    ready: false,
    message: 'To build this piston-cylinder model, include the initial pressure and both the initial and final volumes. The stated process will be used as the textbook assumption.'
  };
};

const showClarification = (readiness) => {
  const message = document.getElementById('clarificationMessage');
  const openButton = document.getElementById('openMatchedModelBtn');
  if (!message || !openButton) return;
  message.textContent = readiness.message;
  message.classList.toggle('hidden', readiness.ready);
  openButton.disabled = !readiness.ready;
};

const renderVisualization = (info = {}) => {
  const box = typeof document !== 'undefined' ? document.getElementById('visualCanvas') : null;
  if (!box) return null;

  if (info.template === 'isothermal') {
    box.innerHTML = `
      <svg width="100%" height="220" viewBox="0 0 480 220" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:220px; background:linear-gradient(180deg,#f7f7f8,#eef3ff); border-radius: 16px;">
        <defs>
          <linearGradient id="cylBody" x1="0" x2="1">
            <stop offset="0%" stop-color="#dfefff"/>
            <stop offset="50%" stop-color="#bfe0ff"/>
            <stop offset="100%" stop-color="#9ac5f8"/>
          </linearGradient>
          <linearGradient id="gasFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="#8ec5ff" stop-opacity="0.85"/>
            <stop offset="100%" stop-color="#5fa4ff" stop-opacity="0.6"/>
          </linearGradient>
        </defs>

        <ellipse cx="240" cy="46" rx="120" ry="18" fill="#dfe5ee" stroke="#4a5568" stroke-width="2"/>
        <path d="M 120 46 L 120 150 Q 120 170, 140 170 L 340 170 Q 360 170, 360 150 L 360 46 Q 360 26, 340 26 L 140 26 Q 120 26, 120 46 Z" fill="url(#cylBody)" stroke="#1d1d1f" stroke-width="2"/>
        <ellipse cx="240" cy="150" rx="120" ry="18" fill="#b8c6d9" stroke="#1d1d1f" stroke-width="2"/>
        <path d="M 136 48 L 136 145 Q 136 155, 146 155 L 334 155 Q 344 155, 344 145 L 344 48 Q 344 38, 334 38 L 146 38 Q 136 38, 136 48 Z" fill="url(#gasFill)" opacity="0.9"/>
        <ellipse cx="240" cy="104" rx="92" ry="12" fill="#f4fbff" opacity="0.7"/>

        <ellipse cx="240" cy="118" rx="118" ry="18" fill="#2a2c30"/>
        <rect x="118" y="100" width="244" height="12" fill="#2a2c30" opacity="0.92"/>
        <text x="40" y="25" font-size="14" fill="#1d1d1f" font-weight="700">Piston-cylinder</text>
        <text x="46" y="192" font-size="12" fill="#1d1d1f">Volume increases</text>
        <text x="322" y="116" font-size="12" fill="#fff">Piston</text>
        <text x="260" y="72" font-size="12" fill="#1d1d1f">Gas</text>
        <text x="260" y="205" font-size="11" fill="#1d1d1f">T = constant</text>
        <path d="M 182 45 L 182 110" stroke="#ff9500" stroke-width="3" stroke-linecap="round"/>
        <path d="M 182 45 L 200 60" stroke="#ff9500" stroke-width="3" stroke-linecap="round"/>
        <path d="M 182 110 L 200 95" stroke="#ff9500" stroke-width="3" stroke-linecap="round"/>
        <text x="160" y="35" font-size="11" fill="#ff9500">P</text>
        <path d="M 95 175 L 385 175" stroke="#1d1d1f" stroke-width="2"/>
        <path d="M 95 175 L 105 170 M 105 175 L 95 180" stroke="#1d1d1f" stroke-width="2"/>
        <path d="M 385 175 L 375 170 M 375 175 L 385 180" stroke="#1d1d1f" stroke-width="2"/>
        <text x="200" y="194" font-size="11" fill="#1d1d1f">Volume</text>
      </svg>
    `;
    return box.innerHTML;
  }

  if (info.template === 'adiabatic') {
    box.innerHTML = `
      <svg width="100%" height="220" viewBox="0 0 480 220" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:220px; background:#f7f7f8; border-radius: 16px;">
        <rect x="35" y="30" width="300" height="130" fill="none" stroke="#1d1d1f" stroke-width="2"/>
        <path d="M 35 140 C 90 105, 130 70, 220 60 S 300 58, 335 35" fill="none" stroke="#0071e3" stroke-width="3"/>
        <path d="M 35 170 C 110 145, 175 120, 255 110 S 320 105, 335 85" fill="none" stroke="#ff9500" stroke-width="3" opacity="0.8"/>
        <text x="40" y="20" font-size="14" fill="#1d1d1f">Adiabatic process</text>
        <text x="40" y="200" font-size="12" fill="#1d1d1f">Volume</text>
        <text x="12" y="100" font-size="12" fill="#1d1d1f" transform="rotate(-90 12 100)">Pressure</text>
        <text x="350" y="116" font-size="12" fill="#1d1d1f">No heat exchange</text>
      </svg>
    `;
    return box.innerHTML;
  }

  if (info.template === 'engine') {
    box.innerHTML = `
      <svg width="100%" height="220" viewBox="0 0 480 220" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:220px; background:#f7f7f8; border-radius: 16px;">
        <rect x="70" y="80" width="100" height="70" rx="10" fill="#ff9500" opacity="0.8"/>
        <rect x="240" y="80" width="100" height="70" rx="10" fill="#0071e3" opacity="0.8"/>
        <path d="M 170 115 H 240" stroke="#1d1d1f" stroke-width="3" fill="none"/>
        <path d="M 340 115 H 390" stroke="#1d1d1f" stroke-width="3" fill="none"/>
        <text x="95" y="116" font-size="12" fill="#1d1d1f">Hot source</text>
        <text x="255" y="116" font-size="12" fill="#1d1d1f">Cold sink</text>
        <text x="180" y="86" font-size="12" fill="#1d1d1f">Q_in</text>
        <text x="350" y="86" font-size="12" fill="#1d1d1f">Q_out</text>
        <text x="170" y="155" font-size="12" fill="#1d1d1f">Work output</text>
      </svg>
    `;
    return box.innerHTML;
  }

  if (info.template === 'entropy') {
    box.innerHTML = `
      <svg width="100%" height="220" viewBox="0 0 480 220" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:220px; background:#f7f7f8; border-radius: 16px;">
        <path d="M 60 150 C 150 60, 210 110, 290 40 S 390 90, 420 80" fill="none" stroke="#0071e3" stroke-width="3"/>
        <path d="M 60 150 Q 180 170, 310 150 T 420 165" fill="none" stroke="#ff9500" stroke-width="3" opacity="0.8"/>
        <text x="40" y="20" font-size="14" fill="#1d1d1f">Entropy flow</text>
        <text x="40" y="200" font-size="12" fill="#1d1d1f">State path</text>
        <text x="345" y="110" font-size="12" fill="#1d1d1f">Disorder increases</text>
      </svg>
    `;
    return box.innerHTML;
  }

  const svg = `
    <svg width="100%" height="220" viewBox="0 0 480 220" xmlns="http://www.w3.org/2000/svg" style="width:100%; height:220px; background:#f7f7f8; border-radius: 16px;">
      <rect x="30" y="30" width="300" height="130" fill="none" stroke="#1d1d1f" stroke-width="2"/>
      <path d="M 30 160 Q 120 90, 200 110 T 330 100" fill="none" stroke="#0071e3" stroke-width="3"/>
      <rect x="300" y="70" width="34" height="80" fill="#0071e3" opacity="0.9"/>
      <text x="40" y="20" font-size="14" fill="#1d1d1f">${info.process}</text>
      <text x="40" y="200" font-size="12" fill="#1d1d1f">Volume</text>
      <text x="12" y="100" font-size="12" fill="#1d1d1f" transform="rotate(-90 12 100)">Pressure</text>
      <text x="350" y="115" font-size="12" fill="#1d1d1f">System: ${info.system}</text>
      <text x="350" y="135" font-size="12" fill="#1d1d1f">Target: ${info.target}</text>
    </svg>
  `;

  box.innerHTML = svg;
  return box.innerHTML;
};

const analyzeQuestion = () => {
  if (typeof document === 'undefined') {
    return null;
  }

  const input = document.getElementById('questionInput');
  const resultPanel = document.getElementById('resultPanel');
  if (!input || !resultPanel) return null;

  const text = input.value.trim();
  if (!text) return null;

  const info = parseQuestion(text);
  const readiness = getModelReadiness(text, info);

  document.getElementById('processTag').textContent = info.process;
  document.getElementById('systemTag').textContent = info.system;
  document.getElementById('targetTag').textContent = info.target;
  document.getElementById('variablesText').textContent = info.variables.join(', ');
  document.getElementById('assumptionsText').textContent = info.assumptions.join(', ');

  resultPanel.classList.remove('hidden');
  showClarification(readiness);
  return { info, readiness, matchedModelUrl: getMatchedModelUrl(info, text) };
};

const initializeVisualizer = () => {
  if (typeof document === 'undefined') return;

  const analyzeBtn = document.getElementById('analyzeBtn');
  if (!analyzeBtn) return;

  analyzeBtn.addEventListener('click', analyzeQuestion);

  const openMatchedModelBtn = document.getElementById('openMatchedModelBtn');
  if (openMatchedModelBtn) {
    openMatchedModelBtn.addEventListener('click', () => {
      const input = document.getElementById('questionInput');
      if (!input || !input.value.trim()) return;
      const info = parseQuestion(input.value);
      const readiness = getModelReadiness(input.value.trim(), info);
      if (!readiness.ready) {
        showClarification(readiness);
        return;
      }
      window.location.href = getMatchedModelUrl(info, input.value.trim());
    });
  }

  const sampleBtn = document.getElementById('sampleBtn');
  if (sampleBtn) {
    sampleBtn.addEventListener('click', () => {
      const input = document.getElementById('questionInput');
      if (!input) return;
      const idx = (sampleQuestions.indexOf(input.value.trim()) + 1) % sampleQuestions.length;
      input.value = sampleQuestions[idx];
      analyzeQuestion();
    });
  }

  analyzeQuestion();
};

const questionVisualizer = {
  sampleQuestions,
  parseQuestion,
  getExplanation,
  getMatchedModelUrl,
  getModelReadiness,
  renderVisualization,
  analyzeQuestion,
  initializeVisualizer
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = questionVisualizer;
}

if (typeof document !== 'undefined') {
  initializeVisualizer();
}
