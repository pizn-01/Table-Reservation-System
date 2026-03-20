/**
 * Load Test Script — Concurrent Reservation Stress Test
 *
 * Tests the atomic RPC locking mechanism by sending N concurrent
 * reservation requests for the same table/time slot. Exactly 1
 * should succeed; the rest should receive 409 Conflict.
 *
 * Usage:
 *   npx ts-node scripts/load-test.ts
 *
 * Environment variables (optional):
 *   BASE_URL     — API base URL (default: http://localhost:5000/api/v1)
 *   SLUG         — Restaurant slug (default: test-restaurant)
 *   CONCURRENCY  — Number of simultaneous requests (default: 20)
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api/v1';
const SLUG = process.env.SLUG || 'test-restaurant';
const CONCURRENCY = parseInt(process.env.CONCURRENCY || '20', 10);

// Generate a future date for testing (tomorrow)
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const testDate = tomorrow.toISOString().split('T')[0];
const testTime = '19:00';

interface ReservationPayload {
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone: string;
  partySize: number;
  reservationDate: string;
  startTime: string;
}

async function makeReservation(index: number): Promise<{ index: number; status: number; body: any }> {
  const payload: ReservationPayload = {
    guestFirstName: `LoadTest`,
    guestLastName: `User${index}`,
    guestEmail: `loadtest${index}@example.com`,
    guestPhone: `555-00${String(index).padStart(2, '0')}`,
    partySize: 2,
    reservationDate: testDate,
    startTime: testTime,
  };

  try {
    const response = await fetch(`${BASE_URL}/public/${SLUG}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await response.json();
    return { index, status: response.status, body };
  } catch (err: any) {
    return { index, status: 0, body: { error: err.message } };
  }
}

async function runLoadTest() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Table Reservation System — Load Test');
  console.log('═══════════════════════════════════════════════════');
  console.log(`  Target:       ${BASE_URL}/public/${SLUG}/reserve`);
  console.log(`  Date:         ${testDate}`);
  console.log(`  Time:         ${testTime}`);
  console.log(`  Concurrency:  ${CONCURRENCY} simultaneous requests`);
  console.log('═══════════════════════════════════════════════════\n');

  console.log(`Launching ${CONCURRENCY} concurrent reservations...\n`);

  const startTime = Date.now();
  const promises = Array.from({ length: CONCURRENCY }, (_, i) => makeReservation(i));
  const results = await Promise.all(promises);
  const elapsed = Date.now() - startTime;

  // Categorize results
  const successes = results.filter(r => r.status === 201);
  const conflicts = results.filter(r => r.status === 409);
  const errors = results.filter(r => r.status !== 201 && r.status !== 409);

  console.log('─── Results ────────────────────────────────────────');
  console.log(`  ✅ Successful (201):   ${successes.length}`);
  console.log(`  🔒 Conflict (409):     ${conflicts.length}`);
  console.log(`  ❌ Other errors:       ${errors.length}`);
  console.log(`  ⏱  Total time:         ${elapsed}ms`);
  console.log('────────────────────────────────────────────────────\n');

  if (errors.length > 0) {
    console.log('─── Error Details ──────────────────────────────────');
    errors.forEach(r => {
      console.log(`  Request #${r.index}: HTTP ${r.status} — ${JSON.stringify(r.body.error || r.body)}`);
    });
    console.log('');
  }

  // Verdict
  if (successes.length === 1 && conflicts.length === CONCURRENCY - 1) {
    console.log('🎉 PASS — Exactly 1 reservation succeeded, all others correctly rejected.');
    console.log('   Atomic booking (RPC row locking) is working as expected.\n');
  } else if (successes.length === 0) {
    console.log('⚠️  No reservations succeeded. Possible causes:');
    console.log('   - Restaurant slug is incorrect');
    console.log('   - No available tables for the chosen date/time');
    console.log('   - Backend is not running\n');
  } else if (successes.length > 1) {
    console.log(`🚨 FAIL — ${successes.length} reservations succeeded (expected exactly 1).`);
    console.log('   This indicates a potential double-booking vulnerability!\n');
  } else {
    console.log('⚠️  Unexpected result distribution. Review error details above.\n');
  }
}

runLoadTest().catch(console.error);
