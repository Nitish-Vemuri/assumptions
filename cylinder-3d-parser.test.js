const assert = require('assert');
const parser = require('./parser');

function almostEqual(a, b, eps = 1e-6) {
  return Math.abs(a - b) < eps;
}

// Tests
(() => {
  console.log('Running parser tests...');

  let r;

  r = parser.parsePrompt('from 2 L to 4 L');
  assert.strictEqual(r.action, 'apply');
  assert.ok(almostEqual(r.ratio, 2.0));

  r = parser.parsePrompt('set volume to 1.2x');
  assert.strictEqual(r.action, 'apply');
  assert.ok(almostEqual(r.ratio, 1.2));

  r = parser.parsePrompt('set volume to 1.2 L');
  assert.strictEqual(r.action, 'apply');
  assert.ok(almostEqual(r.ratio, 0.4));

  r = parser.parsePrompt('50%');
  assert.strictEqual(r.action, 'apply');

  r = parser.parsePrompt('isothermal');
  assert.strictEqual(r.process, 'isothermal');

  r = parser.parsePrompt('constant temp');
  assert.strictEqual(r.process, 'isothermal');

  r = parser.parsePrompt('from 0.002 m^3 to 0.004 m^3 isothermal');
  // 0.002 m^3 = 2 L, 0.004 m^3 = 4 L -> ratio 2
  assert.strictEqual(r.action, 'apply');
  assert.ok(almostEqual(r.ratio, 2.0));

  r = parser.parsePrompt('compress');
  assert.strictEqual(r.action, 'apply');

  r = parser.parsePrompt('show an isobaric expansion');
  assert.strictEqual(r.process, 'isobaric');

  r = parser.parsePrompt('constant volume heating');
  assert.strictEqual(r.process, 'isochoric');

  r = parser.parsePrompt('A frictionless piston-cylinder device contains a gas initially at 0.8 MPa and 0.015 m³. It expands quasi-statically at constant temperature to a final volume of 0.030 m³. The work output will be ____ kJ.');
  assert.strictEqual(r.process, 'isothermal');
  assert.ok(almostEqual(r.problem.initialPressureKPa, 800));
  assert.ok(almostEqual(r.problem.initialVolumeM3, 0.015));
  assert.ok(almostEqual(r.problem.finalVolumeM3, 0.030));
  assert.strictEqual(r.problem.quasiStatic, true);
  assert.strictEqual(r.problem.requestedQuantity, 'boundary_work');
  const workKJ = r.problem.initialPressureKPa * r.problem.initialVolumeM3 * Math.log(r.problem.finalVolumeM3 / r.problem.initialVolumeM3);
  assert.ok(almostEqual(workKJ, 8.317766));

  r = parser.parsePrompt('An ideal gas is compressed isothermally from 0.3 m3 to 0.2 m3. The initial pressure is 200 kPa. Find the final pressure.');
  assert.strictEqual(r.problem.requestedQuantity, 'final_pressure');
  assert.ok(almostEqual(r.problem.initialPressureKPa * r.problem.initialVolumeM3 / r.problem.finalVolumeM3, 300));

  r = parser.parsePrompt('An ideal gas initially occupies 0.04 meter cube at 150 kPa. It undergoes an isothermal expansion until its pressure becomes 60 kPa. Find V2.');
  assert.strictEqual(r.problem.requestedQuantity, 'final_volume');
  assert.ok(almostEqual(r.problem.finalVolumeM3, 0.1));

  r = parser.parsePrompt('A gas initially at 800 kPa and 0.015 m3 expands quasi-statically at constant temp to 0.030 m3.');
  assert.strictEqual(r.process, 'isothermal');
  assert.strictEqual(r.problem.process, 'isothermal');
  assert.ok(almostEqual(r.problem.finalVolumeM3, 0.030));

  r = parser.parsePrompt('A gas initially at 500 kPa and 0.010 m³ expands quasi-statically and adiabatically to 0.020 m³.');
  assert.strictEqual(r.process, 'adiabatic');
  assert.strictEqual(r.problem.process, 'adiabatic');

  r = parser.parsePrompt('A piston-cylinder device initially contains 0.4 m³ of air at 100 kPa and 80°C. The air is now isothermally compressed to 0.1 m³.');
  assert.strictEqual(r.process, 'isothermal');
  assert.strictEqual(r.problem.quasiStatic, true);
  assert.strictEqual(r.problem.quasiStaticInferred, true);
  assert.ok(almostEqual(r.problem.temperatureK, 353.15));
  const compressionWorkKJ = r.problem.initialPressureKPa * r.problem.initialVolumeM3 * Math.log(r.problem.finalVolumeM3 / r.problem.initialVolumeM3);
  assert.ok(almostEqual(compressionWorkKJ, -55.451774));

  console.log('All parser tests passed.');
})();
