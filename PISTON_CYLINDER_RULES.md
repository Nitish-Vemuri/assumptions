# Piston-cylinder rule set

This is the canonical rule set for the future single question-to-3D-model flow. It covers introductory closed-system ideal-gas piston-cylinder problems; it does not claim to solve real-fluid, phase-change, open-system, or combustion problems.

## Supported processes

| Process | Constraint | State relation | Boundary-work rule |
|---|---|---|---|
| Isothermal | `T1 = T2` | `P1 V1 = P2 V2` | `W = P1 V1 ln(V2/V1)` for a quasi-static ideal-gas path |
| Adiabatic air-standard | `Q = 0` | `P1 V1^gamma = P2 V2^gamma` | `(P2 V2 - P1 V1)/(1 - gamma)` for a quasi-static path |
| Isobaric | `P1 = P2` | `V1/T1 = V2/T2` | `P (V2 - V1)` |
| Isochoric | `V1 = V2` | `P1/T1 = P2/T2` | `0` |
| Polytropic | `P V^n = constant` | `P1 V1^n = P2 V2^n` | `(P2 V2 - P1 V1)/(1 - n)`; use isothermal form when `n = 1` |

## Assumptions

- **Stated**: frictionless piston, quasi-static/reversible path, ideal gas, air-standard, closed system, or rigid container.
- **Textbook defaults**: closed system, negligible kinetic/potential-energy changes, and—when textbook mode is enabled—ideal-gas behavior. Defaults are recorded in the contract; they are not mistaken for wording from the student.
- **Required only when applicable**: quasi-static/reversible behavior is required before the engine reports reversible boundary work. Gamma is required for generic adiabatic problems unless air-standard behavior or a gamma value is stated. A polytropic exponent is required for polytropic state/work calculations.

## Solver principle

The target may be any state property: `P1`, `V1`, `T1`, `P2`, `V2`, `T2`, or `W`. The solver uses the selected process relation only when enough independent values are present. Otherwise it reports the exact missing field rather than guessing.
