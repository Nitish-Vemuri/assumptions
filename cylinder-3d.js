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

const viewer = document.getElementById('viewer');
const dbgProcess = document.getElementById('dbgProcess');
const dbgAction = document.getElementById('dbgAction');
const dbgRatio = document.getElementById('dbgRatio');
const dbgConfidence = document.getElementById('dbgConfidence');
const dbgRaw = document.getElementById('dbgRaw');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3f5f8);
scene.fog = new THREE.Fog(0xf3f5f8, 12, 28);

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
  color: 0xcfe5ff,
  roughness: 0.38,
  metalness: 0.12,
  side: THREE.DoubleSide,
  transparent: true,
  opacity: 0.9
});

const gasMaterial = new THREE.MeshPhysicalMaterial({
  color: 0x4ea4ff,
  roughness: 0.18,
  metalness: 0.1,
  transparent: true,
  opacity: 0.7
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
  color: 0xff9500,
  emissive: 0x3a1c00,
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

const pressureArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0.4, 0), 3.5, 0xff9500, 0.9, 0.45);
scene.add(pressureArrow);

const heatArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(-1.8, 0.8, 0), 2.4, 0x34c759, 0.75, 0.35);
scene.add(heatArrow);

const displacementArrow = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, -2.2, 0), 2.8, 0x0071e3, 0.85, 0.4);
scene.add(displacementArrow);

const axis = new THREE.AxesHelper(3.5);
axis.position.set(0, -4.4, 0);
scene.add(axis);

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
  gasConstantKPaM3PerK: 0.04
};

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
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) { const v = v1 + (maxV - v1) * i / 60; const px = x(v), py = y(p1 * v1 / v); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.strokeStyle = '#0071e3'; ctx.lineWidth = 2.5; ctx.stroke();
  if (currentV >= v1) { ctx.beginPath(); ctx.moveTo(x(v1), height - pad.bottom); for (let i=0;i<=40;i++) { const v=v1+(currentV-v1)*i/40; ctx.lineTo(x(v), y(p1*v1/v)); } ctx.lineTo(x(currentV), height-pad.bottom); ctx.closePath(); ctx.fillStyle='rgba(0,113,227,0.14)'; ctx.fill(); }
  ctx.beginPath(); ctx.arc(x(currentV), y(p1 / ratio), 4, 0, Math.PI * 2); ctx.fillStyle = '#ff9500'; ctx.fill();
};

const configureProblem = (problem) => {
  if (!problem) return;
  problemState = { ...problemState, ...problem };
  problemState.gasConstantKPaM3PerK = problemState.initialPressureKPa * problemState.initialVolumeM3 / problemState.temperatureK;
  currentProcess = 'isothermal';
  syncProblemInputs();
  const targetRatio = problemState.finalVolumeM3 / problemState.initialVolumeM3;
  volumeSlider.value = Math.max(Number(volumeSlider.min), Math.min(Number(volumeSlider.max), targetRatio));
  setTutorExplanation('isothermal');
  updateModel();
};

const checkpoints = [
  { id: 1, text: 'Define the system: Identify the gas, piston, and boundaries.' },
  { id: 2, text: 'Set the process: ask for isothermal, adiabatic, compression, or expansion.' },
  { id: 3, text: 'Compare assumptions: ideal-gas vs real-gas, and how the model changes.' },
  { id: 4, text: 'Reflect: What happens to pressure, volume, and temperature?' }
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
  const processTriggers = /(isothermal|adiabatic|constant temperature|no heat exchange|adiabat)/i;
  if (processTriggers.test(lower)) {
    const parsed = parsePromptWithDebug(prompt);
    if (parsed && parsed.process) {
      setTutorExplanation(parsed.process);
      // use applyParameters so visuals and internal state update consistently
      applyParameters(parsed);
      if (parsed.problem) {
        const work = parsed.problem.initialPressureKPa * parsed.problem.initialVolumeM3 * Math.log(parsed.problem.finalVolumeM3 / parsed.problem.initialVolumeM3);
        chatMessage('bot', `Loaded the isothermal, quasi-static problem. The ideal-gas work output is ${work.toFixed(2)} kJ; use the controls to explore the coupled pressure-volume path.`);
      } else {
        chatMessage('bot', `Set process: ${parsed.process}. I didn't change volume — try adding a range, e.g. "from 2 L to 5 L ${parsed.process}".`);
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
    configureProblem(params.problem);
    if (lastParse) { lastParse.applied = true; updateDebugDisplay(); }
    return true;
  }
  if (typeof params.ratio === 'number') {
    const r = Math.max(0.3, Math.min(1.7, params.ratio));
    volumeSlider.value = r;
    updateModel();
  }
  // if process provided, update state pill text
  if (params.process) {
    currentProcess = params.process;
    setTutorExplanation(currentProcess);
    // update visuals related to process immediately
    if (currentProcess === 'isothermal') {
      gasMaterial.color.setHex(0x4ea4ff);
      heatArrow.visible = true;
    } else if (currentProcess === 'adiabatic') {
      gasMaterial.color.setHex(0xffb86b);
      heatArrow.visible = false;
    }
    statePill.textContent = currentProcess + ' (' + (Number(volumeSlider.value).toFixed(2)) + 'x)';
  }
  // mark lastParse as applied and update debug view
  if (lastParse) {
    lastParse.applied = true;
    updateDebugDisplay();
  }
  return true;
};

const updateModel = () => {
  const ratio = Number(volumeSlider.value);

  const gasHeightMin = 2.3;
  const gasHeightMax = 5.1;
  const gasHeight = THREE.MathUtils.mapLinear(ratio, 0.3, 1.7, gasHeightMin, gasHeightMax);
  const pistonY = -3.2 + gasHeight + 0.5;

  gasVolume.scale.y = gasHeight / 4.6;
  gasVolume.position.y = -3.2 + gasHeight / 2;
  piston.position.y = pistonY;

  const isProblemIsothermal = currentProcess === 'isothermal';
  const pressure = isProblemIsothermal
    ? problemState.initialPressureKPa / ratio
    : THREE.MathUtils.mapLinear(ratio, 0.3, 2.5, 1.7, 0.6);
  // temperature mapping depends on process: isothermal -> constant, adiabatic -> steeper change
  let temperature;
  if (currentProcess === 'isothermal') {
    temperature = problemState.temperatureK;
  } else if (currentProcess === 'adiabatic') {
    temperature = THREE.MathUtils.mapLinear(ratio, 0.3, 1.7, 380, 210);
  } else {
    temperature = THREE.MathUtils.mapLinear(ratio, 0.3, 1.7, 335, 255);
  }

  pressureArrow.position.set(0, gasVolume.position.y - 0.2, 0);
  pressureArrow.setLength(1.5 + (1.8 - pressure) * 1.2, 0.8, 0.45);
  pressureArrow.setDirection(new THREE.Vector3(0, 1, 0));

  heatArrow.position.set(-2.7, 0.9, 0.2);
  heatArrow.setDirection(new THREE.Vector3(1, 0, 0));
  heatArrow.setLength(1.9, 0.7, 0.35);

  displacementArrow.position.set(0, -2.6, 0);
  displacementArrow.setDirection(new THREE.Vector3(0, 1, 0));
  displacementArrow.setLength(2.2 + (ratio - 1) * 1.8, 0.85, 0.4);

  const actualVolume = problemState.initialVolumeM3 * ratio;
  const workKJ = isProblemIsothermal ? problemState.initialPressureKPa * problemState.initialVolumeM3 * Math.log(ratio) : 0;
  volumeLabel.textContent = isProblemIsothermal ? `${actualVolume.toFixed(4)} m³` : `${ratio.toFixed(2)}x`;
  volumeStat.textContent = isProblemIsothermal ? `${actualVolume.toFixed(4)} m³` : `${ratio.toFixed(2)}`;
  pressureStat.textContent = isProblemIsothermal ? `${pressure.toFixed(0)} kPa` : `${pressure.toFixed(2)}`;
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
  if (isProblemIsothermal && workResult) {
    const targetWork = problemState.initialPressureKPa * problemState.initialVolumeM3 * Math.log(problemState.finalVolumeM3 / problemState.initialVolumeM3);
    const equilibrium = problemState.quasiStatic ? 'Pgas ≈ Pexternal at every step.' : 'Finite pressure difference: non-quasi-static path.';
    workResult.innerHTML = `<strong>Work output:</strong> ${workKJ.toFixed(2)} kJ now; ${targetWork.toFixed(2)} kJ at V₂.<br><span style="color:#5e5e63">${equilibrium}</span>`;
  }
  drawPV(ratio);
};

volumeSlider.addEventListener('input', updateModel);

[initialPressureInput, initialVolumeInput, finalVolumeInput, temperatureInput, quasiStaticToggle].forEach((input) => {
  input.addEventListener('input', () => { readProblemInputs(input); currentProcess = 'isothermal'; updateModel(); });
  input.addEventListener('change', () => { readProblemInputs(input); currentProcess = 'isothermal'; updateModel(); });
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
updateModel();
const initialPrompt = new URLSearchParams(window.location.search).get('prompt');
if (initialPrompt) {
  chatMessage('user', initialPrompt);
  handleAssistantPrompt(initialPrompt);
}
animate();
