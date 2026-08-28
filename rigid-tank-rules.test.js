const assert = require('assert');
const { isRigidTankQuestion, buildRigidTankContract, solveRigidTankContract } = require('./rigid-tank-rules.js');
const solve = (text) => solveRigidTankContract(buildRigidTankContract(text));
const close = (actual, expected, name) => assert.ok(Math.abs(actual - expected) < 0.001, `${name}: ${actual} !== ${expected}`);

assert.strictEqual(isRigidTankQuestion('A rigid tank contains air.'), true);
assert.strictEqual(isRigidTankQuestion('A piston-cylinder contains air.'), false);

const cases = [
  ['P2 from heating', 'A rigid tank contains air at 100 kPa and 300 K. It is heated to 600 K. Find P2.', 'P2', 200],
  ['T2 from pressure', 'A sealed rigid vessel contains gas at 150 kPa and 300 K. Its pressure rises to 300 kPa. Find T2.', 'T2', 600],
  ['P1 from cooling', 'A rigid container has an unknown initial pressure at 600 K. It cools to 300 K and 100 kPa. Find P1.', 'P1', 200],
  ['T1 from pressure', 'A rigid tank has gas at 100 kPa with unknown initial temperature. It is heated to 200 kPa and 600 K. Find T1.', 'T1', 300],
  ['work is zero', 'A rigid tank contains air at 100 kPa and 300 K. It is heated to 600 K. Find boundary work.', 'W', 0],
  ['MPa and Celsius', 'A rigid vessel contains air at 0.2 MPa and 27 C. It is heated to 327 C. Find final pressure.', 'P2', 399.90005]
];

for (const [name, text, target, expected] of cases) {
  const result = solve(text);
  assert.strictEqual(result.target, target, name);
  assert.strictEqual(result.result.status, 'solved', name);
  close(result.result.value, expected, name);
}

const incomplete = solve('A rigid tank contains air at 100 kPa. Find final pressure.');
assert.strictEqual(incomplete.result.status, 'insufficient_information');
console.log(`rigid-tank rules: ${cases.length + 1} curated cases passed`);
