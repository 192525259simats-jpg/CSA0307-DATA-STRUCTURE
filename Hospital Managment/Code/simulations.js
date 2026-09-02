/**
 * simulations.js
 * Interactive Educational Simulators for Data Structures:
 * 1. FIFO within Same Severity Demonstration
 * 2. Standard FIFO vs Emergency Priority Queue Comparative Simulator
 */

import { Patient, SeverityLevels } from './data-structures/Patient.js';
import { PriorityQueue } from './data-structures/PriorityQueue.js';

export class SimulationsManager {
    constructor() {
        this.initFifoDemo();
        this.initComparisonDemo();
    }

    /**
     * Initialize the FIFO Demonstration within same severity
     */
    initFifoDemo() {
        this.fifoDemoData = [
            { id: 'DEMO-A', name: 'Patient A (Alice)', severity: 4, arrivalTime: '10:01', seq: 1 },
            { id: 'DEMO-B', name: 'Patient B (Bob)', severity: 4, arrivalTime: '10:05', seq: 2 },
            { id: 'DEMO-C', name: 'Patient C (Charlie)', severity: 4, arrivalTime: '10:10', seq: 3 }
        ];
    }

    /**
     * Render the interactive FIFO demonstration step
     */
    renderFifoDemo(containerId = 'fifo-demo-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Build temporary Priority Queue with equal severity patients
        const demoPQ = new PriorityQueue();
        this.fifoDemoData.forEach(item => {
            demoPQ.enqueue(new Patient({
                id: item.id,
                name: item.name,
                severity: item.severity,
                arrivalTime: item.arrivalTime,
                doctor: 'Dr. Sarah Lin (Cardiologist)',
                insertSequence: item.seq
            }));
        });

        const ordered = demoPQ.getOrderedPatients();

        container.innerHTML = `
            <div class="demo-card glass-panel">
                <div class="demo-header">
                    <div class="demo-badge"><i class="fa-solid fa-clock-rotate-left"></i> Same-Severity FIFO Invariant</div>
                    <h3>Interactive FIFO Rule Verification</h3>
                    <p class="text-secondary">
                        When patients arrive with identical severity levels (<span class="badge-pill sev-4">Severity 4 - Very Serious</span>),
                        the Priority Queue falls back to an exact <strong>First-In, First-Out (FIFO)</strong> comparator based on arrival timestamp.
                    </p>
                </div>

                <div class="fifo-flow-grid">
                    <div class="flow-step-box">
                        <div class="step-badge">1. Arrival Order (Real Time)</div>
                        <div class="patient-flow-list">
                            ${this.fifoDemoData.map((p, idx) => `
                                <div class="flow-patient-item animate-fade">
                                    <div class="patient-dot sev-${p.severity}"></div>
                                    <div class="flow-info">
                                        <strong>${p.name}</strong>
                                        <span class="arrival-tag"><i class="fa-regular fa-clock"></i> Arrived: ${p.arrivalTime}</span>
                                    </div>
                                    <span class="order-tag">Order #${idx + 1}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <div class="flow-arrow-column">
                        <i class="fa-solid fa-arrow-right-long text-primary flow-pulse"></i>
                        <span class="flow-label">Priority Queue Sift-Up</span>
                    </div>

                    <div class="flow-step-box">
                        <div class="step-badge success">2. Deterministic Treatment Sequence</div>
                        <div class="patient-flow-list">
                            ${ordered.map((p, idx) => `
                                <div class="flow-patient-item highlight-rank animate-slide-in" style="animation-delay: ${idx * 150}ms">
                                    <div class="treatment-rank">#${idx + 1}</div>
                                    <div class="flow-info">
                                        <strong>${p.name}</strong>
                                        <span class="badge-pill sev-${p.severity}">Severity ${p.severity}</span>
                                    </div>
                                    <span class="time-diff-tag">${p.arrivalTime}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="explanation-callout">
                    <div class="callout-icon"><i class="fa-solid fa-circle-check text-success"></i></div>
                    <div class="callout-content">
                        <strong>FIFO Proof:</strong> Since <code>Patient A (10:01) &lt; Patient B (10:05) &lt; Patient C (10:10)</code>, 
                        the resulting treatment order is strictly <code>Patient A &rarr; Patient B &rarr; Patient C</code>. 
                        No starvation occurs and fairness is mathematically guaranteed.
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Initialize data for Standard FIFO vs Emergency Priority Queue comparison
     */
    initComparisonDemo() {
        this.comparisonArrivals = [
            { id: 'C01', name: 'Patient 1 (Minor Abrasion)', severity: 1, arrivalTime: '09:00', condition: 'Minor Sprain' },
            { id: 'C02', name: 'Patient 2 (High Fever)', severity: 3, arrivalTime: '09:05', condition: 'Severe Dehydration' },
            { id: 'C03', name: 'Patient 3 (Cardiac Arrest)', severity: 5, arrivalTime: '09:10', condition: 'Ventricular Fibrillation' }
        ];
    }

    /**
     * Render the interactive FIFO vs Priority Queue Comparison View
     */
    renderComparisonDemo(containerId = 'comparison-demo-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Standard FIFO treatment order (sorted purely by arrival time)
        const fifoOrder = [...this.comparisonArrivals].sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime));

        // Priority Queue treatment order (sorted by severity DESC, then arrival time)
        const pqOrder = [...this.comparisonArrivals].sort((a, b) => {
            if (b.severity !== a.severity) return b.severity - a.severity;
            return a.arrivalTime.localeCompare(b.arrivalTime);
        });

        container.innerHTML = `
            <div class="comparison-wrapper">
                <div class="comparison-scenario glass-panel mb-4">
                    <h4><i class="fa-solid fa-hospital-user text-primary"></i> Clinical Scenario: Arrival Stream</h4>
                    <p class="text-secondary">Three patients arrive at the Emergency Room in chronological order:</p>
                    <div class="arrival-stream-cards">
                        ${this.comparisonArrivals.map((p, i) => {
                            const sev = SeverityLevels[p.severity];
                            return `
                                <div class="stream-card sev-border-${p.severity}">
                                    <div class="stream-header">
                                        <span class="stream-time"><i class="fa-regular fa-clock"></i> ${p.arrivalTime}</span>
                                        <span class="badge-pill sev-${p.severity}">${sev.name}</span>
                                    </div>
                                    <h5>${p.name}</h5>
                                    <p class="condition-note">${p.condition}</p>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>

                <div class="comparison-grid">
                    <!-- Standard FIFO Column -->
                    <div class="comparison-col danger-border glass-panel">
                        <div class="col-header danger-header">
                            <i class="fa-solid fa-triangle-exclamation"></i>
                            <div>
                                <h4>Conventional FIFO Queue</h4>
                                <span>First-In, First-Out (Ignores Clinical Urgency)</span>
                            </div>
                        </div>

                        <div class="treatment-pipeline">
                            <div class="pipeline-title">Treatment Order:</div>
                            ${fifoOrder.map((p, idx) => {
                                const sev = SeverityLevels[p.severity];
                                const isCriticallyDelayed = p.severity === 5 && idx > 0;
                                return `
                                    <div class="pipeline-item ${isCriticallyDelayed ? 'hazard-highlight' : ''}">
                                        <div class="pipeline-number">Step ${idx + 1}</div>
                                        <div class="pipeline-details">
                                            <strong>${p.name}</strong>
                                            <span class="badge-pill sev-${p.severity}">${sev.name}</span>
                                        </div>
                                        ${isCriticallyDelayed ? '<div class="hazard-badge"><i class="fa-solid fa-skull-crossbones"></i> CRITICAL DELAY!</div>' : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div class="col-footer danger-footer">
                            <strong><i class="fa-solid fa-circle-xmark"></i> Fatal Flaw:</strong>
                            <p>The <em>Critical (Cardiac Arrest)</em> patient who arrived at 09:10 is forced to wait behind the <em>Minor (Sprain)</em> patient from 09:00. In emergency medicine, this leads to catastrophic mortality.</p>
                        </div>
                    </div>

                    <!-- Priority Queue Column -->
                    <div class="comparison-col success-border glass-panel">
                        <div class="col-header success-header">
                            <i class="fa-solid fa-shield-heart"></i>
                            <div>
                                <h4>Emergency Priority Queue</h4>
                                <span>Max-Heap with Deterministic FIFO Tie-break</span>
                            </div>
                        </div>

                        <div class="treatment-pipeline">
                            <div class="pipeline-title">Treatment Order:</div>
                            ${pqOrder.map((p, idx) => {
                                const sev = SeverityLevels[p.severity];
                                const isImmediate = p.severity === 5 && idx === 0;
                                return `
                                    <div class="pipeline-item ${isImmediate ? 'success-highlight' : ''}">
                                        <div class="pipeline-number">Step ${idx + 1}</div>
                                        <div class="pipeline-details">
                                            <strong>${p.name}</strong>
                                            <span class="badge-pill sev-${p.severity}">${sev.name}</span>
                                        </div>
                                        ${isImmediate ? '<div class="immediate-badge"><i class="fa-solid fa-bolt"></i> IMMEDIATE RESUSCITATION</div>' : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>

                        <div class="col-footer success-footer">
                            <strong><i class="fa-solid fa-circle-check"></i> Optimal Clinical Outcome:</strong>
                            <p>The Priority Queue immediately preempts the queue order. The critical cardiac patient is treated first ($O(1)$ peek / $O(\log n)$ extraction), reducing door-to-treatment time to zero.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}
