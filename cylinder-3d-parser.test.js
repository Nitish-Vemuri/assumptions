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

  r = parser.parsePrompt('from 0.002 m^3 to 0.004 m^3 isothermal');
  // 0.002 m^3 = 2 L, 0.004 m^3 = 4 L -> ratio 2
  assert.strictEqual(r.action, 'apply');
  assert.ok(almostEqual(r.ratio, 2.0));

  r = parser.parsePrompt('compress');
  assert.strictEqual(r.action, 'apply');

  r = parser.parsePrompt('A frictionless piston-cylinder device contains a gas initially at 0.8 MPa and 0.015 m³. It expands quasi-statically at constant temperature to a final volume of 0.030 m³. The work output will be ____ kJ.');
  assert.strictEqual(r.process, 'isothermal');
  assert.ok(almostEqual(r.problem.initialPressureKPa, 800));
  assert.ok(almostEqual(r.problem.initialVolumeM3, 0.015));
  assert.ok(almostEqual(r.problem.finalVolumeM3, 0.030));
  assert.strictEqual(r.problem.quasiStatic, true);
  const workKJ = r.problem.initialPressureKPa * r.problem.initialVolumeM3 * Math.log(r.problem.finalVolumeM3 / r.problem.initialVolumeM3);
  assert.ok(almostEqual(workKJ, 8.317766));

  console.log('All parser tests passed.');
})();
