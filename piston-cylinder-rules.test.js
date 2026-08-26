const assert = require('assert');
const { buildPistonContract, solvePistonContract } = require('./piston-cylinder-rules.js');
const solve = (text, options) => solvePistonContract(buildPistonContract(text, options));
const close = (actual, expected, label) => assert.ok(Math.abs(actual - expected) < 0.001, `${label}: ${actual} !== ${expected}`);

const cases = [
  ['isothermal P2', 'An ideal gas in a piston-cylinder at 200 kPa and 0.3 m3 is compressed isothermally to 0.2 m3. Find P2.', 'P2', 300],
  ['isothermal V1', 'An ideal gas at 150 kPa has unknown initial volume. It expands isothermally to 60 kPa and 0.10 m3. Find V1.', 'V1', 0.04],
  ['isothermal V2', 'A gas at 150 kPa and 0.04 m3 expands at constant temperature to 60 kPa. Find V2.', 'V2', 0.1],
  ['isothermal work', 'A quasi-static ideal gas at 100 kPa and 0.4 m3 expands isothermally to 0.8 m3. Find work.', 'W', 27.7259],
  ['isobaric P2', 'A gas at 200 kPa and 0.1 m3 is heated isobarically to 500 K from 250 K. Find P2.', 'P2', 200],
  ['isobaric V2', 'A gas at 200 kPa and 0.1 m3 at 250 K is heated at constant pressure to 500 K. Find V2.', 'V2', 0.2],
  ['isobaric work', 'A quasi-static gas at 200 kPa and 0.1 m3 expands isobarically to 0.2 m3. Find work.', 'W', 20],
  ['isochoric V2', 'A gas at 100 kPa and 0.2 m3 is heated in a rigid container to 600 K from 300 K. Find V2.', 'V2', 0.2],
  ['isochoric P2', 'A gas at 100 kPa and 0.2 m3 at 300 K is heated isochorically to 600 K. Find P2.', 'P2', 200],
  ['isochoric work', 'A quasi-static gas at 100 kPa and 0.2 m3 undergoes an isochoric process to 200 kPa. Find work.', 'W', 0],
  ['adiabatic P2', 'Air at 100 kPa and 0.2 m3 expands quasi-statically and adiabatically to 0.4 m3. Find P2.', 'P2', 37.8929],
  ['adiabatic V2', 'Air at 150 kPa and 0.04 m3 expands quasi-statically and adiabatically to 60 kPa. Find V2.', 'V2', 0.07693],
  ['adiabatic work', 'Air at 100 kPa and 0.2 m3 expands reversibly and adiabatically to 0.4 m3. Find work.', 'W', 12.107],
  ['polytropic P2', 'An ideal gas at 100 kPa and 0.2 m3 expands quasi-statically polytropically with n = 1.3 to 0.4 m3. Find P2.', 'P2', 40.612],
  ['polytropic work', 'An ideal gas at 100 kPa and 0.2 m3 expands reversibly polytropically with n = 1.3 to 0.4 m3. Find work.', 'W', 12.517],
  ['frictionless capture', 'A frictionless piston contains an ideal gas at 100 kPa and 0.2 m3. It expands isothermally to 0.4 m3. Find P2.', 'P2', 50],
  ['MPa and litre', 'An ideal gas at 0.8 MPa and 15 L expands isothermally to 30 L. Find P2.', 'P2', 400],
  ['meter cube wording', 'A gas at 150 kPa and 0.04 meter cube expands isothermally to 60 kPa. Find V2.', 'V2', 0.1]
  ,['isothermal T2', 'An ideal gas at 100 kPa and 0.1 m3 at 300 K expands isothermally to 0.2 m3. Find T2.', 'T2', 300]
  ,['isobaric T2', 'A gas at 150 kPa and 0.1 m3 at 300 K expands isobarically to 0.2 m3. Find T2.', 'T2', 600]
  ,['isobaric V1', 'A gas at 100 kPa has an unknown initial volume at 300 K. It expands isobarically to 0.4 m3 at 600 K. Find V1.', 'V1', 0.2]
  ,['isochoric T2', 'A gas at 100 kPa and 0.2 m3 at 300 K is heated isochorically to 200 kPa. Find T2.', 'T2', 600]
  ,['adiabatic T2', 'Air at 100 kPa and 0.2 m3 at 300 K expands reversibly and adiabatically to 0.4 m3. Find T2.', 'T2', 227.357]
  ,['adiabatic stated gamma', 'A gas at 100 kPa and 0.2 m3 expands adiabatically with gamma = 1.3 to 0.4 m3. Find P2.', 'P2', 40.612]
  ,['polytropic V1', 'An ideal gas has unknown initial volume at 80 kPa. It expands reversibly polytropically with n = 1.2 to 20 kPa and 0.4 m3. Find V1.', 'V1', 0.12599]
];

for (const [name, text, target, expected] of cases) {
  const contract = solve(text);
  assert.strictEqual(contract.target, target, name);
  assert.strictEqual(contract.result.status, 'solved', name);
  close(contract.result.value, expected, name);
}
const noGamma = solve('A gas at 100 kPa and 0.2 m3 expands adiabatically to 0.4 m3. Find P2.', { textbookMode: true });
assert.strictEqual(noGamma.result.status, 'insufficient_information');
assert.ok(noGamma.result.missing.some((item) => item.includes('gamma')));
const noPath = solve('An ideal gas at 100 kPa and 0.2 m3 expands isothermally to 0.4 m3. Find work.');
assert.strictEqual(noPath.result.status, 'insufficient_information');
assert.ok(noPath.result.requiredAssumptions.includes('quasi_static'));
const classroomWork = solvePistonContract(buildPistonContract('An ideal gas at 100 kPa and 0.2 m3 expands isothermally to 0.4 m3. Find work.', { classroomMode: true }));
assert.strictEqual(classroomWork.result.status, 'solved');
assert.ok(classroomWork.assumptions.defaults.includes('quasi_static'));
console.log(`piston-cylinder rules: ${cases.length + 3} curated cases passed`);
