// ============================================================
// ARQUIVO: router/index.js
// Rotas da aplicação com proteção de acesso
// ============================================================

import { createRouter, createWebHashHistory } from 'vue-router'
import { auth } from '../firebase/config'

import LoginView      from '../views/LoginView.vue'
import DashboardView  from '../views/DashboardView.vue'
import TransacoesView from '../views/TransacoesView.vue'
import MetasView      from '../views/MetasView.vue'
import PerfilView     from '../views/PerfilView.vue'

const routes = [
  // Pública
  { path: '/login', component: LoginView },

  // Protegidas — só acessíveis com login
  { path: '/',           component: DashboardView,  meta: { requiresAuth: true } },
  { path: '/transacoes', component: TransacoesView, meta: { requiresAuth: true } },
  { path: '/metas',      component: MetasView,      meta: { requiresAuth: true } },
  { path: '/perfil',     component: PerfilView,     meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHashHistory(),

  routes
})

export default router

// Impede acesso às rotas protegidas quando não há usuário autenticado.
router.beforeEach((to, from, next) => {
  const requiresAuth    = to.matched.some(r => r.meta.requiresAuth)
  const isAuthenticated = auth.currentUser

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else {
    next()
  }
})
