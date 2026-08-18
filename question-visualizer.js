const sampleQuestions = [
  'A piston-cylinder system contains an ideal gas. The gas expands isothermally from 2 L to 5 L at 300 K. Find the work done by the gas.',
  'A heat engine operates between 600 K and 300 K. Find its maximum efficiency.',
  'An ideal gas is compressed adiabatically. Explain what happens to pressure and temperature.',
  'A piston-cylinder system undergoes isobaric expansion at constant pressure while 400 J of heat is added.',
  'A system experiences entropy change during a reversible process; calculate the entropy transfer.'
];

const hasAny = (text, words) => words.some((word) => text.includes(word));

const parseQuestion = (text = '') => {
  const lower = String(text).toLowerCase();

  let process = 'general thermodynamic process';
  let template = 'general';

  if (hasAny(lower, ['isothermal', 'constant temperature'])) {
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
  } else if (hasAny(lower, ['heat engine', 'engine efficiency', 'maximum efficiency', 'carnot'])) {
    process = 'heat engine / efficiency problem';
    template = 'engine';
  } else if (hasAny(lower, ['entropy', 'second law', 'reversible process'])) {
    process = 'entropy and second-law process';
    template = 'entropy';
  }

  let system = 'closed gas system';
  if (lower.includes('piston')) system = 'piston-cylinder system';
  if (lower.includes('engine')) system = 'heat engine';
  if (lower.includes('reservoir')) system = 'thermal reservoir system';

  let target = 'work, pressure, or energy';
  if (hasAny(lower, ['efficiency', 'maximum efficiency', 'η'])) {
    target = 'efficiency';
  } else if (hasAny(lower, ['entropy', 'second law'])) {
    target = 'entropy';
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
  if (template === 'isothermal') assumptions.push('temperature remains constant');
  if (template === 'adiabatic') assumptions.push('no heat exchange');
  if (template === 'engine') assumptions.push('heat flows between thermal reservoirs');
  if (template === 'isobaric') assumptions.push('pressure remains constant');
  if (template === 'isochoric') assumptions.push('volume remains constant');
  if (template === 'entropy') assumptions.push('reversible or near-equilibrium path');

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

  return {
    formula: 'ΔU = Q − W',
    explanation: 'This is a general thermodynamics problem. The central idea is the balance between heat added to the system, work done by the system, and the resulting change in internal energy.'
  };
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
  const explanation = getExplanation(info);

  document.getElementById('processTag').textContent = info.process;
  document.getElementById('systemTag').textContent = info.system;
  document.getElementById('targetTag').textContent = info.target;
  document.getElementById('variablesText').textContent = info.variables.join(', ');
  document.getElementById('assumptionsText').textContent = info.assumptions.join(', ');
  document.getElementById('explanationText').textContent = explanation.explanation;
  document.getElementById('formulaText').textContent = explanation.formula;

  resultPanel.classList.remove('hidden');
  renderVisualization(info);
  return { info, explanation };
};

const initializeVisualizer = () => {
  if (typeof document === 'undefined') return;

  const analyzeBtn = document.getElementById('analyzeBtn');
  if (!analyzeBtn) return;

  analyzeBtn.addEventListener('click', analyzeQuestion);

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

  document.querySelectorAll('[data-example]').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.example);
      const input = document.getElementById('questionInput');
      if (input && sampleQuestions[index]) {
        input.value = sampleQuestions[index];
        analyzeQuestion();
      }
    });
  });

  analyzeQuestion();
};

const questionVisualizer = {
  sampleQuestions,
  parseQuestion,
  getExplanation,
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
