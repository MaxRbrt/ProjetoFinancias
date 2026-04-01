<script setup>
// ============================================================
// ARQUIVO: views/LoginView.vue
// Login e Cadastro em telas separadas com transição suave
// ESTILOS: styles/views/LoginView.css
// ============================================================

import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth'
import { auth, db } from '../firebase/config'
import { doc, setDoc } from 'firebase/firestore'
import { useAuthStore } from '../stores/authStore'
import '../styles/views/LoginView.css'

const router = useRouter()
const authStore = useAuthStore()

// ── Estado da tela ──
const modo = ref('login') // 'login' | 'cadastro'

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

// Máscara celular
const formatarCelular = (e) => {
  let v = e.target.value.replace(/\D/g, '')
  if (v.length <= 11) {
    v = v.replace(/^(\d{2})(\d)/, '($1) $2')
    v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  }
  cadCelular.value = v
}

// ── LOGIN ──
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

// ── Ir para cadastro ──
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

// ── Continuar após sucesso ──
const continuarAposSucesso = () => {
  modalSucesso.value = false
  router.push('/')
}

// ── Voltar para login ──
const voltarParaLogin = () => {
  modo.value = 'login'
  cadErro.value = ''
  loginEmail.value = ''
  loginSenha.value = ''
  loginErro.value = ''
}

// ── CADASTRO ──
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
    console.log('1. Iniciando cadastro...')

    // Cria o usuário no Firebase Auth
    const cred = await createUserWithEmailAndPassword(auth, cadEmail.value, cadSenha.value)
    console.log('2. Usuário criado no Auth:', cred.user.uid)

    // MOSTRA O MODAL IMEDIATAMENTE (antes do Firestore)
    console.log('3. Abrindo modal de sucesso...')
    modalSucesso.value = true
    console.log('4. Modal aberto:', modalSucesso.value)

    // Atualiza o authStore
    authStore.setUser(cred.user)
    console.log('5. AuthStore atualizado')

    // Salva dados adicionais no Firestore (não bloqueia o modal)
    setDoc(doc(db, 'usuarios', cred.user.uid), {
      nome: cadNome.value,
      email: cadEmail.value,
      celular: cadCelular.value || '',
      fotoURL: '',
      criadoEm: new Date()
    }).then(() => {
      console.log('6. Dados salvos no Firestore')
    }).catch((firestoreError) => {
      console.error('6. Erro ao salvar no Firestore:', firestoreError)
    })

  } catch (e) {
    console.error('Erro no cadastro:', e)
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

// ── REDEFINIR SENHA ──
const abrirResetSenha = () => {
  resetEmail.value   = ''
  resetErro.value    = ''
  resetSucesso.value = false
  modalReset.value   = true
}

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

const fecharResetSenha = () => {
  modalReset.value   = false
  resetSucesso.value = false
  resetEmail.value   = ''
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-box">

      <!-- Logo -->
      <div class="login-logo">
        <span class="logo-icon">💰</span>
        <span class="logo-text">FinanceApp</span>
        <p class="login-sub">Controle financeiro inteligente</p>
      </div>

      <!-- ══════════════════════════════════════════════════════ -->
      <!-- TELA DE LOGIN -->
      <!-- ══════════════════════════════════════════════════════ -->
      <transition name="fade-slide" mode="out-in">
        <div v-if="modo === 'login'" key="login" class="login-form">

          <h2 class="form-titulo">Entrar na sua conta</h2>

          <label class="field">
            E-mail
            <input v-model="loginEmail" type="email" placeholder="seu@email.com" @keyup.enter="entrar" />
          </label>

          <label class="field">
            Senha
            <input v-model="loginSenha" type="password" placeholder="sua senha" @keyup.enter="entrar" />
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

        <!-- ══════════════════════════════════════════════════════ -->
        <!-- TELA DE CADASTRO -->
        <!-- ══════════════════════════════════════════════════════ -->
        <div v-else key="cadastro" class="login-form">

          <button class="btn-voltar" @click="voltarParaLogin">
            <i class="fa-solid fa-arrow-left"></i> Voltar para o login
          </button>

          <h2 class="form-titulo">Criar nova conta</h2>

          <label class="field">
            Nome completo
            <input v-model="cadNome" type="text" placeholder="Seu nome" />
          </label>

          <label class="field">
            E-mail
            <input v-model="cadEmail" type="email" placeholder="seu@email.com" />
          </label>

          <label class="field">
            Celular (opcional)
            <input
              :value="cadCelular"
              @input="formatarCelular"
              type="tel"
              placeholder="(11) 99999-9999"
              maxlength="15"
            />
          </label>

          <label class="field">
            Senha
            <input v-model="cadSenha" type="password" placeholder="mínimo 6 caracteres" />
          </label>

          <label class="field">
            Confirmar senha
            <input v-model="cadConfirma" type="password" placeholder="repita a senha" @keyup.enter="registrar" />
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

  <!-- ══════════════════════════════════════════════════════════ -->
  <!-- MODAL SUCESSO -->
  <!-- ══════════════════════════════════════════════════════════ -->
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

  <!-- ══════════════════════════════════════════════════════════ -->
  <!-- MODAL RESET SENHA -->
  <!-- ══════════════════════════════════════════════════════════ -->
  <transition name="fade">
    <div v-if="modalReset" class="modal-sucesso-overlay">
      <div class="modal-sucesso-card" style="max-width: 420px">

        <!-- Antes de enviar -->
        <template v-if="!resetSucesso">
          <div class="sucesso-icone">🔑</div>
          <h2>Redefinir Senha</h2>
          <p class="sucesso-sub" style="margin-bottom: 20px">
            Digite seu e-mail para receber o link de redefinição.
          </p>

          <label class="field" style="text-align: left">
            E-mail
            <input
              v-model="resetEmail"
              type="email"
              placeholder="seu@email.com"
              @keyup.enter="enviarResetSenha"
            />
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

        <!-- Depois de enviar -->
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