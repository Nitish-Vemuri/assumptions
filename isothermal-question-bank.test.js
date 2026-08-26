const assert = require('assert');
const { solveIsothermalQuestion } = require('./isothermal-lab.js');

const cases = [
  ['P2 compression', 'An ideal gas is compressed isothermally from 0.3 m3 to 0.2 m3. The initial pressure is 200 kPa. Find the final pressure.', 'pressure', 300, 'p2'],
  ['V2 expansion', 'An ideal gas initially occupies 0.04 meter cube at 150 kPa. It expands isothermally until pressure becomes 60 kPa. Find V2.', 'volume', 0.1, 'v2'],
  ['work expansion', 'A gas at 100 kPa and 0.4 m3 expands isothermally to 0.8 m3. Find work done.', 'work', 27.725887, 'workKJ'],
  ['work compression', 'A gas at 100 kPa and 0.8 m3 is compressed isothermally to 0.4 m3. Find the work.', 'work', -55.451774, 'workKJ'],
  ['MPa pressure', 'A gas at 0.8 MPa and 0.015 m3 expands at constant temperature to 0.030 m3. Find final pressure.', 'pressure', 400, 'p2'],
  ['liters', 'An ideal gas at 200 kPa and 2 L expands isothermally until its pressure is 80 kPa. Find final volume.', 'volume', 0.005, 'v2'],
  ['cubic centimeters', 'A gas at 300 kPa and 2000 cm3 is compressed isothermally to 1000 cm3. Find P2.', 'pressure', 600, 'p2'],
  ['constant temp shorthand', 'A gas at 120 kPa and 0.5 m3 expands at constant temp to 1.0 m3. Find final pressure.', 'pressure', 60, 'p2'],
  ['constant temperature', 'A gas at 120 kPa and 0.5 m3 expands at constant temperature until pressure is 40 kPa. Find V2.', 'volume', 1.5, 'v2'],
  ['decimal states', 'A gas at 95 kPa and 0.125 m3 expands isothermally to 0.250 m3. Find P2.', 'pressure', 47.5, 'p2'],
  ['uppercase words', 'AN IDEAL GAS AT 100 KPA AND 0.20 M3 EXPANDS ISOTHERMALLY TO 0.50 M3. FIND WORK.', 'work', 18.325815, 'workKJ'],
  ['small volume', 'A gas at 500 kPa and 0.002 m3 expands isothermally until pressure reaches 250 kPa. Find final volume.', 'volume', 0.004, 'v2'],
  ['high expansion', 'A gas at 50 kPa and 1 m3 expands isothermally to 4 m3. Find P2.', 'pressure', 12.5, 'p2'],
  ['meter cubed', 'A gas initially has 0.06 metre cubed at 90 kPa and is compressed isothermally until it reaches 180 kPa. Find V2.', 'volume', 0.03, 'v2'],
  ['explicit work wording', 'At 250 kPa and 0.1 m3, a gas expands isothermally to 0.2 m3. Find the work output.', 'work', 17.32868, 'workKJ'],
  ['P2 label', 'A gas at 100 kPa and 0.6 m3 expands isothermally to 1.2 m3. Find P2.', 'pressure', 50, 'p2'],
  ['V2 label', 'A gas at 500 kPa and 0.01 m3 expands isothermally until P2 is 100 kPa. Find V2.', 'volume', 0.05, 'v2'],
  ['compression relation', 'A gas at 180 kPa and 0.9 m3 undergoes an isothermal compression until pressure is 360 kPa. Find final volume.', 'volume', 0.45, 'v2'],
  ['incomplete state', 'A gas at 180 kPa expands isothermally. Find P2.', 'error', null, null],
  ['wrong process', 'A gas at 180 kPa and 0.9 m3 expands adiabatically to 1.2 m3. Find P2.', 'error', null, null]
];

for (const [name, prompt, target, expected, field] of cases) {
  const result = solveIsothermalQuestion(prompt);
  if (target === 'error') assert.ok(result.error, name);
  else { assert.strictEqual(result.target, target, name); assert.ok(Math.abs(result[field] - expected) < 0.0001, name); }
}
console.log(`isothermal question bank: ${cases.length} verified cases passed`);
