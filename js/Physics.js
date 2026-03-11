export function applyProximityPhysics(activeNodes, hoveredNode) {
    if (!hoveredNode) return;

    activeNodes.forEach(node => {
        if (hoveredNode !== node) {
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
    });
}