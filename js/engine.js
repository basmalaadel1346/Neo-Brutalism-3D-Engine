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
const motionBtn = document.getElementById('enable-motion');

if (motionBtn) {
    motionBtn.addEventListener('click', async () => {
        if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
            try {
                const permissionState = await DeviceOrientationEvent.requestPermission();
                if (permissionState === 'granted') {
                    activateGyroscope();
                } else {
                    alert("تم رفض صلاحية الوصول لحساسات الحركة.");
                }
            } catch (error) {
                console.error("حدث خطأ في طلب الصلاحية:", error);
            }
        } else {
            activateGyroscope();
        }
    });
}

function activateGyroscope() {
    window.addEventListener('deviceorientation', (event) => {
        let tiltX = event.beta;
        let tiltY = event.gamma;

        const maxTilt = 30;

        tiltX = Math.max(-maxTilt, Math.min(maxTilt, tiltX));
        tiltY = Math.max(-maxTilt, Math.min(maxTilt, tiltY));

        const normalizedX = tiltY / maxTilt;
        const normalizedY = tiltX / maxTilt;

        document.querySelectorAll('.card').forEach(card => {

            card.style.setProperty('--rx', `${normalizedY * 15}deg`);
            card.style.setProperty('--ry', `${normalizedX * 15}deg`);
        });
    });

    motionBtn.innerText = "✅ الحساسات تعمل";
    motionBtn.style.backgroundColor = "#4caf50";
    motionBtn.style.color = "white";
    motionBtn.disabled = true;
}