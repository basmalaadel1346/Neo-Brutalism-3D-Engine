import { RenderNode } from './CardRenderer.js';
import { GlobalState, Weights } from './InputManager.js';

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

        activeNodes.forEach(node => {
            if (hoveredNode && hoveredNode !== node) {
                const dx = hoveredNode.cx - node.cx;
                const dy = hoveredNode.cy - node.cy;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 350) {
                    const influence = (1 - dist / 350) * 0.15;
                    node.current.rx += hoveredNode.current.rx * influence;
                    node.current.ry += hoveredNode.current.ry * influence;
                    node.dirty = true;
                }
            }
            node.update();
        });

        frames++;
        if (now - lastTime >= 1000) {
            if (fpsMeter) fpsMeter.textContent = `FPS: ${Math.round((frames * 1000) / (now - lastTime))} | Active: ${activeNodes.size}`;
            frames = 0; lastTime = now;
        }

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}