# Assumption Explorer

An interactive learning app that turns supported introductory piston-cylinder questions into a transparent calculation and 3D visual model. Start a local server with `python -m http.server 8000`, then open `http://localhost:8000/question-visualizer.html`.

## Active files

| File | What it does and why it matters |
| --- | --- |
| `index.html` | Main subject catalog and entry point into the app. |
| `styles.css` | Shared visual styling for the catalog and mechanics content. |
| `main.js` | Runs the catalog and original ramp-model interaction. |
| `mechanics-labs.js` | Supplies introductory mechanics lab content in the catalog. |
| `question-visualizer.html` | Lets a student paste a question and open the unified model. |
| `question-visualizer.js` | Identifies problem structure and routes a supported question to the model. |
| `question-visualizer.test.js` | Checks question-to-model routing so supported prompts open correctly. |
| `cylinder-3d.html` | The single student-facing piston-cylinder model screen. |
| `cylinder-3d.js` | Renders the scene, graphs, animation, chat input, and calculated result. |
| `parser.js` | Extracts piston-cylinder wording, values, and units from natural-language input. |
| `cylinder-3d-parser.test.js` | Verifies parser behavior for common wording and unit variants. |
| `piston-cylinder-rules.js` | Canonical deterministic physics rules for the five supported piston-cylinder processes. |
| `piston-cylinder-rules.test.js` | Regression checks that the rules derive pressure, volume, temperature, and work correctly. |
| `PISTON_CYLINDER_RULES.md` | Human-readable rules, assumptions, and supported scope. |
| `three.min.js` | Local Three.js library required for the 3D scene. |
| `OrbitControls.js` | Local camera controls for inspecting the 3D scene. |

## Supported piston-cylinder scope

The unified model supports introductory closed-system, ideal-gas piston-cylinder questions using isothermal, adiabatic air-standard, isobaric, isochoric, or stated polytropic paths. The rule engine derives the requested state quantity or boundary work from the question; it does not look up student prompts in a fixed question bank.

## Removed legacy files

The separate isothermal and adiabatic lab pages, their one-off tests, and the obsolete project checkpoint were removed because the current product uses one shared question-to-model flow. Their duplication made the repository harder to understand and did not serve the active application.
