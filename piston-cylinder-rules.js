// Canonical rule engine for introductory piston-cylinder problems.
// It is intentionally deterministic: language extraction creates a contract,
// then process equations solve that contract. A renderer can consume the same
// completed contract regardless of the process.
(function(root) {
  const PROCESS_RULES = Object.freeze({
    isothermal: {
      constraints: ['T1 = T2'], equations: ['P1 V1 = P2 V2'], heat: 'may_cross_boundary', piston: 'moves'
    },
    adiabatic: {
      constraints: ['Q = 0'], equations: ['P1 V1^gamma = P2 V2^gamma', 'T1 V1^(gamma - 1) = T2 V2^(gamma - 1)'], heat: 'none', piston: 'moves', requires: ['gamma']
    },
    isobaric: {
      constraints: ['P1 = P2'], equations: ['V1 / T1 = V2 / T2'], heat: 'may_cross_boundary', piston: 'moves'
    },
    isochoric: {
      constraints: ['V1 = V2', 'W_boundary = 0'], equations: ['P1 / T1 = P2 / T2'], heat: 'may_cross_boundary', piston: 'locked'
    },
    polytropic: {
      constraints: ['P V^n = constant'], equations: ['P1 V1^n = P2 V2^n'], heat: 'depends_on_exponent', piston: 'moves', requires: ['polytropic_exponent']
    }
  });

  const ASSUMPTION_RULES = Object.freeze({
    closed_system: 'No mass crosses the boundary.',
    ideal_gas: 'Use ideal-gas state relations.',
    quasi_static: 'Pressure is balanced at each small step; required for reversible boundary-work formulas.',
    frictionless_piston: 'No friction force is added to the piston force balance.',
    negligible_ke_pe: 'Kinetic- and potential-energy changes are neglected.',
    air_standard: 'Use air-standard properties; gamma = 1.4 unless a different value is stated.',
    rigid_container: 'The volume is fixed; the piston is locked.'
  });

  const pressurePattern = /(\d+(?:\.\d+)?)\s*(mpa|kpa|pa)\b/gi;
  const volumePattern = /(\d+(?:\.\d+)?)\s*(m\^?3|m³|cm\^?3|cm³|(?:cubic\s*)?(?:meters?|metres?)\s*(?:cube|cubed)|l|liters?|litres?)/gi;
  const temperaturePattern = /(\d+(?:\.\d+)?)\s*(k|°c|celsius|deg(?:ree)?s?\s*c)\b/gi;

  const toKPa = (value, unit) => unit.toLowerCase() === 'mpa' ? value * 1000 : unit.toLowerCase() === 'pa' ? value / 1000 : value;
  const toM3 = (value, unit) => {
    const u = unit.toLowerCase().replace(/\s+/g, '');
    if (u === 'l' || u.startsWith('liter') || u.startsWith('litre')) return value / 1000;
    if (u.startsWith('cm')) return value / 1000000;
    return value;
  };
  const toKelvin = (value, unit) => unit.toLowerCase() === 'k' ? value : value + 273.15;
  const extract = (text, pattern, convert) => [...text.matchAll(pattern)].map((match) => convert(Number(match[1]), match[2]));

  function detectProcess(text) {
    if (/isothermal|constant temperature|constant temp/.test(text)) return 'isothermal';
    if (/adiabatic|no heat (?:transfer|exchange)|adiabat/.test(text)) return 'adiabatic';
    if (/isobaric|constant pressure|pressure remains constant/.test(text)) return 'isobaric';
    if (/isochoric|constant volume|rigid (?:tank|container)/.test(text)) return 'isochoric';
    if (/polytropic/.test(text)) return 'polytropic';
    return null;
  }

  function detectTarget(text) {
    if (/work|boundary work|work output|work input|work done/.test(text)) return 'W';
    const targetMatch = text.match(/(?:find|calculate|determine|what is)\s+(?:the\s+)?(?:(initial|final)\s+)?(pressure|volume|temperature)|\b([pvt])([12])\b/i);
    if (!targetMatch) return null;
    if (targetMatch[3]) return `${targetMatch[3].toUpperCase()}${targetMatch[4]}`;
    const state = targetMatch[1] === 'initial' ? '1' : '2';
    const symbol = targetMatch[2][0].toUpperCase();
    return `${symbol}${state}`;
  }

  function detectAssumptions(text, options) {
    const stated = [];
    if (/frictionless/.test(text)) stated.push('frictionless_piston');
    if (/quasi[\s-]*static|quasistatic|reversib\w*/.test(text)) stated.push('quasi_static');
    if (/ideal gas/.test(text)) stated.push('ideal_gas');
    if (/air[-\s]*standard|\bair\b/.test(text)) stated.push('air_standard');
    if (/closed system/.test(text)) stated.push('closed_system');
    if (/rigid (?:tank|container)|isochoric|constant volume/.test(text)) stated.push('rigid_container');
    const defaults = options && options.textbookMode === false ? [] : ['closed_system', 'negligible_ke_pe'];
    if (options && options.textbookMode !== false && !stated.includes('ideal_gas')) defaults.push('ideal_gas');
    return { stated, defaults, applied: [...new Set([...stated, ...defaults])] };
  }

  function buildPistonContract(question, options = {}) {
    const raw = String(question || '').trim();
    const text = raw.toLowerCase();
    const process = detectProcess(text);
    const pressures = extract(text, pressurePattern, toKPa);
    const volumes = extract(text, volumePattern, toM3);
    const temperatures = extract(text, temperaturePattern, toKelvin);
    const target = detectTarget(text);
    const exponentMatch = text.match(/(?:n\s*=|exponent\s*(?:is|=)?)\s*(\d+(?:\.\d+)?)/);
    const gammaMatch = text.match(/(?:gamma|γ)\s*(?:is|=)?\s*(\d+(?:\.\d+)?)/);
    const assumptions = detectAssumptions(text, options);
    const gamma = gammaMatch ? Number(gammaMatch[1]) : assumptions.applied.includes('air_standard') ? 1.4 : options.gamma || null;
    const polytropicExponent = exponentMatch ? Number(exponentMatch[1]) : options.polytropicExponent || null;
    return {
      system: /piston[\s-]*cylinder/.test(text) ? 'piston-cylinder' : 'unspecified-gas-system',
      source: raw,
      process,
      target,
      states: {
        P1: target === 'P1' && pressures.length === 1 ? null : pressures[0] ?? null,
        V1: target === 'V1' && volumes.length === 1 ? null : volumes[0] ?? null,
        T1: target === 'T1' && temperatures.length === 1 ? null : temperatures[0] ?? null,
        P2: target === 'P1' && pressures.length === 1 ? pressures[0] : pressures[1] ?? null,
        V2: target === 'V1' && volumes.length === 1 ? volumes[0] : volumes[1] ?? null,
        T2: target === 'T1' && temperatures.length === 1 ? temperatures[0] : temperatures[1] ?? null
      },
      parameters: { gamma, polytropicExponent },
      assumptions,
      processRules: process ? PROCESS_RULES[process] : null,
      derived: {},
      result: { status: process ? 'ready_to_solve' : 'unsupported', missing: process ? [] : ['process'] }
    };
  }

  function copy(contract) { return JSON.parse(JSON.stringify(contract)); }
  const known = (value) => Number.isFinite(value) && value > 0;
  const missingState = (states, names) => names.filter((name) => !known(states[name]));

  function solvePVPower(states, exponent) {
    const missing = missingState(states, ['P1', 'V1', 'P2', 'V2']);
    if (missing.length !== 1) return false;
    const x = missing[0];
    if (x === 'P1') states.P1 = states.P2 * (states.V2 / states.V1) ** exponent;
    if (x === 'P2') states.P2 = states.P1 * (states.V1 / states.V2) ** exponent;
    if (x === 'V1') states.V1 = states.V2 * (states.P2 / states.P1) ** (1 / exponent);
    if (x === 'V2') states.V2 = states.V1 * (states.P1 / states.P2) ** (1 / exponent);
    return true;
  }

  function solveRatio(states, numeratorA, denominatorA, numeratorB, denominatorB) {
    const names = [numeratorA, denominatorA, numeratorB, denominatorB];
    const missing = missingState(states, names);
    if (missing.length !== 1) return false;
    const x = missing[0];
    const a = states[numeratorA], b = states[denominatorA], c = states[numeratorB], d = states[denominatorB];
    if (x === numeratorA) states[x] = b * c / d;
    if (x === denominatorA) states[x] = a * d / c;
    if (x === numeratorB) states[x] = a * d / b;
    if (x === denominatorB) states[x] = b * c / a;
    return true;
  }

  function solvePistonContract(input) {
    const contract = copy(input);
    if (!contract.processRules) return contract;
    const { states, process, parameters } = contract;
    let changed = true;
    while (changed) {
      changed = false;
      if (process === 'isothermal') {
        changed = solvePVPower(states, 1) || changed;
        if (known(states.T1) && !known(states.T2)) { states.T2 = states.T1; changed = true; }
        if (known(states.T2) && !known(states.T1)) { states.T1 = states.T2; changed = true; }
      }
      if (process === 'adiabatic' && known(parameters.gamma)) {
        changed = solvePVPower(states, parameters.gamma) || changed;
        if (known(states.T1) && known(states.V1) && known(states.V2) && !known(states.T2)) { states.T2 = states.T1 * (states.V1 / states.V2) ** (parameters.gamma - 1); changed = true; }
        if (known(states.T2) && known(states.V1) && known(states.V2) && !known(states.T1)) { states.T1 = states.T2 * (states.V2 / states.V1) ** (parameters.gamma - 1); changed = true; }
      }
      if (process === 'isobaric') {
        if (known(states.P1) && !known(states.P2)) { states.P2 = states.P1; changed = true; }
        if (known(states.P2) && !known(states.P1)) { states.P1 = states.P2; changed = true; }
        changed = solveRatio(states, 'V1', 'T1', 'V2', 'T2') || changed;
      }
      if (process === 'isochoric') {
        if (known(states.V1) && !known(states.V2)) { states.V2 = states.V1; changed = true; }
        if (known(states.V2) && !known(states.V1)) { states.V1 = states.V2; changed = true; }
        changed = solveRatio(states, 'P1', 'T1', 'P2', 'T2') || changed;
      }
      if (process === 'polytropic' && known(parameters.polytropicExponent)) changed = solvePVPower(states, parameters.polytropicExponent) || changed;
    }

    const target = contract.target;
    let value = target && target !== 'W' ? states[target] : null;
    if (target === 'W') {
      const needsQuasi = process !== 'isochoric' && !contract.assumptions.applied.includes('quasi_static');
      if (needsQuasi) contract.result.requiredAssumptions = ['quasi_static'];
      const allPV = ['P1', 'V1', 'P2', 'V2'].every((name) => known(states[name]));
      if (process === 'isochoric') value = 0;
      if (allPV && !needsQuasi) {
        if (process === 'isothermal') value = states.P1 * states.V1 * Math.log(states.V2 / states.V1);
        if (process === 'isobaric') value = states.P1 * (states.V2 - states.V1);
        if (process === 'adiabatic' && known(parameters.gamma)) value = (states.P2 * states.V2 - states.P1 * states.V1) / (1 - parameters.gamma);
        if (process === 'polytropic' && known(parameters.polytropicExponent)) value = parameters.polytropicExponent === 1 ? states.P1 * states.V1 * Math.log(states.V2 / states.V1) : (states.P2 * states.V2 - states.P1 * states.V1) / (1 - parameters.polytropicExponent);
      }
    }
    const hasValue = Number.isFinite(value);
    contract.derived = target && hasValue ? { [target]: value } : {};
    const missing = target === 'W' ? (hasValue ? [] : ['sufficient state values and quasi-static path']) : (target && !known(value) ? [target] : []);
    if (process === 'adiabatic' && !known(parameters.gamma)) missing.push('gamma (or an air-standard assumption)');
    if (process === 'polytropic' && !known(parameters.polytropicExponent)) missing.push('polytropic exponent n');
    contract.result = { ...contract.result, status: missing.length ? 'insufficient_information' : 'solved', missing, value: hasValue ? value : null, units: target === 'W' ? 'kJ' : target && target.startsWith('P') ? 'kPa' : target && target.startsWith('V') ? 'm³' : target && target.startsWith('T') ? 'K' : null };
    return contract;
  }

  const api = { PROCESS_RULES, ASSUMPTION_RULES, buildPistonContract, solvePistonContract };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.PistonCylinderRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
