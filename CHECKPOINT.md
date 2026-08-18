# Assumption Explorer — Project Checkpoint

## Main direction
Build a thermodynamics-first, AI-assisted physics visualization platform that helps students understand textbook assumptions by comparing ideal and real-world models.

## Core goal
When a student pastes a thermodynamics question, the system should:
1. identify the process and assumptions,
2. map the question to a suitable visual model,
3. render a diagram or simulation,
4. explain the physics in accessible language,
5. allow toggling of ideal vs real assumptions.

## Current status
- Catalog landing page with subject-based browsing is working.
- Mechanics examples are implemented.
- Thermodynamics examples exist, including law-based concept cards.
- The app is still mostly template-driven rather than question-driven.

## Next work
### Priority 1: Question-to-visualization flow
- Add a separate page or section for pasted-question input.
- Parse the question into: thermodynamic process, variables, assumptions, and target quantity.
- Map that structure to a visualization template.

### Priority 2: Thermodynamics visualization templates
Start with: 
- isothermal expansion/compression
- adiabatic process
- ideal gas law comparison
- heat engine efficiency
- entropy flow / reversible vs irreversible process

### Priority 3: AI-assisted explanation layer
Use AI to:
- infer likely process type,
- explain what the diagram means,
- suggest assumptions and compare ideal vs real cases,
- provide hints instead of final answers when appropriate.

### Priority 4: Teaching scaffolding
Add:
- checkpoints
- guided prompts
- concept questions
- assumption toggles
- professor mode / assignments later

## Important constraints
- Do not remove existing working code.
- Keep the current app running and add new functionality separately.
- Build new capabilities in dedicated pages/sections before integrating them into the main app flow.
- Favor a hybrid architecture: AI for interpretation + template-based rendering for reliability.

## Long-term product vision
A student can paste a textbook or exam question and immediately get a visual explanation of the physical model behind it, with ideal assumptions, real-world corrections, and teaching prompts built in.
