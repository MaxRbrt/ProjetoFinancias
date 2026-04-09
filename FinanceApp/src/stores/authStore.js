// ============================================================
// ARQUIVO: stores/authStore.js
// Armazena globalmente o estado de autenticação do usuário
// ============================================================

import { defineStore } from 'pinia'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    authIsReady: false
  }),

  actions: {
    // Mantém o usuário sincronizado com o retorno do Firebase Auth.
    setUser(user) {
      this.user = user
    },

    // Marca que o ciclo inicial de autenticação já foi resolvido.
    setAuthReady() {
      this.authIsReady = true
    },

    // Faz logout no Firebase e limpa o estado local.
    async logout() {
      await signOut(auth)
      this.user = null
    }
  }
})
