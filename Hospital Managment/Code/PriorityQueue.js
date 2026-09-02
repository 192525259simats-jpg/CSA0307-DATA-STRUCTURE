/**
 * PriorityQueue.js
 * Binary Max-Heap Implementation of Emergency Priority Queue
 * 
 * Order Invariant:
 * 1. Primary: Higher Severity Level (5 > 4 > 3 > 2 > 1)
 * 2. Secondary (Equal Severity): Earlier Arrival Time (FIFO)
 * 3. Tertiary (Equal Arrival): Lower Insertion Sequence Counter (Deterministic FIFO)
 */

import { Patient } from './Patient.js';

export class PriorityQueue {
    constructor() {
        /** @type {Patient[]} */
        this.heap = [];
        this.sequenceCounter = 0;
    }

    /**
     * Parent index in binary heap
     * @param {number} i 
     */
    getParentIndex(i) {
        return Math.floor((i - 1) / 2);
    }

    /**
     * Left child index
     * @param {number} i 
     */
    getLeftChildIndex(i) {
        return 2 * i + 1;
    }

    /**
     * Right child index
     * @param {number} i 
     */
    getRightChildIndex(i) {
        return 2 * i + 2;
    }

    /**
     * Priority Comparator: Returns > 0 if Patient A has higher priority than Patient B
     * @param {Patient} a 
     * @param {Patient} b 
     * @returns {number}
     */
    compare(a, b) {
        if (!a || !b) return 0;

        // 1. Primary Criterion: Severity Level (Higher severity = higher priority)
        if (a.severity !== b.severity) {
            return a.severity - b.severity;
        }

        // 2. Secondary Criterion: Arrival Time (Earlier arrival = higher priority)
        const aTime = a.getArrivalMinutes();
        const bTime = b.getArrivalMinutes();
        if (aTime !== bTime) {
            return bTime - aTime; // Note: Earlier time (smaller number) gives positive value
        }

        // 3. Tertiary Criterion: Insertion Sequence (Deterministic FIFO tie-break)
        return b.insertSequence - a.insertSequence;
    }

    /**
     * Swap elements at two heap indices
     */
    swap(i, j) {
        const temp = this.heap[i];
        this.heap[i] = this.heap[j];
        this.heap[j] = temp;
    }

    /**
     * Sift-up operation to restore heap property after insertion
     * @param {number} index 
     */
    siftUp(index) {
        let currentIndex = index;
        while (
            currentIndex > 0 &&
            this.compare(this.heap[currentIndex], this.heap[this.getParentIndex(currentIndex)]) > 0
        ) {
            const parentIndex = this.getParentIndex(currentIndex);
            this.swap(currentIndex, parentIndex);
            currentIndex = parentIndex;
        }
        return currentIndex;
    }

    /**
     * Sift-down operation to restore heap property after extraction
     * @param {number} index 
     */
    siftDown(index) {
        let currentIndex = index;
        const length = this.heap.length;

        while (this.getLeftChildIndex(currentIndex) < length) {
            let highestPriorityIndex = currentIndex;
            const leftChildIndex = this.getLeftChildIndex(currentIndex);
            const rightChildIndex = this.getRightChildIndex(currentIndex);

            if (this.compare(this.heap[leftChildIndex], this.heap[highestPriorityIndex]) > 0) {
                highestPriorityIndex = leftChildIndex;
            }

            if (
                rightChildIndex < length &&
                this.compare(this.heap[rightChildIndex], this.heap[highestPriorityIndex]) > 0
            ) {
                highestPriorityIndex = rightChildIndex;
            }

            if (highestPriorityIndex === currentIndex) {
                break;
            }

            this.swap(currentIndex, highestPriorityIndex);
            currentIndex = highestPriorityIndex;
        }
        return currentIndex;
    }

    /**
     * Enqueue a new patient into the priority queue
     * Time Complexity: O(log n)
     * @param {Patient} patient 
     * @returns {number} final inserted heap index
     */
    enqueue(patient) {
        if (!(patient instanceof Patient)) {
            patient = new Patient(patient);
        }

        this.sequenceCounter++;
        if (!patient.insertSequence) {
            patient.insertSequence = this.sequenceCounter;
        }

        this.heap.push(patient);
        const finalIndex = this.siftUp(this.heap.length - 1);
        return finalIndex;
    }

    /**
     * Extract and return the highest priority patient
     * Time Complexity: O(log n)
     * @returns {Patient|null}
     */
    dequeue() {
        if (this.isEmpty()) {
            return null;
        }

        const highestPriorityPatient = this.heap[0];
        const lastPatient = this.heap.pop();

        if (this.heap.length > 0 && lastPatient) {
            this.heap[0] = lastPatient;
            this.siftDown(0);
        }

        return highestPriorityPatient;
    }

    /**
     * Peek at the highest priority patient without removing
     * Time Complexity: O(1)
     * @returns {Patient|null}
     */
    peek() {
        if (this.isEmpty()) {
            return null;
        }
        return this.heap[0];
    }

    /**
     * Search for patients matching patient ID or full/partial name
     * Time Complexity: O(n)
     * @param {string} query 
     * @returns {Array<{patient: Patient, heapIndex: number, queueRank: number}>}
     */
    search(query) {
        if (!query || !String(query).trim()) {
            return [];
        }
        const q = String(query).trim().toLowerCase();
        const ordered = this.getOrderedPatients();

        const results = [];
        for (let rank = 0; rank < ordered.length; rank++) {
            const p = ordered[rank];
            if (
                p.id.toLowerCase().includes(q) ||
                p.name.toLowerCase().includes(q) ||
                p.doctor.toLowerCase().includes(q)
            ) {
                const heapIdx = this.heap.findIndex(item => item.id === p.id);
                results.push({
                    patient: p,
                    heapIndex: heapIdx,
                    queueRank: rank + 1 // 1-based rank
                });
            }
        }
        return results;
    }

    /**
     * Find patient by exact ID
     * @param {string} id 
     * @returns {Patient|null}
     */
    findById(id) {
        if (!id) return null;
        const normalized = String(id).trim().toUpperCase();
        return this.heap.find(p => p.id === normalized) || null;
    }

    /**
     * Find patient index in heap by ID
     * @param {string} id 
     * @returns {number} index or -1
     */
    findIndexById(id) {
        if (!id) return -1;
        const normalized = String(id).trim().toUpperCase();
        return this.heap.findIndex(p => p.id === normalized);
    }

    /**
     * Remove patient by ID from anywhere in the priority queue
     * Time Complexity: O(n) search + O(log n) reheapify
     * @param {string} patientId 
     * @returns {Patient|null} removed patient or null
     */
    remove(patientId) {
        const index = this.findIndexById(patientId);
        if (index === -1) return null;

        const removed = this.heap[index];
        const last = this.heap.pop();

        if (index < this.heap.length && last) {
            this.heap[index] = last;
            // Restore heap invariant in both directions
            this.siftUp(index);
            this.siftDown(index);
        }

        return removed;
    }

    /**
     * Update patient fields (e.g. changing severity or doctor) and recalculate position
     * Time Complexity: O(n) search + O(log n) reheapify
     * @param {string} patientId 
     * @param {Partial<Patient>} updatedFields 
     * @returns {Patient|null} updated patient or null
     */
    update(patientId, updatedFields) {
        const index = this.findIndexById(patientId);
        if (index === -1) return null;

        const patient = this.heap[index];
        Object.assign(patient, updatedFields);

        if (updatedFields.severity !== undefined) {
            patient.severity = parseInt(updatedFields.severity, 10);
            if (!updatedFields.severityDesc) {
                patient.severityDesc = Patient.getDefaultSeverityDesc(patient.severity);
            }
        }

        // Re-heapify to restore priority invariant
        this.siftUp(index);
        this.siftDown(index);

        return patient;
    }

    /**
     * Return all waiting patients in exact priority order (Simulated Extraction Order)
     * Time Complexity: O(n log n) non-destructive copy
     * @returns {Patient[]}
     */
    getOrderedPatients() {
        if (this.isEmpty()) return [];

        // Clone heap array without mutating the active instance
        const tempHeap = this.heap.map(p => p.clone());
        const tempPQ = new PriorityQueue();
        tempPQ.heap = tempHeap;
        tempPQ.sequenceCounter = this.sequenceCounter;

        const ordered = [];
        while (!tempPQ.isEmpty()) {
            ordered.push(tempPQ.dequeue());
        }
        return ordered;
    }

    /**
     * Return current queue length
     */
    size() {
        return this.heap.length;
    }

    /**
     * Check if queue is empty
     */
    isEmpty() {
        return this.heap.length === 0;
    }

    /**
     * Clear all elements
     */
    clear() {
        this.heap = [];
        this.sequenceCounter = 0;
    }

    /**
     * Serialize priority queue for persistence
     */
    toJSON() {
        return {
            heap: this.heap.map(p => p.toJSON()),
            sequenceCounter: this.sequenceCounter
        };
    }

    /**
     * Rebuild priority queue from serialized state
     * @param {Object} data 
     */
    static fromJSON(data) {
        const pq = new PriorityQueue();
        if (data && Array.isArray(data.heap)) {
            pq.heap = data.heap.map(item => Patient.fromJSON(item));
            pq.sequenceCounter = data.sequenceCounter || pq.heap.length;
            // Ensure heap property is fully satisfied
            for (let i = Math.floor(pq.heap.length / 2); i >= 0; i--) {
                pq.siftDown(i);
            }
        }
        return pq;
    }
}
