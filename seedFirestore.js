import { readFileSync, readdirSync } from 'fs';
import { resolve } from 'path';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MOCK_STUDENTS, MOCK_STAFF, MOCK_DUES } from './src/data/mockDatabase.js';

/**
 * seedFirestore.js — Firebase Admin SDK Version
 * 
 * Runs with full admin privileges. Bypasses all Firestore Security Rules.
 * Safe to run even when Firestore rules block public writes.
 * 
 * PREREQUISITES:
 *   1. Download your service account key from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Place the downloaded .json file in this project root folder.
 * 
 * RUN COMMAND:
 *   node seedFirestore.js
 */

// ── Locate service account key file automatically ────────────────────────────
function findServiceAccountKey() {
  const files = readdirSync(process.cwd());
  const keyFile = files.find(
    f => f.endsWith('.json') && f.includes('firebase-adminsdk')
  );
  if (!keyFile) {
    console.error('\n❌ Service account key file not found!');
    console.error('   Download it from Firebase Console → Project Settings → Service Accounts');
    console.error('   Then place the .json file in this project root folder.\n');
    process.exit(1);
  }
  return resolve(process.cwd(), keyFile);
}

// ── Initialize Firebase Admin ────────────────────────────────────────────────
const keyPath = findServiceAccountKey();
console.log(`✅ Using service account key: ${keyPath.split('\\').pop()}`);

const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'));

const firebaseApp = initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore(firebaseApp);

// ── Seeding Logic ────────────────────────────────────────────────────────────
async function seed() {
  console.log('\n[Firebase Admin] Starting Secure Database Seeding...\n');

  // 1. Seed Student Profiles
  console.log('📚 Seeding student profiles...');
  for (const student of MOCK_STUDENTS) {
    const ref = db.collection('profiles').doc(student.id);
    await ref.set({
      role: 'student',
      name: student.name,
      email: student.email,
      phone: student.phone,
      matric_no: student.matricNo,
      department: student.department,
      faculty: student.faculty,
      level: student.level,
      created_at: new Date().toISOString(),
    });
    console.log(`  ✔ ${student.name} (${student.matricNo})`);
  }

  // 2. Seed Staff Profiles
  console.log('\n👨‍🏫 Seeding staff profiles...');
  for (const staff of MOCK_STAFF) {
    const ref = db.collection('profiles').doc(staff.id);
    await ref.set({
      role: 'staff',
      name: staff.name,
      title: staff.title,
      email: staff.email,
      phone: staff.phone,
      staff_id: staff.staffId,
      department: staff.department,
      faculty: staff.faculty,
      created_at: new Date().toISOString(),
    });
    console.log(`  ✔ ${staff.name} (${staff.staffId})`);
  }

  // 3. Seed Student Dues
  console.log('\n💰 Seeding student dues catalog...');
  for (const due of MOCK_DUES.student) {
    const ref = db.collection('dues').doc(due.id);
    await ref.set({
      name: due.name,
      amount: due.amount,
      category: due.category,
      description: due.description,
      deadline: due.deadline,
      role_target: 'student',
      created_at: new Date().toISOString(),
    });
    console.log(`  ✔ ${due.name}`);
  }

  // 4. Seed Staff Dues
  console.log('\n💼 Seeding staff dues catalog...');
  for (const due of MOCK_DUES.staff) {
    const ref = db.collection('dues').doc(due.id);
    await ref.set({
      name: due.name,
      amount: due.amount,
      category: due.category,
      description: due.description,
      deadline: due.deadline,
      role_target: 'staff',
      created_at: new Date().toISOString(),
    });
    console.log(`  ✔ ${due.name}`);
  }

  const total = MOCK_STUDENTS.length + MOCK_STAFF.length + MOCK_DUES.student.length + MOCK_DUES.staff.length;
  console.log(`\n✅ [Firebase Admin] Seeding complete! ${total} documents written to Firestore.\n`);
  process.exit(0);
}

seed().catch(err => {
  console.error('\n❌ [Firebase Admin] Seeding failed:', err.message, '\n');
  process.exit(1);
});
