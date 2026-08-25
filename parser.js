// Portable parser for piston-cylinder prompts
// Works in browser (attaches to window) and in Node (module.exports)
(function(root) {
  const toLiters = (value, unit) => {
    if (!unit) return value; // assume liters
    unit = unit.replace(/\s+/g, '').toLowerCase();
    if (unit === 'l' || unit === 'liter' || unit === 'litre') return value;
    if (unit === 'm3' || unit === 'm^3' || unit === 'm³' || unit.includes('meter') || unit.includes('metre')) return value * 1000; // m^3 -> liters
    if (unit === 'cm3' || unit === 'cm^3' || unit === 'cm³') return value * 0.001; // cm^3 -> liters
    return value; // fallback
  };

  const toCubicMeters = (value, unit) => {
    const liters = toLiters(value, unit);
    return liters / 1000;
  };

  function parseThermoProblem(text) {
    const s = String(text || '').toLowerCase();
    const isothermal = /isothermal|constant temperature|constant temp/.test(s);
    const adiabatic = /adiabatic|no heat exchange|adiabat/.test(s);
    const isobaric = /isobaric|constant pressure/.test(s);
    const isochoric = /isochoric|constant volume/.test(s);
    const polytropic = /polytropic/.test(s);
    const quasiStaticExplicit = /quasi[\s-]*static|quasistatic/.test(s);
    const pressureMatches = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(mpa|kpa|pa)\b/g)];
    const volumeMatches = [...s.matchAll(/(\d+(?:\.\d+)?)\s*(m\^?3|m³|cm\^?3|cm³|(?:cubic\s*)?(?:meters?|metres?)\s*(?:cube|cubed)|l|litre|liter)(?=$|[^a-z0-9])/g)];
    const temperature = s.match(/(\d+(?:\.\d+)?)\s*k\b/);
    const temperatureCelsius = s.match(/(\d+(?:\.\d+)?)\s*(?:°|deg(?:ree)?s?\s*)c\b/);
    if ((!isothermal && !adiabatic && !isobaric && !isochoric && !polytropic) || pressureMatches.length < 1 || volumeMatches.length < 1) return null;

    const pressureToKPa = (match) => {
      const value = parseFloat(match[1]);
      return match[2] === 'mpa' ? value * 1000 : match[2] === 'pa' ? value / 1000 : value;
    };
    const pressureKPa = pressureToKPa(pressureMatches[0]);
    const statedFinalPressureKPa = pressureMatches.length > 1 ? pressureToKPa(pressureMatches[1]) : null;
    const initialVolumeM3 = toCubicMeters(parseFloat(volumeMatches[0][1]), volumeMatches[0][2]);
    let finalVolumeM3 = volumeMatches.length > 1 ? toCubicMeters(parseFloat(volumeMatches[1][1]), volumeMatches[1][2]) : null;
    // For an isothermal ideal gas, the supplied final pressure can define V2.
    // This lets the visualizer answer pressure, volume, or work questions from
    // the same PV = constant relation rather than requiring a fixed question form.
    if (isothermal && !finalVolumeM3 && statedFinalPressureKPa > 0) {
      finalVolumeM3 = pressureKPa * initialVolumeM3 / statedFinalPressureKPa;
    }
    if (!(pressureKPa > 0 && initialVolumeM3 > 0 && finalVolumeM3 > 0)) return null;
    return {
      initialPressureKPa: pressureKPa,
      initialVolumeM3,
      finalVolumeM3,
      temperatureK: temperature ? parseFloat(temperature[1]) : temperatureCelsius ? parseFloat(temperatureCelsius[1]) + 273.15 : 300,
      // A reversible/quasi-static path is the standard textbook assumption when
      // isothermal boundary work is requested but no irreversible path is given.
      quasiStatic: true,
      quasiStaticInferred: !quasiStaticExplicit,
      requestedQuantity: /work|work output|work input|work done/.test(s)
        ? 'boundary_work'
        : /(?:final|ending)\s+pressure|pressure\s+(?:at|in)\s+(?:the\s+)?final|find\s+(?:the\s+)?(?:final\s+)?pressure|\bp2\b/.test(s)
          ? 'final_pressure'
          : /(?:final|ending)\s+volume|volume\s+(?:at|in)\s+(?:the\s+)?final|find\s+(?:the\s+)?(?:final\s+)?volume|\bv2\b/.test(s)
            ? 'final_volume'
            : /(?:final|ending)\s+temperature|temperature\s+(?:at|in)\s+(?:the\s+)?final|find\s+(?:the\s+)?(?:final\s+)?temperature|\bt2\b/.test(s)
              ? 'final_temperature'
              : 'boundary_work',
      process: adiabatic ? 'adiabatic' : isobaric ? 'isobaric' : isochoric ? 'isochoric' : polytropic ? 'polytropic' : 'isothermal'
    };
  }

  function parsePrompt(text, context) {
    const ctx = context || {};
    const volContext = typeof ctx.volume === 'number' ? ctx.volume : 1.0;
    const s = String(text || '').toLowerCase();
    const out = { action: 'none', ratio: null, process: null, confidence: 0 };
    const thermoProblem = parseThermoProblem(text);
    if (thermoProblem) {
      out.problem = thermoProblem;
      out.process = thermoProblem.process;
      out.ratio = thermoProblem.finalVolumeM3 / thermoProblem.initialVolumeM3;
      out.action = 'apply';
      out.confidence = 0.99;
      return out;
    }

    // detect process type
    if (s.match(/isothermal|constant temperature|constant temp/)) out.process = 'isothermal';
    if (s.match(/adiabatic|no heat exchange|adiabat/)) out.process = 'adiabatic';
    if (s.match(/isobaric|constant pressure/)) out.process = 'isobaric';
    if (s.match(/isochoric|constant volume/)) out.process = 'isochoric';
    if (s.match(/polytropic/)) out.process = 'polytropic';

    // detect explicit volume range e.g. "from 2 L to 5 L" or m^3
    const range = s.match(/from\s*(\d+\.?\d*)\s*(m\^?3|cm\^?3|l|litre|liter)?\s*to\s*(\d+\.?\d*)\s*(m\^?3|cm\^?3|l|litre|liter)?/);
    if (range) {
      const v1 = toLiters(parseFloat(range[1]), range[2]);
      const v2 = toLiters(parseFloat(range[3]), range[4]);
      if (v1 > 0 && v2 > 0) {
        out.ratio = v2 / v1; // multiplier relative to initial
        out.action = 'apply';
        out.confidence = 0.95;
        return out;
      }
    }

    // A multiplier must be handled before an absolute volume, otherwise "1.2x"
    // is mistakenly interpreted as 1.2 L.
    const multiplier = s.match(/(?:set\s+volume\s+to\s*)?(\d+\.?\d*)\s*x\b/);
    if (multiplier) {
      out.ratio = Math.max(0.3, Math.min(1.7, parseFloat(multiplier[1])));
      out.action = 'apply';
      out.confidence = 0.75;
      return out;
    }

    // detect absolute "set volume to 3 L" -> map to multiplier against default
    const setVol = s.match(/set\s+volume\s+to\s*(\d+\.?\d*)\s*(m\^?3|cm\^?3|l|litre|liter)\b/);
    if (setVol) {
      const vLiters = toLiters(parseFloat(setVol[1]), setVol[2]);
      if (vLiters > 0) {
        const defaultV = ctx.defaultVolumeLiters || 3.0; // baseline liters
        out.ratio = Math.max(0.3, Math.min(1.7, vLiters / defaultV));
        out.action = 'apply';
        out.confidence = 0.85;
        return out;
      }
    }

    // percent
    const percent = s.match(/(\d+)%/);
    if (percent) {
      const p = Math.max(0, Math.min(100, parseFloat(percent[1])));
      out.ratio = 0.3 + (p / 100) * (1.7 - 0.3);
      out.action = 'apply';
      out.confidence = 0.7;
      return out;
    }

    // detect expand/compress verbs; use context.volume for step size
    if (s.match(/expand|increases|increasing|inflate|pull out/)) {
      out.ratio = Math.min(1.7, volContext + 0.25);
      out.action = 'apply';
      out.confidence = 0.55;
      return out;
    }

    if (s.match(/compress|compresses|compression|press|push in/)) {
      out.ratio = Math.max(0.3, volContext - 0.25);
      out.action = 'apply';
      out.confidence = 0.55;
      return out;
    }

    return out;
  }

  // export
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { parsePrompt, parseThermoProblem };
  } else {
    root.parsePrompt = parsePrompt;
  }
})(typeof window !== 'undefined' ? window : globalThis);
