// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { GlobalState, Weights, initInputListeners } from '../InputManager.js';

describe('InputManager', () => {
    describe('GlobalState', () => {
        test('should initialize with correct default values', () => {
            expect(GlobalState.mouse.x).toBe(0);
            expect(GlobalState.mouse.y).toBe(0);
            expect(GlobalState.mouse.vx).toBe(0);
            expect(GlobalState.mouse.vy).toBe(0);
            expect(GlobalState.mouse.active).toBe(false);
            expect(GlobalState.gyro.active).toBe(false);
            expect(GlobalState.dirty).toBe(true);
        });

        test('should track scroll position', () => {
            expect(GlobalState.scroll.depth).toBeDefined();
            expect(GlobalState.scroll.velocity).toBeDefined();
            expect(GlobalState.scroll.lastY).toBe(window.scrollY);
        });

        test('should track gyro values', () => {
            expect(GlobalState.gyro.beta).toBe(0);
            expect(GlobalState.gyro.gamma).toBe(0);
        });
    });

    describe('Weights', () => {
        test('should have default weight values', () => {
            expect(Weights.local).toBe(15);
            expect(Weights.global).toBe(3);
            expect(Weights.gyro).toBe(20);
            expect(Weights.scroll).toBe(0.1);
        });
    });

    describe('initInputListeners', () => {
        let mockInput;

        beforeEach(() => {
            mockInput = document.createElement('input');
            mockInput.id = 'w-local';
            mockInput.value = '15';
            document.body.appendChild(mockInput);

            const globalInput = document.createElement('input');
            globalInput.id = 'w-global';
            globalInput.value = '3';
            document.body.appendChild(globalInput);

            const gyroInput = document.createElement('input');
            gyroInput.id = 'w-gyro';
            gyroInput.value = '20';
            document.body.appendChild(gyroInput);

            const scrollInput = document.createElement('input');
            scrollInput.id = 'w-scroll';
            scrollInput.value = '0.1';
            document.body.appendChild(scrollInput);
        });

        afterEach(() => {
            const inputs = document.querySelectorAll('input[id^="w-"]');
            inputs.forEach(input => document.body.removeChild(input));
        });

        test('should initialize input listeners without error', () => {
            expect(() => initInputListeners()).not.toThrow();
        });

        test('should update weights on input change', () => {
            initInputListeners();
            const localInput = document.getElementById('w-local');
            localInput.value = '25';
            localInput.dispatchEvent(new Event('input'));
            expect(Weights.local).toBe(25);
        });

        test('should track mouse movement', () => {
            initInputListeners();
            const mouseMoveEvent = new MouseEvent('mousemove', {
                clientX: 100,
                clientY: 100,
            });
            window.dispatchEvent(mouseMoveEvent);

            expect(GlobalState.mouse.active).toBe(true);
        });

        test('should normalize mouse coordinates to -1 to 1 range', () => {
            initInputListeners();
            const mouseMoveEvent = new MouseEvent('mousemove', {
                clientX: window.innerWidth / 2,
                clientY: window.innerHeight / 2,
            });
            window.dispatchEvent(mouseMoveEvent);

            expect(GlobalState.mouse.x).toBeCloseTo(0, 1);
            expect(GlobalState.mouse.y).toBeCloseTo(0, 1);
        });

        test('should track scroll velocity', () => {
            initInputListeners();
            const scrollEvent = new Event('scroll');
            window.dispatchEvent(scrollEvent);

            expect(GlobalState.scroll.velocity).toBeDefined();
        });
    });
});
