/**
 * animations.js
 * High-Performance Cinematic Animation & Interaction Engine
 * Inspired by modern streaming/dashboard aesthetics (Netflix-style smooth feel)
 * 
 * Features:
 * - Desktop Interactive Custom Cursor (dot + smooth lerp ring + hover expansions)
 * - Dynamic Cursor Spotlight on major cards (--mouse-x, --mouse-y)
 * - Animated Number Counters for Dashboard Statistics
 * - Scroll Reveal via IntersectionObserver
 * - Micro-interaction and button shine triggers
 * - FLIP (First, Last, Invert, Play) Transition Helpers for Priority Queue
 * - Touch/Mobile and prefers-reduced-motion detection
 */

export class AnimationEngine {
    constructor() {
        this.cursorDot = null;
        this.cursorRing = null;
        this.mousePos = { x: -100, y: -100 };
        this.ringPos = { x: -100, y: -100 };
        this.isHoveringInteractive = false;
        this.isTouchDevice = false;
        this.reducedMotion = false;
        this.rafId = null;

        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            this.init();
        }
    }

    /**
     * Initialize animation engine
     */
    init() {
        this.checkEnvironment();

        if (!this.isTouchDevice && !this.reducedMotion) {
            this.setupCustomCursor();
            this.startCursorLoop();
        }

        this.setupSpotlightEffect();
        this.setupScrollReveal();
        this.setupFormFeedback();
    }

    /**
     * Detect device capabilities and user accessibility preferences
     */
    checkEnvironment() {
        this.isTouchDevice = (
            'ontouchstart' in window ||
            navigator.maxTouchPoints > 0 ||
            window.matchMedia('(pointer: coarse)').matches
        );

        this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    /**
     * Build and inject the custom cursor elements
     */
    setupCustomCursor() {
        if (document.getElementById('custom-cursor-dot')) return;

        this.cursorDot = document.createElement('div');
        this.cursorDot.id = 'custom-cursor-dot';
        this.cursorDot.className = 'custom-cursor-dot';

        this.cursorRing = document.createElement('div');
        this.cursorRing.id = 'custom-cursor-ring';
        this.cursorRing.className = 'custom-cursor-ring';

        document.body.appendChild(this.cursorDot);
        document.body.appendChild(this.cursorRing);

        // Track real mouse position
        window.addEventListener('mousemove', (e) => {
            this.mousePos.x = e.clientX;
            this.mousePos.y = e.clientY;

            // Direct update for the dot (instant tracking)
            if (this.cursorDot) {
                this.cursorDot.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
            }
        }, { passive: true });

        // Hover expansions on interactive elements
        document.addEventListener('mouseover', (e) => {
            const target = e.target.closest('a, button, .btn, .stat-card, .queue-patient-card, .nav-link, input, select, textarea, .stream-card, .sdg-card, .data-table tr, .algo-block, .heap-tree-node, .view-tab-btn');
            if (target && this.cursorRing) {
                this.isHoveringInteractive = true;
                this.cursorRing.classList.add('cursor-hover');
                if (target.classList.contains('stat-critical') || target.classList.contains('btn-danger') || target.classList.contains('toast-critical')) {
                    this.cursorRing.classList.add('cursor-critical');
                } else {
                    this.cursorRing.classList.remove('cursor-critical');
                }
            }
        }, { passive: true });

        document.addEventListener('mouseout', (e) => {
            const target = e.target.closest('a, button, .btn, .stat-card, .queue-patient-card, .nav-link, input, select, textarea, .stream-card, .sdg-card, .data-table tr, .algo-block, .heap-tree-node, .view-tab-btn');
            if (target && this.cursorRing) {
                this.isHoveringInteractive = false;
                this.cursorRing.classList.remove('cursor-hover', 'cursor-critical');
            }
        }, { passive: true });

        // Click pulse
        window.addEventListener('mousedown', () => {
            if (this.cursorRing) this.cursorRing.classList.add('cursor-click');
        }, { passive: true });

        window.addEventListener('mouseup', () => {
            if (this.cursorRing) this.cursorRing.classList.remove('cursor-click');
        }, { passive: true });
    }

    /**
     * 60fps RequestAnimationFrame Loop for smooth ring interpolation (Lerp)
     */
    startCursorLoop() {
        const lerpFactor = 0.18; // smooth lag factor

        const render = () => {
            // Linear interpolation
            this.ringPos.x += (this.mousePos.x - this.ringPos.x) * lerpFactor;
            this.ringPos.y += (this.mousePos.y - this.ringPos.y) * lerpFactor;

            if (this.cursorRing) {
                this.cursorRing.style.transform = `translate3d(${this.ringPos.x}px, ${this.ringPos.y}px, 0)`;
            }

            this.rafId = requestAnimationFrame(render);
        };

        this.rafId = requestAnimationFrame(render);
    }

    /**
     * Cursor Spotlight Effect: updates CSS variables --mouse-x and --mouse-y on cards
     */
    setupSpotlightEffect() {
        if (this.isTouchDevice) return;

        document.addEventListener('mousemove', (e) => {
            const card = e.target.closest('.stat-card, .queue-patient-card, .next-patient-hero, .glass-panel, .stream-card, .sdg-card, .active-bay-card');
            if (card) {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
            }
        }, { passive: true });
    }

    /**
     * Scroll Reveal using IntersectionObserver
     */
    setupScrollReveal() {
        if (this.reducedMotion) return;

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    obs.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

        // Observe elements
        const elements = document.querySelectorAll('.reveal-on-scroll, .sdg-card, .algo-block, .comparison-col');
        elements.forEach(el => observer.observe(el));
    }

    /**
     * Smooth Animated Number Counter for Dashboard Statistics
     * Counts smoothly from previous number to target number
     * @param {HTMLElement} element 
     * @param {number} endVal 
     * @param {number} duration 
     */
    animateNumber(element, endVal, duration = 650) {
        if (!element) return;
        if (this.reducedMotion) {
            element.textContent = endVal;
            return;
        }

        const startVal = parseInt(element.textContent, 10) || 0;
        if (startVal === endVal) {
            element.textContent = endVal;
            return;
        }

        const startTime = performance.now();

        const updateCount = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out quart: 1 - (1 - x)^4
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const currentVal = Math.round(startVal + (endVal - startVal) * easeProgress);

            element.textContent = currentVal;

            if (progress < 1) {
                requestAnimationFrame(updateCount);
            } else {
                element.textContent = endVal;
                // Subtle scale bump upon completion
                element.classList.add('number-bump');
                setTimeout(() => element.classList.remove('number-bump'), 250);
            }
        };

        requestAnimationFrame(updateCount);
    }

    /**
     * Form Validation & Error Shake Animation Trigger
     * @param {HTMLElement|string} elementOrId 
     */
    triggerShake(elementOrId) {
        const el = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
        if (!el) return;

        el.classList.remove('animate-shake');
        void el.offsetWidth; // Trigger reflow
        el.classList.add('animate-shake');

        setTimeout(() => el.classList.remove('animate-shake'), 600);
    }

    /**
     * Setup form micro-interactions
     */
    setupFormFeedback() {
        const inputs = document.querySelectorAll('.form-control, .form-select');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                input.parentElement?.classList.add('input-focused');
            });
            input.addEventListener('blur', () => {
                input.parentElement?.classList.remove('input-focused');
            });
        });
    }

    /**
     * Animate FLIP card movement for queue transitions
     * @param {HTMLElement} cardElement 
     * @param {'insert'|'delete'|'treat'} type 
     * @param {Function} [callback] 
     */
    animateCardAction(cardElement, type = 'insert', callback = null) {
        if (!cardElement || this.reducedMotion) {
            if (callback) callback();
            return;
        }

        if (type === 'delete') {
            cardElement.classList.add('card-exit-delete');
            setTimeout(() => {
                if (callback) callback();
            }, 350);
        } else if (type === 'treat') {
            cardElement.classList.add('card-exit-treat');
            setTimeout(() => {
                if (callback) callback();
            }, 350);
        } else if (type === 'insert') {
            cardElement.classList.add('card-enter-insert');
            setTimeout(() => {
                cardElement.classList.remove('card-enter-insert');
                if (callback) callback();
            }, 450);
        }
    }
}
