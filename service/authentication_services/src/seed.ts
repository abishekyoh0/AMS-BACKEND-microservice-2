/**
 * ─────────────────────────────────────────────────────────────
 *  AMS — Super Admin Seed Script
 *  File: service/authentication_services/src/seed.ts
 * ─────────────────────────────────────────────────────────────
 *  Run:  npx ts-node -r tsconfig-paths/register src/seed.ts
 *  Or add to package.json scripts and run: npm run seed
 * ─────────────────────────────────────────────────────────────
 */

import mongoose from 'mongoose';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from auth service root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Config (edit these if needed) ────────────────────────────
const MONGO_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/ams_auth';

const SUPER_ADMIN = {
  full_name: 'Super Admin',
  email:     'superadmin@ams.com',
  mobile:    '9000000000',
  password:  'SuperAdmin@1234',   // ← change this before production
};
// ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n🌱  AMS Super Admin Seed');
  console.log('────────────────────────────────────');

  // Connect
  await mongoose.connect(MONGO_URI);
  console.log(`✅  Connected to MongoDB: ${MONGO_URI}`);

  const users = mongoose.connection.collection('users');

  // Check if super_admin already exists
  const existing = await users.findOne({ role: 'super_admin' });

  if (existing) {
    console.log('\n⚠️   Super Admin already exists — skipping insert.');
    console.log(`    Email : ${existing.email}`);
    console.log(`    Status: ${existing.status}`);
    console.log('\n    To reset, delete the user in MongoDB and re-run.\n');
    await mongoose.disconnect();
    return;
  }

  // Hash password (same salt rounds as bcrypt in user.schema.ts)
  const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);

  const now = new Date();

  await users.insertOne({
    full_name:         SUPER_ADMIN.full_name,
    email:             SUPER_ADMIN.email.toLowerCase(),
    mobile:            SUPER_ADMIN.mobile,
    password:          hashedPassword,
    role:              'super_admin',
    status:            'active',
    is_verified:       true,
    is_first_login:    false,
    profile_completed: true,
    created_by:        null,
    last_login:        null,
    otp:               null,
    otp_expires_at:    null,
    createdAt:         now,
    updatedAt:         now,
  });

  console.log('\n✅  Super Admin created successfully!\n');
  console.log('    ┌─────────────────────────────────────┐');
  console.log(`    │  Email    : ${SUPER_ADMIN.email.padEnd(25)}│`);
  console.log(`    │  Password : ${SUPER_ADMIN.password.padEnd(25)}│`);
  console.log(`    │  Role     : super_admin              │`);
  console.log('    └─────────────────────────────────────┘');
  console.log('\n    Login at: POST /api/auth/login/admin\n');

  await mongoose.disconnect();
  console.log('🔌  Disconnected. Seed complete.\n');
}

seed().catch((err) => {
  console.error('\n❌  Seed failed:', err.message);
  mongoose.disconnect();
  process.exit(1);
});