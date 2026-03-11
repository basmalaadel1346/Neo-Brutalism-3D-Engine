import { RenderNode } from './CardRenderer.js';
import { GlobalState, Weights } from './InputManager.js';
import { applyProximityPhysics } from './Physics.js';
import { initGyroscope } from './Gyroscope.js';

export function initEngine() {
    const rawNodes = Array.from(document.querySelectorAll('.render-node'));
    const activeNodes = new Set();
    const nodeMap = new Map();

    rawNodes.forEach(el => nodeMap.set(el, new RenderNode(el, GlobalState, Weights)));

    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => {
            const node = nodeMap.get(e.target);
            e.isIntersecting ? activeNodes.add(node) : activeNodes.delete(node);
        });
    }, { rootMargin: "100px" });
    rawNodes.forEach(el => observer.observe(el));

    initGyroscope();

    const fpsMeter = document.getElementById("fps-meter");
    let lastTime = performance.now(), frames = 0;

    function loop() {
        const now = performance.now();

        if (now - GlobalState.lastInteraction > 3000) {
            requestAnimationFrame(loop);
            return;
        }

        let hoveredNode = null;
        for (const node of activeNodes) {
            if (node.localMouse.active) {
                hoveredNode = node;
                break;
            }
        }

        applyProximityPhysics(activeNodes, hoveredNode);

        activeNodes.forEach(node => node.update());

        frames++;
        if (now - lastTime >= 1000) {
            if (fpsMeter) fpsMeter.textContent = `FPS: ${Math.round((frames * 1000) / (now - lastTime))} | Active: ${activeNodes.size}`;
            frames = 0;
            lastTime = now;
        }

        requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
}