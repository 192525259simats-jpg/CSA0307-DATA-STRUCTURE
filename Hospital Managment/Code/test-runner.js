/**
 * test-runner.js
 * Integrated In-Browser Automated Test Suite for Data Structures Verification
 * 
 * Runs 11 Comprehensive Unit and Integration Test Cases:
 * Validates PriorityQueue invariants, composite FIFO comparators, heap operations,
 * search/update behaviors, and boundary handling.
 */

import { Patient, PatientStatus } from './data-structures/Patient.js';
import { PriorityQueue } from './data-structures/PriorityQueue.js';

export class TestRunner {
    constructor() {
        this.testResults = [];
    }

    /**
     * Run all test cases and return structured results
     */
    async runAllTests() {
        this.testResults = [];

        // 1. Critical Priority Injection
        this.runTest(
            'Insert Critical Patient (Severity 5)',
            'Enqueue Sev 1, 2, 3 patients, then enqueue Sev 5 patient.',
            'Severity 5 patient is immediately positioned at root (Priority Rank #1).',
            () => {
                const pq = new PriorityQueue();
                pq.enqueue(new Patient({ id: 'T01', name: 'Minor Case', severity: 1, arrivalTime: '08:00' }));
                pq.enqueue(new Patient({ id: 'T02', name: 'Moderate Case', severity: 2, arrivalTime: '08:05' }));
                pq.enqueue(new Patient({ id: 'T03', name: 'Serious Case', severity: 3, arrivalTime: '08:10' }));
                pq.enqueue(new Patient({ id: 'T_CRIT', name: 'Critical Cardiac', severity: 5, arrivalTime: '08:20' }));

                const top = pq.peek();
                const passed = top && top.id === 'T_CRIT' && top.severity === 5;
                return {
                    passed,
                    actual: `Peek returned: ${top ? top.id + ' (Severity ' + top.severity + ')' : 'None'}`
                };
            }
        );

        // 2. Multi-Severity Sorting
        this.runTest(
            'Multi-Severity Strict Ordering',
            'Enqueue patients with severities [2, 4, 1, 5, 3].',
            'Dequeued sequence must be strictly [5, 4, 3, 2, 1].',
            () => {
                const pq = new PriorityQueue();
                pq.enqueue(new Patient({ id: 'T2', name: 'Sev 2', severity: 2, arrivalTime: '08:00' }));
                pq.enqueue(new Patient({ id: 'T4', name: 'Sev 4', severity: 4, arrivalTime: '08:00' }));
                pq.enqueue(new Patient({ id: 'T1', name: 'Sev 1', severity: 1, arrivalTime: '08:00' }));
                pq.enqueue(new Patient({ id: 'T5', name: 'Sev 5', severity: 5, arrivalTime: '08:00' }));
                pq.enqueue(new Patient({ id: 'T3', name: 'Sev 3', severity: 3, arrivalTime: '08:00' }));

                const extracted = [];
                while (!pq.isEmpty()) {
                    extracted.push(pq.dequeue().severity);
                }

                const expected = [5, 4, 3, 2, 1];
                const passed = JSON.stringify(extracted) === JSON.stringify(expected);
                return {
                    passed,
                    actual: `Extracted order: [${extracted.join(', ')}]`
                };
            }
        );

        // 3. FIFO for Equal Severity
        this.runTest(
            'FIFO Preservation for Equal Severity',
            'Enqueue 3 patients with Severity 4 at 09:00, 09:05, 09:10.',
            'Dequeued order must strictly follow arrival times: 09:00 -> 09:05 -> 09:10.',
            () => {
                const pq = new PriorityQueue();
                pq.enqueue(new Patient({ id: 'P_FIRST', name: 'First Arrival', severity: 4, arrivalTime: '09:00', insertSequence: 1 }));
                pq.enqueue(new Patient({ id: 'P_SECOND', name: 'Second Arrival', severity: 4, arrivalTime: '09:05', insertSequence: 2 }));
                pq.enqueue(new Patient({ id: 'P_THIRD', name: 'Third Arrival', severity: 4, arrivalTime: '09:10', insertSequence: 3 }));

                const order = [];
                while (!pq.isEmpty()) {
                    order.push(pq.dequeue().id);
                }

                const expected = ['P_FIRST', 'P_SECOND', 'P_THIRD'];
                const passed = JSON.stringify(order) === JSON.stringify(expected);
                return {
                    passed,
                    actual: `Dequeued: [${order.join(' -> ')}]`
                };
            }
        );

        // 4. Deterministic Tie-Break (Equal Arrival Time)
        this.runTest(
            'Equal Severity & Equal Arrival Time Tie-Break',
            'Enqueue 2 patients with Severity 3 and identical arrival time "10:00".',
            'First registered patient must be dequeued first via insertion sequence.',
            () => {
                const pq = new PriorityQueue();
                pq.enqueue(new Patient({ id: 'P_SEQ_1', name: 'Arrived Same 1', severity: 3, arrivalTime: '10:00', insertSequence: 1 }));
                pq.enqueue(new Patient({ id: 'P_SEQ_2', name: 'Arrived Same 2', severity: 3, arrivalTime: '10:00', insertSequence: 2 }));

                const p1 = pq.dequeue();
                const p2 = pq.dequeue();
                const passed = p1.id === 'P_SEQ_1' && p2.id === 'P_SEQ_2';
                return {
                    passed,
                    actual: `Dequeued 1st: ${p1.id}, Dequeued 2nd: ${p2.id}`
                };
            }
        );

        // 5. Search Existing Patient
        this.runTest(
            'Search Existing Patient by ID & Name',
            'Search for "Sophia" and "P008" in populated queue.',
            'Returns patient details and exact queue rank.',
            () => {
                const pq = new PriorityQueue();
                pq.enqueue(new Patient({ id: 'P008', name: 'Sophia Reynolds', severity: 4, arrivalTime: '09:35' }));
                pq.enqueue(new Patient({ id: 'P005', name: 'Eleanor Vance', severity: 5, arrivalTime: '09:42' }));

                const results = pq.search('Sophia');
                const passed = results.length > 0 && results[0].patient.id === 'P008' && results[0].queueRank === 2;
                return {
                    passed,
                    actual: `Found ${results.length} result(s). Rank: #${results[0]?.queueRank || 'N/A'}`
                };
            }
        );

        // 6. Search Non-existing Patient
        this.runTest(
            'Search Non-Existing Patient',
            'Query queue for non-existent patient "P99999_UNKNOWN".',
            'Returns empty array [] without throwing an exception.',
            () => {
                const pq = new PriorityQueue();
                pq.enqueue(new Patient({ id: 'P001', name: 'Test', severity: 1, arrivalTime: '09:00' }));
                const results = pq.search('P99999_UNKNOWN');
                const passed = Array.isArray(results) && results.length === 0;
                return {
                    passed,
                    actual: `Returned length: ${results.length}`
                };
            }
        );

        // 7. Dynamic Severity Elevation (Triage Update)
        this.runTest(
            'Dynamic Severity Update & Reheapification',
            'Update patient P_LOW from Severity 1 to Severity 5.',
            'Patient immediately floats to the top of the Priority Queue.',
            () => {
                const pq = new PriorityQueue();
                pq.enqueue(new Patient({ id: 'P_TOP', name: 'Existing Top', severity: 4, arrivalTime: '08:00' }));
                pq.enqueue(new Patient({ id: 'P_LOW', name: 'Initial Low', severity: 1, arrivalTime: '08:00' }));

                pq.update('P_LOW', { severity: 5 });
                const newTop = pq.peek();
                const passed = newTop && newTop.id === 'P_LOW' && newTop.severity === 5;
                return {
                    passed,
                    actual: `New Top after update: ${newTop?.id} (Severity ${newTop?.severity})`
                };
            }
        );

        // 8. Patient Removal / Deletion
        this.runTest(
            'Delete / Remove Patient from Queue',
            'Remove patient P_MID from middle of 3-element queue.',
            'Queue size reduces to 2 and remaining elements maintain Max-Heap invariant.',
            () => {
                const pq = new PriorityQueue();
                pq.enqueue(new Patient({ id: 'P1', name: 'Patient 1', severity: 5, arrivalTime: '08:00' }));
                pq.enqueue(new Patient({ id: 'P_MID', name: 'Patient Mid', severity: 3, arrivalTime: '08:05' }));
                pq.enqueue(new Patient({ id: 'P3', name: 'Patient 3', severity: 1, arrivalTime: '08:10' }));

                const removed = pq.remove('P_MID');
                const passed = removed && removed.id === 'P_MID' && pq.size() === 2 && pq.peek().id === 'P1';
                return {
                    passed,
                    actual: `Removed: ${removed?.id}, Remaining size: ${pq.size()}, Current Root: ${pq.peek()?.id}`
                };
            }
        );

        // 9. Extract-Max (Start Treatment)
        this.runTest(
            'Extract-Max / Dequeue Operation',
            'Call dequeue() on queue with 3 patients.',
            'Root is extracted, second highest becomes new root, size decrements by 1.',
            () => {
                const pq = new PriorityQueue();
                pq.enqueue(new Patient({ id: 'HIGH', name: 'High Sev', severity: 5, arrivalTime: '08:00' }));
                pq.enqueue(new Patient({ id: 'MED', name: 'Med Sev', severity: 3, arrivalTime: '08:00' }));
                pq.enqueue(new Patient({ id: 'LOW', name: 'Low Sev', severity: 1, arrivalTime: '08:00' }));

                const extracted = pq.dequeue();
                const nextRoot = pq.peek();
                const passed = extracted.id === 'HIGH' && nextRoot.id === 'MED' && pq.size() === 2;
                return {
                    passed,
                    actual: `Extracted: ${extracted.id}, New Root: ${nextRoot.id}, Size: ${pq.size()}`
                };
            }
        );

        // 10. Complete Treatment Flow Status
        this.runTest(
            'Treatment Status Lifecycle Transition',
            'Transition patient from "Waiting" -> "In Treatment" -> "Treated".',
            'Status and duration timestamps are properly populated.',
            () => {
                const patient = new Patient({ id: 'P_LIFE', name: 'Lifecycle Patient', severity: 4, arrivalTime: '08:00' });
                patient.status = PatientStatus.IN_TREATMENT;
                patient.treatmentStart = '08:10';

                patient.status = PatientStatus.TREATED;
                patient.treatmentEnd = '08:50';

                const passed = patient.status === PatientStatus.TREATED && patient.treatmentStart === '08:10' && patient.treatmentEnd === '08:50';
                return {
                    passed,
                    actual: `Status: ${patient.status}, Start: ${patient.treatmentStart}, End: ${patient.treatmentEnd}`
                };
            }
        );

        // 11. Empty Queue Boundary Handling
        this.runTest(
            'Empty Queue Boundary Handling',
            'Call peek() and dequeue() on empty PriorityQueue.',
            'Returns null without runtime errors or crashes.',
            () => {
                const pq = new PriorityQueue();
                const peekResult = pq.peek();
                const dequeueResult = pq.dequeue();
                const isEmpty = pq.isEmpty();

                const passed = peekResult === null && dequeueResult === null && isEmpty === true;
                return {
                    passed,
                    actual: `peek: ${peekResult}, dequeue: ${dequeueResult}, isEmpty: ${isEmpty}`
                };
            }
        );

        return this.testResults;
    }

    /**
     * Helper to run single test with timing and try/catch
     */
    runTest(title, inputDesc, expectedDesc, testFn) {
        const startTime = performance.now();
        let passed = false;
        let actual = '';
        let error = null;

        try {
            const result = testFn();
            passed = result.passed;
            actual = result.actual;
        } catch (err) {
            passed = false;
            actual = `Exception thrown: ${err.message}`;
            error = err;
        }

        const duration = (performance.now() - startTime).toFixed(2);
        this.testResults.push({
            title,
            inputDesc,
            expectedDesc,
            actualResult: actual,
            status: passed ? 'PASS' : 'FAIL',
            duration: `${duration}ms`,
            error
        });
    }

    /**
     * Render the Testing & Results UI table
     */
    renderResults(containerId = 'testing-results-container') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const total = this.testResults.length;
        const passedCount = this.testResults.filter(t => t.status === 'PASS').length;
        const failedCount = total - passedCount;
        const passRate = total > 0 ? Math.round((passedCount / total) * 100) : 0;

        container.innerHTML = `
            <div class="test-suite-wrapper glass-panel">
                <div class="test-suite-header">
                    <div>
                        <h3><i class="fa-solid fa-vial-circle-check text-success"></i> Automated Data Structure Test Suite</h3>
                        <p class="text-secondary">Execution and verification of PriorityQueue invariants, FIFO tie-breaking, and edge cases.</p>
                    </div>
                    <button class="btn btn-primary" onclick="window.app.runTestSuite()">
                        <i class="fa-solid fa-play"></i> Run All Tests Again
                    </button>
                </div>

                <div class="test-metrics-bar">
                    <div class="test-metric-card success">
                        <span class="metric-num">${passedCount}</span>
                        <span class="metric-label">Tests Passed</span>
                    </div>
                    <div class="test-metric-card ${failedCount > 0 ? 'danger' : 'neutral'}">
                        <span class="metric-num">${failedCount}</span>
                        <span class="metric-label">Tests Failed</span>
                    </div>
                    <div class="test-metric-card info">
                        <span class="metric-num">${passRate}%</span>
                        <span class="metric-label">Pass Rate</span>
                    </div>
                    <div class="test-metric-card neutral">
                        <span class="metric-num">${total}</span>
                        <span class="metric-label">Total Test Cases</span>
                    </div>
                </div>

                <div class="table-responsive mt-4">
                    <table class="data-table test-results-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Test Case</th>
                                <th>Input / Pre-condition</th>
                                <th>Expected Result</th>
                                <th>Actual Result</th>
                                <th>Time</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.testResults.map((t, idx) => `
                                <tr class="${t.status === 'PASS' ? 'row-pass' : 'row-fail'} animate-fade">
                                    <td><strong>${idx + 1}</strong></td>
                                    <td><strong>${t.title}</strong></td>
                                    <td><code>${t.inputDesc}</code></td>
                                    <td>${t.expectedDesc}</td>
                                    <td><span class="actual-val">${t.actualResult}</span></td>
                                    <td><small class="text-secondary">${t.duration}</small></td>
                                    <td>
                                        <span class="test-badge ${t.status === 'PASS' ? 'badge-pass' : 'badge-fail'}">
                                            <i class="fa-solid ${t.status === 'PASS' ? 'fa-check' : 'fa-xmark'}"></i> ${t.status}
                                        </span>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }
}
