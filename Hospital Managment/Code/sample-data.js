/**
 * sample-data.js
 * Pre-configured Realistic Emergency Room Patient Dataset
 * 
 * Contains:
 * - Waiting patients with varied and identical severity levels
 * - Clearly distinguished arrival times to illustrate FIFO within same severity
 * - Currently treating patient in resuscitation bay
 * - Completed treatment history records
 */

import { Patient, PatientStatus } from './data-structures/Patient.js';

export const SampleWaitingPatients = [
    new Patient({
        id: 'P005',
        name: 'Eleanor Vance',
        arrivalTime: '09:42',
        severity: 5,
        severityDesc: 'Acute Myocardial Infarction / Ventricular Fibrillation',
        doctor: 'Dr. Sarah Lin (Cardiologist)',
        status: PatientStatus.WAITING,
        insertSequence: 1
    }),
    new Patient({
        id: 'P002',
        name: 'Carlos Mendez',
        arrivalTime: '09:50',
        severity: 5,
        severityDesc: 'Severe Polytrauma with Massive Arterial Bleeding',
        doctor: 'Dr. Marcus Vance (Trauma Lead)',
        status: PatientStatus.WAITING,
        insertSequence: 2
    }),
    new Patient({
        id: 'P008',
        name: 'Sophia Reynolds',
        arrivalTime: '09:35',
        severity: 4,
        severityDesc: 'Acute Hemiparesis & Slurred Speech (Suspected Stroke)',
        doctor: 'Dr. Elena Rostova (Neurologist)',
        status: PatientStatus.WAITING,
        insertSequence: 3
    }),
    new Patient({
        id: 'P011',
        name: 'David Kim',
        arrivalTime: '09:48',
        severity: 4,
        severityDesc: 'Compound Tibial Fracture with Neurovascular Impairment',
        doctor: 'Dr. Marcus Vance (Trauma Lead)',
        status: PatientStatus.WAITING,
        insertSequence: 4
    }),
    new Patient({
        id: 'P003',
        name: 'Amina Al-Mansoor',
        arrivalTime: '09:15',
        severity: 3,
        severityDesc: 'Severe Refractory Asthma Exacerbation & Hypoxia',
        doctor: 'Dr. Aisha Patel (Critical Care)',
        status: PatientStatus.WAITING,
        insertSequence: 5
    }),
    new Patient({
        id: 'P007',
        name: 'Liam O’Connor',
        arrivalTime: '09:28',
        severity: 3,
        severityDesc: 'High-grade Septic Fever (39.8°C) with Lethargy',
        doctor: 'Dr. James Chen (Emergency Physician)',
        status: PatientStatus.WAITING,
        insertSequence: 6
    }),
    new Patient({
        id: 'P001',
        name: 'Lucas Wright',
        arrivalTime: '08:50',
        severity: 2,
        severityDesc: 'Colicky Right Lower Quadrant Abdominal Pain (Suspected Appendicitis)',
        doctor: 'Dr. James Chen (Emergency Physician)',
        status: PatientStatus.WAITING,
        insertSequence: 7
    }),
    new Patient({
        id: 'P009',
        name: 'Grace Hopper',
        arrivalTime: '08:30',
        severity: 1,
        severityDesc: 'Distal Finger Laceration with Controlled Hemostasis',
        doctor: 'Dr. Michael Scott (General ER)',
        status: PatientStatus.WAITING,
        insertSequence: 8
    }),
    new Patient({
        id: 'P010',
        name: 'Ethan Hunt',
        arrivalTime: '08:45',
        severity: 1,
        severityDesc: 'Right Inversion Ankle Sprain with Mild Edema',
        doctor: 'Dr. Michael Scott (General ER)',
        status: PatientStatus.WAITING,
        insertSequence: 9
    })
];

export const SampleActiveTreatingPatients = [
    new Patient({
        id: 'P004',
        name: 'Alexander Bell',
        arrivalTime: '09:05',
        severity: 5,
        severityDesc: 'Severe Anaphylactic Shock / Airway Angioedema',
        doctor: 'Dr. Aisha Patel (Critical Care)',
        status: PatientStatus.IN_TREATMENT,
        treatmentStart: '09:12'
    })
];

export const SampleTreatmentHistory = [
    {
        id: 'P006',
        name: 'Maria Santos',
        arrivalTime: '08:10',
        severity: 4,
        severityDesc: 'Hypertensive Emergency with Flash Pulmonary Edema',
        doctor: 'Dr. Sarah Lin (Cardiologist)',
        status: PatientStatus.TREATED,
        treatmentStart: '08:18',
        treatmentEnd: '09:05',
        durationMinutes: 47
    },
    {
        id: 'P000',
        name: 'Arthur Pendelton',
        arrivalTime: '07:45',
        severity: 3,
        severityDesc: 'Dislocated Glenohumeral Joint (Shoulder Reduction)',
        doctor: 'Dr. Marcus Vance (Trauma Lead)',
        status: PatientStatus.TREATED,
        treatmentStart: '08:00',
        treatmentEnd: '08:40',
        durationMinutes: 40
    },
    {
        id: 'P999',
        name: 'Hannah Abbott',
        arrivalTime: '07:30',
        severity: 2,
        severityDesc: 'Acute Corneal Foreign Body Removal',
        doctor: 'Dr. James Chen (Emergency Physician)',
        status: PatientStatus.TREATED,
        treatmentStart: '07:45',
        treatmentEnd: '08:15',
        durationMinutes: 30
    }
];
