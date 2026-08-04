# Assumption Explorer - Block on a Ramp

An interactive educational tool that helps students understand modeling assumptions in physics by allowing them to toggle assumptions ON/OFF and see how the physical system changes.

## 🎯 Purpose

Students learn to:
- Understand what assumptions enable the equations they use
- See how assumptions simplify complex reality
- Know when simplified models work vs. when more detail is needed
- Develop intuition about which effects are significant

## 🚀 How to Use

### Quick Start

1. **Open the application:**
   - Simply open `index.html` in any modern web browser
   - No installation or server required!

2. **Two ways to open:**
   - **Option A:** Double-click `index.html` file
   - **Option B:** Right-click `index.html` → "Open with" → Choose your browser

### Recommended Browsers
- Chrome (recommended)
- Firefox
- Edge
- Safari

## 📚 Using the Tool

### Step 1: Start in Textbook Mode
- See the simplified frictionless model
- Block slides down with acceleration a = g·sin(θ)
- No energy loss, clean motion

### Step 2: Explore Assumptions
Toggle the checkboxes to modify assumptions:
- **☑ Frictionless surface** - When OFF, friction opposes motion
- **☑ Point mass (no rotation)** - When OFF, block can roll/rotate
- **☑ No air resistance** - When OFF, drag force slows the block

### Step 3: Switch to Reality Mode
- Click "🌍 Reality Mode" to see side-by-side comparison
- Left: Simplified model (frictionless)
- Right: Complete model (with your assumption changes)

### Step 4: Adjust Parameters
Use sliders to change:
- **Ramp Angle** (10-60°) - Steeper = faster acceleration
- **Block Mass** (1-10 kg) - Mass cancels out in acceleration!
- **Friction Coefficient** (0.05-0.80) - Higher = more resistance

### Step 5: Observe Results
Watch:
- **Block motion** - Visual difference between sliding and rolling
- **Force vectors** - See gravity, friction, and net force
- **Velocity graphs** - How friction changes acceleration
- **Explanations** - Context-aware insights about what changed

## 🎓 Learning Objectives

After using this tool, students should understand:

1. **Frictionless model works best when:**
   - Surfaces are very smooth (ice, polished metal)
   - Friction force is < 10% of driving force
   - Quick estimates are needed

2. **Friction matters when:**
   - Rough surfaces (wood, rubber)
   - Slow speeds where static friction dominates
   - Energy loss is significant

3. **Point mass vs. extended body:**
   - Sliding: All energy goes to translation
   - Rolling: Energy splits between translation and rotation
   - Rolling reduces acceleration by ~33% for solid blocks

4. **Modeling is about choices:**
   - Assumptions simplify to make problems tractable
   - Each assumption has a validity range
   - Knowing when to add complexity is key

## 🔧 Technical Details

### Built With
- Pure HTML5, CSS3, JavaScript (no dependencies!)
- Canvas 2D API for rendering
- Custom physics engine for mechanics

### Features
- Real-time motion simulation
- Force vector visualization
- Frictionless vs. friction comparison
- Interactive assumption toggles
- Side-by-side visualization
- Live velocity graphing
- Rotation animation (when point mass is disabled)
- Responsive explanations

### Physics Implementation

**Frictionless Model:**
- a = g·sin(θ)
- No energy loss
- Pure sliding motion

**With Friction:**
- a = g·sin(θ) - μg·cos(θ)
- Friction opposes motion: f = μN
- Energy dissipated as heat

**With Rotation:**
- a = g·sin(θ) / (1 + I/mr²)
- For solid block: factor of 1.5
- Angular velocity increases over time

## 📖 Educational Use

### For Teachers:
- Use in lectures to demonstrate friction effects
- Assign as interactive homework
- Basis for discussion about energy loss

### For Students:
- Explore before/after reading textbook
- Test understanding of friction
- Prepare for exam problems involving inclined planes

### Suggested Activities:

1. **Prediction Challenge:**
   - Before toggling friction, predict the difference
   - Check your intuition

2. **Find the Critical Angle:**
   - At what angle does friction = driving force?
   - Block won't slide below this angle

3. **Real-World Connection:**
   - Research: Friction coefficients of materials
   - Examples: Skis on snow, tires on roads

## 🐛 Troubleshooting

**Problem: Block not moving**
- Click "▶️ Play" button
- Try clicking "🔄 Reset"
- Check if angle is too small for the friction coefficient

**Problem: Page is blank**
- Check browser console for errors (F12)
- Make sure all files are in same folder

**Problem: Slow performance**
- Close other browser tabs
- Try a different browser (Chrome is fastest)

## 📊 Future Enhancements

Planned features:
- More scenarios (pendulum, ideal gas, projectile)
- AI-powered question answering
- Export data for analysis
- Multiple surface types
- Mobile optimization

## 📝 License

Built for educational purposes. Free to use and modify for teaching.

## 🤝 Feedback

This is a prototype! Feedback welcome on:
- Clarity of explanations
- Ease of use
- Educational effectiveness
- Feature requests

---

**Made with the goal of helping students understand that assumptions are modeling choices, not laws of nature.**
