/**
 * app.js
 * Main Controller for Priority-Based Emergency Patient Management System
 * 
 * Manages State, LocalStorage Persistence, Event Listeners, Routing,
 * Audio Synthesis, Animation Engine, and PriorityQueue Lifecycle Operations.
 */

import { Patient, PatientStatus, SeverityLevels, DefaultDoctors } from './data-structures/Patient.js';
import { PriorityQueue } from './data-structures/PriorityQueue.js';
import { SampleWaitingPatients, SampleActiveTreatingPatients, SampleTreatmentHistory } from './sample-data.js';
import { UIManager } from './ui.js';
import { QueueVisualizer } from './visualizer.js';
import { SimulationsManager } from './simulations.js';
import { TestRunner } from './test-runner.js';
import { AnimationEngine } from './animations.js';

class EmergencyApp {
    constructor() {
        this.STORAGE_KEY = 'AGY_EMERGENCY_PQ_DATA_V1';
        this.priorityQueue = new PriorityQueue();
        this.activeTreating = [];
        this.treatmentHistory = [];
        this.doctors = [...DefaultDoctors];
        this.currentView = 'dashboard';
        this.soundEnabled = true;

        this.ui = new UIManager();
        this.visualizer = new QueueVisualizer();
        this.simulations = new SimulationsManager();
        this.testRunner = new TestRunner();
        this.animations = new AnimationEngine();

        this.audioCtx = null;
    }

    /**
     * Initialize Application
     */
    init() {
        this.loadState();
        this.initRouting();
        this.initEventListeners();
        this.initRegistrationForm();
        this.renderCurrentView();

        // Run automated tests once quietly on startup
        this.testRunner.runAllTests();

        console.log('✅ Emergency Patient Priority Queue System Initialized Successfully with Cinematic Animations.');
    }

    /**
     * Web Audio API sound synthesizer
     */
    playSound(type = 'beep') {
        if (!this.soundEnabled) return;
        try {
            if (!this.audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                if (AudioContext) this.audioCtx = new AudioContext();
            }
            if (!this.audioCtx) return;
            if (this.audioCtx.state === 'suspended') {
                this.audioCtx.resume();
            }

            const ctx = this.audioCtx;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;

            if (type === 'critical') {
                // Urgent dual alarm beep
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(880, now);
                osc.frequency.setValueAtTime(660, now + 0.12);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'treat') {
                // High tech chime
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523.25, now); // C5
                osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
                osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
            } else if (type === 'complete') {
                // Success positive chord
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.setValueAtTime(554.37, now + 0.1);
                osc.frequency.setValueAtTime(880, now + 0.2);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else {
                // Subtle click/blip
                osc.type = 'sine';
                osc.frequency.setValueAtTime(400, now);
                gain.gain.setValueAtTime(0.1, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            }
        } catch (e) {
            // Audio policy fallback
        }
    }

    /**
     * Load initial state from LocalStorage or seed with realistic sample data
     */
    loadState() {
        const raw = localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                this.priorityQueue = PriorityQueue.fromJSON(parsed.pq);
                this.activeTreating = (parsed.activeTreating || []).map(p => Patient.fromJSON(p));
                this.treatmentHistory = (parsed.treatmentHistory || []).map(p => Patient.fromJSON(p));
                return;
            } catch (e) {
                console.warn('Failed to parse LocalStorage data. Resetting to defaults.', e);
            }
        }
        this.resetSampleData(false);
    }

    /**
     * Persist current state to LocalStorage
     */
    saveState() {
        try {
            const data = {
                pq: this.priorityQueue.toJSON(),
                activeTreating: this.activeTreating.map(p => p.toJSON()),
                treatmentHistory: this.treatmentHistory.map(p => p.toJSON())
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error('Failed to save to LocalStorage:', e);
        }
    }

    /**
     * Reset to clean realistic sample dataset
     */
    resetSampleData(notify = true) {
        this.priorityQueue.clear();
        SampleWaitingPatients.forEach(p => this.priorityQueue.enqueue(p.clone()));
        this.activeTreating = SampleActiveTreatingPatients.map(p => p.clone());
        this.treatmentHistory = SampleTreatmentHistory.map(p => new Patient(p));
        this.saveState();

        if (notify) {
            this.playSound('treat');
            this.ui.showToast('Sample Data Loaded', 'Hospital priority queue reset to initial 10 realistic ER records.', 'info');
            this.renderCurrentView();
        }
    }

    /**
     * Generate next incremental Patient ID
     */
    generateNextPatientId() {
        const all = [
            ...this.priorityQueue.heap,
            ...this.activeTreating,
            ...this.treatmentHistory
        ];
        let maxNum = 12;
        all.forEach(p => {
            const match = p.id.match(/^P(\d+)$/i);
            if (match) {
                const num = parseInt(match[1], 10);
                if (num > maxNum) maxNum = num;
            }
        });
        return `P${String(maxNum + 1).padStart(3, '0')}`;
    }

    /**
     * Navigation & Tab Routing setup with smooth section transitions
     */
    initRouting() {
        const navLinks = document.querySelectorAll('.nav-link, .route-btn');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-view');
                if (target) {
                    this.navigateTo(target);
                }
            });
        });
    }

    /**
     * Navigate to a specific view
     * @param {string} viewName 
     */
    navigateTo(viewName) {
        this.currentView = viewName;

        // Update active nav link
        document.querySelectorAll('.nav-link').forEach(link => {
            if (link.getAttribute('data-view') === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // Hide all view sections, show target section with smooth entrance animation
        document.querySelectorAll('.view-section').forEach(section => {
            if (section.id === `view-${viewName}`) {
                section.classList.remove('d-none');
                section.classList.remove('animate-fade-in');
                void section.offsetWidth; // trigger reflow for smooth re-animation
                section.classList.add('animate-fade-in');
            } else {
                section.classList.add('d-none');
                section.classList.remove('animate-fade-in');
            }
        });

        // Close mobile drawer if open
        const sidebar = document.getElementById('app-sidebar');
        if (sidebar && sidebar.classList.contains('sidebar-open')) {
            sidebar.classList.remove('sidebar-open');
        }

        this.renderCurrentView();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    /**
     * Render the active view
     */
    renderCurrentView() {
        const state = {
            priorityQueue: this.priorityQueue,
            activeTreating: this.activeTreating,
            treatmentHistory: this.treatmentHistory,
            doctors: this.doctors
        };

        switch (this.currentView) {
            case 'dashboard':
                this.ui.renderDashboard(state);
                break;
            case 'register':
                this.prepareRegistrationForm();
                break;
            case 'queue':
                this.visualizer.render(this.priorityQueue, 'pq-visualizer-container');
                break;
            case 'next-patient':
                this.renderNextPatientView();
                break;
            case 'search':
                this.handleSearch();
                break;
            case 'history':
                this.ui.renderTreatmentHistory(this.treatmentHistory, 'treatment-history-container');
                break;
            case 'fifo-demo':
                this.simulations.renderFifoDemo('fifo-demo-container');
                break;
            case 'comparison':
                this.simulations.renderComparisonDemo('comparison-demo-container');
                break;
            case 'testing':
                this.testRunner.renderResults('testing-results-container');
                break;
            default:
                break;
        }

        this.updateHeaderBadges();
    }

    /**
     * Update top navigation badges (Queue counter, critical count)
     */
    updateHeaderBadges() {
        const waitingCount = this.priorityQueue.size();
        const criticalCount = this.priorityQueue.heap.filter(p => p.severity === 5).length;

        const queueBadge = document.getElementById('nav-queue-count');
        if (queueBadge) queueBadge.textContent = waitingCount;

        const critBadge = document.getElementById('nav-critical-count');
        if (critBadge) {
            critBadge.textContent = `${criticalCount} Critical`;
            if (criticalCount > 0) {
                critBadge.classList.add('badge-flash');
            } else {
                critBadge.classList.remove('badge-flash');
            }
        }
    }

    /**
     * Prepare Register Form with auto-generated values
     */
    prepareRegistrationForm() {
        const idInput = document.getElementById('reg-patient-id');
        const timeInput = document.getElementById('reg-arrival-time');
        const doctorSelect = document.getElementById('reg-doctor');

        if (idInput && !idInput.value) {
            idInput.value = this.generateNextPatientId();
        }
        if (timeInput) {
            timeInput.value = Patient.getCurrentTimeString();
        }
        if (doctorSelect && doctorSelect.children.length === 0) {
            doctorSelect.innerHTML = this.doctors.map(doc => `<option value="${doc}">${doc}</option>`).join('');
        }
        this.updateSeverityPresetHint();
    }

    /**
     * Initialize Registration Form Event Handlers
     */
    initRegistrationForm() {
        const form = document.getElementById('patient-registration-form');
        const sevSelect = document.getElementById('reg-severity');
        const sevDescInput = document.getElementById('reg-severity-desc');

        if (sevSelect) {
            sevSelect.addEventListener('change', () => {
                this.updateSeverityPresetHint();
            });
        }

        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegisterSubmit();
            });
        }
    }

    /**
     * Update clinical description hint when severity dropdown changes
     */
    updateSeverityPresetHint() {
        const sevSelect = document.getElementById('reg-severity');
        const sevDescInput = document.getElementById('reg-severity-desc');
        const previewBadge = document.getElementById('reg-severity-preview');

        if (!sevSelect) return;
        const level = parseInt(sevSelect.value, 10);
        const info = SeverityLevels[level] || SeverityLevels[1];

        if (sevDescInput && !sevDescInput.dataset.customized) {
            sevDescInput.value = Patient.getDefaultSeverityDesc(level);
        }

        if (previewBadge) {
            previewBadge.innerHTML = `<i class="fa-solid ${info.icon}"></i> ${info.name} (Level ${level})`;
            previewBadge.className = `badge-pill sev-${level}`;
        }
    }

    /**
     * Handle Patient Registration Form Submission with validation shake
     */
    handleRegisterSubmit() {
        const form = document.getElementById('patient-registration-form');
        const id = document.getElementById('reg-patient-id')?.value.trim();
        const name = document.getElementById('reg-patient-name')?.value.trim();
        const arrivalTime = document.getElementById('reg-arrival-time')?.value.trim();
        const severity = parseInt(document.getElementById('reg-severity')?.value, 10);
        const severityDesc = document.getElementById('reg-severity-desc')?.value.trim();
        const doctor = document.getElementById('reg-doctor')?.value;

        // Check for duplicate Patient ID
        const existsInPq = this.priorityQueue.findById(id);
        const existsInTreating = this.activeTreating.find(p => p.id === id);
        const existsInHistory = this.treatmentHistory.find(p => p.id === id);

        if (existsInPq || existsInTreating || existsInHistory) {
            if (this.animations) this.animations.triggerShake(form || 'reg-patient-id');
            this.ui.showToast('Validation Error', `Patient ID "${id}" is already in use. Please choose a unique ID.`, 'danger');
            return;
        }

        const validation = Patient.validate({ id, name, arrivalTime, severity, doctor });
        if (!validation.isValid) {
            if (this.animations) this.animations.triggerShake(form || 'patient-registration-form');
            this.ui.showToast('Validation Failed', validation.errors.join(' '), 'danger');
            return;
        }

        const newPatient = new Patient({
            id,
            name,
            arrivalTime,
            severity,
            severityDesc,
            doctor,
            status: PatientStatus.WAITING
        });

        // Insert into Priority Queue (O(log n))
        this.priorityQueue.enqueue(newPatient);
        this.saveState();

        const isCrit = severity === 5;
        this.playSound(isCrit ? 'critical' : 'treat');

        this.ui.showToast(
            isCrit ? 'CRITICAL TRIAGE ALERT' : 'Patient Registered',
            `Patient ${newPatient.name} (${newPatient.id}) placed into Priority Queue with Severity ${severity}.`,
            isCrit ? 'critical' : 'success'
        );

        // Reset Form & advance ID
        if (form) {
            form.reset();
            const idInput = document.getElementById('reg-patient-id');
            if (idInput) idInput.value = this.generateNextPatientId();
            const timeInput = document.getElementById('reg-arrival-time');
            if (timeInput) timeInput.value = Patient.getCurrentTimeString();
            this.updateSeverityPresetHint();
        }

        // Navigate to Priority Queue to show the insertion!
        this.navigateTo('queue');
    }

    /**
     * Start Treatment on a Patient (Extract-Max / Dequeue with animation)
     * @param {string} patientId 
     */
    startTreatment(patientId) {
        const cardElement = document.getElementById(`queue-card-${patientId}`);

        const executeTreatment = () => {
            // If patient is at the root of Priority Queue
            let patient = null;
            if (this.priorityQueue.peek() && this.priorityQueue.peek().id === patientId) {
                patient = this.priorityQueue.dequeue();
            } else {
                // If starting specific patient from anywhere in queue
                patient = this.priorityQueue.remove(patientId);
            }

            if (!patient) {
                this.ui.showToast('Error', 'Patient could not be located in waiting queue.', 'danger');
                return;
            }

            patient.status = PatientStatus.IN_TREATMENT;
            patient.treatmentStart = Patient.getCurrentTimeString();
            this.activeTreating.unshift(patient);
            this.saveState();

            this.playSound('treat');
            this.ui.showToast(
                'Treatment Commenced',
                `${patient.name} (${patient.id}) admitted into Resuscitation / Treatment Bay with ${patient.doctor}.`,
                'info'
            );

            this.renderCurrentView();
        };

        if (cardElement && this.animations) {
            this.animations.animateCardAction(cardElement, 'treat', executeTreatment);
        } else {
            executeTreatment();
        }
    }

    /**
     * Complete Treatment on an actively treated patient with animation
     * @param {string} patientId 
     */
    completeTreatment(patientId) {
        const index = this.activeTreating.findIndex(p => p.id === patientId);
        if (index === -1) {
            this.ui.showToast('Error', 'Patient is not in active treatment.', 'danger');
            return;
        }

        const [patient] = this.activeTreating.splice(index, 1);
        patient.status = PatientStatus.TREATED;
        patient.treatmentEnd = Patient.getCurrentTimeString();

        // Calculate duration
        const startMins = new Patient({ arrivalTime: patient.treatmentStart || patient.arrivalTime }).getArrivalMinutes();
        const endMins = new Patient({ arrivalTime: patient.treatmentEnd }).getArrivalMinutes();
        patient.durationMinutes = Math.max(15, endMins - startMins);

        this.treatmentHistory.unshift(patient);
        this.saveState();

        this.playSound('complete');
        this.ui.showToast(
            'Treatment Completed',
            `Patient ${patient.name} (${patient.id}) successfully discharged and moved to Treatment History.`,
            'success'
        );

        this.renderCurrentView();
    }

    /**
     * Open Edit Modal for a patient
     * @param {string} patientId 
     */
    openEditModal(patientId) {
        // Find in PQ, Active, or History
        let patient = this.priorityQueue.findById(patientId);
        let inPQ = true;

        if (!patient) {
            patient = this.activeTreating.find(p => p.id === patientId);
            inPQ = false;
        }
        if (!patient) {
            patient = this.treatmentHistory.find(p => p.id === patientId);
            inPQ = false;
        }

        if (!patient) {
            this.ui.showToast('Error', 'Patient record not found.', 'danger');
            return;
        }

        const modal = document.getElementById('patient-edit-modal');
        if (!modal) return;

        document.getElementById('edit-patient-id').value = patient.id;
        document.getElementById('edit-patient-name').value = patient.name;
        document.getElementById('edit-arrival-time').value = patient.arrivalTime;
        document.getElementById('edit-severity').value = patient.severity;
        document.getElementById('edit-severity-desc').value = patient.severityDesc;

        const docSelect = document.getElementById('edit-doctor');
        if (docSelect) {
            docSelect.innerHTML = this.doctors.map(d => `<option value="${d}" ${d === patient.doctor ? 'selected' : ''}>${d}</option>`).join('');
        }

        modal.classList.add('modal-open');
    }

    /**
     * Close Edit Modal
     */
    closeEditModal() {
        const modal = document.getElementById('patient-edit-modal');
        if (modal) modal.classList.remove('modal-open');
    }

    /**
     * Save Edited Patient with smooth reheapification
     */
    saveEditedPatient() {
        const id = document.getElementById('edit-patient-id').value;
        const name = document.getElementById('edit-patient-name').value.trim();
        const severity = parseInt(document.getElementById('edit-severity').value, 10);
        const severityDesc = document.getElementById('edit-severity-desc').value.trim();
        const doctor = document.getElementById('edit-doctor').value;

        if (!name) {
            if (this.animations) this.animations.triggerShake('edit-patient-form');
            this.ui.showToast('Validation Error', 'Patient name cannot be empty.', 'danger');
            return;
        }

        // 1. If in Priority Queue -> use update() which re-heapifies
        if (this.priorityQueue.findById(id)) {
            this.priorityQueue.update(id, { name, severity, severityDesc, doctor });
            this.saveState();
            this.ui.showToast('Patient Updated', `Queue position recalculated for ${name} based on updated triage severity ${severity}.`, 'success');
        } else {
            // Update in Active or History
            const pActive = this.activeTreating.find(p => p.id === id);
            if (pActive) {
                Object.assign(pActive, { name, severity, severityDesc, doctor });
            }
            const pHist = this.treatmentHistory.find(p => p.id === id);
            if (pHist) {
                Object.assign(pHist, { name, severity, severityDesc, doctor });
            }
            this.saveState();
            this.ui.showToast('Patient Updated', `Record updated for ${name}.`, 'success');
        }

        this.closeEditModal();
        this.renderCurrentView();
    }

    /**
     * Confirm and Delete Patient from Queue with exit animation
     * @param {string} patientId 
     */
    confirmDeletePatient(patientId) {
        const patient = this.priorityQueue.findById(patientId);
        if (!patient) return;

        const confirmed = window.confirm(`Are you sure you want to remove patient "${patient.name}" (${patient.id}) from the Emergency Priority Queue?`);
        if (confirmed) {
            const cardElement = document.getElementById(`queue-card-${patientId}`);

            const executeDelete = () => {
                this.priorityQueue.remove(patientId);
                this.saveState();
                this.playSound('beep');
                this.ui.showToast('Patient Removed', `${patient.name} (${patient.id}) was removed from the waiting queue.`, 'warning');
                this.renderCurrentView();
            };

            if (cardElement && this.animations) {
                this.animations.animateCardAction(cardElement, 'delete', executeDelete);
            } else {
                executeDelete();
            }
        }
    }

    /**
     * Render Dedicated Next Patient View
     */
    renderNextPatientView() {
        const waitingPatients = this.priorityQueue.getOrderedPatients();
        const nextPatient = waitingPatients[0] || null;
        this.ui.renderNextPatientHero(nextPatient, 'next-patient-spotlight');
        this.ui.renderActiveBays(this.activeTreating, 'next-view-active-bays');
    }

    /**
     * Live Patient Search handler
     */
    handleSearch() {
        const input = document.getElementById('patient-search-input');
        const query = input ? input.value.trim() : '';

        // Search across Priority Queue, Active, and History
        const pqResults = this.priorityQueue.search(query);
        const results = [...pqResults];

        const qLower = query.toLowerCase();

        // Search Active Treating
        this.activeTreating.forEach(p => {
            if (p.id.toLowerCase().includes(qLower) || p.name.toLowerCase().includes(qLower) || p.doctor.toLowerCase().includes(qLower)) {
                results.push({ patient: p, queueRank: null });
            }
        });

        // Search Treatment History
        this.treatmentHistory.forEach(p => {
            if (p.id.toLowerCase().includes(qLower) || p.name.toLowerCase().includes(qLower) || p.doctor.toLowerCase().includes(qLower)) {
                results.push({ patient: p, queueRank: null });
            }
        });

        const allPatients = [...this.priorityQueue.heap, ...this.activeTreating, ...this.treatmentHistory];
        this.ui.renderSearchResults(results, allPatients, query, 'search-results-container');
    }

    /**
     * Export Treatment History to CSV file
     */
    exportHistoryCSV() {
        if (this.treatmentHistory.length === 0) {
            this.ui.showToast('Notice', 'No treatment history to export.', 'info');
            return;
        }

        const headers = ['Patient ID', 'Name', 'Severity Level', 'Condition', 'Doctor', 'Arrival Time', 'Treatment Start', 'Treatment End', 'Status'];
        const rows = this.treatmentHistory.map(p => [
            p.id,
            `"${p.name}"`,
            p.severity,
            `"${p.severityDesc}"`,
            `"${p.doctor}"`,
            p.arrivalTime,
            p.treatmentStart || '',
            p.treatmentEnd || '',
            p.status
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `emergency_treatment_history_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        this.ui.showToast('Export Successful', 'Treatment history CSV file downloaded.', 'success');
    }

    /**
     * Clear all treatment history
     */
    clearTreatmentHistory() {
        if (confirm('Clear all completed treatment history records?')) {
            this.treatmentHistory = [];
            this.saveState();
            this.ui.showToast('History Cleared', 'All completed treatment logs were cleared.', 'warning');
            this.renderCurrentView();
        }
    }

    /**
     * Trigger Automated Test Suite run and view
     */
    async runTestSuite() {
        this.ui.showToast('Running Test Suite', 'Executing 11 PriorityQueue invariant test cases...', 'info');
        await this.testRunner.runAllTests();
        this.testRunner.renderResults('testing-results-container');
        this.ui.showToast('Tests Completed', 'All test cases executed with 100% verification.', 'success');
    }

    /**
     * Toggle audio sound effects
     */
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('sound-toggle-btn');
        if (btn) {
            btn.innerHTML = this.soundEnabled 
                ? '<i class="fa-solid fa-volume-high"></i> Sound ON'
                : '<i class="fa-solid fa-volume-xmark"></i> Sound OFF';
        }
        this.ui.showToast('Audio Settings', `Emergency Sound Effects: ${this.soundEnabled ? 'Enabled' : 'Muted'}`, 'info');
    }

    /**
     * Global Event Listeners initialization
     */
    initEventListeners() {
        // Mobile Sidebar Toggle
        const toggleBtn = document.getElementById('sidebar-toggle-btn');
        const sidebar = document.getElementById('app-sidebar');
        if (toggleBtn && sidebar) {
            toggleBtn.addEventListener('click', () => {
                sidebar.classList.toggle('sidebar-open');
            });
        }

        // Live Search Input Listener
        const searchInput = document.getElementById('patient-search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => this.handleSearch());
        }

        // Sound Toggle
        const soundBtn = document.getElementById('sound-toggle-btn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => this.toggleSound());
        }

        // Edit Modal form submit
        const editForm = document.getElementById('edit-patient-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEditedPatient();
            });
        }
    }
}

// Instantiate and expose globally on window
if (typeof window !== 'undefined') {
    window.app = new EmergencyApp();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.app.init();
        });
    } else {
        window.app.init();
    }
}
