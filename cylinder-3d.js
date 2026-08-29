const volumeSlider = document.getElementById('volumeSlider');
const volumeLabel = document.getElementById('volumeLabel');
const volumeStat = document.getElementById('volumeStat');
const pressureStat = document.getElementById('pressureStat');
const tempStat = document.getElementById('tempStat');
const statePill = document.getElementById('statePill');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const checkpointList = document.getElementById('checkpointList');
const tutorBox = document.getElementById('tutorBox');
const initialPressureInput = document.getElementById('initialPressureInput');
const initialVolumeInput = document.getElementById('initialVolumeInput');
const finalVolumeInput = document.getElementById('finalVolumeInput');
const temperatureInput = document.getElementById('temperatureInput');
const quasiStaticToggle = document.getElementById('quasiStaticToggle');
const workResult = document.getElementById('workResult');
const pvCanvas = document.getElementById('pvCanvas');
const tvCanvas = document.getElementById('tvCanvas');
const questionContext = document.getElementById('questionContext');
const playProcessBtn = document.getElementById('playProcessBtn');
const stepProcessBtn = document.getElementById('stepProcessBtn');
const resetProcessBtn = document.getElementById('resetProcessBtn');
const processStage = document.getElementById('processStage');
const problemTitle = document.getElementById('problemTitle');
const processRuleText = document.getElementById('processRuleText');

const viewer = document.getElementById('viewer');
const dbgProcess = document.getElementById('dbgProcess');
const dbgAction = document.getElementById('dbgAction');
const dbgRatio = document.getElementById('dbgRatio');
const dbgConfidence = document.getElementById('dbgConfidence');
const dbgRaw = document.getElementById('dbgRaw');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xfff8ed);
scene.fog = new THREE.Fog(0xfff8ed, 14, 30);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
viewer.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(7.5, 4.5, 9.5);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 18;
controls.target.set(0, 0, 0);

const ambient = new THREE.AmbientLight(0xffffff, 1.1);
scene.add(ambient);

const keyLight = new THREE.DirectionalLight(0xffffff, 1.5);
keyLight.position.set(6, 7, 8);
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xbad7ff, 0.6);
fillLight.position.set(-6, -3, -5);
scene.add(fillLight);

const cylinderGroup = new THREE.Group();
scene.add(cylinderGroup);

const wallMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x2e9a95,
  roughness: 0.38,
  metalness: 0.12,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.42
});

const gasMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x21b6c7,
  roughness: 0.18,
  metalness: 0.1,
  transparent: true,
  opacity: 0.62
});

const pistonMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x2d2d31,
  roughness: 0.26,
  metalness: 0.8,
  clearcoat: 0.5
});

const baseMaterial = new THREE.MeshStandardMaterial({
  color: 0x6d7580,
  roughness: 0.68,
  metalness: 0.3
});

const openRingMaterial = new THREE.MeshStandardMaterial({
  color: 0x243b53,
  emissive: 0x071523,
  roughness: 0.45,
  metalness: 0.4
});

const cylinderMesh = new THREE.Mesh(new THREE.CylinderGeometry(2.85, 2.85, 7.7, 64, 1, true), wallMaterial);
cylinderGroup.add(cylinderMesh);

const baseDisk = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 0.35, 64), baseMaterial);
baseDisk.position.y = -3.95;
cylinderGroup.add(baseDisk);

const pistonRing = new THREE.Mesh(new THREE.TorusGeometry(2.8, 0.17, 20, 64), openRingMaterial);
pistonRing.rotation.x = Math.PI / 2;
pistonRing.position.y = 3.8;
cylinderGroup.add(pistonRing);

const gasVolume = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.18, 4.6, 64, 1, true), gasMaterial);
const gasVolumeBaseY = -1.8;
gasVolume.position.y = gasVolumeBaseY + 2.3;
cylinderGroup.add(gasVolume);

const piston = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 0.48, 64), pistonMaterial);
piston.position.y = 3.1;
cylinderGroup.add(piston);

const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 5.4, 18), new THREE.MeshStandardMaterial({ color: 0x8ea3b3, metalness: 0.82, roughness: 0.4 }));
rod.rotation.z = Math.PI / 2;
rod.rotation.x = Math.PI / 2;
rod.position.y = 0.2;
cylinderGroup.add(rod);

const pressureArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(-3.25, -2.5, 0.4), 3.5, 0xff5a36, 1.2, 0.6);
scene.add(pressureArrow);

const heatArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(-3.6, 0.8, 0), 2.4, 0x008a3f, 1.05, 0.5);
scene.add(heatArrow);

const displacementArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -2.2, 0), 2.8, 0x005bd1, 1.1, 0.55);
scene.add(displacementArrow);

const externalPressureArrow = new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), new THREE.Vector3(2.2, 4.1, 0), 1.3, 0x6f2dbd, 1.05, 0.5);
scene.add(externalPressureArrow);

const makeArrowLabel = (text, color) => {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(1.55, 0.39, 1);
  sprite.userData = { canvas, context, texture, color, text: '' };
  scene.add(sprite);
  setArrowLabel(sprite, text);
  return sprite;
};

const setArrowLabel = (sprite, text) => {
  if (sprite.userData.text === text) return;
  const { canvas, context, texture, color } = sprite.userData;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.font = '700 34px system-ui';
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillStyle = 'rgba(255,255,255,0.88)';
  context.fillRect(4, 4, canvas.width - 8, canvas.height - 8);
  context.fillStyle = color;
  context.fillText(text, canvas.width / 2, canvas.height / 2 + 1);
  texture.needsUpdate = true;
  sprite.userData.text = text;
};

const setArrowLabelColor = (sprite, color) => {
  if (sprite.userData.color === color) return;
  sprite.userData.color = color;
  sprite.userData.text = '';
};

const pressureLabel = makeArrowLabel('P₍gas₎', '#b42318');
const heatLabel = makeArrowLabel('Qᵢₙ', '#087443');
const displacementLabel = makeArrowLabel('Wₒᵤₜ', '#005bd1');
const externalPressureLabel = makeArrowLabel('P₍ext₎', '#6f2dbd');

const axis = new THREE.AxesHelper(3.5);
axis.position.set(0, -4.4, 0);
scene.add(axis);

// Contract-driven geometry: a stop ring and dimension guide are only shown
// when the parsed scene declares a piston stop.
const stopAnnotations = new THREE.Group();
const stopRing = new THREE.Mesh(new THREE.TorusGeometry(2.7, 0.12, 16, 64), new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0x5d3200, metalness: 0.35, roughness: 0.38 }));
stopRing.rotation.x = Math.PI / 2;
const stopGuide = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-3.05, -3.85, 0), new THREE.Vector3(-3.05, -0.4, 0)]), new THREE.LineDashedMaterial({ color: 0xd97706, dashSize: 0.14, gapSize: 0.08 }));
stopGuide.computeLineDistances();
stopAnnotations.add(stopRing, stopGuide);
stopAnnotations.visible = false;
scene.add(stopAnnotations);
const stopBaseDimensionLabel = makeArrowLabel('', '#9a5b00');
const stopGapDimensionLabel = makeArrowLabel('', '#9a5b00');

const chatMessage = (role, text) => {
  const node = document.createElement('div');
  node.className = `chat-message ${role}`;
  node.textContent = text;
  chatWindow.appendChild(node);
  chatWindow.scrollTop = chatWindow.scrollHeight;
};

// current process state (null | 'isothermal' | 'adiabatic')
let currentProcess = null;
let lastParse = null;
let problemState = {
  initialPressureKPa: 800,
  initialVolumeM3: 0.015,
  finalVolumeM3: 0.030,
  temperatureK: 300,
  quasiStatic: true,
  quasiStaticInferred: false,
  requestedQuantity: 'boundary_work',
  requestedTarget: 'W',
  polytropicExponent: 1.3,
  gasConstantKPaM3PerK: 0.04,
  process: 'isothermal'
};
let processRunning = false;
let lastAnimationTime = null;

const finite = (value, fallback) => Number.isFinite(Number(value)) && Number(value) > 0 ? Number(value) : fallback;

const syncProblemInputs = () => {
  initialPressureInput.value = problemState.initialPressureKPa;
  initialVolumeInput.value = problemState.initialVolumeM3;
  finalVolumeInput.value = problemState.finalVolumeM3;
  temperatureInput.value = problemState.temperatureK;
  quasiStaticToggle.checked = problemState.quasiStatic;
};

const readProblemInputs = (changedInput) => {
  const fixedGasConstant = problemState.gasConstantKPaM3PerK || (problemState.initialPressureKPa * problemState.initialVolumeM3 / problemState.temperatureK);
  problemState.initialPressureKPa = finite(initialPressureInput.value, problemState.initialPressureKPa);
  problemState.initialVolumeM3 = finite(initialVolumeInput.value, problemState.initialVolumeM3);
  problemState.finalVolumeM3 = finite(finalVolumeInput.value, problemState.finalVolumeM3);
  problemState.temperatureK = finite(temperatureInput.value, problemState.temperatureK);
  problemState.quasiStatic = quasiStaticToggle.checked;
  if (changedInput === temperatureInput) {
    problemState.initialPressureKPa = fixedGasConstant * problemState.temperatureK / problemState.initialVolumeM3;
    initialPressureInput.value = problemState.initialPressureKPa.toFixed(1);
  } else {
    problemState.gasConstantKPaM3PerK = problemState.initialPressureKPa * problemState.initialVolumeM3 / problemState.temperatureK;
  }
  updateVolumeRange();
};

const updateVolumeRange = () => {
  const targetRatio = problemState.finalVolumeM3 / problemState.initialVolumeM3;
  // The slider represents the stated process path, not an open-ended volume
  // control. Its endpoints are exactly V1 and V2 from the matched question.
  volumeSlider.min = Math.min(1, targetRatio).toFixed(4);
  volumeSlider.max = Math.max(1, targetRatio).toFixed(4);
};

const drawPV = (ratio) => {
  if (!pvCanvas) return;
  const rect = pvCanvas.getBoundingClientRect();
  const width = Math.max(280, Math.round(rect.width));
  const height = 120;
  pvCanvas.width = width * Math.min(window.devicePixelRatio, 2);
  pvCanvas.height = height * Math.min(window.devicePixelRatio, 2);
  const ctx = pvCanvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio, 2);
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);
  const pad = { left: 38, right: 10, top: 12, bottom: 25 };
  const v1 = problemState.initialVolumeM3;
  const maxV = Math.max(problemState.finalVolumeM3, v1 * 2.5, v1 * ratio) * 1.08;
  const p1 = problemState.initialPressureKPa;
  const x = (v) => pad.left + ((v - v1 * 0.5) / (maxV - v1 * 0.5)) * (width - pad.left - pad.right);
  const y = (p) => height - pad.bottom - (p / (p1 * 1.12)) * (height - pad.top - pad.bottom);
  ctx.strokeStyle = '#8b8b91'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, height - pad.bottom); ctx.lineTo(width - pad.right, height - pad.bottom); ctx.stroke();
  ctx.fillStyle = '#6e6e73'; ctx.font = '10px system-ui'; ctx.fillText('P', 9, 17); ctx.fillText('V', width - 12, height - 8);
  const currentV = v1 * ratio;
  const exponent = problemState.process === 'adiabatic' ? 1.4 : problemState.process === 'polytropic' ? problemState.polytropicExponent : problemState.process === 'isobaric' ? 0 : 1;
  ctx.strokeStyle = '#005bd1'; ctx.lineWidth = 2.5;
  if (problemState.process === 'isochoric') {
    ctx.beginPath(); ctx.moveTo(x(v1), pad.top); ctx.lineTo(x(v1), height - pad.bottom); ctx.stroke();
    ctx.fillStyle = '#6e6e73'; ctx.fillText('V = constant', x(v1) + 5, pad.top + 12);
  } else {
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) { const v = v1 + (maxV - v1) * i / 60; const px = x(v), py = y(p1 * (v1 / v) ** exponent); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    if (currentV >= v1 && problemState.quasiStatic) { ctx.beginPath(); ctx.moveTo(x(v1), height - pad.bottom); for (let i=0;i<=40;i++) { const v=v1+(currentV-v1)*i/40; ctx.lineTo(x(v), y(p1*(v1/v)**exponent)); } ctx.lineTo(x(currentV), height-pad.bottom); ctx.closePath(); ctx.fillStyle='rgba(0,91,209,0.16)'; ctx.fill(); }
  }
  ctx.beginPath(); ctx.arc(x(currentV), y(p1 * ratio ** -exponent), 4.5, 0, Math.PI * 2); ctx.fillStyle = '#ff5a36'; ctx.fill();
  if (problemState.stopLimited) {
    const Tstop = problemState.stopTemperatureK;
    const finalPressure = p1 * problemState.finalLockedTemperatureK / Tstop;
    ctx.setLineDash([4, 3]); ctx.strokeStyle = '#d97706'; ctx.beginPath(); ctx.moveTo(x(problemState.finalVolumeM3), y(p1)); ctx.lineTo(x(problemState.finalVolumeM3), y(finalPressure)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#9a5b00'; ctx.fillText('stops: V constant', x(problemState.finalVolumeM3) + 5, y(finalPressure) - 6);
  }
};

const drawTV = (ratio) => {
  if (!tvCanvas) return;
  const rect = tvCanvas.getBoundingClientRect();
  const width = Math.max(280, Math.round(rect.width));
  const height = 120;
  const dpr = Math.min(window.devicePixelRatio, 2);
  tvCanvas.width = width * dpr; tvCanvas.height = height * dpr;
  const ctx = tvCanvas.getContext('2d');
  ctx.scale(dpr, dpr); ctx.clearRect(0, 0, width, height);
  const pad = { left: 38, right: 10, top: 12, bottom: 25 };
  const v1 = problemState.initialVolumeM3;
  const v2 = problemState.finalVolumeM3;
  const t1 = problemState.temperatureK;
  const process = problemState.process;
  const gamma = 1.4;
  const temperatureAt = (volume) => {
    const r = volume / v1;
    if (process === 'adiabatic') return t1 * r ** (1 - gamma);
    if (process === 'isobaric') return t1 * r;
    if (process === 'polytropic') return t1 * r ** (1 - problemState.polytropicExponent);
    return t1;
  };
  const t2 = temperatureAt(v2);
  const minV = Math.min(v1, v2) * 0.88;
  const maxV = Math.max(v1, v2) * 1.12;
  const minT = problemState.stopLimited ? Math.min(t1, t2, problemState.finalLockedTemperatureK) * 0.9 : process === 'isochoric' ? t1 * 0.7 : Math.min(t1, t2) * 0.9;
  const maxT = process === 'isochoric' ? t1 * 1.3 : Math.max(t1, t2) * 1.1;
  const x = (volume) => pad.left + ((volume - minV) / (maxV - minV)) * (width - pad.left - pad.right);
  const y = (temperature) => height - pad.bottom - ((temperature - minT) / (maxT - minT)) * (height - pad.top - pad.bottom);
  ctx.strokeStyle = '#8b8b91'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(pad.left, pad.top); ctx.lineTo(pad.left, height - pad.bottom); ctx.lineTo(width - pad.right, height - pad.bottom); ctx.stroke();
  ctx.fillStyle = '#6e6e73'; ctx.font = '10px system-ui'; ctx.fillText('T', 10, 17); ctx.fillText('V', width - 12, height - 8);
  ctx.strokeStyle = '#0f766e'; ctx.lineWidth = 2.5; ctx.beginPath();
  if (process === 'isochoric') {
    ctx.moveTo(x(v1), y(minT + (maxT - minT) * 0.12)); ctx.lineTo(x(v1), y(minT + (maxT - minT) * 0.88));
    ctx.fillStyle = '#6e6e73'; ctx.fillText('V = constant', x(v1) + 6, pad.top + 12);
  } else {
    for (let i = 0; i <= 60; i++) {
      const volume = v1 + (v2 - v1) * i / 60;
      i ? ctx.lineTo(x(volume), y(temperatureAt(volume))) : ctx.moveTo(x(volume), y(temperatureAt(volume)));
    }
  }
  ctx.stroke();
  const currentV = v1 * ratio;
  const currentT = temperatureAt(currentV);
  ctx.beginPath(); ctx.arc(x(currentV), y(currentT), 4.5, 0, Math.PI * 2); ctx.fillStyle = '#f97316'; ctx.fill();
  if (problemState.stopLimited) {
    ctx.setLineDash([4, 3]); ctx.strokeStyle = '#d97706'; ctx.beginPath(); ctx.moveTo(x(v2), y(t2)); ctx.lineTo(x(v2), y(problemState.finalLockedTemperatureK)); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#9a5b00'; ctx.fillText('locked cooling', x(v2) + 5, y(problemState.finalLockedTemperatureK) - 6);
  }
  if (process === 'isothermal') { ctx.fillStyle = '#0f766e'; ctx.fillText('T = constant', x(v1) + 6, y(t1) - 7); }
};

const configureProblem = (problem, sourceText = '') => {
  if (!problem) return;
  problemState = { ...problemState, ...problem };
  // Do not silently substitute an irreversible constant-load path for a
  // textbook problem whose work is determined from its isothermal end states.
  if (problemState.quasiStaticInferred) problemState.quasiStatic = true;
  problemState.gasConstantKPaM3PerK = problemState.initialPressureKPa * problemState.initialVolumeM3 / problemState.temperatureK;
  problemState.process = problem.process || 'isothermal';
  currentProcess = problemState.process;
  syncProblemInputs();
  quasiStaticToggle.disabled = problemState.quasiStaticInferred;
  const targetRatio = problemState.finalVolumeM3 / problemState.initialVolumeM3;
  updateVolumeRange();
  // A matched question should begin at V1. The replay then makes the state
  // change visible instead of dropping the student directly at V2.
  volumeSlider.value = 1;
  volumeSlider.disabled = problemState.process === 'isochoric';
  if (volumeSlider.disabled) volumeSlider.value = 1;
  updateProcessControls();
  if (sourceText && questionContext) questionContext.textContent = `Matched question: ${sourceText}`;
  if (problemTitle) problemTitle.textContent = `${problemState.process[0].toUpperCase() + problemState.process.slice(1)} piston-cylinder model`;
  setTutorExplanation(problemState.process);
  updateModel();
};

const configureContract = (contract) => {
  const { states, process, parameters, assumptions, target, scene: contractScene } = contract;
  const targetMap = { P2: 'final_pressure', V2: 'final_volume', T2: 'final_temperature', W: 'boundary_work' };
  const stopLimited = process === 'piston_stops';
  configureProblem({
    initialPressureKPa: states.P1,
    // Stop locations give a volume ratio, not an absolute volume. Use a visual
    // scale only; the rule engine keeps the physical answer on a mass basis.
    initialVolumeM3: stopLimited ? 0.30 : states.V1,
    finalVolumeM3: stopLimited ? 0.30 * states.V2 / states.V1 : states.V2,
    temperatureK: states.T1 || 300,
    process: stopLimited ? 'isobaric' : process,
    polytropicExponent: parameters.polytropicExponent || 1.3,
    quasiStatic: assumptions.applied.includes('quasi_static'),
    quasiStaticInferred: assumptions.defaults.includes('quasi_static'),
    requestedQuantity: targetMap[target] || 'state_property',
    requestedTarget: target || 'W',
    stopLimited,
    sceneContract: contractScene || null,
    stopTemperatureK: contract.derived && contract.derived.Tstop,
    finalLockedTemperatureK: states.T2,
    specificWorkKJPerKg: contract.result.value
  }, contract.source);
  if (stopLimited && problemTitle) problemTitle.textContent = 'Piston with stops model';
  if (processRuleText) {
    processRuleText.textContent = `${contract.processRules.constraints.join('; ')}. ${contract.assumptions.applied.includes('ideal_gas') ? 'Ideal-gas model applied.' : ''}`;
  }
};

const playMatchedProcess = () => {
  if (problemState.process === 'isochoric') return;
  volumeSlider.value = 1;
  processRunning = true;
  playProcessBtn.textContent = 'Pause process';
  processStage.textContent = 'Starting from the given initial state: watch the piston, pressure, and process condition change together.';
  updateModel();
};

const updateProcessControls = () => {
  const locked = problemState.process === 'isochoric';
  if (locked) processRunning = false;
  playProcessBtn.disabled = locked;
  stepProcessBtn.disabled = locked;
  playProcessBtn.textContent = locked ? 'Piston locked' : 'Play process';
  playProcessBtn.style.opacity = locked ? '0.55' : '1';
  stepProcessBtn.style.opacity = locked ? '0.55' : '1';
};

const setProcessStage = (ratio) => {
  if (problemState.stopLimited) {
    const target = problemState.finalVolumeM3 / problemState.initialVolumeM3;
    if (ratio <= target + 0.005) processStage.textContent = `Piston reaches the stops: it is now locked. Cooling continues at constant volume to ${Math.round(problemState.finalLockedTemperatureK)} K, with no additional boundary work.`;
    else processStage.textContent = 'Stage 1: cooling moves the piston down at constant pressure until it contacts the stops.';
    return;
  }
  if (problemState.process === 'isochoric') {
    processStage.textContent = 'Isochoric constraint: the piston is locked, volume is fixed, and boundary work is zero.';
    return;
  }
  const target = problemState.finalVolumeM3 / problemState.initialVolumeM3;
  const progress = target === 1 ? 1 : (ratio - 1) / (target - 1);
  if (progress <= 0.02) {
    processStage.textContent = 'Initial state: inspect P₁, V₁, and T before the piston moves.';
  } else if (progress >= 0.98) {
    processStage.textContent = 'Final state: compare P₂ and V₂; read the completed work from the shaded PV area.';
  } else if (problemState.quasiStatic) {
    processStage.textContent = problemState.process === 'adiabatic'
      ? 'Quasi-static adiabatic step: Pgas ≈ Pexternal while no heat crosses the boundary.'
      : 'Quasi-static isothermal step: Pgas ≈ Pexternal while heat enters to hold T constant.';
  } else {
    processStage.textContent = 'Non-quasi-static comparison: a finite pressure difference drives the piston.';
  }
};

const checkpoints = [
  { id: 1, text: 'Predict: as the gas expands at constant temperature, will pressure rise or fall?' },
  { id: 2, text: 'Observe: play or step the process and follow the orange point on the PV diagram.' },
  { id: 3, text: 'Explain: heat enters while the gas does work, keeping the ideal-gas temperature constant.' },
  { id: 4, text: 'Compare: turn off quasi-static behavior to see why the reversible PV area no longer applies.' }
];

const tutorDefinitions = {
  isothermal: {
    title: 'Isothermal',
    text: 'Definition: temperature remains constant during the process. In a piston-cylinder, the gas can expand or compress while the temperature stays fixed, so pressure adjusts according to the gas law.'
  },
  adiabatic: {
    title: 'Adiabatic',
    text: 'Definition: no heat is exchanged with the surroundings. The gas temperature changes because work is done on or by the gas, even though no heat enters or leaves.'
  },
  compression: {
    title: 'Compression',
    text: 'Definition: the piston moves inward, decreasing volume and increasing pressure. In the model, the gas volume shrinks and the piston moves down.'
  },
  expansion: {
    title: 'Expansion',
    text: 'Definition: the piston moves outward and the gas volume increases. Pressure falls as the gas expands.'
  },
  default: {
    title: 'System assumption',
    text: 'Definition: an assumption is a simplification we make to model the real world. Here we compare idealized textbook conditions with more realistic behavior.'
  }
};

const renderCheckpoints = () => {
  if (!checkpointList) return;
  checkpointList.innerHTML = checkpoints.map((item) => `
    <li class="checkpoint-item">
      <span class="checkpoint-badge">${item.id}</span>
      <span class="checkpoint-copy">${item.text}</span>
    </li>
  `).join('');
};

const setTutorExplanation = (key) => {
  if (!tutorBox) return;
  const content = tutorDefinitions[key] || tutorDefinitions.default;
  tutorBox.innerHTML = `<strong>${content.title}</strong>${content.text}`;
};

const updateDebugDisplay = () => {
  if (!dbgProcess) return;
  dbgProcess.textContent = currentProcess || '-';
  if (lastParse) {
    dbgAction.textContent = lastParse.action || '-';
    dbgRatio.textContent = (typeof lastParse.ratio === 'number') ? lastParse.ratio.toFixed(3) : '-';
    dbgConfidence.textContent = (typeof lastParse.confidence === 'number') ? lastParse.confidence.toFixed(2) : '-';
    dbgRaw.textContent = lastParse.raw || '-';
  } else {
    dbgAction.textContent = '-';
    dbgRatio.textContent = '-';
    dbgConfidence.textContent = '-';
    dbgRaw.textContent = '-';
  }
};

const handleAssistantPrompt = (raw) => {
  const prompt = String(raw || '').trim();
  if (!prompt) return;

  const lower = prompt.toLowerCase();

  // Canonical question-to-model path. The shared rule engine builds a typed
  // contract, solves the requested state/work value, then configures this one renderer.
  if (typeof PistonCylinderRules !== 'undefined') {
    const contract = PistonCylinderRules.solvePistonContract(
      PistonCylinderRules.buildPistonContract(prompt, { classroomMode: true })
    );
    if (contract.result.status === 'solved') {
      configureContract(contract);
      const label = contract.target === 'W' ? 'boundary work' : contract.target;
      chatMessage('bot', `Loaded the ${contract.process} model. Requested result: ${label} = ${contract.result.value.toFixed(3)} ${contract.result.units || ''}.`);
      return;
    }
    if (contract.process && contract.result.status === 'insufficient_information') {
      chatMessage('bot', `I need ${contract.result.missing.join(', ')} before I can build a reliable ${contract.process} model.`);
      return;
    }
  }

  // If user asks model-building style prompts, try to parse parameters and apply to scene
  const buildTriggers = /build|draw|show|make|create|set|apply|model|visual/i;
  const wantsBuild = buildTriggers.test(lower);

  if (wantsBuild) {
    const parsed = parsePromptWithDebug(prompt);
    if (parsed && parsed.action === 'apply') {
      applyParameters(parsed);
      const desc = [];
      if (parsed.process) desc.push(parsed.process);
      if (parsed.ratio) desc.push(`volume ${parsed.ratio.toFixed(2)}x`);
      chatMessage('bot', `Built piston-cylinder example (${desc.join(', ')}). Use the slider to fine-tune.`);
      return;
    }
    // if parser returned a process (e.g. "isothermal") without geometric params, apply the process state
    if (parsed && parsed.process) {
      statePill.textContent = parsed.process + ' (' + (Number(volumeSlider.value).toFixed(2)) + 'x)';
      chatMessage('bot', `Set process: ${parsed.process}. I didn't change volume — try "from 2 L to 5 L ${parsed.process}" to apply a volume change.`);
      return;
    }
    // if parser returned but low confidence or couldn't figure parameters, ask for clarification when confidence is low
    if (parsed && parsed.confidence < 0.6) {
      chatMessage('bot', 'I detected an intent but I\'m not confident. Do you mean expand, compress, or set an absolute volume? Example: "from 2 L to 5 L isothermally".');
      return;
    }
    chatMessage('bot', 'I understood you want the model updated, but I could not extract clear parameters. Try: "Expand from 2 L to 5 L isothermally" or "Set volume to 1.2x".');
    return;
  }

  // Recognize process-only prompts like "isothermal" or "adiabatic"
  const processTriggers = /(isothermal|adiabatic|isobaric|isochoric|polytropic|constant temperature|constant temp|constant pressure|constant volume|no heat exchange|adiabat)/i;
  if (processTriggers.test(lower)) {
    const parsed = parsePromptWithDebug(prompt);
    if (parsed && parsed.process) {
      setTutorExplanation(parsed.process);
      // use applyParameters so visuals and internal state update consistently
      applyParameters(parsed);
      if (parsed.problem) {
        const ratio = parsed.problem.finalVolumeM3 / parsed.problem.initialVolumeM3;
        const exponent = parsed.problem.process === 'adiabatic' ? 1.4 : parsed.problem.process === 'polytropic' ? 1.3 : parsed.problem.process === 'isobaric' ? 0 : 1;
        const finalPressure = parsed.problem.initialPressureKPa * ratio ** -exponent;
        const answer = parsed.problem.requestedQuantity === 'final_pressure'
          ? `The requested final pressure is P₂ = ${finalPressure.toFixed(2)} kPa.`
          : parsed.problem.requestedQuantity === 'final_volume'
            ? `The requested final volume is V₂ = ${parsed.problem.finalVolumeM3.toFixed(5)} m³.`
          : parsed.problem.requestedQuantity === 'final_temperature'
            ? 'The requested final temperature is displayed in the result panel.'
            : 'The requested boundary work is displayed in the result panel.';
        chatMessage('bot', `Loaded the matched ${parsed.problem.process} problem. ${answer}`);
      } else {
        const processAnswers = {
          isothermal: 'Temperature stays constant. For an ideal gas, PV stays constant; heat entering balances the work during expansion.',
          adiabatic: 'No heat crosses the cylinder boundary (Q = 0). Expansion lowers both pressure and temperature; compression raises them.',
          isobaric: 'Pressure stays constant. As volume changes, temperature changes in proportion for an ideal gas, and boundary work is W = PΔV.',
          isochoric: 'The piston is locked, so volume is constant and boundary work is zero. Heat transfer changes internal energy, pressure, and temperature.',
          polytropic: 'A polytropic process follows PVⁿ = constant. The exponent n identifies the particular idealized path.'
        };
        chatMessage('bot', `${parsed.process}: ${processAnswers[parsed.process] || 'I can explain this process, but need more state information to build a precise path.'}`);
      }
      return;
    }
  }

  const supported = /cylinder|piston|pressure|volume|expand|compress|thermo|heat|gas|work/.test(lower);

  if (supported) {
    const msg = 'This prototype currently focuses on a single piston-cylinder model. In the current setup, pushing the piston compresses the gas, raises pressure, and reduces volume; pulling it out expands the gas and lowers pressure. Try asking me to build a case: "Expand from 2 L to 5 L isothermally".';
    const processKey = currentProcess || (lower.includes('isothermal') ? 'isothermal' : lower.includes('adiabatic') ? 'adiabatic' : lower.includes('compress') ? 'compression' : lower.includes('expand') ? 'expansion' : null);
    if (processKey) setTutorExplanation(processKey);
    chatMessage('bot', msg);
  } else {
    setTutorExplanation('default');
    chatMessage('bot', 'We are still building support for that prompt. For now, this prototype is limited to the piston-cylinder example and thermodynamic basics around compression, expansion, pressure, and volume.');
  }
};

// Parser is provided by parser.js (portable module). Use it via parsePrompt(text, { volume })

// wrapper to record lastParse and update debug display
// wrapper to call portable parser with context and record debug info
const parsePromptWithDebug = (text) => {
  // parsePrompt is provided by parser.js and expects (text, context)
  const ctx = { volume: Number(volumeSlider.value), defaultVolumeLiters: 3.0 };
  const res = (typeof parsePrompt === 'function') ? parsePrompt(text, ctx) : { action: 'none', confidence: 0 };
  res.raw = String(text || '');
  lastParse = res;
  updateDebugDisplay();
  return res;
};

const applyParameters = (params) => {
  if (!params || typeof params !== 'object') return false;
  if (params.problem) {
    configureProblem(params.problem, lastParse && lastParse.raw);
    if (lastParse) { lastParse.applied = true; updateDebugDisplay(); }
    return true;
  }
  if (typeof params.ratio === 'number') {
    const r = Math.max(Number(volumeSlider.min), Math.min(Number(volumeSlider.max), params.ratio));
    volumeSlider.value = r;
    updateModel();
  }
  // if process provided, update state pill text
  if (params.process) {
    currentProcess = params.process;
    problemState.process = currentProcess;
    const lockedVolume = currentProcess === 'isochoric';
    volumeSlider.disabled = lockedVolume;
    if (lockedVolume) volumeSlider.value = 1;
    updateProcessControls();
    setTutorExplanation(currentProcess);
    if (problemTitle) problemTitle.textContent = `${currentProcess[0].toUpperCase() + currentProcess.slice(1)} piston-cylinder model`;
    // update visuals related to process immediately
    if (currentProcess === 'isothermal') {
      gasMaterial.color.setHex(0x4ea4ff);
      heatArrow.visible = true;
    } else if (currentProcess === 'adiabatic') {
      gasMaterial.color.setHex(0xffb86b);
      heatArrow.visible = false;
    } else if (currentProcess === 'isobaric') {
      gasMaterial.color.setHex(0x3e7cb1);
      heatArrow.visible = true;
    } else if (currentProcess === 'isochoric') {
      gasMaterial.color.setHex(0x7d5ba6);
      heatArrow.visible = true;
    }
    statePill.textContent = currentProcess + ' (' + (Number(volumeSlider.value).toFixed(2)) + 'x)';
    updateModel();
  }
  // mark lastParse as applied and update debug view
  if (lastParse) {
    lastParse.applied = true;
    updateDebugDisplay();
  }
  return true;
};

const updateModel = () => {
  if (problemState.quasiStaticInferred) {
    problemState.quasiStatic = true;
    quasiStaticToggle.checked = true;
  }
  const ratio = Number(volumeSlider.value);

  const gasHeightMin = 2.3;
  const gasHeightMax = 5.1;
  const gasHeight = THREE.MathUtils.mapLinear(ratio, Number(volumeSlider.min), Number(volumeSlider.max), gasHeightMin, gasHeightMax);
  const pistonY = -3.2 + gasHeight + 0.5;

  gasVolume.scale.y = gasHeight / 4.6;
  gasVolume.position.y = -3.2 + gasHeight / 2;
  piston.position.y = pistonY;

  const stopGeometry = problemState.sceneContract && problemState.sceneContract.geometry;
  const declaredStop = stopGeometry && stopGeometry.stops && stopGeometry.stops[0];
  if (problemState.stopLimited && declaredStop) {
    const stopRatio = problemState.finalVolumeM3 / problemState.initialVolumeM3;
    const stopGasHeight = THREE.MathUtils.mapLinear(stopRatio, Number(volumeSlider.min), Number(volumeSlider.max), gasHeightMin, gasHeightMax);
    const stopY = -3.2 + stopGasHeight + 0.5;
    stopAnnotations.visible = true;
    stopRing.position.y = stopY;
    stopGuide.geometry.setFromPoints([new THREE.Vector3(-3.05, -3.85, 0), new THREE.Vector3(-3.05, stopY, 0)]);
    stopGuide.computeLineDistances();
    stopBaseDimensionLabel.visible = true;
    stopGapDimensionLabel.visible = true;
    stopBaseDimensionLabel.position.set(-3.75, (-3.85 + stopY) / 2, 0);
    stopGapDimensionLabel.position.set(3.45, (stopY + pistonY) / 2, 0);
    setArrowLabel(stopBaseDimensionLabel, `${declaredStop.heightM} m: base to stop`);
    setArrowLabel(stopGapDimensionLabel, `${stopGeometry.pistonInitialHeightM - declaredStop.heightM} m: piston to stop`);
  } else {
    stopAnnotations.visible = false;
    stopBaseDimensionLabel.visible = false;
    stopGapDimensionLabel.visible = false;
  }

  const isProblemIsothermal = currentProcess === 'isothermal';
  const isProblemAdiabatic = currentProcess === 'adiabatic';
  const isProblemIsobaric = currentProcess === 'isobaric';
  const isProblemIsochoric = currentProcess === 'isochoric';
  const isProblemPolytropic = currentProcess === 'polytropic';
  const gamma = 1.4;
  const exponent = isProblemAdiabatic ? gamma : isProblemPolytropic ? problemState.polytropicExponent : isProblemIsobaric ? 0 : 1;
  const pressure = problemState.initialPressureKPa * ratio ** -exponent;
  const temperature = isProblemAdiabatic ? problemState.temperatureK * ratio ** (1 - gamma)
    : isProblemIsobaric ? problemState.temperatureK * ratio
    : isProblemPolytropic ? problemState.temperatureK * ratio ** (1 - problemState.polytropicExponent)
    : problemState.temperatureK;

  // Color is a reading aid, not decoration: cool means pressure has fallen;
  // warm means it has risen. The neutral tone is the initial state.
  const pressureRatio = pressure / problemState.initialPressureKPa;
  const pressureColor = new THREE.Color(0x21b6c7);
  if (pressureRatio > 1) {
    pressureColor.lerp(new THREE.Color(0xf06449), Math.min(1, (pressureRatio - 1) * 0.75));
  } else {
    pressureColor.lerp(new THREE.Color(0x72b7df), Math.min(1, (1 - pressureRatio) * 1.25));
  }
  gasMaterial.color.copy(pressureColor);
  pressureArrow.setColor(pressureRatio > 1 ? 0xd9472f : pressureRatio < 1 ? 0x287bb7 : 0xff5a36);
  setArrowLabelColor(pressureLabel, pressureRatio > 1 ? '#b42318' : pressureRatio < 1 ? '#1769aa' : '#b42318');

  // Keep the gas-pressure arrow outside the transparent wall so it remains visible.
  pressureArrow.position.set(-3.25, pistonY - 3.4, 0.4);
  pressureArrow.setLength(1.2 + Math.min(1.5, pressure / problemState.initialPressureKPa * 1.5), 1.0, 0.5);
  pressureArrow.setDirection(new THREE.Vector3(0, 1, 0));
  pressureLabel.position.set(-3.25, pistonY - 0.9, 0.4);
  setArrowLabel(pressureLabel, 'P₍gas₎');

  const expansion = problemState.finalVolumeM3 >= problemState.initialVolumeM3;
  const heatEnters = !isProblemAdiabatic && expansion;
  if (heatEnters) {
    gasMaterial.emissive.setHex(0xffb000);
    gasMaterial.emissiveIntensity = 0.28;
    heatArrow.setColor(0xe59a00);
    setArrowLabelColor(heatLabel, '#a96700');
  } else if (isProblemAdiabatic) {
    gasMaterial.emissive.setHex(0x000000);
    gasMaterial.emissiveIntensity = 0;
    heatArrow.setColor(0x8a959e);
    setArrowLabelColor(heatLabel, '#68737c');
  } else {
    gasMaterial.emissive.setHex(0x2f83bd);
    gasMaterial.emissiveIntensity = 0.14;
    heatArrow.setColor(0x2f83bd);
    setArrowLabelColor(heatLabel, '#1769aa');
  }

  heatArrow.position.set(heatEnters ? -2.7 : -0.8, 0.9, 0.2);
  heatArrow.setDirection(new THREE.Vector3(heatEnters ? 1 : -1, 0, 0));
  heatArrow.setLength(1.9, 0.9, 0.45);
  heatLabel.position.set(-1.7, 1.35, 0.2);
  heatLabel.visible = true;
  setArrowLabel(heatLabel, isProblemAdiabatic ? 'Q = 0' : heatEnters ? 'Qᵢₙ' : 'Qₒᵤₜ');

  displacementArrow.position.set(0, -2.6, 0);
  displacementArrow.setDirection(new THREE.Vector3(0, 1, 0));
  displacementArrow.setLength(Math.max(1.1, 2.0 + (ratio - 1) * 1.6), 1.0, 0.5);
  displacementLabel.position.set(0.65, -1.05, 0);
  setArrowLabel(displacementLabel, expansion ? 'Wₒᵤₜ' : 'Wᵢₙ');

  const actualVolume = problemState.initialVolumeM3 * ratio;
  const targetRatio = problemState.finalVolumeM3 / problemState.initialVolumeM3;
  const externalPressure = problemState.quasiStatic ? pressure : problemState.initialPressureKPa * targetRatio ** -exponent;
  const reversibleWork = isProblemIsochoric ? 0 : isProblemIsothermal
    ? problemState.initialPressureKPa * problemState.initialVolumeM3 * Math.log(ratio)
    : isProblemIsobaric ? problemState.initialPressureKPa * (actualVolume - problemState.initialVolumeM3)
    : problemState.initialPressureKPa * problemState.initialVolumeM3 * (1 - ratio ** (1 - exponent)) / (exponent - 1);
  const workKJ = problemState.quasiStatic ? reversibleWork : externalPressure * (actualVolume - problemState.initialVolumeM3);
  volumeLabel.textContent = isProblemIsothermal ? `${actualVolume.toFixed(4)} m³` : `${ratio.toFixed(2)}x`;
  volumeStat.textContent = isProblemIsothermal ? `${actualVolume.toFixed(4)} m³` : `${ratio.toFixed(2)}`;
  pressureStat.textContent = isProblemIsothermal ? `${pressure.toFixed(0)} kPa` : `${pressure.toFixed(2)}`;
  // Use physical units for both supported process types.
  volumeLabel.textContent = `${actualVolume.toFixed(4)} m³`;
  volumeStat.textContent = `${actualVolume.toFixed(4)} m³`;
  pressureStat.textContent = `${pressure.toFixed(0)} kPa`;
  tempStat.textContent = `${Math.round(temperature)} K`;
  const compressed = ratio < 1;
  // Preserve currentProcess in the state pill if set
  if (currentProcess) {
    statePill.textContent = `${currentProcess} — ${compressed ? 'compression' : 'expansion'}`;
  } else {
    statePill.textContent = compressed ? 'Piston pressed: compression' : 'Piston pulled: expansion';
  }
  statePill.style.background = compressed ? 'rgba(255, 149, 0, 0.09)' : 'rgba(52, 199, 89, 0.1)';
  statePill.style.setProperty('--blue', compressed ? '#ff9500' : '#34c759');
  statePill.style.color = '#1d1d1f';
  if (workResult) {
    const targetReversibleWork = isProblemIsochoric ? 0 : isProblemIsothermal
      ? problemState.initialPressureKPa * problemState.initialVolumeM3 * Math.log(targetRatio)
      : isProblemIsobaric ? problemState.initialPressureKPa * (problemState.finalVolumeM3 - problemState.initialVolumeM3)
      : problemState.initialPressureKPa * problemState.initialVolumeM3 * (1 - targetRatio ** (1 - exponent)) / (exponent - 1);
    const targetWork = problemState.quasiStatic ? targetReversibleWork : externalPressure * (problemState.finalVolumeM3 - problemState.initialVolumeM3);
    const equilibrium = problemState.quasiStatic
      ? `Pgas = Pexternal = ${pressure.toFixed(0)} kPa in this equilibrium step.`
      : `Pgas = ${pressure.toFixed(0)} kPa; Pexternal = ${externalPressure.toFixed(0)} kPa (illustrative constant-load comparison).`;
    const heatText = isProblemIsochoric
      ? 'Isochoric: the piston is locked, so boundary work is zero; heat changes internal energy, pressure, and temperature.'
      : isProblemIsothermal
      ? (problemState.quasiStatic ? `Heat enters: Q_in = W_out = ${workKJ.toFixed(2)} kJ, so temperature stays constant.` : 'The temperature is held fixed for comparison; the reversible PV-area rule is not used.')
      : isProblemAdiabatic ? 'Adiabatic: Q = 0. The gas cools during expansion as internal energy supplies the work.'
      : isProblemIsobaric ? 'Isobaric: pressure stays constant while temperature changes with volume.'
      : 'Polytropic reference path: PV^n = constant (shown here with n = 1.3).';
    workResult.innerHTML = `<strong>Work output:</strong> ${workKJ.toFixed(2)} kJ now; ${targetWork.toFixed(2)} kJ at V₂.<br><span style="color:#5e5e63">${equilibrium}<br>${heatText}</span>`;
  }
  // State the sign convention explicitly; this avoids calling negative compression work "output".
  if (workResult) {
    const targetReversibleWorkForLabel = isProblemIsochoric ? 0 : isProblemIsothermal
      ? problemState.initialPressureKPa * problemState.initialVolumeM3 * Math.log(targetRatio)
      : isProblemIsobaric ? problemState.initialPressureKPa * (problemState.finalVolumeM3 - problemState.initialVolumeM3)
      : problemState.initialPressureKPa * problemState.initialVolumeM3 * (1 - targetRatio ** (1 - exponent)) / (exponent - 1);
    const targetWorkForLabel = problemState.quasiStatic ? targetReversibleWorkForLabel : externalPressure * (problemState.finalVolumeM3 - problemState.initialVolumeM3);
    const workMeaning = workKJ < 0
      ? `Compression: ${Math.abs(workKJ).toFixed(2)} kJ of work is required on the gas.`
      : 'Expansion: the gas delivers work to the surroundings.';
    const inferred = problemState.quasiStaticInferred && problemState.quasiStatic
      ? '<br>Textbook assumption applied: quasi-static ideal-gas path, required to calculate boundary work from the stated end states.'
      : '';
    const equilibriumSummary = problemState.quasiStatic
      ? `Pgas = Pexternal = ${pressure.toFixed(0)} kPa in this equilibrium step.`
      : `Pgas = ${pressure.toFixed(0)} kPa; Pexternal = ${externalPressure.toFixed(0)} kPa (constant-load comparison).`;
    const heatSummary = isProblemIsothermal
      ? 'Isothermal: heat transfer balances the boundary work, so temperature remains constant.'
      : isProblemAdiabatic ? 'Adiabatic: Q = 0; internal energy changes as the gas does work.'
      : isProblemIsochoric ? 'Isochoric: boundary work is zero because the piston is locked.'
      : isProblemIsobaric ? 'Isobaric: pressure remains constant while volume and temperature change.'
      : 'Polytropic: the displayed path follows PV^n = constant.';
    const finalPressure = problemState.initialPressureKPa * targetRatio ** -exponent;
    const finalTemperature = isProblemAdiabatic ? problemState.temperatureK * targetRatio ** (1 - gamma)
      : isProblemIsobaric ? problemState.temperatureK * targetRatio
      : isProblemPolytropic ? problemState.temperatureK * targetRatio ** (1 - problemState.polytropicExponent)
      : problemState.temperatureK;
    const stateTargetValues = {
      P1: [problemState.initialPressureKPa, 'kPa'], V1: [problemState.initialVolumeM3, 'm³'], T1: [problemState.temperatureK, 'K'],
      P2: [finalPressure, 'kPa'], V2: [problemState.finalVolumeM3, 'm³'], T2: [finalTemperature, 'K']
    };
    const stateTarget = stateTargetValues[problemState.requestedTarget];
    const requestedResult = stateTarget
      ? `<strong>Requested ${problemState.requestedTarget}:</strong> ${stateTarget[0].toFixed(stateTarget[1] === 'm³' ? 5 : 2)} ${stateTarget[1]}.<br><span style="color:#5e5e63">The ${problemState.process} relation determines this state value from the values supplied in the question.</span>`
      : problemState.requestedQuantity === 'final_pressure'
      ? `<strong>Final pressure P₂:</strong> ${finalPressure.toFixed(2)} kPa.<br><span style="color:#5e5e63">For this ${problemState.process} path, the final-state relation gives P₂ = ${finalPressure.toFixed(2)} kPa.</span>`
      : problemState.requestedQuantity === 'final_volume'
        ? `<strong>Final volume V₂:</strong> ${problemState.finalVolumeM3.toFixed(5)} m³.<br><span style="color:#5e5e63">For this ${problemState.process} path, the final-state relation gives V₂ = ${problemState.finalVolumeM3.toFixed(5)} m³.</span>`
      : problemState.requestedQuantity === 'final_temperature'
        ? `<strong>Final temperature T₂:</strong> ${finalTemperature.toFixed(2)} K.<br><span style="color:#5e5e63">This follows the stated ${problemState.process} path.</span>`
        : `<strong>Boundary work (by gas):</strong> ${workKJ.toFixed(2)} kJ now; ${targetWorkForLabel.toFixed(2)} kJ at final volume.<br><span style="color:#5e5e63">${workMeaning}<br>${equilibriumSummary}<br>${heatSummary}${inferred}</span>`;
    workResult.innerHTML = requestedResult;
  }
  if (workResult && problemState.stopLimited) {
    workResult.innerHTML = `<strong>Requested |specific work|:</strong> ${Math.abs(problemState.specificWorkKJPerKg).toFixed(2)} kJ/kg.<br><span style="color:#5e5e63">Stage 1: constant-pressure compression until the piston hits the stops. Stage 2: constant-volume cooling, so its boundary work is zero.</span>`;
  }
  heatArrow.visible = !isProblemAdiabatic;
  heatArrow.setLength(1.2 + Math.min(1.5, Math.abs(workKJ) * 0.12), 0.55, 0.28);
  externalPressureArrow.position.set(2.2, pistonY + 1.4, 0);
  externalPressureArrow.setLength(1.0 + Math.min(1.4, externalPressure / problemState.initialPressureKPa * 1.4), 0.9, 0.42);
  externalPressureLabel.position.set(2.2, pistonY + 0.7, 0);
  setArrowLabel(externalPressureLabel, 'P₍ext₎');
  setProcessStage(ratio);
  drawPV(ratio);
  drawTV(ratio);
};

volumeSlider.addEventListener('input', updateModel);

playProcessBtn.addEventListener('click', () => {
  const targetRatio = problemState.finalVolumeM3 / problemState.initialVolumeM3;
  if (Number(volumeSlider.value) >= targetRatio - 0.005) volumeSlider.value = 1;
  processRunning = !processRunning;
  playProcessBtn.textContent = processRunning ? 'Pause process' : 'Play process';
  updateModel();
});

stepProcessBtn.addEventListener('click', () => {
  const targetRatio = problemState.finalVolumeM3 / problemState.initialVolumeM3;
  const direction = targetRatio >= 1 ? 1 : -1;
  volumeSlider.value = Math.max(Number(volumeSlider.min), Math.min(Number(volumeSlider.max), Number(volumeSlider.value) + direction * 0.1));
  updateModel();
});

resetProcessBtn.addEventListener('click', () => {
  processRunning = false;
  playProcessBtn.textContent = 'Play process';
  volumeSlider.value = 1;
  updateModel();
});

[initialPressureInput, initialVolumeInput, finalVolumeInput, temperatureInput, quasiStaticToggle].forEach((input) => {
  input.addEventListener('input', () => { readProblemInputs(input); currentProcess = problemState.process; updateModel(); });
  input.addEventListener('change', () => { readProblemInputs(input); currentProcess = problemState.process; updateModel(); });
});

chatSend.addEventListener('click', () => {
  const value = chatInput.value.trim();
  if (!value) return;
  chatMessage('user', value);
  handleAssistantPrompt(value);
  chatInput.value = '';
});

chatInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    chatSend.click();
  }
});

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  if (processRunning) {
    const elapsed = lastAnimationTime ? (now - lastAnimationTime) / 1000 : 0;
    const targetRatio = problemState.finalVolumeM3 / problemState.initialVolumeM3;
    const direction = targetRatio >= 1 ? 1 : -1;
    const speed = problemState.quasiStatic ? 0.32 : 0.7;
    const next = Number(volumeSlider.value) + direction * speed * elapsed;
    const finished = direction > 0 ? next >= targetRatio : next <= targetRatio;
    volumeSlider.value = finished ? targetRatio : Math.max(Number(volumeSlider.min), Math.min(Number(volumeSlider.max), next));
    updateModel();
    if (finished) { processRunning = false; playProcessBtn.textContent = 'Replay process'; }
  }
  lastAnimationTime = now;
  controls.update();
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

renderCheckpoints();
setTutorExplanation('default');
syncProblemInputs();
currentProcess = 'isothermal';
updateProcessControls();
updateModel();
const initialPrompt = new URLSearchParams(window.location.search).get('prompt');
if (initialPrompt) {
  chatMessage('user', initialPrompt);
  handleAssistantPrompt(initialPrompt);
  // Give the initial state one rendered frame before moving the piston.
  if (lastParse && lastParse.problem) window.setTimeout(playMatchedProcess, 650);
}
animate();
