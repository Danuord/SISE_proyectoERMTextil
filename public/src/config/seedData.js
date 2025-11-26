import { auth, db } from './firebase.js';
import { createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js';
import { collection, doc, setDoc, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js';

const TEST_ACCOUNTS = [
  {
    email: 'admin@textileflow.com',
    password: 'Admin@123456',
    displayName: 'Admin TextileFlow',
    company: 'TextileFlow Inc.',
    phone: '+57 300 0000000',
    role: 'admin',
    permissions: ['read', 'write', 'delete', 'admin']
  },
  {
    email: 'manager@textileflow.com',
    password: 'Manager@123456',
    displayName: 'Juan Manager',
    company: 'TextileFlow Inc.',
    phone: '+57 300 1111111',
    role: 'manager',
    permissions: ['read', 'write', 'edit']
  },
  {
    email: 'empleado@textileflow.com',
    password: 'Empleado@123456',
    displayName: 'Carlos Empleado',
    company: 'TextileFlow Inc.',
    phone: '+57 300 2222222',
    role: 'employee',
    permissions: ['read']
  }
];

async function accountExists(email) {
  try {
    const q = query(collection(db, 'users'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.warn('Error verificando cuenta:', error);
    return false;
  }
}

async function createTestAccount(accountData) {
  try {
    console.log(`Verificando si ${accountData.email} existe...`);
    const exists = await accountExists(accountData.email);
    
    if (exists) {
      console.log(`✓ Cuenta ${accountData.email} ya existe`);
      return { success: true, exists: true };
    }

    console.log(`Creando usuario en Firebase Auth para ${accountData.email}...`);
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      accountData.email,
      accountData.password
    );

    const user = userCredential.user;
    console.log(`✓ Usuario creado en Auth: ${user.uid}`);

    console.log(`Creando documento en Firestore...`);
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: accountData.email,
      displayName: accountData.displayName,
      company: accountData.company,
      phone: accountData.phone,
      role: accountData.role,
      permissions: accountData.permissions,
      createdAt: new Date(),
      status: 'active',
      isTestAccount: true
    });

    console.log(`✓ Documento creado en Firestore para ${user.uid}`);
    console.log(`Cuenta creada completamente: ${accountData.email}`);
  
    console.log(`🚪 Logout después de crear cuenta...`);
    await signOut(auth);

    return { success: true, exists: false };
  } catch (error) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`✓ Cuenta ${accountData.email} ya existe en el emulador`);
      return { success: true, exists: true };
    }
    
    console.error(`Error creando cuenta ${accountData.email}:`, error.code, error.message);
    return { success: false, error: error.message, code: error.code };
  }
}

export async function initializeTestAccounts() {
  console.log('Inicializando cuentas de prueba...');
  
  try {
    for (const account of TEST_ACCOUNTS) {
      await createTestAccount(account);
    }
    
    console.log('Inicialización de cuentas completada');
    return { success: true };
  } catch (error) {
    console.error('Error en inicialización:', error);
    return { success: false, error };
  }
}

export function getTestAccountsInfo() {
  return TEST_ACCOUNTS.map(acc => ({
    email: acc.email,
    password: acc.password,
    role: acc.role
  }));
}
