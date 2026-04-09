<script setup>
// Layout principal da aplicação: decide quando mostrar a sidebar
// e concentra a navegação das telas autenticadas.
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from './stores/authStore'

const router    = useRouter()
const route     = useRoute()
const authStore = useAuthStore()

// A sidebar só aparece para usuários logados fora da tela de login.
const showMenu = computed(() =>
  !!authStore.user && route.path !== '/login'
)

// Encerra a sessão e redireciona para o login.
const sair = async () => {
  await authStore.logout()
  router.push('/login')
}

// Links principais usados na navegação lateral.
const navLinks = [
  { to: '/',            icon: 'fa-chart-pie',     label: 'Dashboard'   },
  { to: '/transacoes',  icon: 'fa-arrow-right-arrow-left', label: 'Transações' },
  { to: '/metas',       icon: 'fa-piggy-bank',    label: 'Cofrinhos'   },
  { to: '/perfil',      icon: 'fa-user-circle',   label: 'Perfil'      },
]
</script>

<template>
  <div :class="showMenu ? 'app-layout' : 'app-plain'">

    <!-- ── SIDEBAR ── -->
    <aside v-if="showMenu" class="sidebar">
      <!-- Logo -->
      <div class="sidebar-logo">
        <div class="logo-mark">
          <i class="fa-solid fa-chart-line"></i>
        </div>
        <div class="logo-text">
          <span class="logo-name">Finance</span>
          <span class="logo-tag">App</span>
        </div>
      </div>

      <!-- Navigation -->
      <nav class="sidebar-nav">
        <span class="nav-section-label">Menu</span>
        <RouterLink
          v-for="link in navLinks"
          :key="link.to"
          :to="link.to"
          class="nav-link"
          exact-active-class="nav-link--active"
        >
          <span class="nav-icon">
            <i :class="`fa-solid ${link.icon}`"></i>
          </span>
          <span class="nav-label">{{ link.label }}</span>
          <span class="nav-indicator"></span>
        </RouterLink>
      </nav>

      <!-- User & Logout -->
      <div class="sidebar-footer">
        <div class="sidebar-user">
          <div class="user-avatar">
            {{ authStore.user?.email?.[0]?.toUpperCase() || 'U' }}
          </div>
          <div class="user-info">
            <span class="user-email">{{ authStore.user?.email?.split('@')[0] }}</span>
            <span class="user-status">
              <span class="status-dot"></span>
              Online
            </span>
          </div>
        </div>
        <button class="btn-logout" @click="sair" title="Sair">
          <i class="fa-solid fa-arrow-right-from-bracket"></i>
        </button>
      </div>
    </aside>

    <!-- ── MAIN CONTENT ── -->
    <main :class="showMenu ? 'main-content' : ''">
      <RouterView />
    </main>

  </div>
</template>
