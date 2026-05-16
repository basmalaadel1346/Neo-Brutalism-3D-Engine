/**
 * engine.js
 * ---------
 * Orchestrates the per-frame render loop over all visible RenderNodes.
 *
 * Changes from previous version:
 *  - Removed: initGyroscope() import/call (Gyroscope.js deleted — logic in InputManager.js).
 *  - Added:   RAF handle stored so the loop can be suspended when no nodes are active
 *             and the scene is idle, saving battery on low-end devices.
 *  - Added:   Loop auto-resumes when a node re-enters the viewport.
 */

import { RenderNode }             from './CardRenderer.js';
import { GlobalState, Weights }   from './InputManager.js';
import { applyProximityPhysics }  from './Physics.js';

const DEBUG = new URLSearchParams(location.search).has('debug');

if (DEBUG) {
    document.documentElement.classList.add('debug-paint-flash');
    console.info('[RenderDiag] Debug mode active. window.__renderDiag available.');
}

window.__renderDiag = {
    fps: 0,
    activeNodes: 0,
    animationStates: {},
    layerHint: 'Run chrome://tracing or DevTools Layers panel for compositor layer count.',
    debugMode: DEBUG,
};

export function initEngine() {
    const rawNodes   = Array.from(document.querySelectorAll('.render-node'));
    const activeNodes = new Set();
    const nodeMap     = new Map();

    rawNodes.forEach(el => nodeMap.set(el, new RenderNode(el, GlobalState, Weights)));

    // ------------------------------------------------------------------
    // RAF handle — stored so we can cancel/resume the loop
    // ------------------------------------------------------------------
    let rafId = null;

    const startLoop = () => {
        if (!rafId) rafId = requestAnimationFrame(loop);
    };

    const stopLoop = () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    };

    // ------------------------------------------------------------------
    // Visibility observer — activates/deactivates nodes as they scroll in/out.
    // Also resumes the RAF loop when the first node becomes active.
    // ------------------------------------------------------------------
    const visibilityObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
            const node = nodeMap.get(e.target);
            if (!node) return;
            if (e.isIntersecting) {
                activeNodes.add(node);
                startLoop();           // resume if the loop was suspended
            } else {
                activeNodes.delete(node);
                node.dirty = true;
            }
        });
    }, { rootMargin: '100px' });

    rawNodes.forEach(el => visibilityObserver.observe(el));

    // ------------------------------------------------------------------
    // FPS meter
    // ------------------------------------------------------------------
    const fpsMeter = document.getElementById('fps-meter');
    let frames         = 0;
    let fpsAccumulator = 0;
    let lastFrameTime  = performance.now();

    // ------------------------------------------------------------------
    // Main render loop
    // ------------------------------------------------------------------
    function loop() {
        rafId = null; // clear before deciding whether to re-queue

        const now = performance.now();

        // Idle guard — suspend the loop entirely when nothing is happening.
        // It will be restarted by the visibilityObserver or by wakeUp() in InputManager.
        const isIdle = now - GlobalState.lastInteraction > 3000;
        if (isIdle && activeNodes.size === 0) {
            // Loop suspended — do not re-queue.
            return;
        }

        // Skip physics computation while idle but keep the meter ticking.
        if (!isIdle) {
            const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1);

            let hoveredNode = null;
            for (const node of activeNodes) {
                if (node.localMouse.active) { hoveredNode = node; break; }
            }
            applyProximityPhysics(activeNodes, hoveredNode);
            activeNodes.forEach(node => node.update(deltaTime));

            frames++;
            fpsAccumulator += deltaTime;

            if (fpsAccumulator >= 1.0) {
                const fps = Math.round(frames / fpsAccumulator);
                if (fpsMeter) {
                    fpsMeter.textContent = `FPS: ${fps} | Active: ${activeNodes.size}`;
                    fpsMeter.style.color =
                        fps >= 55 ? '#0f0' :
                        fps >= 30 ? '#ff0' : '#f55';
                }
                window.__renderDiag.fps         = fps;
                window.__renderDiag.activeNodes = activeNodes.size;

                if (DEBUG) {
                    let layerCount = 0;
                    activeNodes.forEach((node, i) => {
                        const wc = node.el.style.willChange;
                        if (wc && wc !== 'auto') layerCount++;
                        window.__renderDiag.animationStates[i] = {
                            willChange: wc || 'auto',
                            hovered:    node.localMouse.active,
                            dirty:      node.dirty,
                        };
                    });
                    console.debug(`[RenderDiag] FPS: ${fps} | Active: ${activeNodes.size} | Layers: ${layerCount}`);
                }

                frames         = 0;
                fpsAccumulator = 0;
            }
        }

        lastFrameTime = now;
        rafId = requestAnimationFrame(loop);
    }

    // Kick off the loop once on init.
    startLoop();
}