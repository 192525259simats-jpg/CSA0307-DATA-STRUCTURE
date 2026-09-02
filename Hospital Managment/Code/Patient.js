/**
 * Patient.js
 * Data Model for Emergency Department Patients
 * 
 * Manages patient attributes, severity classification (1-5),
 * validation rules, and status lifecycle transitions.
 */

export const SeverityLevels = Object.freeze({
    5: { level: 5, name: 'Critical', color: '#E53935', bg: 'rgba(229, 57, 53, 0.1)', border: '#E53935', icon: 'fa-heart-pulse' },
    4: { level: 4, name: 'Very Serious', color: '#FB8C00', bg: 'rgba(251, 140, 0, 0.1)', border: '#FB8C00', icon: 'fa-truck-medical' },
    3: { level: 3, name: 'Serious', color: '#D97706', bg: 'rgba(217, 119, 6, 0.12)', border: '#D97706', icon: 'fa-triangle-exclamation' },
    2: { level: 2, name: 'Moderate', color: '#1E88E5', bg: 'rgba(30, 136, 229, 0.1)', border: '#1E88E5', icon: 'fa-user-nurse' },
    1: { level: 1, name: 'Minor', color: '#43A047', bg: 'rgba(67, 160, 71, 0.1)', border: '#43A047', icon: 'fa-bandage' }
});

export const PatientStatus = Object.freeze({
    WAITING: 'Waiting',
    IN_TREATMENT: 'In Treatment',
    TREATED: 'Treated'
});

export const DefaultDoctors = Object.freeze([
    'Dr. Sarah Lin (Cardiologist)',
    'Dr. Marcus Vance (Trauma Lead)',
    'Dr. Elena Rostova (Neurologist)',
    'Dr. James Chen (Emergency Physician)',
    'Dr. Aisha Patel (Critical Care)',
    'Dr. Michael Scott (General ER)'
]);

export class Patient {
    /**
     * @param {Object} params
     * @param {string} params.id - Unique Patient Identifier (e.g., P001)
     * @param {string} params.name - Full Name of the Patient
     * @param {string} params.arrivalTime - Arrival Time string (HH:MM or ISO)
     * @param {number} params.severity - Severity Level integer (1-5)
     * @param {string} [params.severityDesc] - Clinical description of severity condition
     * @param {string} params.doctor - Assigned Attending Doctor
     * @param {string} [params.status='Waiting'] - Current triage status
     * @param {number} [params.insertSequence=0] - Monotonic counter for deterministic FIFO tie-break
     * @param {string|null} [params.treatmentStart=null] - Timestamp when treatment commenced
     * @param {string|null} [params.treatmentEnd=null] - Timestamp when treatment completed
     */
    constructor({
        id,
        name,
        arrivalTime,
        severity,
        severityDesc = '',
        doctor,
        status = PatientStatus.WAITING,
        insertSequence = 0,
        treatmentStart = null,
        treatmentEnd = null
    }) {
        this.id = id ? String(id).trim().toUpperCase() : '';
        this.name = name ? String(name).trim() : '';
        this.arrivalTime = arrivalTime || Patient.getCurrentTimeString();
        this.severity = parseInt(severity, 10);
        this.severityDesc = severityDesc ? String(severityDesc).trim() : Patient.getDefaultSeverityDesc(this.severity);
        this.doctor = doctor || DefaultDoctors[0];
        this.status = status;
        this.insertSequence = insertSequence;
        this.treatmentStart = treatmentStart;
        this.treatmentEnd = treatmentEnd;
    }

    /**
     * Get visual metadata for patient's severity level
     */
    getSeverityInfo() {
        return SeverityLevels[this.severity] || SeverityLevels[1];
    }

    /**
     * Parse arrival time into comparable minute integer for accurate FIFO comparison
     * @returns {number} minutes from start of day
     */
    getArrivalMinutes() {
        if (!this.arrivalTime) return 0;
        const parts = this.arrivalTime.split(':');
        if (parts.length >= 2) {
            const hours = parseInt(parts[0], 10) || 0;
            const minutes = parseInt(parts[1], 10) || 0;
            return hours * 60 + minutes;
        }
        return 0;
    }

    /**
     * Return formatted current local time in HH:MM format
     */
    static getCurrentTimeString() {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    /**
     * Provide default clinical condition suggestions based on severity level
     */
    static getDefaultSeverityDesc(severity) {
        switch (parseInt(severity, 10)) {
            case 5:
                return 'Cardiac Arrest / Massive Hemorrhage / Acute Respiratory Failure';
            case 4:
                return 'Severe Chest Pain / Potential Stroke / Major Compound Fracture';
            case 3:
                return 'High Grade Fever with Dehydration / Severe Asthma / Deep Laceration';
            case 2:
                return 'Moderate Abdominal Pain / Minor Fracture / Concussion Symptoms';
            case 1:
                return 'Superficial Abrasion / Mild Sprain / Low-grade Viral Pharyngitis';
            default:
                return 'General Emergency Triage Assessment';
        }
    }

    /**
     * Validate patient attributes before queue insertion
     * @returns {{isValid: boolean, errors: string[]}}
     */
    static validate(data) {
        const errors = [];
        if (!data.id || !String(data.id).trim()) {
            errors.push('Patient ID is required (e.g., P001).');
        }
        if (!data.name || !String(data.name).trim()) {
            errors.push('Patient Name is required.');
        }
        const severity = parseInt(data.severity, 10);
        if (isNaN(severity) || severity < 1 || severity > 5) {
            errors.push('Severity Level must be an integer between 1 (Minor) and 5 (Critical).');
        }
        if (!data.arrivalTime || !String(data.arrivalTime).trim()) {
            errors.push('Arrival Time is required.');
        }
        if (!data.doctor || !String(data.doctor).trim()) {
            errors.push('Assigned Doctor is required.');
        }
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Deep clone patient object
     */
    clone() {
        return new Patient({
            id: this.id,
            name: this.name,
            arrivalTime: this.arrivalTime,
            severity: this.severity,
            severityDesc: this.severityDesc,
            doctor: this.doctor,
            status: this.status,
            insertSequence: this.insertSequence,
            treatmentStart: this.treatmentStart,
            treatmentEnd: this.treatmentEnd
        });
    }

    /**
     * Serialization helper for LocalStorage
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            arrivalTime: this.arrivalTime,
            severity: this.severity,
            severityDesc: this.severityDesc,
            doctor: this.doctor,
            status: this.status,
            insertSequence: this.insertSequence,
            treatmentStart: this.treatmentStart,
            treatmentEnd: this.treatmentEnd
        };
    }

    /**
     * Deserialization helper from LocalStorage JSON
     */
    static fromJSON(json) {
        return new Patient(json);
    }
}
