/**
 * Usage:
 * 1. Place a service account JSON at ./scripts/serviceAccountKey.json
 * 2. Run: npm run set-admin-claim -- <UID> <ROLE>
 * Example: npm run set-admin-claim -- l4WS76QqZcdjgg1n3ovu6jsSy132 ADMIN
 */
import admin from 'firebase-admin';
import fs from 'fs';

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('Uso: node setAdminClaim.js <UID> <ROLE>');
  process.exit(1);
}
const [uid, role] = args;

const serviceAccountPath = './scripts/serviceAccountKey.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Crea el archivo de credenciales de servicio en:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.cert(serviceAccount),
});

(async () => {
  try {
    await admin.auth().setCustomUserClaims(uid, { role });

    const db = admin.firestore();
    const userRef = db.collection('users').doc(uid);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
      await userRef.update({ role });
    } else {
      await userRef.set({
        role,
        updatedAt: new Date().toISOString(),
      });
    }

    console.log(`Custom claim y rol Firestore actualizados para ${uid} => role=${role}`);
    process.exit(0);
  } catch (err) {
    console.error('Error estableciendo custom claim:', err);
    process.exit(1);
  }
})();
