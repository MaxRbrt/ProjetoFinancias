// ============================================================
// ARQUIVO: firebase/config.js
// Inicializa a conexão com o Firebase
// ============================================================

import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyCPsSlVJi1pSpH5e71-qlqzgt6NqnCvtB4",
  authDomain: "controlefinancas-58381.firebaseapp.com",
  projectId: "controlefinancas-58381",
  storageBucket: "controlefinancas-58381.firebasestorage.app",
  messagingSenderId: "900973492551",
  appId: "1:900973492551:web:a3be9bc85314a78dcd7462"
};

// Inicializa o Firebase
const firebaseApp = initializeApp(firebaseConfig)

// Exporta os serviços que vamos usar
export const auth = getAuth(firebaseApp)
export const db   = getFirestore(firebaseApp)
export const storage = getStorage(firebaseApp)

// Habilita persistência offline para o Firestore
try {
  enableIndexedDbPersistence(db)
} catch (err) {
  if (err.code === 'failed-precondition') {
    console.log('Persistência já habilitada em outra aba')
  } else if (err.code === 'unimplemented') {
    console.log('Browser não suporta persistência offline')
  }
}