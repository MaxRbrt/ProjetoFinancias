<script setup>
// ============================================================
// ARQUIVO: views/PerfilView.vue
// Perfil SIMPLES e RÁPIDO - Auth + localStorage (sem Firestore)
// ============================================================

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { useAuthStore } from '../stores/authStore'
import '../styles/views/PerfilView.css'
import {
  readUserJson,
  readUserValue,
  writeUserValue
} from '../utils/appData'

const router = useRouter()
const authStore = useAuthStore()

// ── Dados do usuário ──
const nome = ref('')
const email = computed(() => authStore.user?.email || '')
const celular = ref('')
const fotoURL = ref('')
const membroDesde = ref('')

// ── Estatísticas ──
const totalTransacoes = ref(0)
const totalMetas = ref(0)

// ── Edição ──
const editandoNome = ref(false)
const editandoCelular = ref(false)
const editandoSenha = ref(false)
const salvandoNome = ref(false)
const salvandoCelular = ref(false)
const salvandoSenha = ref(false)
const uploadandoFoto = ref(false)

// ── Campos de edição ──
const editNome = ref('')
const editCelular = ref('')
const senhaAtual = ref('')
const novaSenha = ref('')
const confirmaSenha = ref('')

// ── Mensagens ──
const msgSucesso = ref('')
const msgErro = ref('')

// Gera as iniciais exibidas no avatar quando não há foto.
const iniciais = computed(() => {
  if (nome.value) {
    const partes = nome.value.trim().split(' ')
    if (partes.length === 1) return partes[0].charAt(0).toUpperCase()
    return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase()
  }
  return email.value ? email.value.charAt(0).toUpperCase() : '?'
})

// Carrega informações do usuário e estatísticas simples salvas localmente.
const carregarDados = () => {
  if (!authStore.user) {
    router.push('/login')
    return
  }

  // Nome vem do Auth
  nome.value = authStore.user.displayName || ''

  // Foto vem do localStorage
  fotoURL.value = readUserValue(authStore.user.uid, 'foto', '')

  // Celular vem do localStorage
  celular.value = readUserValue(authStore.user.uid, 'celular', 'Não informado')

  // Data de cadastro do localStorage
  membroDesde.value = readUserValue(authStore.user.uid, 'criadoEm', '')

  // Contagem de transações/metas do localStorage
  try {
    const transacoesArray = readUserJson(authStore.user.uid, 'transacoes', [])
    totalTransacoes.value = Array.isArray(transacoesArray) ? transacoesArray.length : 0
  } catch (e) {
    totalTransacoes.value = 0
  }

  try {
    const metasArray = readUserJson(authStore.user.uid, 'metas', [])
    totalMetas.value = Array.isArray(metasArray) ? metasArray.length : 0
  } catch (e) {
    totalMetas.value = 0
  }
}

// Permite selecionar uma foto e armazená-la localmente em base64.
const selecionarFoto = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      msgErro.value = 'A imagem deve ter no máximo 2MB'
      setTimeout(() => msgErro.value = '', 3000)
      return
    }

    uploadandoFoto.value = true

    try {
      // Converter para base64
      const reader = new FileReader()
      reader.onload = async (event) => {
        const base64 = event.target.result

        // Salvar no localStorage
        writeUserValue(authStore.user.uid, 'foto', base64)

        // Atualizar estado local
        fotoURL.value = base64
        uploadandoFoto.value = false
        mostrarSucesso('Foto atualizada!')
      }
      reader.readAsDataURL(file)

    } catch (error) {
      console.error('Erro ao processar foto:', error)
      msgErro.value = 'Erro ao processar foto. Tente novamente.'
      setTimeout(() => msgErro.value = '', 3000)
      uploadandoFoto.value = false
    }
  }
  input.click()
}

// Formata o celular digitado no padrão brasileiro.
const formatarCelular = (e) => {
  let v = e.target.value.replace(/\D/g, '')
  if (v.length <= 11) {
    v = v.replace(/^(\d{2})(\d)/, '($1) $2')
    v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  }
  editCelular.value = v
}

// Atualiza o nome do usuário no Firebase Auth e no estado local.
const salvarNome = async () => {
  if (!editNome.value.trim()) {
    msgErro.value = 'O nome não pode estar vazio'
    setTimeout(() => msgErro.value = '', 3000)
    return
  }

  salvandoNome.value = true

  try {
    // Atualizar no Auth
    await updateProfile(auth.currentUser, { displayName: editNome.value.trim() })

    // Atualizar estado local
    nome.value = editNome.value.trim()
    editandoNome.value = false
    mostrarSucesso('Nome atualizado!')

  } catch (error) {
    console.error('Erro ao salvar nome:', error)
    msgErro.value = 'Erro ao salvar nome'
    setTimeout(() => msgErro.value = '', 3000)
  }

  salvandoNome.value = false
}

// Salva o celular apenas no armazenamento local do usuário.
const salvarCelular = () => {
  const limpo = editCelular.value.replace(/\D/g, '')
  if (limpo.length > 0 && limpo.length < 10) {
    msgErro.value = 'Celular inválido'
    setTimeout(() => msgErro.value = '', 3000)
    return
  }

  // Salvar no localStorage
  writeUserValue(authStore.user.uid, 'celular', editCelular.value || 'Não informado')

  celular.value = editCelular.value || 'Não informado'
  editandoCelular.value = false
  mostrarSucesso('Celular atualizado!')
}

// Reautentica o usuário antes de alterar a senha.
const salvarSenha = async () => {
  msgErro.value = ''

  if (!senhaAtual.value || !novaSenha.value || !confirmaSenha.value) {
    msgErro.value = 'Preencha todos os campos'
    setTimeout(() => msgErro.value = '', 3000)
    return
  }

  if (novaSenha.value.length < 6) {
    msgErro.value = 'A senha deve ter no mínimo 6 caracteres'
    setTimeout(() => msgErro.value = '', 3000)
    return
  }

  if (novaSenha.value !== confirmaSenha.value) {
    msgErro.value = 'As senhas não coincidem'
    setTimeout(() => msgErro.value = '', 3000)
    return
  }

  salvandoSenha.value = true

  try {
    const credencial = EmailAuthProvider.credential(email.value, senhaAtual.value)
    await reauthenticateWithCredential(auth.currentUser, credencial)
    await updatePassword(auth.currentUser, novaSenha.value)

    editandoSenha.value = false
    senhaAtual.value = ''
    novaSenha.value = ''
    confirmaSenha.value = ''
    mostrarSucesso('Senha alterada!')

  } catch (error) {
    if (error.code === 'auth/wrong-password') {
      msgErro.value = 'Senha atual incorreta'
    } else {
      msgErro.value = 'Erro ao alterar senha'
    }
    setTimeout(() => msgErro.value = '', 3000)
  }

  salvandoSenha.value = false
}

// Exibe mensagens breves de sucesso para feedback visual.
const mostrarSucesso = (msg) => {
  msgSucesso.value = msg
  setTimeout(() => msgSucesso.value = '', 3000)
}

// Prepara os campos de edição sem persistir nada ainda.
const iniciarEdicaoNome = () => {
  editNome.value = nome.value
  editandoNome.value = true
  msgErro.value = ''
}

const iniciarEdicaoCelular = () => {
  editCelular.value = celular.value === 'Não informado' ? '' : celular.value
  editandoCelular.value = true
  msgErro.value = ''
}

// ── Logout ──
const sair = async () => {
  await authStore.logout()
  router.push('/login')
}

onMounted(carregarDados)
</script>

<template>
  <section class="card perfil-container">

    <!-- Header -->
    <div class="perfil-header">
      <h1><i class="fa-solid fa-user-circle"></i> Meu Perfil</h1>
      <p class="muted">Gerencie suas informações pessoais</p>
    </div>

    <!-- Mensagem de sucesso -->
    <div v-if="msgSucesso" class="sucesso-msg">
      <i class="fa-solid fa-check-circle"></i> {{ msgSucesso }}
    </div>

    <!-- Mensagem de erro -->
    <div v-if="msgErro" class="error-msg">
      <i class="fa-solid fa-triangle-exclamation"></i> {{ msgErro }}
    </div>

    <!-- Card Principal: Avatar + Info -->
    <div class="perfil-card-main">
      <!-- Avatar -->
      <div class="avatar-section">
        <div class="avatar-wrapper" @click="selecionarFoto" :title="uploadandoFoto ? 'Enviando...' : 'Clique para trocar foto'">
          <img v-if="fotoURL" :src="fotoURL" alt="Foto de perfil" class="avatar-img" />
          <div v-else class="avatar-placeholder">
            <span class="avatar-letras">{{ iniciais }}</span>
          </div>
          <!-- Overlay hover -->
          <div class="avatar-overlay">
            <i class="fa-solid fa-camera"></i>
          </div>
          <!-- Loading spinner -->
          <div v-if="uploadandoFoto" class="avatar-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
          </div>
        </div>
        <button class="btn-foto" @click="selecionarFoto" :disabled="uploadandoFoto">
          <i class="fa-solid fa-camera"></i>
          {{ uploadandoFoto ? 'Enviando...' : 'Trocar foto' }}
        </button>
      </div>

      <!-- Informações -->
      <div class="info-section">
        <!-- Nome -->
        <div class="info-item">
          <div v-if="!editandoNome" class="info-display">
            <div class="info-content">
              <span class="info-label">Nome completo</span>
              <span class="info-value">{{ nome || 'Sem nome' }}</span>
            </div>
            <button class="btn-editar" @click="iniciarEdicaoNome" title="Editar nome">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
          <div v-else class="info-form">
            <label class="field">
              Nome completo
              <input v-model="editNome" type="text" placeholder="Seu nome" @keyup.enter="salvarNome" />
            </label>
            <div class="acoes-inline">
              <button @click="salvarNome" class="btn-salvar" :disabled="salvandoNome">
                <i class="fa-solid fa-check"></i>
                {{ salvandoNome ? 'Salvando...' : 'Salvar' }}
              </button>
              <button @click="editandoNome = false" class="btn-cancelar" :disabled="salvandoNome">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Email -->
        <div class="info-item">
          <div class="info-display">
            <div class="info-content">
              <span class="info-label">E-mail</span>
              <span class="info-value">{{ email }}</span>
            </div>
            <span class="badge-verificado">
              <i class="fa-solid fa-check-circle"></i> Verificado
            </span>
          </div>
        </div>

        <!-- Celular -->
        <div class="info-item">
          <div v-if="!editandoCelular" class="info-display">
            <div class="info-content">
              <span class="info-label">Celular</span>
              <span class="info-value">{{ celular }}</span>
            </div>
            <button class="btn-editar" @click="iniciarEdicaoCelular" title="Editar celular">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
          <div v-else class="info-form">
            <label class="field">
              Celular
              <input :value="editCelular" @input="formatarCelular" type="tel" placeholder="(11) 99999-9999" maxlength="15" />
            </label>
            <div class="acoes-inline">
              <button @click="salvarCelular" class="btn-salvar" :disabled="salvandoCelular">
                <i class="fa-solid fa-check"></i>
                {{ salvandoCelular ? 'Salvando...' : 'Salvar' }}
              </button>
              <button @click="editandoCelular = false" class="btn-cancelar" :disabled="salvandoCelular">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Estatísticas -->
    <div class="estatisticas-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fa-solid fa-arrow-right-arrow-left"></i>
        </div>
        <div class="stat-info">
          <span class="stat-valor">{{ totalTransacoes }}</span>
          <span class="stat-label">Transações</span>
        </div>
      </div>
      <div class="stat-card metas">
        <div class="stat-icon">
          <i class="fa-solid fa-bullseye"></i>
        </div>
        <div class="stat-info">
          <span class="stat-valor">{{ totalMetas }}</span>
          <span class="stat-label">Metas</span>
        </div>
      </div>
      <div class="stat-card membro">
        <div class="stat-icon">
          <i class="fa-solid fa-calendar-check"></i>
        </div>
        <div class="stat-info">
          <span class="stat-valor">{{ membroDesde || '--' }}</span>
          <span class="stat-label">Membro desde</span>
        </div>
      </div>
    </div>

    <!-- Segurança -->
    <div class="secao-seguranca">
      <h3><i class="fa-solid fa-shield-halved"></i> Segurança</h3>

      <div class="secao-content">
        <div class="info-item">
          <div v-if="!editandoSenha" class="info-display">
            <div class="info-content">
              <span class="info-label">Senha</span>
              <span class="info-value">••••••••</span>
            </div>
            <button class="btn-editar btn-alterar" @click="editandoSenha = true">
              <i class="fa-solid fa-pen"></i> Alterar
            </button>
          </div>

          <div v-else class="senha-form">
            <label class="field">
              Senha atual
              <input v-model="senhaAtual" type="password" placeholder="Sua senha atual" />
            </label>
            <label class="field">
              Nova senha
              <input v-model="novaSenha" type="password" placeholder="Mínimo 6 caracteres" />
            </label>
            <label class="field">
              Confirmar nova senha
              <input v-model="confirmaSenha" type="password" placeholder="Repita a nova senha" @keyup.enter="salvarSenha" />
            </label>
            <div class="acoes-inline">
              <button @click="salvarSenha" class="btn-salvar" :disabled="salvandoSenha">
                <i class="fa-solid fa-check"></i>
                {{ salvandoSenha ? 'Salvando...' : 'Salvar senha' }}
              </button>
              <button @click="editandoSenha = false" class="btn-cancelar" :disabled="salvandoSenha">
                <i class="fa-solid fa-xmark"></i> Cancelar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Botão Sair -->
    <button class="btn-sair" @click="sair">
      <i class="fa-solid fa-right-from-bracket"></i> Sair da conta
    </button>

  </section>
</template>
