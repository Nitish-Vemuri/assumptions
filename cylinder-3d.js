const volumeSlider = document.getElementById('volumeSlider');
const volumeLabel = document.getElementById('volumeLabel');
const volumeStat = document.getElementById('volumeStat');
const pressureStat = document.getElementById('pressureStat');
const tempStat = document.getElementById('tempStat');
const statePill = document.getElementById('statePill');
const chatWindow = document.getElementById('chatWindow');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');

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
      // use applyParameters so visuals and internal state update consistently
      applyParameters(parsed);
      chatMessage('bot', `Set process: ${parsed.process}. I didn't change volume — try adding a range, e.g. "from 2 L to 5 L ${parsed.process}".`);
      return;
    }
  }

  const supported = /cylinder|piston|pressure|volume|expand|compress|thermo|heat|gas|work/.test(lower);

  if (supported) {
    chatMessage('bot', 'This prototype currently focuses on a single piston-cylinder model. In the current setup, pushing the piston compresses the gas, raises pressure, and reduces volume; pulling it out expands the gas and lowers pressure. Try asking me to build a case: "Expand from 2 L to 5 L isothermally".');
  } else {
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
  if (typeof params.ratio === 'number') {
    const r = Math.max(0.3, Math.min(1.7, params.ratio));
    volumeSlider.value = r;
    updateModel();
  }
  // if process provided, update state pill text
  if (params.process) {
    currentProcess = params.process;
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

  const pressure = THREE.MathUtils.mapLinear(ratio, 0.3, 1.7, 1.7, 0.75);
  // temperature mapping depends on process: isothermal -> constant, adiabatic -> steeper change
  let temperature;
  if (currentProcess === 'isothermal') {
    temperature = 300; // keep a nominal constant temperature for isothermal
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

  volumeLabel.textContent = `${ratio.toFixed(2)}x`;
  volumeStat.textContent = `${ratio.toFixed(2)}`;
  pressureStat.textContent = `${pressure.toFixed(2)}`;
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
};

volumeSlider.addEventListener('input', updateModel);

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

updateModel();
animate();
