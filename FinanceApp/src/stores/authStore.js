// ============================================================
// ARQUIVO: stores/authStore.js
// Armazena globalmente o estado de autenticação do usuário
// ============================================================

import { defineStore } from 'pinia'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase/config'

export const useAuthStore = defineStore('auth', {

  state: () => ({
    user: null,        // Dados do usuário logado (ou null)
    authIsReady: false // Firebase já verificou o estado?
  }),

  actions: {
    setUser(user) {
      this.user = user
    },
    setAuthReady() {
      this.authIsReady = true
    },
    async logout() {
      await signOut(auth)
      this.user = null
    }
  }
})