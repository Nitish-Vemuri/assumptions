// Constants
const G = 9.8; // Gravity (m/s²)
const FPS = 60;
const DT = 1 / FPS;
const SCALE = 50; // pixels per meter

// Application state
const state = {
    angle: 30, // degrees
    mass: 5, // kg
    frictionCoeff: 0.30, // coefficient of friction (μ)
    isPlaying: true,
    assumptions: {
        frictionless: true,
        pointMass: true,
        noAir: true
    }
};

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
        if (this.stopped) return;

        this.time += dt;

        // Forces
        const mgSinTheta = this.mass * G * Math.sin(angleRad);
        const mgCosTheta = this.mass * G * Math.cos(angleRad);
        
        let netForce = mgSinTheta;
        let acceleration;

        // Friction force
        if (useFriction && !state.assumptions.frictionless) {
            const frictionForce = frictionCoeff * mgCosTheta;
            netForce -= frictionForce;
        }

        // Air resistance (simplified drag: F = 0.5 * C * ρ * A * v²)
        if (useAir && !state.assumptions.noAir && this.velocity > 0) {
            const dragCoeff = 0.1; // Simplified
            const dragForce = dragCoeff * this.velocity * this.velocity;
            netForce -= Math.min(dragForce, netForce); // Don't reverse direction
        }

        // Check if rolling or sliding
        if (useRotation && !state.assumptions.pointMass) {
            // Rolling: Energy splits between translation and rotation
            // For solid cylinder: I = 0.5 * m * r²
            // Acceleration is reduced by factor of (1 + I/mr²) = 1.5 for cylinder
            const rotationalFactor = 1.5;
            acceleration = netForce / (this.mass * rotationalFactor);
            
            // Update angular velocity (assuming radius = 0.3m)
            const radius = 0.3;
            this.angularVelocity += (acceleration / radius) * dt;
            this.rotation += this.angularVelocity * dt;
        } else {
            // Sliding: All force goes to translation
            acceleration = netForce / this.mass;
        }

        // Update velocity and position
        this.velocity += acceleration * dt;
        this.position += this.velocity * dt;

        // Stop if velocity becomes negative (shouldn't happen, but safety check)
        if (this.velocity < 0) {
            this.velocity = 0;
            this.stopped = true;
        }

        // Stop if reached bottom (8 meters)
        if (this.position > 8) {
            this.position = 8;
            this.stopped = true;
        }
    }

    getAcceleration(angleRad, frictionCoeff, useRotation, useFriction) {
        const mgSinTheta = this.mass * G * Math.sin(angleRad);
        const mgCosTheta = this.mass * G * Math.cos(angleRad);
        
        let netForce = mgSinTheta;

        if (useFriction && !state.assumptions.frictionless) {
            const frictionForce = frictionCoeff * mgCosTheta;
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
        this.ctx = this.canvas.getContext('2d');
        
        // Ensure canvas size is properly set
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = this.canvas.offsetWidth || 400;
        this.canvas.height = this.canvas.offsetHeight || 400;
        
        this.block = new Block(state.mass, isReal);
        this.isReal = isReal;
        this.velocityHistory = [];
        
        this.rampLength = 8; // meters
        this.rampStartX = 50;
        this.rampStartY = 100;
        this.rampEndX = 350;
        this.rampEndY = 300;
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
        
        this.block.update(dt, angleRad, state.frictionCoeff, useRotation, useFriction, useAir);
    }

    getAcceleration() {
        const angleRad = (state.angle * Math.PI) / 180;
        const useFriction = this.isReal && !state.assumptions.frictionless;
        const useRotation = this.isReal && !state.assumptions.pointMass;
        
        return this.block.getAcceleration(angleRad, state.frictionCoeff, useRotation, useFriction);
    }

    draw() {
        // Clear canvas
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
            // Friction force (up the ramp)
            const normalForce = state.mass * G * Math.cos(angleRad);
            const frictionForce = state.frictionCoeff * normalForce;
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
let animationFrameId;

function init() {
    idealSim = new RampSimulation('idealCanvas', false);
    realSim = new RampSimulation('realCanvas', true);
    graph = new VelocityGraph('graphCanvas');
    
    setupEventListeners();
    updateUI();
    animate();
}

function setupEventListeners() {
    // Assumptions
    document.getElementById('assumptionFrictionless').addEventListener('change', (e) => {
        state.assumptions.frictionless = e.target.checked;
        realSim.reset();
        graph.reset();
        updateExplanation();
    });
    
    document.getElementById('assumptionPointMass').addEventListener('change', (e) => {
        state.assumptions.pointMass = e.target.checked;
        realSim.reset();
        graph.reset();
        updateExplanation();
    });
    
    document.getElementById('assumptionNoAir').addEventListener('change', (e) => {
        state.assumptions.noAir = e.target.checked;
        realSim.reset();
        graph.reset();
        updateExplanation();
    });
    
    // Parameters
    document.getElementById('angleSlider').addEventListener('input', (e) => {
        state.angle = parseInt(e.target.value);
        document.getElementById('angleValue').textContent = state.angle;
        idealSim.reset();
        realSim.reset();
        graph.reset();
        updateResults();
    });
    
    document.getElementById('massSlider').addEventListener('input', (e) => {
        state.mass = parseFloat(e.target.value);
        document.getElementById('massValue').textContent = state.mass.toFixed(1);
        idealSim.block.mass = state.mass;
        realSim.block.mass = state.mass;
        idealSim.reset();
        realSim.reset();
        graph.reset();
        updateResults();
    });
    
    document.getElementById('frictionSlider').addEventListener('input', (e) => {
        state.frictionCoeff = parseFloat(e.target.value);
        document.getElementById('frictionValue').textContent = state.frictionCoeff.toFixed(2);
        idealSim.reset();
        realSim.reset();
        graph.reset();
        updateResults();
    });
    
    // Controls
    document.getElementById('playPauseBtn').addEventListener('click', () => {
        state.isPlaying = !state.isPlaying;
        document.getElementById('playPauseBtn').textContent = state.isPlaying ? '⏸️ Pause' : '▶️ Play';
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
        idealSim.reset();
        realSim.reset();
        graph.reset();
    });
}

function updateUI() {
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
        const mu = state.frictionCoeff;
        realEq = `a = g·sin(θ) - μg·cos(θ) = 9.8(${sinTheta} - ${mu}×${cosTheta})`;
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
            <p>The <strong>frictionless ramp model</strong> assumes no energy loss from surface contact. This simplification gives clean equations: a = g·sin(θ). It works well for very smooth surfaces or quick calculations.</p>
            <p><strong>Try toggling assumptions</strong> to see what friction and rotation do to the motion!</p>
        `;
    } else {
        let text = '<p><strong>You\'ve modified the model!</strong> Here\'s what changed:</p><ul>';
        
        if (!state.assumptions.frictionless) {
            text += `<li>🔴 <strong>Friction is now active:</strong> The surface resists sliding with force f = μN = μmg·cos(θ). This opposes motion and reduces acceleration. At μ = ${state.frictionCoeff.toFixed(2)}, friction removes ~${(state.frictionCoeff * Math.cos(state.angle * Math.PI / 180) * 100).toFixed(0)}% of the gravitational component.</li>`;
        }
        
        if (!state.assumptions.pointMass) {
            text += '<li>🔴 <strong>Block can now rotate:</strong> Energy splits between sliding and rolling. For a solid block, rotational inertia reduces acceleration by a factor of 1.5. Notice the white dot rotating - this visualizes angular motion.</li>';
        }
        
        if (!state.assumptions.noAir) {
            text += '<li>🔴 <strong>Air resistance active:</strong> Drag force increases with velocity squared (F ∝ v²), causing additional deceleration at higher speeds.</li>';
        }
        
        text += '</ul>';
        
        if (!state.assumptions.frictionless || !state.assumptions.pointMass) {
            text += '<p>📚 <strong>For exams:</strong> Unless specified, still use a = g·sin(θ) for frictionless incline problems.</p>';
        }
        
        text += '<p>🌍 <strong>Real world:</strong> All surfaces have friction. Engineering often uses coefficients: ice ≈ 0.05, wood ≈ 0.3, rubber ≈ 0.7.</p>';
        
        explanationEl.innerHTML = text;
    }
}

function animate() {
    if (state.isPlaying) {
        idealSim.update(DT);
        realSim.update(DT);
        
        // Update graph every few frames
        if (Math.floor(idealSim.block.time * 60) % 3 === 0) {
            graph.addData(idealSim.block.velocity, realSim.block.velocity);
        }
    }
    
    idealSim.draw();
    realSim.draw();
    graph.draw();
    updateResults();
    
    animationFrameId = requestAnimationFrame(animate);
}

// Start the application
window.addEventListener('load', init);
