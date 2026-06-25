const admin = require('firebase-admin');
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 3) {
  console.error('Uso: node createUser.cjs <EMAIL> <PASSWORD> <ROLE> [DISPLAY_NAME]');
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
  credential: admin.credential.cert(serviceAccount),
});

(async () => {
  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, { role });

    const db = admin.firestore();
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
