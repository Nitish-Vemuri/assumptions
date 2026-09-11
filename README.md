# Assumption Explorer

An interactive thermodynamics learning app with two labs: the existing rule-based question-to-model flow and a separate AI voice teaching prototype. Open the catalog at `http://localhost:8000/index.html` (or use the local teaching server for voice features).

## Voice teaching lab (local prototype)

Run `node teaching-server.js`, then open `http://127.0.0.1:8001/teaching.html`.
This uses a separate page so the existing question lab is still available.

To enable AI, run `node teaching-launcher.js --ai --port=8002` in your terminal.
It prompts for the key with hidden
input, uses it for the server session, and does not save it. Node 22+ is required.
Alternatively provide `OPENAI_API_KEY` through the server environment. Do not put
keys in the project directory: the older Python static server can expose files there.
Do not paste your key into chat or the browser. `OPENAI_MODEL` is configurable;
the default is `gpt-4.1-mini`. The optional PowerShell wrapper is
`./start-teaching.ps1 -EnableAI -Port 8002`.
The server binds only to loopback, restricts public files and requests, and uses the
[Responses API structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
to interpret commands. No AI key is required for direct value editing or playback.
AI requests include the instruction, current example, and up to eight recent messages;
they use `store:false`. Speech uses browser speech recognition, which may send audio
to the browser vendor. Chrome/Edge support depends on browser and device settings.

Click **Speak**, dictate at your own pace, then click **Stop recording**. Review
the transcript and click **Apply command**. Silence and browser recognition timeouts
never submit a command. Click Speak again to append more to the existing draft.
The input clears when submitted; the question remains in history. Typed commands
use the same path. Only one interpretation is applied at a time. **Undo** restores
the preceding model, progress and graph visibility; playback resumes paused.

Try the displayed example, then: “Set initial pressure to 200 kPa”, “Switch to
isochoric”, “Play”, “Hide graphs”, “Undo”. For a new example: “Create an isothermal
ideal-gas piston-cylinder example, initially 100 kPa, 0.4 cubic metres and 353.15 K,
compressed to 0.1 cubic metres.” Expected final pressure: 400 kPa; work: -55.4518 kJ.
Say initial or final pressure when that distinction matters. The interpreter uses
conversation context and asks a short clarification if the intended state remains
ambiguous. There is no pressure-mode dropdown. A process switch preserves initial conditions and final
temperature, except isothermal (or polytropic n=1), which preserves final volume.
Inconsistent explicitly supplied values are rejected without changing the model.

The AI receives `TeachingEngine.interpretationPolicy`, including the displayed
ideal-gas and quasi-static teaching defaults. It should not reconfirm those defaults
for supported problems; explicit conflicting physics must be reported instead.
Interpretation happens before engine validation: a clarification from the AI does
not mean the solver rejected the problem. Changes to server instructions require
restarting the teaching server, then refreshing the page.

Scope: five single-stage ideal-gas paths with constant heat capacities and reversible
adiabatic behavior; geometric stops, springs, phase changes and open-system problems
are deliberately not accepted by this new page. Gas geometry is proportional to
volume within each example; playback is an equilibrium-state sequence, not a
prediction of physical piston speed. No claim of validity at extreme gas conditions.

`teaching-engine.js` owns validated state and thermodynamics; `teaching-server.js`
handles interpretation and local serving; `teaching.html`, `teaching.css` and
`teaching.js` implement the classroom interface and rendering. Run
`node --test teaching.test.js` for independent physics and HTTP regression checks.

## Existing lab files

| File | What it does and why it matters |
| --- | --- |
| `index.html` | Main subject catalog and entry point into the app. |
| `styles.css` | Shared visual styling for the Thermodynamics catalog. |
| `main.js` | Controls the two catalog tabs and teaching-server status. |
| `question-visualizer.html` | Lets a student paste a question and open the unified model. |
| `question-visualizer.js` | Identifies problem structure and routes a supported question to the model. |
| `question-visualizer.test.js` | Checks question-to-model routing so supported prompts open correctly. |
| `cylinder-3d.html` | The single student-facing piston-cylinder model screen. |
| `cylinder-3d.js` | Renders the scene, graphs, animation, chat input, and calculated result. |
| `rigid-tank.html` | Student-facing 3D rigid-tank model for constant-volume heating and cooling questions. |
| `rigid-tank.js` | Renders the sealed tank, particle motion, heat cue, state animation, and pressure-temperature graph. |
| `rigid-tank-rules.js` | Deterministic ideal-gas rigid-tank rules for pressure, temperature, and zero boundary work. |
| `rigid-tank-rules.test.js` | Regression checks for rigid-tank calculations, units, and insufficient-data handling. |
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
