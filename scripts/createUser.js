/**
 * Usage:
 * 1. Place a service account JSON at ./scripts/serviceAccountKey.json
 * 2. Run: npm run create-user -- <EMAIL> <PASSWORD> <ROLE> [DISPLAY_NAME]
 * Example: npm run create-user -- administrador@sjl.com admin123 ADMIN "Administrador SJL"
 */
import admin from 'firebase-admin';
import fs from 'fs';

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Uso: node createUser.js <EMAIL> <PASSWORD> <ROLE> [DISPLAY_NAME]');
  process.exit(1);
}

const [email, password, role, ...rest] = args;
const displayName = rest.join(' ') || '';

const serviceAccountPath = './scripts/serviceAccountKey.json';
if (!fs.existsSync(serviceAccountPath)) {
  console.error('Crea el archivo de credenciales de servicio en:', serviceAccountPath);
  process.exit(1);
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.cert(serviceAccount),
  // databaseURL: optionally add databaseURL if needed
});

(async () => {
  try {
    // create auth user
    const userRecord = await auth().createUser({
      email,
      password,
      displayName,
    });

    // set custom claims
    await auth().setCustomUserClaims(userRecord.uid, { role });

    // create Firestore user doc
    const db = firestore();
    await db.collection('users').doc(userRecord.uid).set({
      name: displayName,
      email,
      role,
      createdAt: new Date().toISOString(),
    });

    console.log(`Usuario creado: ${email} (uid=${userRecord.uid}) con role=${role}`);
    process.exit(0);
  } catch (err) {
    console.error('Error creando usuario:', err);
    process.exit(1);
  }
})();
