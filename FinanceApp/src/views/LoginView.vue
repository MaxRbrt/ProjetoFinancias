<script setup>
// ============================================================
// ARQUIVO: views/LoginView.vue
// Login e Cadastro - SIMPLES E RÁPIDO
// ============================================================

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuthStore } from '../stores/authStore'
import '../styles/views/LoginView.css'

const router = useRouter()
const authStore = useAuthStore()

// ── Estado da tela ──
const modo = ref('login')

// ── Campos Login ──
const loginEmail      = ref('')
const loginSenha      = ref('')
const loginErro       = ref('')
const loginCarregando = ref(false)

// ── Campos Cadastro ──
const cadNome       = ref('')
const cadEmail      = ref('')
const cadCelular    = ref('')
const cadSenha      = ref('')
const cadConfirma   = ref('')
const cadErro       = ref('')
const cadCarregando = ref(false)

// ── Modal sucesso ──
const modalSucesso = ref(false)

// ── Modal reset senha ──
const modalReset       = ref(false)
const resetEmail       = ref('')
const resetErro        = ref('')
const resetSucesso     = ref(false)
const resetCarregando  = ref(false)

// Aplica máscara simples no celular durante o cadastro.
const formatarCelular = (e) => {
  let v = e.target.value.replace(/\D/g, '')
  if (v.length <= 11) {
    v = v.replace(/^(\d{2})(\d)/, '($1) $2')
    v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  }
  cadCelular.value = v
}

// Faz login com Firebase Auth e redireciona para o dashboard.
const entrar = async () => {
  loginErro.value = ''
  if (!loginEmail.value || !loginSenha.value) {
    loginErro.value = 'Preencha e-mail e senha.'
    return
  }
  loginCarregando.value = true
  try {
    await signInWithEmailAndPassword(auth, loginEmail.value, loginSenha.value)
    router.push('/')
  } catch (e) {
    loginErro.value = 'E-mail ou senha incorretos.'
  } finally {
    loginCarregando.value = false
  }
}

// Troca a interface para o modo de cadastro limpando estados anteriores.
const irParaCadastro = () => {
  modo.value = 'cadastro'
  loginErro.value = ''
  cadNome.value = ''
  cadEmail.value = ''
  cadCelular.value = ''
  cadSenha.value = ''
  cadConfirma.value = ''
  cadErro.value = ''
}

// Fecha o modal de sucesso e segue para a área logada.
const continuarAposSucesso = () => {
  modalSucesso.value = false
  router.push('/')
}

// Retorna para o modo de login e reseta os campos principais.
const voltarParaLogin = () => {
  modo.value = 'login'
  cadErro.value = ''
  loginEmail.value = ''
  loginSenha.value = ''
  loginErro.value = ''
}

// Cria a conta, atualiza o perfil público e salva dados locais simples.
const registrar = async () => {
  cadErro.value = ''

  if (!cadNome.value || !cadEmail.value || !cadSenha.value || !cadConfirma.value) {
    cadErro.value = 'Preencha nome, e-mail, senha e confirmação.'
    return
  }

  if (cadNome.value.length < 2) {
    cadErro.value = 'O nome deve ter pelo menos 2 caracteres.'
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cadEmail.value)) {
    cadErro.value = 'E-mail inválido.'
    return
  }

  if (cadSenha.value.length < 6) {
    cadErro.value = 'A senha deve ter no mínimo 6 caracteres.'
    return
  }

  if (cadSenha.value !== cadConfirma.value) {
    cadErro.value = 'As senhas não coincidem.'
    return
  }

  cadCarregando.value = true
  cadErro.value = ''

  try {
    // Cria o usuário no Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, cadEmail.value, cadSenha.value)

    // Salva o nome no perfil do Auth (instantâneo!)
    await updateProfile(cred.user, { displayName: cadNome.value })

    // Salva celular no localStorage (simples e rápido!)
    localStorage.setItem(`user_${cred.user.uid}_celular`, cadCelular.value || '')

    // Salva data de criação no localStorage
    const dataCriacao = new Date().toLocaleDateString('pt-BR')
    localStorage.setItem(`user_${cred.user.uid}_criadoEm`, dataCriacao)

    // Atualiza o authStore
    authStore.setUser(cred.user)

    // Mostra modal de sucesso
    modalSucesso.value = true

  } catch (e) {
    if (e.code === 'auth/email-already-in-use') {
      cadErro.value = 'Este e-mail já está em uso.'
    } else if (e.code === 'auth/invalid-email') {
      cadErro.value = 'E-mail inválido.'
    } else if (e.code === 'auth/weak-password') {
      cadErro.value = 'Senha muito fraca. Use no mínimo 6 caracteres.'
    } else {
      cadErro.value = 'Erro ao criar conta: ' + (e.message || 'Tente novamente.')
    }
  } finally {
    cadCarregando.value = false
  }
}

// Prepara o modal de recuperação de senha.
const abrirResetSenha = () => {
  resetEmail.value   = ''
  resetErro.value    = ''
  resetSucesso.value = false
  modalReset.value   = true
}

// Dispara o e-mail de redefinição usando o Firebase Auth.
const enviarResetSenha = async () => {
  resetErro.value = ''
  if (!resetEmail.value) {
    resetErro.value = 'Digite seu e-mail.'
    return
  }
  resetCarregando.value = true
  try {
    await sendPasswordResetEmail(auth, resetEmail.value)
    resetSucesso.value = true
  } catch (e) {
    resetErro.value = 'E-mail não encontrado ou inválido.'
  } finally {
    resetCarregando.value = false
  }
}

// Fecha e limpa o modal de redefinição.
const fecharResetSenha = () => {
  modalReset.value   = false
  resetSucesso.value = false
  resetEmail.value   = ''
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-box">
      <div class="login-badge">
        <i class="fa-solid fa-shield-halved"></i>
        Ambiente seguro
      </div>

      <!-- Logo -->
      <div class="login-logo">
        <span class="logo-icon">💰</span>
        <span class="logo-text">FinanceApp</span>
        <p class="login-sub">Controle financeiro inteligente</p>
      </div>

      <!-- TELA DE LOGIN -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="modo === 'login'" key="login" class="login-form">

          <h2 class="form-titulo">Entrar na sua conta</h2>

          <label class="field">
            E-mail
            <span class="input-shell">
              <i class="fa-regular fa-envelope input-icon"></i>
              <input v-model="loginEmail" type="email" placeholder="seu@email.com" @keyup.enter="entrar" />
            </span>
          </label>

          <label class="field">
            Senha
            <span class="input-shell">
              <i class="fa-solid fa-lock input-icon"></i>
              <input v-model="loginSenha" type="password" placeholder="sua senha" @keyup.enter="entrar" />
            </span>
          </label>

          <p v-if="loginErro" class="error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ loginErro }}
          </p>

          <button class="btn-full" @click="entrar" :disabled="loginCarregando">
            <i class="fa-solid fa-arrow-right-to-bracket"></i>
            {{ loginCarregando ? 'Entrando...' : 'Entrar' }}
          </button>

          <p class="login-switch">
            Não tem conta? <span @click="irParaCadastro">Criar uma</span>
          </p>

          <p class="login-esqueceu">
            <span @click="abrirResetSenha">Esqueceu a senha?</span>
          </p>

        </div>

        <!-- TELA DE CADASTRO -->
        <div v-else key="cadastro" class="login-form">

          <button class="btn-voltar" @click="voltarParaLogin">
            <i class="fa-solid fa-arrow-left"></i> Voltar para o login
          </button>

          <h2 class="form-titulo">Criar nova conta</h2>

          <label class="field">
            Nome completo
            <span class="input-shell">
              <i class="fa-regular fa-user input-icon"></i>
              <input v-model="cadNome" type="text" placeholder="Seu nome" />
            </span>
          </label>

          <label class="field">
            E-mail
            <span class="input-shell">
              <i class="fa-regular fa-envelope input-icon"></i>
              <input v-model="cadEmail" type="email" placeholder="seu@email.com" />
            </span>
          </label>

          <label class="field">
            Celular (opcional)
            <span class="input-shell">
              <i class="fa-solid fa-phone input-icon"></i>
              <input
                :value="cadCelular"
                @input="formatarCelular"
                type="tel"
                placeholder="(11) 99999-9999"
                maxlength="15"
              />
            </span>
          </label>

          <label class="field">
            Senha
            <span class="input-shell">
              <i class="fa-solid fa-lock input-icon"></i>
              <input v-model="cadSenha" type="password" placeholder="mínimo 6 caracteres" />
            </span>
          </label>

          <label class="field">
            Confirmar senha
            <span class="input-shell">
              <i class="fa-solid fa-shield-check input-icon"></i>
              <input v-model="cadConfirma" type="password" placeholder="repita a senha" @keyup.enter="registrar" />
            </span>
          </label>

          <div v-if="cadSenha" class="senha-forca">
            <div class="forca-barra" :class="{
              'forca-fraca':  cadSenha.length < 6,
              'forca-media':  cadSenha.length >= 6 && cadSenha.length < 10,
              'forca-forte':  cadSenha.length >= 10
            }"></div>
            <span class="forca-texto muted">
              {{ cadSenha.length < 6 ? 'Fraca' : cadSenha.length < 10 ? 'Média' : 'Forte' }}
            </span>
          </div>

          <p v-if="cadErro" class="error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ cadErro }}
          </p>

          <button class="btn-full" @click="registrar" :disabled="cadCarregando">
            <i class="fa-solid fa-user-plus"></i>
            {{ cadCarregando ? 'Criando conta...' : 'Criar conta' }}
          </button>

        </div>
      </transition>

    </div>
  </div>

  <!-- MODAL SUCESSO -->
  <transition name="fade">
    <div v-if="modalSucesso" class="modal-sucesso-overlay">
      <div class="modal-sucesso-card">
        <div class="sucesso-icone">🎉</div>
        <h2>Conta criada com sucesso!</h2>
        <p class="sucesso-mensagem">Bem-vindo ao FinanceApp</p>
        <p class="sucesso-sub">Sua conta está pronta para usar</p>
        <button class="btn-continuar" @click="continuarAposSucesso">
          <i class="fa-solid fa-arrow-right"></i> Entrar no app
        </button>
      </div>
    </div>
  </transition>

  <!-- MODAL RESET SENHA -->
  <transition name="fade">
    <div v-if="modalReset" class="modal-sucesso-overlay">
      <div class="modal-sucesso-card" style="max-width: 420px">

        <template v-if="!resetSucesso">
          <div class="sucesso-icone">🔑</div>
          <h2>Redefinir Senha</h2>
          <p class="sucesso-sub" style="margin-bottom: 20px">
            Digite seu e-mail para receber o link de redefinição.
          </p>

          <label class="field" style="text-align: left">
            E-mail
            <span class="input-shell">
              <i class="fa-regular fa-envelope input-icon"></i>
              <input
                v-model="resetEmail"
                type="email"
                placeholder="seu@email.com"
                @keyup.enter="enviarResetSenha"
              />
            </span>
          </label>

          <p v-if="resetErro" class="error">
            <i class="fa-solid fa-triangle-exclamation"></i> {{ resetErro }}
          </p>

          <div class="modal-actions" style="margin-top: 16px">
            <button @click="enviarResetSenha" :disabled="resetCarregando">
              <i class="fa-solid fa-paper-plane"></i>
              {{ resetCarregando ? 'Enviando...' : 'Enviar link' }}
            </button>
            <button class="secondary" @click="fecharResetSenha">
              <i class="fa-solid fa-xmark"></i> Cancelar
            </button>
          </div>
        </template>

        <template v-else>
          <div class="sucesso-icone">✅</div>
          <h2>E-mail Enviado!</h2>
          <p class="sucesso-mensagem">Verifique sua caixa de entrada</p>
          <p class="sucesso-sub" style="margin-bottom: 24px">
            Siga as instruções no e-mail para redefinir sua senha.
          </p>
          <button class="btn-continuar" @click="fecharResetSenha">
            <i class="fa-solid fa-check"></i> Ok, entendi
          </button>
        </template>

      </div>
    </div>
  </transition>
</template>
