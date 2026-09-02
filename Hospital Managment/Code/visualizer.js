/**
 * visualizer.js
 * Interactive Visualizer for Emergency Priority Queue with Modern Hospital Styling
 * 
 * Includes:
 * 1. Ranked Priority Queue List View with clinical triage badges & next-patient indicators
 * 2. Binary Heap Tree Graph with Parent-Child Invariant Connectors (SVG)
 * 3. Memory Array Representation Visualizer
 */

import { SeverityLevels } from './data-structures/Patient.js';

export class QueueVisualizer {
    constructor() {
        this.currentViewMode = 'list'; // 'list' | 'tree' | 'array'
    }

    /**
     * Render the visualizer container based on the selected mode
     * @param {PriorityQueue} pq 
     * @param {string} containerId 
     */
    render(pq, containerId = 'pq-visualizer-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (pq.isEmpty()) {
            container.innerHTML = `
                <div class="empty-queue-state glass-panel animate-fade-in text-center p-5">
                    <div class="empty-icon text-success mb-2" style="font-size: 2.5rem;"><i class="fa-solid fa-clipboard-check"></i></div>
                    <h3>Waiting Queue is Clear</h3>
                    <p class="text-secondary">All emergency patients have been triaged and transferred to active resuscitation or treatment bays.</p>
                    <button class="btn btn-outline mt-3" onclick="window.app.resetSampleData()">
                        <i class="fa-solid fa-rotate-left"></i> Reload Sample Patients
                    </button>
                </div>
            `;
            return;
        }

        const orderedPatients = pq.getOrderedPatients();

        container.innerHTML = `
            <div class="visualizer-header animate-slide-up" style="animation-delay: 40ms">
                <div class="view-switch-tabs">
                    <button class="view-tab-btn ${this.currentViewMode === 'list' ? 'active' : ''}" data-view="list">
                        <i class="fa-solid fa-list-ol"></i> Priority Queue List (${orderedPatients.length})
                    </button>
                    <button class="view-tab-btn ${this.currentViewMode === 'tree' ? 'active' : ''}" data-view="tree">
                        <i class="fa-solid fa-diagram-project"></i> Binary Heap Tree Visualizer
                    </button>
                    <button class="view-tab-btn ${this.currentViewMode === 'array' ? 'active' : ''}" data-view="array">
                        <i class="fa-solid fa-table-cells-large"></i> Heap Array Memory Layout
                    </button>
                </div>

                <div class="queue-meta-summary">
                    <span class="meta-tag"><i class="fa-solid fa-trophy text-warning"></i> Next in Line: <strong>${orderedPatients[0]?.name}</strong></span>
                    <span class="meta-tag"><i class="fa-solid fa-layer-group text-primary"></i> Queue Size: <strong>${pq.size()}</strong></span>
                </div>
            </div>

            <!-- Hospital Triage Level Guide -->
            <div class="triage-guide-strip mt-3 animate-slide-up" style="animation-delay: 80ms">
                <span class="text-secondary"><i class="fa-solid fa-circle-info text-primary"></i> <strong>TRIAGE RULE:</strong> Patients are ordered by Severity ($5 > 4 > 3 > 2 > 1$). Equal severity is processed in strict arrival order (FIFO).</span>
                <div class="triage-guide-item"><span class="triage-dot" style="background:#E53935"></span> 5 - Critical (Highest)</div>
                <div class="triage-guide-item"><span class="triage-dot" style="background:#FB8C00"></span> 4 - Very Serious</div>
                <div class="triage-guide-item"><span class="triage-dot" style="background:#D97706"></span> 3 - Serious</div>
                <div class="triage-guide-item"><span class="triage-dot" style="background:#1E88E5"></span> 2 - Moderate</div>
                <div class="triage-guide-item"><span class="triage-dot" style="background:#43A047"></span> 1 - Minor (Lowest)</div>
            </div>

            <div class="visualizer-body mt-3">
                ${this.currentViewMode === 'list' ? this.renderListView(orderedPatients) : ''}
                ${this.currentViewMode === 'tree' ? this.renderHeapTreeView(pq) : ''}
                ${this.currentViewMode === 'array' ? this.renderArrayMemoryView(pq) : ''}
            </div>
        `;

        // Attach view switch handlers
        container.querySelectorAll('.view-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const targetView = e.currentTarget.dataset.view;
                this.currentViewMode = targetView;
                this.render(pq, containerId);
            });
        });
    }

    /**
     * Render the Priority-Ranked List View with clean hospital patient cards
     */
    renderListView(patients) {
        return `
            <div class="priority-queue-cards-grid">
                ${patients.map((patient, index) => {
                    const sev = SeverityLevels[patient.severity] || SeverityLevels[1];
                    const isNext = index === 0;
                    const rankStr = String(index + 1).padStart(2, '0');
                    return `
                        <div class="queue-patient-card glass-panel ${isNext ? 'next-spotlight' : ''} animate-slide-up" 
                             id="queue-card-${patient.id}"
                             style="animation-delay: ${Math.min(index * 60, 500)}ms; border-left: 4.5px solid ${sev.color};">
                            
                            <div class="card-rank-badge">
                                <span class="rank-num">PRIORITY QUEUE #${rankStr}</span>
                                ${isNext ? '<span class="next-pill"><i class="fa-solid fa-star"></i> NEXT PATIENT</span>' : ''}
                            </div>

                            <div class="patient-id-row">
                                <span class="id-badge">${patient.id}</span>
                                <span class="badge-pill sev-${patient.severity}">
                                    <i class="fa-solid ${sev.icon}"></i> ${sev.name} (S${patient.severity})
                                </span>
                            </div>

                            <h4 class="patient-name">${patient.name}</h4>
                            <p class="clinical-desc" title="${patient.severityDesc}">
                                <i class="fa-solid fa-stethoscope text-primary"></i> ${patient.severityDesc}
                            </p>

                            <div class="card-meta-grid">
                                <div class="meta-item">
                                    <span class="meta-label">Arrival Time</span>
                                    <span class="meta-val"><i class="fa-regular fa-clock"></i> ${patient.arrivalTime}</span>
                                </div>
                                <div class="meta-item">
                                    <span class="meta-label">Triage Status</span>
                                    <span class="meta-val status-val"><span class="status-dot waiting"></span> Waiting</span>
                                </div>
                                <div class="meta-item doctor-val">
                                    <span class="meta-label">Assigned Doctor</span>
                                    <span class="meta-val"><i class="fa-solid fa-user-doctor"></i> ${patient.doctor}</span>
                                </div>
                            </div>

                            <div class="card-actions">
                                ${isNext ? `
                                    <button class="btn btn-primary btn-sm treat-btn" onclick="window.app.startTreatment('${patient.id}')">
                                        <i class="fa-solid fa-stethoscope"></i> Start Treatment
                                    </button>
                                ` : ''}
                                <button class="btn btn-outline btn-sm edit-btn" onclick="window.app.openEditModal('${patient.id}')" title="Edit Patient">
                                    <i class="fa-solid fa-pen-to-square"></i> Edit
                                </button>
                                <button class="btn btn-danger-outline btn-sm delete-btn" onclick="window.app.confirmDeletePatient('${patient.id}')" title="Remove Patient">
                                    <i class="fa-solid fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render the Binary Heap Tree Structure Visualizer (SVG-powered hierarchical nodes)
     */
    renderHeapTreeView(pq) {
        const heap = pq.heap;
        if (heap.length === 0) return '<p class="text-secondary text-center p-4">Heap is currently empty.</p>';

        // Calculate tree levels
        const treeDepth = Math.floor(Math.log2(heap.length)) + 1;
        const width = 900;
        const height = Math.max(380, treeDepth * 110);
        const nodeRadius = 26;

        // Compute coordinate positions for each node index
        const nodePositions = [];
        for (let i = 0; i < heap.length; i++) {
            const level = Math.floor(Math.log2(i + 1));
            const levelIndex = i - (Math.pow(2, level) - 1);
            const totalNodesInLevel = Math.pow(2, level);
            const levelWidth = width / (totalNodesInLevel + 1);
            const cx = levelWidth * (levelIndex + 1);
            const cy = 50 + level * 95;
            nodePositions.push({ cx, cy, patient: heap[i], index: i });
        }

        // Generate SVG lines for parent -> child links
        let linesSvg = '';
        for (let i = 0; i < heap.length; i++) {
            const leftChild = 2 * i + 1;
            const rightChild = 2 * i + 2;

            if (leftChild < heap.length) {
                const p = nodePositions[i];
                const c = nodePositions[leftChild];
                linesSvg += `<line x1="${p.cx}" y1="${p.cy}" x2="${c.cx}" y2="${c.cy}" stroke="#CBDCE9" stroke-width="2" stroke-dasharray="4,4" />`;
            }
            if (rightChild < heap.length) {
                const p = nodePositions[i];
                const c = nodePositions[rightChild];
                linesSvg += `<line x1="${p.cx}" y1="${p.cy}" x2="${c.cx}" y2="${c.cy}" stroke="#CBDCE9" stroke-width="2" stroke-dasharray="4,4" />`;
            }
        }

        // Generate SVG nodes with hover animation
        let nodesSvg = '';
        nodePositions.forEach(node => {
            const p = node.patient;
            const sev = SeverityLevels[p.severity] || SeverityLevels[1];
            const isRoot = node.index === 0;

            nodesSvg += `
                <g class="heap-tree-node" transform="translate(${node.cx}, ${node.cy})" onclick="window.app.openEditModal('${p.id}')">
                    <circle r="${nodeRadius}" fill="#FFFFFF" stroke="${sev.color}" stroke-width="${isRoot ? '3.5' : '2'}" class="node-circle" />
                    <text text-anchor="middle" dy="-3" fill="#16324F" font-size="11" font-weight="700">${p.id}</text>
                    <text text-anchor="middle" dy="11" fill="${sev.color}" font-size="10" font-weight="700">S${p.severity} | ${p.arrivalTime}</text>
                    <rect x="-35" y="-38" width="70" height="15" rx="3" fill="#F1F6FA" stroke="#DCE6EE" stroke-width="1" />
                    <text text-anchor="middle" dy="-27" fill="#4A607A" font-size="9" font-weight="600">heap[${node.index}]</text>
                </g>
            `;
        });

        return `
            <div class="heap-tree-container glass-panel animate-scale-in">
                <div class="tree-legend">
                    <div class="legend-item"><span class="legend-dot root-dot"></span> Root Node (Index 0 = Max Priority)</div>
                    <div class="legend-item"><span class="legend-dot invariant-dot"></span> Max-Heap Property: <code>Parent.Severity &ge; Child.Severity</code></div>
                </div>

                <div class="svg-scroll-wrapper">
                    <svg viewBox="0 0 ${width} ${height}" class="heap-svg">
                        ${linesSvg}
                        ${nodesSvg}
                    </svg>
                </div>
                <div class="tree-tip text-center text-secondary mt-2">
                    <small><i class="fa-solid fa-circle-info"></i> Click any node to inspect or edit the patient. Binary Heap uses zero-based array indexing: <code>left=2i+1</code>, <code>right=2i+2</code>.</small>
                </div>
            </div>
        `;
    }

    /**
     * Render the Direct Array Memory Representation Visualizer
     */
    renderArrayMemoryView(pq) {
        const heap = pq.heap;
        return `
            <div class="heap-array-view glass-panel animate-scale-in p-4">
                <div class="array-explanation mb-3">
                    <h4><i class="fa-solid fa-memory text-primary"></i> Internal Array Storage Layout</h4>
                    <p class="text-secondary">
                        The Priority Queue is stored internally as a contiguous 1D array. Binary tree parent-child relations are computed purely with arithmetic:
                        <code>Parent(i) = &lfloor;(i-1)/2&rfloor;</code>, <code>Left(i) = 2i+1</code>, <code>Right(i) = 2i+2</code>.
                    </p>
                </div>

                <div class="array-boxes-row">
                    ${heap.map((patient, index) => {
                        const sev = SeverityLevels[patient.severity] || SeverityLevels[1];
                        return `
                            <div class="array-cell-block animate-slide-up" style="animation-delay: ${index * 40}ms">
                                <div class="cell-index">Index [${index}]</div>
                                <div class="cell-card" style="border-top: 3.5px solid ${sev.color}">
                                    <span class="cell-id">${patient.id}</span>
                                    <span class="badge-pill sev-${patient.severity}">S${patient.severity}</span>
                                    <span class="cell-name">${patient.name}</span>
                                    <span class="cell-time">${patient.arrivalTime}</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
}
