const { parseQuestion, getExplanation, getMatchedModelUrl, getModelReadiness } = require('./question-visualizer.js');

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

const abbreviatedIso = parseQuestion('A piston-cylinder expands at constant temp.');
assertEqual(abbreviatedIso.template, 'isothermal', 'constant temp detection');
assertIncludes(getMatchedModelUrl(abbreviatedIso, 'constant temp'), 'isothermal-lab.html', 'constant temp route');

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

const collision = parseQuestion('Two carts collide elastically. Find their final velocities using momentum conservation.');
assertEqual(collision.template, 'collisions', 'collision detection');
assertIncludes(getExplanation(collision).formula, 'sum(p', 'collision formula');

const orbit = parseQuestion('Find the orbital speed of a satellite in a circular orbit around Earth.');
assertEqual(orbit.template, 'gravitation', 'gravitation detection');

assertIncludes(getMatchedModelUrl(iso, 'isothermal from 2 L to 5 L'), 'isothermal-lab.html', 'isothermal route');
assertIncludes(getMatchedModelUrl(engine, 'heat engine'), 'model=second-law', 'engine route');
assertIncludes(getMatchedModelUrl(collision, 'collision'), 'model=collisions', 'collision route');
assertIncludes(getMatchedModelUrl(parseQuestion('A piston-cylinder expands isobarically.'), 'piston'), 'cylinder-3d.html', 'piston isobaric route');
assertEqual(getModelReadiness('A vague question', parseQuestion('A vague question')).ready, false, 'unclear question is blocked');
assertEqual(getModelReadiness('A heat engine operates between 600 K and 300 K.', engine).ready, true, 'known non-piston question is ready');

console.log('question visualizer tests passed');
