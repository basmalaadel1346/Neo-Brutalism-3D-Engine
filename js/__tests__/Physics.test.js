import { describe, test, expect, beforeEach, vi } from 'vitest';
import { applyProximityPhysics } from '../Physics.js';

describe('Physics', () => {
    describe('applyProximityPhysics', () => {
        let nodes;
        let hoveredNode;

        beforeEach(() => {
            hoveredNode = {
                cx: 200,
                cy: 200,
                current: { rx: 10, ry: 15 },
                dirty: false,
            };

            nodes = [
                {
                    cx: 300,
                    cy: 300,
                    current: { rx: 0, ry: 0 },
                    dirty: false,
                },
                {
                    cx: 500,
                    cy: 500,
                    current: { rx: 0, ry: 0 },
                    dirty: false,
                },
            ];
        });

        test('should not apply physics if hoveredNode is null', () => {
            const nodesBefore = JSON.stringify(nodes);
            applyProximityPhysics(nodes, null);
            const nodesAfter = JSON.stringify(nodes);
            expect(nodesBefore).toBe(nodesAfter);
        });

        test('should apply influence to nodes within proximity range', () => {
            applyProximityPhysics(nodes, hoveredNode);

            expect(nodes[0].current.rx).not.toBe(0);
            expect(nodes[0].current.ry).not.toBe(0);
            expect(nodes[0].dirty).toBe(true);
        });

        test('should not apply influence to nodes outside proximity range', () => {
            const farNode = {
                cx: 1000,
                cy: 1000,
                current: { rx: 0, ry: 0 },
                dirty: false,
            };

            applyProximityPhysics([farNode], hoveredNode);
            expect(farNode.current.rx).toBe(0);
            expect(farNode.current.ry).toBe(0);
            expect(farNode.dirty).toBe(false);
        });

        test('should calculate correct influence based on distance', () => {
            applyProximityPhysics(nodes, hoveredNode);

            const influence = (1 - Math.sqrt(20000) / 350) * 0.15;
            const expectedRx = hoveredNode.current.rx * influence;

            expect(nodes[0].current.rx).toBeCloseTo(expectedRx, 5);
        });

        test('should skip hoveredNode itself', () => {
            const singleNode = hoveredNode;
            applyProximityPhysics([hoveredNode], hoveredNode);

            expect(hoveredNode.current.rx).toBe(10);
            expect(hoveredNode.current.ry).toBe(15);
        });

        test('should handle empty node array', () => {
            expect(() => applyProximityPhysics([], hoveredNode)).not.toThrow();
        });

        test('should scale influence correctly at boundary distance', () => {
            const boundaryNode = {
                cx: 200 + 350,
                cy: 200,
                current: { rx: 0, ry: 0 },
                dirty: false,
            };

            applyProximityPhysics([boundaryNode], hoveredNode);

            expect(Math.abs(boundaryNode.current.rx)).toBeLessThan(0.01);
            expect(Math.abs(boundaryNode.current.ry)).toBeLessThan(0.01);
        });
    });
});
