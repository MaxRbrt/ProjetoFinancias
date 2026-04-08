<script setup>
// ============================================================
// ARQUIVO: App.vue
// Componente raiz — topbar + RouterView
// Corrigido: menu não aparece durante fluxo de cadastro
// ============================================================

import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/authStore'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

// Só exibe o menu se estiver logado E fora da tela de login
const showMenu = computed(() =>
  !!authStore.user && route.path !== '/login'
)

const sair = async () => {
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="layout">

    <!-- Topbar só aparece quando logado e fora do login -->
    <header v-if="showMenu" class="topbar">
      <span class="logo">💰 FinanceApp</span>
      <nav class="menu">
        <RouterLink to="/">Dashboard</RouterLink>
        <RouterLink to="/transacoes">Transações</RouterLink>
        <RouterLink to="/metas">Metas</RouterLink>
        <RouterLink to="/perfil">Perfil</RouterLink>
        <button class="linklike" @click="sair">Sair</button>
      </nav>
    </header>

    <RouterView />

  </div>
</template>