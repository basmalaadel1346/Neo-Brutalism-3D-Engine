# ⚡ Neo-Brutalism 3D DOM Engine

# 

# A highly optimized, dependency-free 3D interaction engine for the DOM. This project transforms a standard CSS Neo-Brutalism grid into a reactive, physics-driven environment using Vanilla JavaScript and advanced rendering techniques.

# 

# 🔗 View Live Demo Here

# &nbsp;(سيتم وضع الرابط هنا بعد الاستضافة)

# 

# ✨ Features

# 

# Zero Dependencies: Pure Vanilla JS \& CSS.

# 

# Physics Engine: Spring-based rotations, inertia, and velocity-driven motion.

# 

# Proximity Field: Cards influence nearby nodes with a magnetic ripple effect.

# 

# Dynamic Lighting: Follow-mouse and scroll-dependent lighting with smooth radial gradients.

# 

# Extreme Performance: Frustum Culling (IntersectionObserver), Idle Throttling, and minimal DOM updates.

# 

# Responsive \& Accessible: Fully CSS Grid layout, mobile touch \& gyroscope support, and prefers-reduced-motion compliance.

# 

# HUD Panel: Real-time tuning for interaction weights like Local Hover, Global Gravity, Gyroscope, and Scroll Velocity.

# 

# 🛠️ Tech Stack

# 

# HTML5 / CSS3: Grid, Variables, 3D Transforms, Animations

# 

# JavaScript (ES6 Modules): Classes, Dependency Injection, Observer Patterns

# 

# Optimizations: requestAnimationFrame, ResizeObserver, IntersectionObserver, and will-change for GPU acceleration

# 

# 🏗 Architecture \& Core Features

# 

# Frustum Culling: Only visible cards are processed each frame to minimize CPU/GPU load.

# 

# Sensor Fusion: Weighted combination of Local Mouse, Global Mouse, Scroll, and Gyroscope input drives 3D transformations.

# 

# Spring Physics: Smooth, natural animations using velocity, friction, and spring constants.

# 

# Cinematic Depth \& Dynamic Shading: Simulates depth, ambient light, and shadow pulses with CSS-only techniques.

# 

# GPU Optimized: Active transformations and shadows are applied only during interactions to avoid unnecessary rendering overhead.

# 

# 🚀 Physics Control Panel

# 

# Adjust the engine in real-time:

# 

# <div class="engine-panel" id="controls">

# &nbsp; <div class="control-group">

# &nbsp;   <label>Local Hover</label>

# &nbsp;   <input type="range" id="w-local" min="0" max="30" value="15">

# &nbsp; </div>

# &nbsp; <div class="control-group">

# &nbsp;   <label>Global Gravity</label>

# &nbsp;   <input type="range" id="w-global" min="0" max="10" value="3">

# &nbsp; </div>

# &nbsp; <div class="control-group">

# &nbsp;   <label>Gyroscope</label>

# &nbsp;   <input type="range" id="w-gyro" min="0" max="40" value="20">

# &nbsp; </div>

# &nbsp; <div class="control-group">

# &nbsp;   <label>Scroll Velocity</label>

# &nbsp;   <input type="range" id="w-scroll" min="0" max="1" step="0.01" value="0.1">

# &nbsp; </div>

# </div>

# 

# Control explanations:

# 

# Local Hover: Intensity of direct mouse interaction.

# 

# Global Gravity: Environmental reaction to cursor position.

# 

# Gyroscope: Mobile device motion sensitivity (iOS 13+ permission compliant).

# 

# Scroll Velocity: Shadow pulse and vertical tilt amplitude.

# 

# 📱 Mobile Support

# 

# Touch-friendly interactions

# 

# Gyroscope mapping for natural 3D tilts on mobile devices

# 

# Fully responsive with CSS Grid and scaling transforms

# 

# 💻 Running Locally

# 

# Clone the repository:

# 

# git clone https://github.com/basmalaadel1346/Neo-Brutalism-3D-Engine.git

# 

# Open index.html in your browser — no build tools required.

# 

# Optional: Open the HUD panel to tweak physics parameters live.

# 

# 🔮 Roadmap / Future Enhancements

# 

# Spatial grid optimization for large card sets

# 

# Plugin system for custom effects (Glow, Magnet, Tilt)

# 

# Reduced motion mode for accessibility

# 

GPU-accelerated shaders for advanced lighting
🚀 Physics Control Panel
===

# 

Adjust the engine in real-time using the HUD:
🔧 Physics Weight Table
===

# Parameter	Range	Default	Description

# Local Hover	0 – 30	15	Controls intensity of direct mouse interactions on individual cards.

# Global Gravity	0 – 10	3	Environmental reaction to cursor position; influences nearby cards.

# Gyroscope	0 – 40	20	Sensitivity of mobile device motion input (tilt to rotate cards).

# Scroll Velocity	0 – 1	0.1	Amplitude of shadow pulse and vertical tilt when scrolling.

