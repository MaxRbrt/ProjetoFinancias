// ============================================================
// ARQUIVO: main.js
// Ponto de entrada da aplicação
// ============================================================

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { onAuthStateChanged } from 'firebase/auth'
import App from './App.vue'
import router from './router'
import { auth } from './firebase/config'
import { useAuthStore } from './stores/authStore'
import './style.css'

const pinia = createPinia()
let app

// Aguarda a primeira resposta do Firebase Auth antes de montar a aplicação.
// Isso evita renderização temporária em estado incorreto.
onAuthStateChanged(auth, (user) => {
  const authStore = useAuthStore(pinia)
  authStore.setUser(user)
  authStore.setAuthReady()

  if (!app) {
    app = createApp(App)
    app.use(pinia)
    app.use(router)
    app.mount('#app')
  }
})
