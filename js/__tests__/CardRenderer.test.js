// @vitest-environment jsdom
import './setup.js';
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { RenderNode } from '../CardRenderer.js';

globalThis.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};
window.ResizeObserver = globalThis.ResizeObserver;

describe('RenderNode', () => {
    let element;
    let globalState;
    let weights;

    beforeEach(() => {
        element = document.createElement('div');
        element.getBoundingClientRect = vi.fn(() => ({
            left: 0, top: 0, width: 300, height: 200, right: 300, bottom: 200,
        }));
        document.body.appendChild(element);

        globalState = {
            mouse: { x: 0, y: 0, vx: 0, vy: 0, active: false },
            scroll: { depth: 0, velocity: 0 },
            gyro: { beta: 0, gamma: 0, active: false },
            dirty: false,
        };

        weights = { local: 15, global: 3, gyro: 20, scroll: 0.1 };
    });

    afterEach(() => {
        if (element && element.parentNode) {
            element.parentNode.removeChild(element);
        }
    });

    test('should initialize with correct properties', () => {
        const node = new RenderNode(element, globalState, weights);
        expect(node.el).toBe(element);
        expect(node.globalState).toBe(globalState);
        expect(node.weights).toBe(weights);
        expect(node.current.rx).toBe(0);
        expect(node.current.ry).toBe(0);
        expect(node.current.sc).toBe(1);
    });

    test('should update rect on initialization', () => {
        const node = new RenderNode(element, globalState, weights);
        node.updateRect();
        expect(node.rect).toBeTruthy();
        expect(node.cx).toBe(150);
        expect(node.cy).toBe(100);
    });

    test('should handle mouse enter and leave events', () => {
        const node = new RenderNode(element, globalState, weights);
        const mouseEnterEvent = new MouseEvent('mouseenter');
        const mouseLeaveEvent = new MouseEvent('mouseleave');

        element.dispatchEvent(mouseEnterEvent);
        expect(node.localMouse.active).toBe(true);

        element.dispatchEvent(mouseLeaveEvent);
        expect(node.localMouse.active).toBe(false);
    });

    test('should calculate local mouse position correctly', () => {
        const node = new RenderNode(element, globalState, weights);
        node.updateRect();

        const mouseMoveEvent = new MouseEvent('mousemove', {
            clientX: 150,
            clientY: 100,
        });
        element.dispatchEvent(mouseMoveEvent);

        expect(node.localMouse.x).toBeCloseTo(0, 1);
        expect(node.localMouse.y).toBeCloseTo(0, 1);
    });

    test('should apply spring physics on update', () => {
        const node = new RenderNode(element, globalState, weights);
        globalState.mouse.active = true;
        globalState.mouse.x = 0.5;
        globalState.mouse.y = 0.5;

        node.update(0.016);

        expect(node.velocity.rx).not.toBe(0);
        expect(node.velocity.ry).not.toBe(0);
    });

    test('should mark dirty on velocity changes', () => {
        const node = new RenderNode(element, globalState, weights);
        node.current.rx = 10;
        node.dirty = false;
        node.update(0.016);
        expect(node.dirty).toBe(false);
    });
    test('should apply CSS variables to element', () => {
        const node = new RenderNode(element, globalState, weights);
        node.update(0.016);

        const style = element.style;
        expect(style.getPropertyValue('--rx')).toBeTruthy();
        expect(style.getPropertyValue('--ry')).toBeTruthy();
        expect(style.getPropertyValue('--scale')).toBeTruthy();
    });
});