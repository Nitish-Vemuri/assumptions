// Portable parser for piston-cylinder prompts
// Works in browser (attaches to window) and in Node (module.exports)
(function(root) {
  const toLiters = (value, unit) => {
    if (!unit) return value; // assume liters
    unit = unit.replace(/\s+/g, '').toLowerCase();
    if (unit === 'l' || unit === 'liter' || unit === 'litre') return value;
    if (unit === 'm3' || unit === 'm^3') return value * 1000; // m^3 -> liters
    if (unit === 'cm3' || unit === 'cm^3') return value * 0.001; // cm^3 -> liters
    return value; // fallback
  };

  function parsePrompt(text, context) {
    const ctx = context || {};
    const volContext = typeof ctx.volume === 'number' ? ctx.volume : 1.0;
    const s = String(text || '').toLowerCase();
    const out = { action: 'none', ratio: null, process: null, confidence: 0 };

    // detect process type
    if (s.match(/isothermal|constant temperature/)) out.process = 'isothermal';
    if (s.match(/adiabatic|no heat exchange|adiabat/)) out.process = 'adiabatic';

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

    // detect absolute "set volume to 3 L" -> map to multiplier against default
    const setVol = s.match(/set\s+volume\s+to\s*(\d+\.?\d*)\s*(m\^?3|cm\^?3|l|litre|liter)?/);
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

    // multiplier like 1.2x
    const mult = s.match(/(\d+\.?\d*)\s*x/);
    if (mult) {
      out.ratio = Math.max(0.3, Math.min(1.7, parseFloat(mult[1])));
      out.action = 'apply';
      out.confidence = 0.75;
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
    module.exports = { parsePrompt };
  } else {
    root.parsePrompt = parsePrompt;
  }
})(typeof window !== 'undefined' ? window : globalThis);
