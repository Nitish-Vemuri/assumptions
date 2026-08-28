// Deterministic rules for introductory ideal-gas rigid-tank questions.
// A rigid, closed tank has fixed volume, so P/T is constant for a fixed mass.
(function(root) {
  const pressurePattern = /(\d+(?:\.\d+)?)\s*(mpa|kpa|pa)\b/gi;
  const temperaturePattern = /(\d+(?:\.\d+)?)\s*(k|°\s*c|celsius|(?:deg(?:ree)?s?\s*)?c)\b/gi;
  const volumePattern = /(\d+(?:\.\d+)?)\s*(m\^?3|m3|cm\^?3|cm3|(?:cubic\s*)?(?:meters?|metres?)\s*(?:cube|cubed)|l|liters?|litres?)/gi;
  const toKPa = (value, unit) => unit.toLowerCase() === 'mpa' ? value * 1000 : unit.toLowerCase() === 'pa' ? value / 1000 : value;
  const toKelvin = (value, unit) => unit.toLowerCase().replace(/\s+/g, '') === 'k' ? value : value + 273.15;
  const toM3 = (value, unit) => {
    const normalized = unit.toLowerCase().replace(/\s+/g, '');
    if (normalized === 'l' || normalized.startsWith('liter') || normalized.startsWith('litre')) return value / 1000;
    if (normalized.startsWith('cm')) return value / 1000000;
    return value;
  };
  const values = (text, pattern, convert) => [...text.matchAll(pattern)].map((match) => convert(Number(match[1]), match[2]));
  const known = (value) => Number.isFinite(value) && value > 0;

  const isRigidTankQuestion = (text) => {
    const source = String(text || '');
    return !/piston|moving\s+boundary/i.test(source)
      && /(?:rigid|sealed|closed|fixed[-\s]?volume)\s+(?:tank|vessel|container)|\b(?:tank|vessel)\b/i.test(source);
  };

  const detectTarget = (text) => {
    const lower = String(text || '').toLowerCase();
    if (/boundary work|work done|\bwork\b/.test(lower)) return 'W';
    const symbol = lower.match(/\b([pt])([12])\b/);
    if (symbol) return `${symbol[1].toUpperCase()}${symbol[2]}`;
    const words = lower.match(/(?:find|calculate|determine|what is)\s+(?:the\s+)?(?:(initial|final)\s+)?(pressure|temperature)/);
    if (!words) return null;
    return `${words[2][0].toUpperCase()}${words[1] === 'initial' ? '1' : '2'}`;
  };

  function buildRigidTankContract(question) {
    const source = String(question || '').trim();
    const pressures = values(source, pressurePattern, toKPa);
    const temperatures = values(source, temperaturePattern, toKelvin);
    const volumes = values(source, volumePattern, toM3);
    const target = detectTarget(source);
    const states = {
      P1: target === 'P1' && pressures.length === 1 ? null : pressures[0] ?? null,
      P2: target === 'P1' && pressures.length === 1 ? pressures[0] : pressures[1] ?? null,
      T1: target === 'T1' && temperatures.length === 1 ? null : temperatures[0] ?? null,
      T2: target === 'T1' && temperatures.length === 1 ? temperatures[0] : temperatures[1] ?? null,
      V: volumes[0] ?? null
    };
    return {
      system: isRigidTankQuestion(source) ? 'rigid_tank' : 'unsupported',
      source,
      process: 'isochoric',
      target,
      states,
      assumptions: {
        stated: ['rigid_container'],
        defaults: ['closed_system', 'ideal_gas', 'negligible_ke_pe'],
        applied: ['rigid_container', 'closed_system', 'ideal_gas', 'negligible_ke_pe']
      },
      processRules: { constraints: ['V = constant', 'W_boundary = 0'], equation: 'P1 / T1 = P2 / T2' },
      result: { status: isRigidTankQuestion(source) ? 'ready_to_solve' : 'unsupported', missing: [] }
    };
  }

  function solveRigidTankContract(input) {
    const contract = JSON.parse(JSON.stringify(input));
    if (contract.system !== 'rigid_tank') return contract;
    const s = contract.states;
    const stateNames = ['P1', 'T1', 'P2', 'T2'];
    const missingStates = stateNames.filter((name) => !known(s[name]));
    if (missingStates.length === 1) {
      const missing = missingStates[0];
      if (missing === 'P1') s.P1 = s.P2 * s.T1 / s.T2;
      if (missing === 'P2') s.P2 = s.P1 * s.T2 / s.T1;
      if (missing === 'T1') s.T1 = s.P1 * s.T2 / s.P2;
      if (missing === 'T2') s.T2 = s.P2 * s.T1 / s.P1;
    }
    const target = contract.target;
    const value = target === 'W' ? 0 : target ? s[target] : null;
    const solved = Number.isFinite(value);
    const missing = !target ? ['requested quantity'] : solved ? [] : ['one pressure and one temperature from each state'];
    contract.result = {
      status: missing.length ? 'insufficient_information' : 'solved',
      missing,
      value: solved ? value : null,
      units: target === 'W' ? 'kJ' : target && target.startsWith('P') ? 'kPa' : 'K'
    };
    return contract;
  }

  const api = { isRigidTankQuestion, buildRigidTankContract, solveRigidTankContract };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.RigidTankRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
