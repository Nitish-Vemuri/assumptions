// Constants
const G = 9.8; // Gravity (m/s²)
const FPS = 60;
const DT = 1 / FPS;
const SCALE = 50; // pixels per meter

// Application state
const state = {
    angle: 30, // degrees
    mass: 5, // kg
    // Friction: static (μs) and kinetic (μk)
    muStatic: 0.40,
    muKinetic: 0.30,
    // Pendulum params
    pendulumLength: 1.0, // meters
    pendulumInitAngle: 15, // degrees
    pendulumDamping: 0.05,
    // Mass-spring-damper params
    massSpringMass: 1.5,
    springConstant: 18,
    dampingCoeff: 0.6,
    // Free-fall params
    freeFallMass: 2.0,
    dragCoeff: 0.12,
    thermoTemperature: 300,
    thermoVolume: 1.0,
    thermoHeatLoss: 0.2,
    isPlaying: true,
    currentView: 'catalog',
    selectedModel: null,
    assumptions: {
        frictionless: true,
        pointMass: true,
        noAir: true
    }
};

const MODEL_CATALOG = [
    {
        id: 'ramp',
        title: 'Friction on a Ramp',
        summary: 'Textbook model vs real-world effects from friction, rotation, and air drag.',
        description: 'Explore how surface friction, rotational inertia, and drag change the motion of a block on an incline.'
    },
    {
        id: 'pendulum',
        title: 'Simple Pendulum',
        summary: 'Compare the small-angle approximation with nonlinear motion and damping.',
        description: 'See how the ideal pendulum differs from a damped nonlinear pendulum under real conditions.'
    },
    {
        id: 'mass-spring',
        title: 'Mass–Spring–Damper',
        summary: 'Compare ideal SHM against a damped real oscillation with energy loss.',
        description: 'See how a spring without damping differs from a real system with viscous resistance and reduced amplitude.'
    },
    {
        id: 'free-fall',
        title: 'Free-Fall with Drag',
        summary: 'Compare constant gravity to a drag-limited real fall with terminal velocity.',
        description: 'Watch how the textbook no-drag model diverges from a falling object that reaches a terminal speed in air.'
    },
    {
        id: 'thermo',
        title: 'Ideal Gas Expansion',
        summary: 'Compare the ideal gas law with a real gas model including intermolecular effects.',
        description: 'See how ideal gas assumptions diverge from real gases as temperature, volume, and heat leak change.'
    }
];

// Assumptions catalog (simple in-memory list)
const ASSUMPTIONS = [
    {
        id: 'frictionless',
        title: 'Frictionless surface',
        type: 'Idealization',
        summary: 'Ignore surface friction: μ = 0 (textbook simplification).',
        description: 'Removes both static and kinetic friction terms; objects accelerate purely under g·sin(θ).',
        key: 'frictionless',
        textbookValue: true,
        realValue: false
    },
    {
        id: 'pointMass',
        title: 'Point mass (no rotation)',
        type: 'Idealization',
        summary: 'Neglect rotational inertia; all energy is translational.',
        description: 'Prevents rolling/rotation effects; acceleration not reduced by rotational inertia.',
        key: 'pointMass',
        textbookValue: true,
        realValue: false
    },
    {
        id: 'noAir',
        title: 'No air resistance',
        type: 'Boundary simplification',
        summary: 'Ignore drag forces from air (F ∝ v²).',
        description: 'Useful at low speeds or vacuum; real-world drag slows motion at higher velocities.',
        key: 'noAir',
        textbookValue: true,
        realValue: false
    },
    {
        id: 'smallAnglePendulum',
        title: 'Small-angle pendulum approximation',
        type: 'Approximation',
        summary: 'sin(θ) ≈ θ for small angles → linear ODE and closed-form period.',
        description: 'Valid for θ ≲ 10–15°. Useful for analytic solutions and intuition.',
        key: 'pendulumSmallAngle',
        textbookValue: true,
        realValue: false
    }
];

function renderCatalogGrid() {
    // Prefer the main-page grid; fall back to any remaining modal grid id
    const grid = document.getElementById('catalogGridMain') || document.getElementById('catalogGrid');
    if (!grid) return;
    grid.innerHTML = '';
    ASSUMPTIONS.forEach(a => {
        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.dataset.id = a.id;
        card.innerHTML = `
            <h4>${a.title}</h4>
            <p>${a.summary}</p>
            <div class="catalog-meta">
                <small style="color:#6e6e73">${a.type}</small>
                <button class="apply-btn" data-id="${a.id}">Apply</button>
            </div>
        `;
        card.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('apply-btn')) return;
            openAssumptionDetail(a.id, /* mainPage = */ true);
        });
        const applyBtn = card.querySelector('.apply-btn');
        applyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyAssumption(a);
        });
        grid.appendChild(card);
    });
}

function openAssumptionDetail(id, mainPage = false) {
    // Render into main page detail area if present
    const detail = (mainPage ? document.getElementById('catalogDetailMain') : document.getElementById('catalogDetail')) || document.getElementById('catalogDetailMain');
    const assump = ASSUMPTIONS.find(x => x.id === id);
    if (!detail || !assump) return;
    detail.style.display = 'block';
    detail.innerHTML = `
        <h3>${assump.title}</h3>
        <p style="color:#6e6e73">${assump.type} — ${assump.summary}</p>
        <p style="margin-top:8px">${assump.description}</p>
        <div style="margin-top:12px;display:flex;gap:8px;align-items:center;">
            <button id="detailApplyBtn" class="control-btn">Apply to Real World</button>
            <button id="detailCloseBtn" class="control-btn" style="background:#6e6e73">Back to list</button>
        </div>
    `;
    document.getElementById('detailApplyBtn').addEventListener('click', () => applyAssumption(assump));
    document.getElementById('detailCloseBtn').addEventListener('click', () => { detail.style.display = 'none'; });
    // scroll into view for main page
    if (mainPage) detail.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function applyAssumption(assump) {
    // Map known keys to state.assumptions where appropriate
    if (!assump) return;
    if (assump.key === 'frictionless' || assump.key === 'pointMass' || assump.key === 'noAir') {
        // set the assumption to the realValue (usually false to enable effect)
        state.assumptions[assump.key === 'pointMass' ? 'pointMass' : assump.key] = assump.realValue;
        // Update corresponding checkbox if present
        const cb = document.getElementById(`assumption${assump.key.charAt(0).toUpperCase() + assump.key.slice(1)}`);
        if (cb) cb.checked = state.assumptions[assump.key === 'pointMass' ? 'pointMass' : assump.key];
    }

    // Special case: pendulum small-angle toggle — currently controlled by which sim is used; we keep for future mapping
    // Close modal detail and refresh sims
    const detail = document.getElementById('catalogDetail');
    if (detail) detail.style.display = 'none';
    renderCatalogGrid();
    if (realSim) realSim.reset();
    if (idealSim) idealSim.reset();
    if (graph) graph.reset();
    updateExplanation();
}

function openCatalog() {
    // ensure main-page catalog is rendered and scroll to it
    renderCatalogGrid();
    const section = document.getElementById('catalogSection');
    if (section) section.scrollIntoView({ behavior: 'smooth' });
}

function closeCatalog() {
    // hide main-page detail if visible
    const detail = document.getElementById('catalogDetailMain');
    if (detail) detail.style.display = 'none';
}

// Block class
class Block {
    constructor(mass, isReal = false) {
        this.mass = mass;
        this.isReal = isReal;
        this.reset();
        this.trail = []; // Motion trail
        this.maxTrailLength = 20;
    }

    reset() {
        this.position = 0.5; // meters from top of ramp
        this.velocity = 0; // m/s
        this.angularVelocity = 0; // rad/s (for rolling)
        this.rotation = 0; // angle of block rotation
        this.time = 0;
        this.stopped = false;
        this.trail = [];
    }

    update(dt, angleRad, frictionCoeff, useRotation, useFriction, useAir) {
        if (this.stopped) {
            return;
        }

        // Forces
        const mgSinTheta = this.mass * G * Math.sin(angleRad);
        const mgCosTheta = this.mass * G * Math.cos(angleRad);
        
        let netForce = mgSinTheta;
        let acceleration = 0;

        if (useFriction && !state.assumptions.frictionless) {
            const muS = state.muStatic;
            const muK = state.muKinetic;
            const staticMax = muS * mgCosTheta;

            // If the block is at rest, check whether static friction is enough to prevent motion.
            if (Math.abs(this.velocity) < 1e-6) {
                if (mgSinTheta <= staticMax) {
                    this.velocity = 0;
                    this.stopped = true;
                    return;
                }
            }

            const frictionForce = muK * mgCosTheta;
            netForce -= frictionForce;
        }

        // Air resistance (simplified drag: F = 0.5 * C * ρ * A * v²)
        if (useAir && !state.assumptions.noAir && this.velocity > 0) {
            const dragCoeff = 0.1; // Simplified
            const dragForce = dragCoeff * this.velocity * this.velocity;
            netForce -= Math.min(dragForce, netForce);
        }

        if (useRotation && !state.assumptions.pointMass) {
            const rotationalFactor = 1.5;
            acceleration = netForce / (this.mass * rotationalFactor);

            const radius = 0.3;
            this.angularVelocity += (acceleration / radius) * dt;
            this.rotation += this.angularVelocity * dt;
        } else {
            acceleration = netForce / this.mass;
        }

        this.velocity += acceleration * dt;
        this.position += this.velocity * dt;
        this.time += dt;

        if (this.velocity <= 0 && netForce <= 0) {
            this.velocity = 0;
            this.stopped = true;
            return;
        }

        if (this.position > 8) {
            this.position = 8;
            this.velocity = 0;
            this.stopped = true;
            return;
        }
    }

    getAcceleration(angleRad, frictionCoeff, useRotation, useFriction) {
        const mgSinTheta = this.mass * G * Math.sin(angleRad);
        const mgCosTheta = this.mass * G * Math.cos(angleRad);

        let netForce = mgSinTheta;

        if (useFriction && !state.assumptions.frictionless) {
            // If static threshold not exceeded, acceleration is zero
            const muS = state.muStatic;
            const muK = state.muKinetic;
            const staticMax = muS * mgCosTheta;
            if (mgSinTheta <= staticMax) {
                return 0;
            }
            const frictionForce = muK * mgCosTheta;
            netForce -= frictionForce;
        }

        if (useRotation && !state.assumptions.pointMass) {
            const rotationalFactor = 1.5;
            return netForce / (this.mass * rotationalFactor);
        } else {
            return netForce / this.mass;
        }
    }
}

// Simulation class
class RampSimulation {
    constructor(canvasId, isReal = false) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.error('Canvas not found:', canvasId);
            return;
        }
        this.ctx = this.canvas.getContext('2d');

        this.ensureCanvasSize();
        this.block = new Block(state.mass, isReal);
        this.isReal = isReal;
        this.velocityHistory = [];
        
        this.rampLength = 8; // meters
        this.rampStartX = 50;
        this.rampStartY = 100;
        this.rampEndX = 350;
        this.rampEndY = 300;
    }

    ensureCanvasSize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        const width = Math.max(300, Math.round(rect.width || this.canvas.width || 400));
        const height = Math.max(300, Math.round(rect.height || this.canvas.height || 400));
        this.canvas.width = width;
        this.canvas.height = height;
    }

    reset() {
        this.block.reset();
        this.velocityHistory = [];
    }

    update(dt) {
        const angleRad = (state.angle * Math.PI) / 180;
        
        // Ideal sim always uses assumptions ON (frictionless, point mass, no air)
        // Real sim responds to user toggles
        const useFriction = this.isReal && !state.assumptions.frictionless;
        const useRotation = this.isReal && !state.assumptions.pointMass;
        const useAir = this.isReal && !state.assumptions.noAir;
        
        this.block.update(dt, angleRad, state.muKinetic, useRotation, useFriction, useAir);
    }

    getAcceleration() {
        const angleRad = (state.angle * Math.PI) / 180;
        const useFriction = this.isReal && !state.assumptions.frictionless;
        const useRotation = this.isReal && !state.assumptions.pointMass;
        
        return this.block.getAcceleration(angleRad, state.muKinetic, useRotation, useFriction);
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        this.ensureCanvasSize();

        // Clear canvas with white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Calculate ramp end position based on angle
        const angleRad = (state.angle * Math.PI) / 180;
        this.rampEndX = this.rampStartX + this.rampLength * SCALE * Math.cos(angleRad);
        this.rampEndY = this.rampStartY + this.rampLength * SCALE * Math.sin(angleRad);
        
        // Draw ramp shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowOffsetX = 2;
        this.ctx.shadowOffsetY = 3;
        
        // Draw ramp
        this.ctx.strokeStyle = '#1d1d1f';
        this.ctx.lineWidth = 6;
        this.ctx.lineCap = 'round';
        this.ctx.beginPath();
        this.ctx.moveTo(this.rampStartX, this.rampStartY);
        this.ctx.lineTo(this.rampEndX, this.rampEndY);
        this.ctx.stroke();
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;
        
        // Draw ramp surface (with texture if friction)
        if (this.isReal && !state.assumptions.frictionless) {
            this.ctx.strokeStyle = '#86868b';
            this.ctx.lineWidth = 1.5;
            // Draw texture lines
            for (let i = 0; i < 20; i++) {
                const t = i / 20;
                const x1 = this.rampStartX + (this.rampEndX - this.rampStartX) * t;
                const y1 = this.rampStartY + (this.rampEndY - this.rampStartY) * t;
                const perpX = -Math.sin(angleRad) * 5;
                const perpY = Math.cos(angleRad) * 5;
                this.ctx.beginPath();
                this.ctx.moveTo(x1, y1);
                this.ctx.lineTo(x1 + perpX, y1 + perpY);
                this.ctx.stroke();
            }
        }
        
        // Calculate block position on ramp
        const blockT = this.block.position / this.rampLength;
        const blockX = this.rampStartX + (this.rampEndX - this.rampStartX) * blockT;
        const blockY = this.rampStartY + (this.rampEndY - this.rampStartY) * blockT;
        
        // Add to trail
        if (this.block.velocity > 0.1) {
            this.block.trail.push({ x: blockX, y: blockY, alpha: 1.0 });
            if (this.block.trail.length > this.block.maxTrailLength) {
                this.block.trail.shift();
            }
        }
        
        // Draw motion trail
        this.block.trail.forEach((point, index) => {
            const alpha = (index / this.block.trail.length) * 0.15;
            const size = 6 + (index / this.block.trail.length) * 4;
            this.ctx.fillStyle = this.isReal ? `rgba(255, 149, 0, ${alpha})` : `rgba(0, 113, 227, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw block shadow
        this.ctx.save();
        this.ctx.translate(blockX + 5, blockY + 5);
        this.ctx.rotate(angleRad);
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(-15, -15, 30, 30);
        this.ctx.restore();
        
        // Draw block
        const blockSize = 30;
        this.ctx.save();
        this.ctx.translate(blockX, blockY);
        
        // Add subtle glow effect when moving fast
        if (this.block.velocity > 2) {
            const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, blockSize * 1.2);
            gradient.addColorStop(0, this.isReal ? 'rgba(255, 149, 0, 0.2)' : 'rgba(0, 113, 227, 0.2)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(-blockSize, -blockSize, blockSize * 2, blockSize * 2);
        }
        
        // Rotate block based on ramp angle and rotation
        if (this.isReal && !state.assumptions.pointMass) {
            this.ctx.rotate(angleRad + this.block.rotation);
        } else {
            this.ctx.rotate(angleRad);
        }
        
        // Draw block body with subtle styling
        if (this.isReal) {
            this.ctx.fillStyle = '#ff9500';
        } else {
            this.ctx.fillStyle = '#0071e3';
        }
        this.ctx.fillRect(-blockSize/2, -blockSize/2, blockSize, blockSize);
        
        // Block border
        this.ctx.strokeStyle = this.isReal ? '#e68a00' : '#0077ed';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-blockSize/2, -blockSize/2, blockSize, blockSize);
        
        // Draw rotation indicator (dot) if rotating
        if (this.isReal && !state.assumptions.pointMass) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 3;
            this.ctx.beginPath();
            this.ctx.arc(blockSize/4, 0, 5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowColor = 'transparent';
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.restore();
        
        // Draw forces (vectors)
        this.drawForces(blockX, blockY, angleRad);
        
        // Draw angle arc
        this.drawAngleArc();
    }

    drawForces(blockX, blockY, angleRad) {
        const forceScale = 3; // scale for visualization
        
        // Gravity (straight down)
        const gravityLength = state.mass * G * forceScale;
        this.drawVector(blockX, blockY, 0, gravityLength, '#2ecc71', 'mg');
        
        if (this.isReal && !state.assumptions.frictionless) {
            // Friction force (up the ramp). Use kinetic coefficient when moving; if static, visualize resisting force
            const normalForce = state.mass * G * Math.cos(angleRad);
            let frictionForce = state.muKinetic * normalForce;
            // If block is stopped and static friction threshold holds, show equal-and-opposite friction
            if (Math.abs(this.block.velocity) < 1e-3) {
                const staticMax = state.muStatic * normalForce;
                const mgSinTheta = state.mass * G * Math.sin(angleRad);
                if (mgSinTheta <= staticMax) {
                    frictionForce = mgSinTheta; // static friction balancing component down ramp
                }
            }
            const frictionLength = frictionForce * forceScale;
            const frictionX = -frictionLength * Math.cos(angleRad);
            const frictionY = -frictionLength * Math.sin(angleRad);
            this.drawVector(blockX, blockY, frictionX, frictionY, '#ff9500', 'f');
        }
        
        // Component down the ramp (for reference in textbook mode)
        if (!this.isReal) {
            const componentLength = state.mass * G * Math.sin(angleRad) * forceScale;
            const compX = componentLength * Math.cos(angleRad);
            const compY = componentLength * Math.sin(angleRad);
            this.drawVector(blockX, blockY, compX, compY, '#0071e3', 'F');
        }
    }

    drawVector(x, y, dx, dy, color, label) {
        this.ctx.strokeStyle = color;
        this.ctx.fillStyle = color;
        this.ctx.lineWidth = 2.5;
        
        // Arrow line with slight shadow for depth
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        this.ctx.shadowBlur = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(x + dx, y + dy);
        this.ctx.stroke();
        
        // Arrow head
        const angle = Math.atan2(dy, dx);
        const headLength = 10;
        this.ctx.beginPath();
        this.ctx.moveTo(x + dx, y + dy);
        this.ctx.lineTo(
            x + dx - headLength * Math.cos(angle - Math.PI / 6),
            y + dy - headLength * Math.sin(angle - Math.PI / 6)
        );
        this.ctx.moveTo(x + dx, y + dy);
        this.ctx.lineTo(
            x + dx - headLength * Math.cos(angle + Math.PI / 6),
            y + dy - headLength * Math.sin(angle + Math.PI / 6)
        );
        this.ctx.stroke();
        
        // Reset shadow
        this.ctx.shadowColor = 'transparent';
        this.ctx.shadowBlur = 0;
        
        // Label with background for readability
        this.ctx.font = 'bold 13px -apple-system, sans-serif';
        const metrics = this.ctx.measureText(label);
        const labelX = x + dx + 8;
        const labelY = y + dy - 8;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.fillRect(labelX - 2, labelY - 10, metrics.width + 4, 14);
        
        this.ctx.fillStyle = color;
        this.ctx.fillText(label, labelX, labelY);
    }

    drawAngleArc() {
        const arcRadius = 40;
        const angleRad = (state.angle * Math.PI) / 180;
        
        this.ctx.strokeStyle = '#86868b';
        this.ctx.lineWidth = 1.5;
        this.ctx.setLineDash([3, 3]);
        this.ctx.beginPath();
        this.ctx.arc(this.rampStartX, this.rampStartY, arcRadius, 0, angleRad);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Angle label with better styling
        this.ctx.fillStyle = '#1d1d1f';
        this.ctx.font = '13px -apple-system, sans-serif';
        this.ctx.fillText(
            state.angle + '°',
            this.rampStartX + arcRadius + 12,
            this.rampStartY + 5
        );
    }
}

// Pendulum model
class Pendulum {
    constructor(length = 1.0, mass = 1.0, isReal = false) {
        this.length = length;
        this.mass = mass;
        this.isReal = isReal;
        this.reset();
    }

    reset() {
        // angle in radians
        this.angle = (state.pendulumInitAngle * Math.PI) / 180;
        this.angularVelocity = 0;
        this.time = 0;
    }

    update(dt, useSmallAngle, useDamping) {
        // equation: theta'' = - (g/L) * sin(theta) - (b/m) * theta'
        const gOverL = G / this.length;
        const dampingTerm = useDamping ? (state.pendulumDamping / this.mass) * this.angularVelocity : 0;
        const restoring = useSmallAngle ? gOverL * this.angle : gOverL * Math.sin(this.angle);
        const angularAcc = -restoring - dampingTerm;

        this.angularVelocity += angularAcc * dt;
        this.angle += this.angularVelocity * dt;
        this.time += dt;
    }

    getPeriodSmallAngle() {
        return 2 * Math.PI * Math.sqrt(this.length / G);
    }
}

class PendulumSimulation {
    constructor(canvasId, isReal = false) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.isReal = isReal;
        this.pendulum = new Pendulum(state.pendulumLength, 1, isReal);
        this.ensureCanvasSize = function() {
            if (!this.canvas) return;
            const rect = this.canvas.getBoundingClientRect();
            this.canvas.width = Math.round(rect.width || this.canvas.width || 400);
            this.canvas.height = Math.round(rect.height || this.canvas.height || 300);
        };
    }

    reset() {
        this.pendulum.length = state.pendulumLength;
        this.pendulum.reset();
    }

    update(dt) {
        const useSmall = !this.isReal; // textbook uses small-angle
        const useDamping = this.isReal; // real includes damping by default
        this.pendulum.length = state.pendulumLength;
        this.pendulum.update(dt, useSmall, useDamping);
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        this.ensureCanvasSize();
        const ctx = this.ctx;
        ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

        const cx = this.canvas.width / 2;
        const cy = 50;
        const Lpx = this.pendulum.length * SCALE;
        const x = cx + Lpx * Math.sin(this.pendulum.angle);
        const y = cy + Lpx * Math.cos(this.pendulum.angle);

        // rod
        ctx.strokeStyle = this.isReal ? '#ff9500' : '#0071e3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(x, y);
        ctx.stroke();

        // bob
        ctx.fillStyle = this.isReal ? '#ff9500' : '#0071e3';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI*2);
        ctx.fill();
    }
}

class MassSpringDamper {
    constructor(isReal = false) {
        this.isReal = isReal;
        this.position = 0.8;
        this.velocity = 0;
        this.time = 0;
    }

    reset() {
        this.position = 0.8;
        this.velocity = 0;
        this.time = 0;
    }

    update(dt) {
        const m = state.massSpringMass;
        const k = state.springConstant;
        const c = state.dampingCoeff;

        const springForce = -k * this.position;
        const dampingForce = -c * this.velocity;
        const acceleration = (springForce + dampingForce) / m;

        if (!this.isReal) {
            this.velocity += (-k * this.position / m) * dt;
        } else {
            this.velocity += acceleration * dt;
        }

        this.position += this.velocity * dt;
        this.time += dt;
    }
}

class MassSpringDamperSimulation {
    constructor(canvasId, isReal = false) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.isReal = isReal;
        this.oscillator = new MassSpringDamper(isReal);
        this.ensureCanvasSize();
    }

    ensureCanvasSize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = Math.round(rect.width || this.canvas.width || 400);
        this.canvas.height = Math.round(rect.height || this.canvas.height || 260);
    }

    reset() {
        this.oscillator.reset();
    }

    update(dt) {
        this.oscillator.update(dt);
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        this.ensureCanvasSize();
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        const supportX = w * 0.5;
        const supportY = 30;
        const equilibriumY = h * 0.75;
        const massW = 80;
        const massH = 32;
        const amplitude = 90;
        const x = supportX + this.oscillator.position * amplitude;

        ctx.fillStyle = '#f5f5f7';
        ctx.fillRect(0, 0, w, h);

        ctx.strokeStyle = this.isReal ? '#ff9500' : '#0071e3';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(supportX, supportY);
        ctx.lineTo(supportX, equilibriumY - 40);
        ctx.stroke();

        const springSegments = 18;
        ctx.beginPath();
        ctx.moveTo(supportX, equilibriumY - 40);
        for (let i = 0; i <= springSegments; i++) {
            const px = supportX + (i / springSegments) * (x - supportX);
            const py = equilibriumY - 40 + (i % 2 === 0 ? 0 : 12);
            ctx.lineTo(px, py);
        }
        ctx.stroke();

        ctx.fillStyle = this.isReal ? '#ff9500' : '#0071e3';
        ctx.fillRect(x - massW / 2, equilibriumY - massH / 2, massW, massH);

        ctx.fillStyle = '#1d1d1f';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillText(`x ≈ ${this.oscillator.position.toFixed(2)} m`, 18, 22);
        ctx.fillText(`v ≈ ${this.oscillator.velocity.toFixed(2)} m/s`, 18, 38);
    }
}

class FreeFallBody {
    constructor(isReal = false) {
        this.isReal = isReal;
        this.height = 0;
        this.velocity = 0;
        this.time = 0;
    }

    reset() {
        this.height = 0;
        this.velocity = 0;
        this.time = 0;
    }

    update(dt) {
        const g = G;
        const mass = state.freeFallMass;
        const dragTerm = state.dragCoeff * Math.abs(this.velocity) * this.velocity;

        if (!this.isReal) {
            this.velocity += g * dt;
        } else {
            const acceleration = g - (dragTerm / mass);
            this.velocity += acceleration * dt;
            if (this.velocity > 0) {
                this.velocity = Math.max(0, this.velocity);
            }
        }

        const fallDistance = this.velocity * dt * 20;
        this.height += fallDistance;
        this.time += dt;
    }
}

class FreeFallSimulation {
    constructor(canvasId, isReal = false) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.isReal = isReal;
        this.body = new FreeFallBody(isReal);
        this.ensureCanvasSize();
    }

    ensureCanvasSize() {
        if (!this.canvas) return;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = Math.round(rect.width || this.canvas.width || 400);
        this.canvas.height = Math.round(rect.height || this.canvas.height || 260);
    }

    reset() {
        this.body.reset();
    }

    update(dt) {
        this.body.update(dt);
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        this.ensureCanvasSize();
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        const groundY = h - 28;
        const maxDrop = 180;
        const displayHeight = Math.min(this.body.height, maxDrop);
        const bobY = groundY - displayHeight;

        ctx.fillStyle = '#f5f5f7';
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#e5e5ea';
        ctx.fillRect(0, groundY, w, 28);

        ctx.strokeStyle = '#1d1d1f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, groundY);
        ctx.lineTo(w, groundY);
        ctx.stroke();

        ctx.fillStyle = this.isReal ? '#ff9500' : '#0071e3';
        ctx.beginPath();
        ctx.arc(w * 0.5, bobY, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1d1d1f';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillText(`v ≈ ${this.body.velocity.toFixed(2)} m/s`, 18, 22);
        ctx.fillText(`t ≈ ${this.body.time.toFixed(2)} s`, 18, 40);
    }
}

class ThermoSimulation {
    constructor(canvasId, isReal = false) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.isReal = isReal;
        this.pressure = 0;
        this.volume = state.thermoVolume;
        this.pistonOffset = 0.5;
        this.particles = [];
        this.reset();
    }

    reset() {
        this.volume = state.thermoVolume;
        this.pressure = this.getPressure();
        this.pistonOffset = 0.5;
        this.particles = Array.from({ length: 14 }, (_, i) => ({
            x: 0.2 + (i % 5) * 0.12,
            y: 0.2 + Math.floor(i / 5) * 0.2,
            vx: (Math.random() - 0.5) * 0.2,
            vy: (Math.random() - 0.5) * 0.2
        }));
    }

    getPressure() {
        const T = state.thermoTemperature;
        const V = state.thermoVolume;
        const n = 1;
        const idealPressure = (n * 8.314 * T) / V;
        if (!this.isReal) {
            return idealPressure / 10;
        }
        const a = 1.4;
        const b = 0.04;
        const realPressure = (n * 8.314 * T) / (V - n * b) - (a * n * n) / (V * V);
        return Math.max(0.1, (realPressure / 10) - state.thermoHeatLoss * 8);
    }

    update(dt) {
        const targetPressure = this.getPressure();
        this.pressure += (targetPressure - this.pressure) * 0.12;
        const targetPiston = 0.2 + (state.thermoVolume / 3.0) * 0.7;
        this.pistonOffset += (targetPiston - this.pistonOffset) * 0.08;

        this.particles.forEach((particle) => {
            particle.x += particle.vx * dt * 18;
            particle.y += particle.vy * dt * 18;
            if (particle.x < 0.1 || particle.x > 0.95) particle.vx *= -1;
            if (particle.y < 0.08 || particle.y > 0.9) particle.vy *= -1;
        });
    }

    draw() {
        if (!this.canvas || !this.ctx) return;
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        const left = 60;
        const right = w - 55;
        const top = 50;
        const bottom = h - 40;
        const pistonX = left + (right - left) * this.pistonOffset;
        const cylinderWidth = right - left;

        ctx.fillStyle = '#f5f5f7';
        ctx.fillRect(0, 0, w, h);

        // cylinder body
        ctx.strokeStyle = this.isReal ? '#ff9500' : '#0071e3';
        ctx.lineWidth = 3;
        ctx.strokeRect(left, top, cylinderWidth, bottom - top);

        // gas particles
        ctx.fillStyle = this.isReal ? '#ff9500' : '#0071e3';
        this.particles.forEach((particle) => {
            const px = left + 18 + particle.x * (cylinderWidth - 36);
            const py = top + 18 + particle.y * (bottom - top - 36);
            ctx.beginPath();
            ctx.arc(px, py, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        // piston
        ctx.fillStyle = this.isReal ? '#ff9500' : '#0071e3';
        ctx.fillRect(pistonX - 40, top - 8, 80, 14);
        ctx.fillStyle = '#1d1d1f';
        ctx.fillRect(pistonX - 42, top - 8, 4, (bottom - top) + 16);
        ctx.fillRect(pistonX + 38, top - 8, 4, (bottom - top) + 16);

        // pressure label
        ctx.fillStyle = '#1d1d1f';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillText(`P ≈ ${this.pressure.toFixed(1)} kPa`, 20, 22);
    }
}

class ThermoGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.dataIdeal = [];
        this.dataReal = [];
        this.maxPoints = 180;
    }

    addData(idealPressure, realPressure) {
        this.dataIdeal.push(idealPressure);
        this.dataReal.push(realPressure);
        if (this.dataIdeal.length > this.maxPoints) this.dataIdeal.shift();
        if (this.dataReal.length > this.maxPoints) this.dataReal.shift();
    }

    draw() {
        const canvas = this.canvas;
        const ctx = this.ctx;
        const width = canvas.width;
        const height = canvas.height;
        const pad = 30;

        ctx.fillStyle = '#f5f5f7';
        ctx.fillRect(0, 0, width, height);

        ctx.strokeStyle = '#86868b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pad, pad);
        ctx.lineTo(pad, height - pad);
        ctx.lineTo(width - pad, height - pad);
        ctx.stroke();

        const maxP = 120;
        const xRange = width - pad * 2;
        const yRange = height - pad * 2;

        const drawLine = (values, color) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            values.forEach((value, index) => {
                const x = pad + (index / Math.max(1, values.length - 1)) * xRange;
                const y = height - pad - (value / maxP) * yRange;
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();
        };

        if (this.dataIdeal.length > 1) drawLine(this.dataIdeal, '#0071e3');
        if (this.dataReal.length > 1) drawLine(this.dataReal, '#ff9500');

        ctx.fillStyle = '#1d1d1f';
        ctx.font = '13px -apple-system, sans-serif';
        ctx.fillText('Pressure', 8, 18);
        ctx.fillText('Volume', width - 60, height - 8);

        ctx.fillStyle = '#0071e3';
        ctx.fillRect(width - 150, 16, 12, 8);
        ctx.fillStyle = '#1d1d1f';
        ctx.fillText('Ideal', width - 130, 24);

        ctx.fillStyle = '#ff9500';
        ctx.fillRect(width - 150, 34, 12, 8);
        ctx.fillStyle = '#1d1d1f';
        ctx.fillText('Real', width - 130, 42);
    }

    reset() {
        this.dataIdeal = [];
        this.dataReal = [];
    }
}

// Graph class for velocity over time
class VelocityGraph {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.dataIdeal = [];
        this.dataReal = [];
        this.maxPoints = 300;
        this.time = 0;
    }

    addData(idealVel, realVel) {
        this.time += 1;
        this.dataIdeal.push({ time: this.time, velocity: idealVel });
        this.dataReal.push({ time: this.time, velocity: realVel });
        
        // Keep only recent data
        if (this.dataIdeal.length > this.maxPoints) {
            this.dataIdeal.shift();
        }
        if (this.dataReal.length > this.maxPoints) {
            this.dataReal.shift();
        }
    }

    draw() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 40;
        
        // Clear with subtle background
        this.ctx.fillStyle = '#f5f5f7';
        this.ctx.fillRect(0, 0, width, height);
        
        // Draw axes
        this.ctx.strokeStyle = '#86868b';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.moveTo(padding, padding);
        this.ctx.lineTo(padding, height - padding);
        this.ctx.lineTo(width - padding, height - padding);
        this.ctx.stroke();
        
        // Labels
        this.ctx.fillStyle = '#1d1d1f';
        this.ctx.font = '13px -apple-system, sans-serif';
        this.ctx.fillText('Velocity (m/s)', 10, 20);
        this.ctx.fillText('Time', width - 60, height - 10);
        
        // Draw data
        if (this.dataIdeal.length > 1) {
            this.drawLine(this.dataIdeal, '#0071e3', padding, width - padding, padding, height - padding);
        }
        if (this.dataReal.length > 1) {
            this.drawLine(this.dataReal, '#ff9500', padding, width - padding, padding, height - padding);
        }
        
        // Legend
        this.ctx.fillStyle = '#0071e3';
        this.ctx.fillRect(width - 150, 20, 20, 10);
        this.ctx.fillStyle = '#1d1d1f';
        this.ctx.fillText('Textbook', width - 125, 29);
        
        this.ctx.fillStyle = '#ff9500';
        this.ctx.fillRect(width - 150, 40, 20, 10);
        this.ctx.fillStyle = '#1d1d1f';
        this.ctx.fillText('Real World', width - 125, 49);
    }

    drawLine(data, color, xMin, xMax, yMin, yMax) {
        const maxVelocity = 15; // m/s
        const xRange = xMax - xMin;
        const yRange = yMax - yMin;
        
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.beginPath();
        
        data.forEach((point, index) => {
            const x = xMin + (index / this.maxPoints) * xRange;
            const y = yMax - (point.velocity / maxVelocity) * yRange;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
    }

    reset() {
        this.dataIdeal = [];
        this.dataReal = [];
        this.time = 0;
    }
}

// Initialize simulations
let idealSim, realSim, graph;
let pendulumIdeal, pendulumReal, pendulumGraph;
let massSpringIdeal, massSpringReal;
let freeFallIdeal, freeFallReal;
let thermoIdeal, thermoReal, thermoGraph;
let animationFrameId;

function renderCatalogGrid() {
    const grid = document.getElementById('catalogGridMain');
    if (!grid) return;

    grid.innerHTML = '';
    MODEL_CATALOG.forEach((model) => {
        const card = document.createElement('div');
        card.className = 'catalog-card';
        card.innerHTML = `
            <h4>${model.title}</h4>
            <p>${model.summary}</p>
            <div class="catalog-meta">
                <span>Model</span>
                <button class="apply-btn" data-model="${model.id}">Open</button>
            </div>
        `;

        card.addEventListener('click', (event) => {
            if (event.target && event.target.closest('.apply-btn')) return;
            selectModel(model.id);
        });

        const button = card.querySelector('.apply-btn');
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            selectModel(model.id);
        });

        grid.appendChild(card);
    });
}

function selectModel(modelId) {
    state.selectedModel = modelId;
    state.currentView = 'model';
    document.getElementById('modelTitle').textContent = MODEL_CATALOG.find(m => m.id === modelId)?.title || 'Model';
    const rampSection = document.getElementById('rampModelSection');
    const pendulumSection = document.getElementById('pendulumModelSection');
    const massSpringSection = document.getElementById('massSpringModelSection');
    const freeFallSection = document.getElementById('freeFallModelSection');
    const thermoSection = document.getElementById('thermoModelSection');
    if (rampSection) rampSection.classList.toggle('hidden', modelId !== 'ramp');
    if (pendulumSection) pendulumSection.classList.toggle('hidden', modelId !== 'pendulum');
    if (massSpringSection) massSpringSection.classList.toggle('hidden', modelId !== 'mass-spring');
    if (freeFallSection) freeFallSection.classList.toggle('hidden', modelId !== 'free-fall');
    if (thermoSection) thermoSection.classList.toggle('hidden', modelId !== 'thermo');
    showView('model');
}

function showView(viewName) {
    const catalog = document.getElementById('catalogScreen');
    const model = document.getElementById('modelScreen');

    catalog.classList.toggle('active', viewName === 'catalog');
    catalog.classList.toggle('hidden', viewName !== 'catalog');
    model.classList.toggle('active', viewName === 'model');
    model.classList.toggle('hidden', viewName !== 'model');
}

function resetAllMotion() {
    if (idealSim) idealSim.reset();
    if (realSim) realSim.reset();
    if (graph) graph.reset();
    if (pendulumIdeal) pendulumIdeal.reset();
    if (pendulumReal) pendulumReal.reset();
    if (pendulumGraph) pendulumGraph.reset();
    if (massSpringIdeal) massSpringIdeal.reset();
    if (massSpringReal) massSpringReal.reset();
    if (freeFallIdeal) freeFallIdeal.reset();
    if (freeFallReal) freeFallReal.reset();
    if (thermoIdeal) thermoIdeal.reset();
    if (thermoReal) thermoReal.reset();
    if (thermoGraph) thermoGraph.reset();
}

function init() {
    renderCatalogGrid();

    idealSim = new RampSimulation('idealCanvas', false);
    realSim = new RampSimulation('realCanvas', true);
    graph = new VelocityGraph('graphCanvas');
    pendulumIdeal = new PendulumSimulation('pendulumIdealCanvas', false);
    pendulumReal = new PendulumSimulation('pendulumRealCanvas', true);
    pendulumGraph = new VelocityGraph('pendulumGraphCanvas');
    massSpringIdeal = new MassSpringDamperSimulation('massSpringIdealCanvas', false);
    massSpringReal = new MassSpringDamperSimulation('massSpringRealCanvas', true);
    freeFallIdeal = new FreeFallSimulation('freeFallIdealCanvas', false);
    freeFallReal = new FreeFallSimulation('freeFallRealCanvas', true);
    thermoIdeal = new ThermoSimulation('thermoIdealCanvas', false);
    thermoReal = new ThermoSimulation('thermoRealCanvas', true);
    thermoGraph = new ThermoGraph('thermoGraphCanvas');

    setupEventListeners();
    updateUI();
    showView('catalog');
    animate();
}

function setupEventListeners() {
    // Assumptions
    document.getElementById('assumptionFrictionless').addEventListener('change', (e) => {
        state.assumptions.frictionless = e.target.checked;
        resetAllMotion();
        updateExplanation();
    });
    
    document.getElementById('assumptionPointMass').addEventListener('change', (e) => {
        state.assumptions.pointMass = e.target.checked;
        resetAllMotion();
        updateExplanation();
    });
    
    document.getElementById('assumptionNoAir').addEventListener('change', (e) => {
        state.assumptions.noAir = e.target.checked;
        resetAllMotion();
        updateExplanation();
    });
    
    // Parameters
    document.getElementById('angleSlider').addEventListener('input', (e) => {
        state.angle = parseInt(e.target.value);
        document.getElementById('angleValue').textContent = state.angle;
        resetAllMotion();
        updateResults();
    });
    
    document.getElementById('massSlider').addEventListener('input', (e) => {
        state.mass = parseFloat(e.target.value);
        document.getElementById('massValue').textContent = state.mass.toFixed(1);
        idealSim.block.mass = state.mass;
        realSim.block.mass = state.mass;
        resetAllMotion();
        updateResults();
    });
    
    document.getElementById('frictionSlider').addEventListener('input', (e) => {
        state.muKinetic = parseFloat(e.target.value);
        document.getElementById('frictionValue').textContent = state.muKinetic.toFixed(2);
        resetAllMotion();
        updateResults();
    });

    // Pendulum controls
    const pLen = document.getElementById('pendulumLengthSlider');
    if (pLen) {
        pLen.addEventListener('input', (e) => {
            state.pendulumLength = parseFloat(e.target.value);
            document.getElementById('pendulumLengthValue').textContent = state.pendulumLength.toFixed(2);
            pendulumIdeal.reset();
            pendulumReal.reset();
            pendulumGraph.reset();
            updateUI();
        });
    }

    const pAng = document.getElementById('pendulumAngleSlider');
    if (pAng) {
        pAng.addEventListener('input', (e) => {
            state.pendulumInitAngle = parseFloat(e.target.value);
            document.getElementById('pendulumAngleValue').textContent = state.pendulumInitAngle;
            pendulumIdeal.reset();
            pendulumReal.reset();
            pendulumGraph.reset();
            updateUI();
        });
    }

    const pDamp = document.getElementById('pendulumDampingSlider');
    if (pDamp) {
        pDamp.addEventListener('input', (e) => {
            state.pendulumDamping = parseFloat(e.target.value);
            document.getElementById('pendulumDampingValue').textContent = state.pendulumDamping.toFixed(2);
            pendulumIdeal.reset();
            pendulumReal.reset();
            pendulumGraph.reset();
            updateUI();
        });
    }

    // Static friction slider
    const staticSlider = document.getElementById('staticFrictionSlider');
    if (staticSlider) {
        staticSlider.addEventListener('input', (e) => {
            state.muStatic = parseFloat(e.target.value);
            document.getElementById('staticFrictionValue').textContent = state.muStatic.toFixed(2);
            idealSim.reset();
            realSim.reset();
            graph.reset();
            updateResults();
        });
    }

    const massSpringMassSlider = document.getElementById('massSpringMassSlider');
    if (massSpringMassSlider) {
        massSpringMassSlider.addEventListener('input', (e) => {
            state.massSpringMass = parseFloat(e.target.value);
            document.getElementById('massSpringMassValue').textContent = state.massSpringMass.toFixed(1);
            resetAllMotion();
        });
    }

    const springConstSlider = document.getElementById('springConstSlider');
    if (springConstSlider) {
        springConstSlider.addEventListener('input', (e) => {
            state.springConstant = parseFloat(e.target.value);
            document.getElementById('springConstValue').textContent = state.springConstant.toFixed(0);
            resetAllMotion();
        });
    }

    const dampingSlider = document.getElementById('dampingSlider');
    if (dampingSlider) {
        dampingSlider.addEventListener('input', (e) => {
            state.dampingCoeff = parseFloat(e.target.value);
            document.getElementById('dampingValue').textContent = state.dampingCoeff.toFixed(1);
            resetAllMotion();
        });
    }

    const freeFallMassSlider = document.getElementById('freeFallMassSlider');
    if (freeFallMassSlider) {
        freeFallMassSlider.addEventListener('input', (e) => {
            state.freeFallMass = parseFloat(e.target.value);
            document.getElementById('freeFallMassValue').textContent = state.freeFallMass.toFixed(1);
            resetAllMotion();
        });
    }

    const dragCoeffSlider = document.getElementById('dragCoeffSlider');
    if (dragCoeffSlider) {
        dragCoeffSlider.addEventListener('input', (e) => {
            state.dragCoeff = parseFloat(e.target.value);
            document.getElementById('dragCoeffValue').textContent = state.dragCoeff.toFixed(2);
            resetAllMotion();
        });
    }

    const thermoTempSlider = document.getElementById('thermoTempSlider');
    if (thermoTempSlider) {
        thermoTempSlider.addEventListener('input', (e) => {
            state.thermoTemperature = parseFloat(e.target.value);
            document.getElementById('thermoTempValue').textContent = state.thermoTemperature.toFixed(0);
            resetAllMotion();
        });
    }

    const thermoVolumeSlider = document.getElementById('thermoVolumeSlider');
    if (thermoVolumeSlider) {
        thermoVolumeSlider.addEventListener('input', (e) => {
            state.thermoVolume = parseFloat(e.target.value);
            document.getElementById('thermoVolumeValue').textContent = state.thermoVolume.toFixed(1);
            resetAllMotion();
        });
    }

    const thermoHeatSlider = document.getElementById('thermoHeatSlider');
    if (thermoHeatSlider) {
        thermoHeatSlider.addEventListener('input', (e) => {
            state.thermoHeatLoss = parseFloat(e.target.value);
            document.getElementById('thermoHeatValue').textContent = state.thermoHeatLoss.toFixed(2);
            resetAllMotion();
        });
    }
    
    // Controls
    document.getElementById('playPauseBtn').addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        document.getElementById('playPauseBtn').textContent = state.isPlaying ? '⏸️ Pause' : '▶️ Play';
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        idealSim.reset();
        realSim.reset();
        graph.reset();
        if (pendulumIdeal) pendulumIdeal.reset();
        if (pendulumReal) pendulumReal.reset();
        if (pendulumGraph) pendulumGraph.reset();
        if (massSpringIdeal) massSpringIdeal.reset();
        if (massSpringReal) massSpringReal.reset();
        if (freeFallIdeal) freeFallIdeal.reset();
        if (freeFallReal) freeFallReal.reset();
        if (thermoIdeal) thermoIdeal.reset();
        if (thermoReal) thermoReal.reset();
        if (thermoGraph) thermoGraph.reset();
    });

    const backToCatalogBtn = document.getElementById('backToCatalogBtn');
    if (backToCatalogBtn) {
        backToCatalogBtn.addEventListener('click', () => {
            state.currentView = 'catalog';
            showView('catalog');
        });
    }

    document.querySelectorAll('.catalog-link').forEach((button) => {
        button.addEventListener('click', () => {
            const modelId = button.dataset.model;
            if (modelId) selectModel(modelId);
        });
    });

    document.querySelectorAll('.catalog-card').forEach((card) => {
        const btn = card.querySelector('.apply-btn');
        if (btn) {
            btn.addEventListener('click', () => {
                selectModel(btn.dataset.model);
            });
        }
    });
}

function updateUI() {
    // Sync parameter displays
    const sv = document.getElementById('staticFrictionValue');
    if (sv) sv.textContent = state.muStatic.toFixed(2);
    const kv = document.getElementById('frictionValue');
    if (kv) kv.textContent = state.muKinetic.toFixed(2);

    // Pendulum displays
    const pl = document.getElementById('pendulumLengthValue');
    if (pl) pl.textContent = state.pendulumLength.toFixed(2);
    const pa = document.getElementById('pendulumAngleValue');
    if (pa) pa.textContent = state.pendulumInitAngle;
    const pd = document.getElementById('pendulumDampingValue');
    if (pd) pd.textContent = state.pendulumDamping.toFixed(2);

    const massSpringMassText = document.getElementById('massSpringMassValue');
    if (massSpringMassText) massSpringMassText.textContent = state.massSpringMass.toFixed(1);
    const springConstText = document.getElementById('springConstValue');
    if (springConstText) springConstText.textContent = state.springConstant.toFixed(0);
    const dampingText = document.getElementById('dampingValue');
    if (dampingText) dampingText.textContent = state.dampingCoeff.toFixed(1);
    const freeFallMassText = document.getElementById('freeFallMassValue');
    if (freeFallMassText) freeFallMassText.textContent = state.freeFallMass.toFixed(1);
    const dragText = document.getElementById('dragCoeffValue');
    if (dragText) dragText.textContent = state.dragCoeff.toFixed(2);

    const ttv = document.getElementById('thermoTempValue');
    if (ttv) ttv.textContent = state.thermoTemperature.toFixed(0);
    const tvv = document.getElementById('thermoVolumeValue');
    if (tvv) tvv.textContent = state.thermoVolume.toFixed(1);
    const thv = document.getElementById('thermoHeatValue');
    if (thv) thv.textContent = state.thermoHeatLoss.toFixed(2);

    if (pendulumIdeal) {
        document.getElementById('pendulumIdealPeriod').textContent = pendulumIdeal.pendulum.getPeriodSmallAngle().toFixed(2) + ' s';
        document.getElementById('pendulumIdealAngle').textContent = (state.pendulumInitAngle).toFixed(1) + '°';
    }
    if (pendulumReal) {
        document.getElementById('pendulumRealPeriod').textContent = pendulumReal.pendulum.getPeriodSmallAngle().toFixed(2) + ' s';
        document.getElementById('pendulumRealAngle').textContent = (state.pendulumInitAngle).toFixed(1) + '°';
    }
    if (massSpringIdeal) {
        document.getElementById('massSpringIdealPosition').textContent = massSpringIdeal.oscillator.position.toFixed(2) + ' m';
        document.getElementById('massSpringIdealVelocity').textContent = massSpringIdeal.oscillator.velocity.toFixed(2) + ' m/s';
    }
    if (massSpringReal) {
        document.getElementById('massSpringRealPosition').textContent = massSpringReal.oscillator.position.toFixed(2) + ' m';
        document.getElementById('massSpringRealVelocity').textContent = massSpringReal.oscillator.velocity.toFixed(2) + ' m/s';
    }
    if (freeFallIdeal) {
        document.getElementById('freeFallIdealVelocity').textContent = freeFallIdeal.body.velocity.toFixed(2) + ' m/s';
        document.getElementById('freeFallIdealTime').textContent = freeFallIdeal.body.time.toFixed(2) + ' s';
    }
    if (freeFallReal) {
        document.getElementById('freeFallRealVelocity').textContent = freeFallReal.body.velocity.toFixed(2) + ' m/s';
        document.getElementById('freeFallRealTime').textContent = freeFallReal.body.time.toFixed(2) + ' s';
    }
    if (thermoIdeal) {
        document.getElementById('thermoIdealPressure').textContent = thermoIdeal.getPressure().toFixed(1) + ' kPa';
        document.getElementById('thermoIdealVolume').textContent = state.thermoVolume.toFixed(1) + ' L';
    }
    if (thermoReal) {
        document.getElementById('thermoRealPressure').textContent = thermoReal.getPressure().toFixed(1) + ' kPa';
        document.getElementById('thermoRealVolume').textContent = state.thermoVolume.toFixed(1) + ' L';
    }

    updateResults();
    updateExplanation();
}

function updateResults() {
    const idealAccel = idealSim.getAcceleration();
    const realAccel = realSim.getAcceleration();
    
    document.getElementById('idealAccel').textContent = idealAccel.toFixed(2) + ' m/s²';
    document.getElementById('realAccel').textContent = realAccel.toFixed(2) + ' m/s²';
    document.getElementById('idealVel').textContent = idealSim.block.velocity.toFixed(2) + ' m/s';
    document.getElementById('realVel').textContent = realSim.block.velocity.toFixed(2) + ' m/s';
    document.getElementById('idealTime').textContent = idealSim.block.time.toFixed(2) + ' s';
    document.getElementById('realTime').textContent = realSim.block.time.toFixed(2) + ' s';
    
    document.getElementById('idealResult').textContent = idealAccel.toFixed(2) + ' m/s²';
    document.getElementById('realResult').textContent = realAccel.toFixed(2) + ' m/s²';
    
    const difference = ((realAccel - idealAccel) / idealAccel * 100).toFixed(1);
    document.getElementById('differenceResult').textContent = difference + '%';
    
    // Update equation display
    const angleRad = (state.angle * Math.PI) / 180;
    const sinTheta = Math.sin(angleRad).toFixed(2);
    const cosTheta = Math.cos(angleRad).toFixed(2);
    
    let textbookEq = `a = g·sin(θ) = 9.8 × ${sinTheta} = ${idealAccel.toFixed(2)} m/s²`;
    let realEq = textbookEq;
    
    if (!state.assumptions.frictionless) {
        const muK = state.muKinetic;
        const muS = state.muStatic;
        realEq = `a = g·sin(θ) - μ_k g·cos(θ) = 9.8(${sinTheta} - ${muK}×${cosTheta})`;
        // Note: if static friction holds, a = 0 (no motion until threshold exceeded)
        realEq += `<br><small>static μ_s = ${muS}, kinetic μ_k = ${muK}</small>`;
    }
    if (!state.assumptions.pointMass) {
        realEq += ' ÷ 1.5 (rolling)';
    }
    realEq += ` = ${realAccel.toFixed(2)} m/s²`;
    
    document.getElementById('equationUsed').innerHTML = `<strong>Textbook:</strong> ${textbookEq}<br><strong>Real World:</strong> ${realEq}`;
}

function updateExplanation() {
    const explanationEl = document.getElementById('explanationText');
    
    if (state.assumptions.frictionless && state.assumptions.pointMass && state.assumptions.noAir) {
        explanationEl.innerHTML = `
            <p>All assumptions are <strong>active</strong>. Both models show the same idealized motion.</p>
            <p><strong>Toggle assumptions OFF</strong> to see how friction, rotation, or air resistance change the real-world motion!</p>
        `;
        return;
    }
    
    let effects = [];
    
    if (!state.assumptions.frictionless) {
        effects.push('<li><strong>Friction added:</strong> Surface contact slows the block. Acceleration decreases by μ·g·cos(θ).</li>');
    }
    
    if (!state.assumptions.pointMass) {
        effects.push('<li><strong>Rotation enabled:</strong> Block rolls instead of sliding. Energy splits between translation and rotation, reducing acceleration by ~33%.</li>');
    }
    
    if (!state.assumptions.noAir) {
        effects.push('<li><strong>Air resistance added:</strong> Drag force opposes motion. Effect increases with velocity (F ∝ v²).</li>');
    }
    
    explanationEl.innerHTML = `
        <p>The <strong>textbook model</strong> (left) ignores these real-world effects. The <strong>real world</strong> (right) includes:</p>
        <ul>${effects.join('')}</ul>
        <p>Compare the accelerations and watch how the blocks move differently!</p>
    `;
}

function animate() {
    if (state.isPlaying) {
        idealSim.update(DT);
        realSim.update(DT);

        if (!idealSim.block.stopped || !realSim.block.stopped) {
            if (Math.floor((idealSim.block.time + realSim.block.time) * 60) % 3 === 0) {
                graph.addData(idealSim.block.velocity, realSim.block.velocity);
            }
        }

        // Pendulum updates
        if (pendulumIdeal && pendulumReal) {
            pendulumIdeal.update(DT);
            pendulumReal.update(DT);
            if (Math.floor((pendulumIdeal.pendulum.time + pendulumReal.pendulum.time) * 60) % 3 === 0) {
                const idealDeg = Math.abs(pendulumIdeal.pendulum.angle * 180 / Math.PI);
                const realDeg = Math.abs(pendulumReal.pendulum.angle * 180 / Math.PI);
                if (pendulumGraph) pendulumGraph.addData(idealDeg, realDeg);
            }
        }

        if (massSpringIdeal && massSpringReal) {
            massSpringIdeal.update(DT);
            massSpringReal.update(DT);
        }

        if (freeFallIdeal && freeFallReal) {
            freeFallIdeal.update(DT);
            freeFallReal.update(DT);
        }

        if (thermoIdeal && thermoReal) {
            thermoIdeal.update(DT);
            thermoReal.update(DT);
            if (thermoGraph) thermoGraph.addData(thermoIdeal.getPressure(), thermoReal.getPressure());
        }
    }
    
    idealSim.draw();
    realSim.draw();
    graph.draw();
    if (pendulumIdeal) pendulumIdeal.draw();
    if (pendulumReal) pendulumReal.draw();
    if (pendulumGraph) pendulumGraph.draw();
    if (massSpringIdeal) massSpringIdeal.draw();
    if (massSpringReal) massSpringReal.draw();
    if (freeFallIdeal) freeFallIdeal.draw();
    if (freeFallReal) freeFallReal.draw();
    if (thermoIdeal) thermoIdeal.draw();
    if (thermoReal) thermoReal.draw();
    if (thermoGraph) thermoGraph.draw();
    updateResults();
    updateUI();
    
    animationFrameId = requestAnimationFrame(animate);
}

// Start the application
window.addEventListener('load', init);
