

https://github.com/user-attachments/assets/e9f88788-1608-43a4-9ff5-bef9800416c0



https://github.com/user-attachments/assets/ce7bbfb5-7c38-4c25-87a0-6c1ddaa7ea16

# Neo-Brutalism 3D DOM Engine
A highly optimized, dependency-free 3D interaction engine for the DOM. This project transforms a standard CSS Neo-Brutalism grid into a reactive, physics-driven environment using Vanilla JavaScript and advanced rendering techniques.

🔗 [View Live Demo Here](https://basmalaadel1346.github.io/Neo-Brutalism-3D-Engine/) 

## ✨ Features
- Zero Dependencies: Pure Vanilla JS & CSS.
- Physics Engine: Spring-based rotations, inertia, and velocity-driven motion.
- Proximity Field: Cards influence nearby nodes with a magnetic ripple effect.
- Dynamic Lighting: Follow-mouse and scroll-dependent lighting with smooth radial gradients.
- Extreme Performance: Frustum Culling (IntersectionObserver), Idle Throttling, and minimal DOM updates.
- Responsive & Accessible: Fully CSS Grid layout, mobile touch & gyroscope support.
- HUD Panel: Real-time tuning for interaction weights.

## 🛠️ Tech Stack
- HTML5 / CSS3: Grid, Variables, 3D Transforms, Animations.
- JavaScript (ES6 Modules): Classes, Dependency Injection, Observer Patterns.
- Optimizations: requestAnimationFrame, IntersectionObserver, and will-change.

## 🏗 Architecture & Core Features
- Frustum Culling: Only visible cards are processed each frame.
- Sensor Fusion: Weighted combination of Local Mouse, Global Mouse, Scroll, and Gyroscope input.
- Spring Physics: Smooth, natural animations using velocity, friction, and spring constants.
- Cinematic Depth: Simulates depth, ambient light, and shadow pulses.

## 🚀 Physics Control Panel
- Adjust the engine in real-time using the HUD.

## 📱 Mobile Support
- Touch-friendly interactions.
- Gyroscope mapping for natural 3D tilts on mobile devices.
- Fully responsive with CSS Grid.

## 💻 Running Locally
- Clone the repository:
`git clone https://github.com/basmalaadel1346/Neo-Brutalism-3D-Engine.git`

- Open index.html in your browser.

## 🔮 Roadmap / Future Enhancements
- Spatial grid optimization for large card sets.
- Plugin system for custom effects.
- GPU-accelerated shaders for advanced lighting.
