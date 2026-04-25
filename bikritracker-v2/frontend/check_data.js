const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function checkData() {
  try {
    // Get all users
    const usersSnap = await db.collection('users').limit(1).get();
    if (usersSnap.empty) {
      console.log('No users found');
      process.exit(0);
    }
    
    const uid = usersSnap.docs[0].id;
    console.log('Checking UID:', uid);
    
    const productsSnap = await db.collection('users').doc(uid).collection('products').limit(3).get();
    
    productsSnap.forEach(doc => {
      const data = doc.data();
      console.log(`\nProduct: ${data.name}`);
      console.log(`Price: ${data.price}`);
      if (data.history && data.history.length > 0) {
        console.log('First 2 history items:');
        console.log(data.history.slice(0, 2));
      } else {
        console.log('No history found');
      }
    });
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
