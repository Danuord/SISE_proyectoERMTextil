import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { auth, db } from '../../config/firebase.js';
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";
import { authStore } from '../../store/authStore.js';

class AuthService {
  constructor() {
    this.currentUser = null;
  }

  async register(userData) {
    try {
      const { email, password, fullName, company, phone, newsletter } = userData;

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName
      });

      await setDoc(doc(db, 'usuario', user.uid), {
        uid: user.uid,
        email: email,
        displayName: fullName,
        company: company,
        phone: phone,
        newsletter: newsletter,
        role: 'employee',
        permissions: ['read'],
        createdAt: new Date(),
        status: 'active'
      });

      this.saveSession(user, { role: 'employee', permissions: ['read'] });

      return { success: true, user };
    } catch (error) {
      console.error('Error en registro:', error);
      return {
        success: false,
        error: this.handleAuthError(error.code)
      };
    }
  }

  async login(email, password) {
    try {
      console.log('🔐 AuthService.login() - Iniciando con:', email);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      console.log('✅ Usuario autenticado en Firebase Auth:', user.uid, user.email);

      // Obtener datos completos del usuario desde Firestore
      let userData = null;
      try {
        console.log('📦 Buscando datos en Firestore (colección: usuario)...');
        const userDoc = await getDoc(doc(db, 'usuario', user.uid));

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          console.log('✅ Datos encontrados en Firestore:', firestoreData);

          // Construir objeto de usuario completo
          userData = {
            uid: user.uid,
            email: user.email,
            nombre: firestoreData.nombre || '',
            apellido: firestoreData.apellido || '',
            displayName: firestoreData.nombre
              ? `${firestoreData.nombre} ${firestoreData.apellido || ''}`.trim()
              : user.displayName || user.email,
            rol: firestoreData.rol || 'Empleado',
            ...firestoreData
          };

          console.log('✅ Datos de usuario procesados:', userData);
        } else {
          console.warn('⚠️ No se encontró documento en Firestore, usando datos básicos');
          userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email,
            rol: 'Empleado'
          };
        }
      } catch (e) {
        console.error('❌ Error al obtener datos de Firestore:', e);
        userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email,
          rol: 'Empleado',
          role: 'Empleado'
        };
      }

      // Guardar sesión en localStorage
      console.log('💾 Guardando sesión en localStorage...');
      this.saveSession(user, userData);

      // Actualizar authStore
      authStore.setUser(user, userData.rol || 'Empleado', userData.permissions || []);

      console.log('✅✅✅ Login completado exitosamente');
      return { success: true, user, userData };
    } catch (error) {
      console.error('❌ Error en login - Código:', error.code);
      console.error('❌ Mensaje:', error.message);
      const errorMsg = this.handleAuthError(error.code);
      return {
        success: false,
        error: errorMsg
      };
    }
  }

  async logout() {
    try {
      await signOut(auth);
      authStore.logout();
      this.clearSession();
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error: error.message };
    }
  }

  onAuthStateChanged(callback) {
    return onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'usuario', user.uid));
        const userData = userDoc.data();
        this.currentUser = { ...user, ...userData };
        authStore.setUser(user, userData?.rol || userData?.role, userData?.permissions);
      } else {
        this.currentUser = null;
        authStore.logout();
      }
      callback(this.currentUser);
    });
  }

  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: this.handleAuthError(error.code)
      };
    }
  }

  getCurrentUser() {
    return this.currentUser || auth.currentUser;
  }

  isAuthenticated() {
    return !!auth.currentUser;
  }

  saveSession(user, userData) {
    const sessionData = {
      uid: user.uid,
      email: user.email,
      nombre: userData?.nombre || '',
      apellido: userData?.apellido || '',
      displayName: userData?.displayName || user.displayName || 'Usuario',
      rol: userData?.rol || 'Empleado',
      permissions: userData?.permissions || [],
      timestamp: Date.now()
    };
    console.log('💾 Guardando sesión completa:', sessionData);
    localStorage.setItem('textileflow_session', JSON.stringify(sessionData));
    console.log('✅ Sesión guardada en localStorage');
  }

  clearSession() {
    localStorage.removeItem('textileflow_session');
  }

  getSession() {
    const session = localStorage.getItem('textileflow_session');
    return session ? JSON.parse(session) : null;
  }

  handleAuthError(errorCode) {
    console.log('🔍 Analizando código de error:', errorCode, typeof errorCode);

    const errorMessages = {
      'auth/email-already-in-use': 'El email ya está registrado',
      'auth/invalid-email': 'Email inválido',
      'auth/weak-password': 'La contraseña es muy débil',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
      'auth/account-exists-with-different-credential': 'La cuenta existe con diferente método de inicio',
      'auth/operation-not-allowed': 'Operación no permitida',
      'auth/invalid-credential': 'Email o contraseña incorrectos'
    };

    const message = errorMessages[errorCode] || 'Error de autenticación';
    console.log('✓ Mensaje de error mapeado:', message);
    return message;
  }
}

export const authService = new AuthService();
export default authService;
