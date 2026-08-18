const { parseQuestion, getExplanation } = require('./question-visualizer.js');

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertIncludes(actual, expected, label) {
  if (!actual.includes(expected)) {
    throw new Error(`${label}: expected to include ${expected}, got ${actual}`);
  }
}

const iso = parseQuestion('A gas expands isothermally from 2 L to 5 L at 300 K. Find the work done by the gas.');
assertEqual(iso.template, 'isothermal', 'isothermal detection');
assertEqual(iso.process, 'isothermal process', 'isothermal process name');

const adiabatic = parseQuestion('An ideal gas is compressed adiabatically. Explain what happens to pressure and temperature.');
assertEqual(adiabatic.template, 'adiabatic', 'adiabatic detection');
assertIncludes(adiabatic.assumptions.join(', '), 'no heat exchange', 'adiabatic assumptions');

const engine = parseQuestion('A heat engine operating between 600 K and 300 K has efficiency equation.');
assertEqual(engine.template, 'engine', 'engine detection');
assertEqual(engine.target, 'efficiency', 'engine target');

const entropy = parseQuestion('A system undergoes entropy change during a reversible process and heat transfer is measured.');
assertEqual(entropy.template, 'entropy', 'entropy detection');
assertEqual(entropy.target, 'entropy', 'entropy target');

const explanation = getExplanation({ template: 'isothermal' });
assertIncludes(explanation.formula, 'ln', 'isothermal formula includes natural log');

console.log('question visualizer tests passed');
