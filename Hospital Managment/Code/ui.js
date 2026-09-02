/**
 * ui.js
 * User Interface Renderer & View Manager with Enhanced Visual Animations
 * 
 * Handles rendering for:
 * - Dashboard statistics & animated count tickers
 * - Next Patient spotlight hero card with breathing highlight
 * - Active Treatment Bay management
 * - Patient Search & Directory
 * - Treatment History table with CSV Export
 * - Modals & Animated Toast notification system
 */

import { SeverityLevels, PatientStatus, DefaultDoctors, Patient } from './data-structures/Patient.js';

export class UIManager {
    constructor() {
        this.toastContainer = null;
        this.initToastContainer();
    }

    /**
     * Initialize container for toast messages
     */
    initToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        this.toastContainer = container;
    }

    /**
     * Display a floating Toast notification with smooth slide/fade entrance
     * @param {string} title 
     * @param {string} message 
     * @param {'success'|'danger'|'warning'|'info'|'critical'} type 
     */
    showToast(title, message, type = 'info') {
        if (!this.toastContainer) this.initToastContainer();

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type} animate-slide-in`;

        let icon = 'fa-circle-info';
        if (type === 'success') icon = 'fa-circle-check';
        if (type === 'danger' || type === 'critical') icon = 'fa-triangle-exclamation';
        if (type === 'warning') icon = 'fa-bell';

        toast.innerHTML = `
            <div class="toast-icon"><i class="fa-solid ${icon}"></i></div>
            <div class="toast-body">
                <strong>${title}</strong>
                <p>${message}</p>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
        `;

        this.toastContainer.appendChild(toast);

        // Auto dismiss with reverse animation
        setTimeout(() => {
            toast.classList.add('toast-fade-out');
            setTimeout(() => toast.remove(), 350);
        }, 4200);
    }

    /**
     * Render Dashboard View with animated statistic counters
     * @param {Object} state - Application state object
     */
    renderDashboard(state) {
        const { priorityQueue, activeTreating, treatmentHistory, doctors } = state;
        const waitingPatients = priorityQueue.getOrderedPatients();
        const nextPatient = waitingPatients[0] || null;
        const criticalCount = waitingPatients.filter(p => p.severity === 5).length;
        const totalPatients = waitingPatients.length + activeTreating.length + treatmentHistory.length;

        // 1. Render Statistic Cards & Emergency Department Status Banner
        const statsContainer = document.getElementById('dashboard-stats-grid');
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="er-status-banner animate-slide-up" style="grid-column: 1 / -1;">
                    <div class="er-status-left">
                        <div class="er-status-icon"><i class="fa-solid fa-hospital"></i></div>
                        <div class="er-status-title">
                            <h3><span class="status-dot online"></span> EMERGENCY DEPARTMENT STATUS &bull; OPERATIONAL</h3>
                            <span>Real-Time Triage Priority &amp; Resuscitation Bay Monitoring</span>
                        </div>
                    </div>
                    <div class="er-status-metrics">
                        <div class="er-metric-item">
                            <span class="er-metric-label">Waiting Patients</span>
                            <span class="er-metric-val">${waitingPatients.length}</span>
                        </div>
                        <div class="er-metric-item">
                            <span class="er-metric-label">Critical Cases</span>
                            <span class="er-metric-val text-danger" style="color: #FF8A80;">${criticalCount}</span>
                        </div>
                        <div class="er-metric-item">
                            <span class="er-metric-label">Doctors Available</span>
                            <span class="er-metric-val">${doctors.length}</span>
                        </div>
                    </div>
                </div>

                <div class="stat-card glass-panel animate-slide-up" style="animation-delay: 60ms">
                    <div class="stat-icon icon-cyan"><i class="fa-solid fa-hospital-user"></i></div>
                    <div class="stat-content">
                        <span class="stat-label">Total Patients</span>
                        <h2 class="stat-value counter" id="stat-val-total">${totalPatients}</h2>
                        <span class="stat-meta">All-time triage registry</span>
                    </div>
                </div>

                <div class="stat-card glass-panel animate-slide-up" style="animation-delay: 120ms">
                    <div class="stat-icon icon-yellow"><i class="fa-solid fa-clock-rotate-left"></i></div>
                    <div class="stat-content">
                        <span class="stat-label">Waiting in Queue</span>
                        <h2 class="stat-value counter text-warning" id="stat-val-waiting">${waitingPatients.length}</h2>
                        <span class="stat-meta">Awaiting clinical call</span>
                    </div>
                </div>

                <div class="stat-card glass-panel stat-critical animate-slide-up ${criticalCount > 0 ? 'critical-pulse' : ''}" style="animation-delay: 180ms">
                    <div class="stat-icon icon-red"><i class="fa-solid fa-heart-pulse"></i></div>
                    <div class="stat-content">
                        <span class="stat-label">Critical Patients</span>
                        <h2 class="stat-value counter text-danger" id="stat-val-critical">${criticalCount}</h2>
                        <span class="stat-meta text-danger">Immediate resuscitation</span>
                    </div>
                </div>

                <div class="stat-card glass-panel animate-slide-up" style="animation-delay: 240ms">
                    <div class="stat-icon icon-blue"><i class="fa-solid fa-bed-pulse"></i></div>
                    <div class="stat-content">
                        <span class="stat-label">In Treatment</span>
                        <h2 class="stat-value counter text-primary" id="stat-val-treating">${activeTreating.length}</h2>
                        <span class="stat-meta">Active resuscitation bays</span>
                    </div>
                </div>

                <div class="stat-card glass-panel animate-slide-up" style="animation-delay: 300ms">
                    <div class="stat-icon icon-green"><i class="fa-solid fa-circle-check"></i></div>
                    <div class="stat-content">
                        <span class="stat-label">Treated &amp; Discharged</span>
                        <h2 class="stat-value counter text-success" id="stat-val-treated">${treatmentHistory.length}</h2>
                        <span class="stat-meta">Completed clinical care</span>
                    </div>
                </div>

                <div class="stat-card glass-panel animate-slide-up" style="animation-delay: 360ms">
                    <div class="stat-icon icon-indigo"><i class="fa-solid fa-user-doctor"></i></div>
                    <div class="stat-content">
                        <span class="stat-label">Available Doctors</span>
                        <h2 class="stat-value counter text-info" id="stat-val-doctors">${doctors.length}</h2>
                        <span class="stat-meta">ER attending physicians</span>
                    </div>
                </div>
            `;

            // Trigger animated counting
            if (window.app?.animations) {
                window.app.animations.animateNumber(document.getElementById('stat-val-total'), totalPatients);
                window.app.animations.animateNumber(document.getElementById('stat-val-waiting'), waitingPatients.length);
                window.app.animations.animateNumber(document.getElementById('stat-val-treating'), activeTreating.length);
                window.app.animations.animateNumber(document.getElementById('stat-val-treated'), treatmentHistory.length);
                window.app.animations.animateNumber(document.getElementById('stat-val-critical'), criticalCount);
                window.app.animations.animateNumber(document.getElementById('stat-val-doctors'), doctors.length);
            }
        }

        // 2. Render Next Patient Spotlight on Dashboard
        this.renderNextPatientHero(nextPatient, 'dashboard-next-patient');

        // 3. Render Active Treatment Bays on Dashboard
        this.renderActiveBays(activeTreating, 'dashboard-active-bays');

        // 4. Render Top Waiting Patients summary table on Dashboard
        this.renderDashboardQueueSummary(waitingPatients, 'dashboard-queue-summary');
    }

    /**
     * Render the Spotlight Hero Card for the top-priority next patient
     */
    renderNextPatientHero(patient, containerId = 'next-patient-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!patient) {
            container.innerHTML = `
                <div class="next-patient-hero empty-hero glass-panel animate-fade-in">
                    <div class="hero-icon"><i class="fa-solid fa-circle-check text-success"></i></div>
                    <div class="hero-body">
                        <h3>Waiting Queue is Clear</h3>
                        <p class="text-secondary">No patients currently awaiting treatment. Register a new triage patient or reload sample data.</p>
                    </div>
                </div>
            `;
            return;
        }

        const sev = SeverityLevels[patient.severity] || SeverityLevels[1];

        container.innerHTML = `
            <div class="next-patient-hero glass-panel sev-glow-${patient.severity} animate-scale-in">
                <div class="hero-status-ribbon">
                    <span class="pulse-indicator"></span>
                    <i class="fa-solid fa-bolt"></i> PRIORITY RANK #1 &bull; NEXT TO BE TREATED
                </div>

                <div class="hero-main-content">
                    <div class="hero-id-col">
                        <span class="hero-patient-id">${patient.id}</span>
                        <span class="badge-pill sev-${patient.severity}">
                            <i class="fa-solid ${sev.icon}"></i> ${sev.name} (Level ${patient.severity})
                        </span>
                    </div>

                    <div class="hero-info-col">
                        <h2 class="hero-name">${patient.name}</h2>
                        <p class="hero-desc"><i class="fa-solid fa-notes-medical text-primary"></i> ${patient.severityDesc}</p>
                        
                        <div class="hero-meta-row">
                            <span><i class="fa-regular fa-clock"></i> Arrived: <strong>${patient.arrivalTime}</strong></span>
                            <span><i class="fa-solid fa-user-doctor"></i> Doctor: <strong>${patient.doctor}</strong></span>
                            <span><i class="fa-solid fa-tag"></i> FIFO Seq: <strong>#${patient.insertSequence}</strong></span>
                        </div>
                    </div>

                    <div class="hero-action-col">
                        <button class="btn btn-primary btn-lg start-treat-btn" onclick="window.app.startTreatment('${patient.id}')">
                            <i class="fa-solid fa-stethoscope"></i> Start Treatment
                        </button>
                        <small class="text-secondary text-center mt-2">Pulls patient into Active Bay</small>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render Active Treatment Bays
     */
    renderActiveBays(activeTreating, containerId = 'active-bays-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (activeTreating.length === 0) {
            container.innerHTML = `
                <div class="empty-bay-state glass-panel animate-fade-in">
                    <i class="fa-solid fa-bed text-secondary"></i>
                    <p class="text-secondary">All Resuscitation and Treatment Bays are currently open.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="active-bays-grid">
                ${activeTreating.map((patient, idx) => {
                    const sev = SeverityLevels[patient.severity] || SeverityLevels[1];
                    return `
                        <div class="active-bay-card glass-panel animate-slide-up" style="animation-delay: ${idx * 90}ms; border-top: 4px solid ${sev.color}">
                            <div class="bay-header">
                                <span class="bay-room-tag"><i class="fa-solid fa-door-open"></i> Bay ${idx + 1}</span>
                                <span class="badge-pill sev-${patient.severity}">${sev.name}</span>
                            </div>

                            <div class="bay-patient-info">
                                <span class="patient-id">${patient.id}</span>
                                <h4 class="patient-name">${patient.name}</h4>
                                <p class="clinical-desc text-secondary"><small>${patient.severityDesc}</small></p>
                            </div>

                            <div class="bay-time-info">
                                <div><small class="text-secondary">Started:</small> <strong>${patient.treatmentStart || 'Just now'}</strong></div>
                                <div><small class="text-secondary">Doctor:</small> <strong>${patient.doctor}</strong></div>
                            </div>

                            <button class="btn btn-success btn-block mt-3" onclick="window.app.completeTreatment('${patient.id}')">
                                <i class="fa-solid fa-check-double"></i> Complete Treatment
                            </button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render Top Waiting Patients summary table for Dashboard
     */
    renderDashboardQueueSummary(waitingPatients, containerId = 'dashboard-queue-summary') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const topPatients = waitingPatients.slice(0, 5);

        if (topPatients.length === 0) {
            container.innerHTML = `<p class="text-secondary text-center p-3 animate-fade-in">No waiting patients.</p>`;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>ID</th>
                            <th>Patient Name</th>
                            <th>Severity</th>
                            <th>Arrival</th>
                            <th>Doctor</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topPatients.map((p, idx) => {
                            const sev = SeverityLevels[p.severity];
                            return `
                                <tr class="animate-fade" style="animation-delay: ${idx * 50}ms">
                                    <td><span class="rank-badge-sm">#${idx + 1}</span></td>
                                    <td><strong>${p.id}</strong></td>
                                    <td>${p.name}</td>
                                    <td><span class="badge-pill sev-${p.severity}">${sev.name} (S${p.severity})</span></td>
                                    <td>${p.arrivalTime}</td>
                                    <td><small>${p.doctor}</small></td>
                                    <td>
                                        <button class="btn btn-primary btn-xs" onclick="window.app.startTreatment('${p.id}')">
                                            Treat
                                        </button>
                                        <button class="btn btn-outline btn-xs" onclick="window.app.openEditModal('${p.id}')">
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    /**
     * Render Patient Search & Directory Results with entry animations
     */
    renderSearchResults(results, allPatients, query, containerId = 'search-results-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!query || !query.trim()) {
            container.innerHTML = `
                <div class="search-empty-prompt text-center p-5 text-secondary animate-fade-in">
                    <i class="fa-solid fa-magnifying-glass fa-2x mb-2 text-primary"></i>
                    <p>Enter a Patient ID (e.g. <code>P008</code>), Patient Name (e.g. <code>Sophia</code>), or Doctor Name to look up records.</p>
                </div>
            `;
            return;
        }

        if (results.length === 0) {
            container.innerHTML = `
                <div class="search-empty-state glass-panel text-center p-5 animate-shake">
                    <i class="fa-solid fa-user-slash fa-2x text-warning mb-2"></i>
                    <h4>No Patients Found</h4>
                    <p class="text-secondary">No active waiting, treating, or treated patient matched "<strong>${query}</strong>".</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="search-results-grid">
                ${results.map((item, idx) => {
                    const p = item.patient;
                    const sev = SeverityLevels[p.severity] || SeverityLevels[1];
                    return `
                        <div class="search-result-card glass-panel animate-slide-up" style="animation-delay: ${idx * 70}ms; border-left: 4px solid ${sev.color}">
                            <div class="result-header">
                                <span class="id-badge">${p.id}</span>
                                <span class="badge-pill sev-${p.severity}">${sev.name}</span>
                                <span class="status-tag status-${p.status.toLowerCase().replace(' ', '-')}">${p.status}</span>
                            </div>

                            <h3 class="patient-name mt-2">${p.name}</h3>
                            <p class="clinical-desc text-secondary"><i class="fa-solid fa-stethoscope"></i> ${p.severityDesc}</p>

                            <div class="result-meta-grid">
                                <div><small class="text-secondary">Arrival:</small> <strong>${p.arrivalTime}</strong></div>
                                <div><small class="text-secondary">Assigned Doctor:</small> <strong>${p.doctor}</strong></div>
                                <div>
                                    <small class="text-secondary">Queue Rank:</small> 
                                    <strong>${item.queueRank ? `#${item.queueRank} in Waiting Queue` : p.status}</strong>
                                </div>
                            </div>

                            <div class="result-actions mt-3">
                                ${p.status === PatientStatus.WAITING ? `
                                    <button class="btn btn-primary btn-sm" onclick="window.app.startTreatment('${p.id}')">
                                        <i class="fa-solid fa-bolt"></i> Start Treatment
                                    </button>
                                ` : ''}
                                <button class="btn btn-outline btn-sm" onclick="window.app.openEditModal('${p.id}')">
                                    <i class="fa-solid fa-pen-to-square"></i> Edit
                                </button>
                                ${p.status === PatientStatus.WAITING ? `
                                    <button class="btn btn-danger-outline btn-sm" onclick="window.app.confirmDeletePatient('${p.id}')">
                                        <i class="fa-solid fa-trash-can"></i> Remove
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    /**
     * Render Treatment History Table with row animations
     */
    renderTreatmentHistory(history, containerId = 'treatment-history-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (history.length === 0) {
            container.innerHTML = `
                <div class="glass-panel text-center p-5 text-secondary animate-fade-in">
                    <i class="fa-solid fa-notes-medical fa-2x mb-2 text-primary"></i>
                    <h4>No Treatment History Recorded</h4>
                    <p>When waiting patients complete treatment, their clinical logs appear here.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="history-controls-bar mb-3">
                <div>
                    <span class="text-secondary">Total Completed Treatments: <strong>${history.length}</strong></span>
                </div>
                <div class="history-actions">
                    <button class="btn btn-outline btn-sm" onclick="window.app.exportHistoryCSV()">
                        <i class="fa-solid fa-file-csv"></i> Export to CSV
                    </button>
                    <button class="btn btn-danger-outline btn-sm" onclick="window.app.clearTreatmentHistory()">
                        <i class="fa-solid fa-trash-can"></i> Clear History
                    </button>
                </div>
            </div>

            <div class="table-responsive glass-panel">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Patient ID</th>
                            <th>Patient Name</th>
                            <th>Severity Level</th>
                            <th>Assigned Doctor</th>
                            <th>Arrival Time</th>
                            <th>Treatment Start</th>
                            <th>Completion Time</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${history.map((p, idx) => {
                            const sev = SeverityLevels[p.severity] || SeverityLevels[1];
                            return `
                                <tr class="animate-fade" style="animation-delay: ${idx * 45}ms">
                                    <td><span class="id-badge">${p.id}</span></td>
                                    <td><strong>${p.name}</strong></td>
                                    <td><span class="badge-pill sev-${p.severity}"><i class="fa-solid ${sev.icon}"></i> ${sev.name} (S${p.severity})</span></td>
                                    <td>${p.doctor}</td>
                                    <td>${p.arrivalTime}</td>
                                    <td>${p.treatmentStart || '—'}</td>
                                    <td><strong>${p.treatmentEnd || '—'}</strong></td>
                                    <td><span class="status-tag status-treated"><i class="fa-solid fa-circle-check"></i> Treated</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }
}
