import { RenderNode }            from './CardRenderer.js';
import { GlobalState, Weights }  from './InputManager.js';
import { applyProximityPhysics } from './Physics.js';

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
    const rawNodes    = Array.from(document.querySelectorAll('.render-node'));
    const activeNodes = new Set();
    const nodeMap     = new Map();

    rawNodes.forEach(el => nodeMap.set(el, new RenderNode(el, GlobalState, Weights)));

    let rafId = null;

    const startLoop = () => {
        if (!rafId) rafId = requestAnimationFrame(loop);
    };

    const visibilityObserver = new IntersectionObserver(entries => {
        entries.forEach(e => {
            const node = nodeMap.get(e.target);
            if (!node) return;
            if (e.isIntersecting) {
                activeNodes.add(node);
                startLoop();
            } else {
                activeNodes.delete(node);
                node.dirty = true;
            }
        });
    }, { rootMargin: '100px' });

    rawNodes.forEach(el => visibilityObserver.observe(el));

    const fpsMeter = document.getElementById('fps-meter');
    let frames         = 0;
    let fpsAccumulator = 0;
    let lastFrameTime  = performance.now();

    function loop() {
        rafId = null;
        const now    = performance.now();
        const isIdle = now - GlobalState.lastInteraction > 3000;

        if (isIdle && activeNodes.size === 0) {
            // Reset so the first active frame after resume has a clean delta.
            lastFrameTime = now;
            return;
        }

        if (!isIdle) {
            const deltaTime = Math.min((now - lastFrameTime) / 1000, 0.1);
            lastFrameTime = now;

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

        rafId = requestAnimationFrame(loop);
    }

    startLoop();
}