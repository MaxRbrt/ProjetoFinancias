<script setup>
// ============================================================
// ARQUIVO: views/PerfilView.vue
// Perfil do usuário com foto, nome, celular e estatísticas
// ESTILOS: styles/views/PerfilView.css
// ============================================================

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile
} from 'firebase/auth'
import { doc, getDoc, updateDoc, collection, query, getDocs } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useAuthStore } from '../stores/authStore'
import { auth, db, storage } from '../firebase/config'
import '../styles/views/PerfilView.css'

const router    = useRouter()
const authStore = useAuthStore()

// ── Dados do usuário ──
const nome       = ref('')
const email      = computed(() => authStore.user?.email || '')
const celular    = ref('')
const fotoURL    = ref('')
const criadoEm   = ref('')

// ── Estatísticas ──
const totalTransacoes = ref(0)
const totalMetas      = ref(0)
const mesMembro       = ref('')

// ── Edição de nome ──
const editNome         = ref('')
const editandoNome     = ref(false)

// ── Edição de celular ──
const editCelular      = ref('')
const editandoCelular  = ref(false)
const erroCelular      = ref('')
const sucessoCelular   = ref(false)

// ── Edição de foto ──
const inputFoto        = ref(null)
const carregandoFoto   = ref(false)

// ── Edição de senha ──
const senhaAtual       = ref('')
const novaSenha        = ref('')
const confirmarSenha   = ref('')
const editandoSenha    = ref(false)
const erroSenha        = ref('')
const sucessoSenha     = ref(false)

// Iniciais do nome para avatar fallback
const iniciais = computed(() => {
  if (!nome.value) return email.value.charAt(0).toUpperCase()
  const partes = nome.value.trim().split(' ')
  if (partes.length === 1) return partes[0].charAt(0).toUpperCase()
  return (partes[0].charAt(0) + partes[partes.length - 1].charAt(0)).toUpperCase()
})

// Máscara de celular
const formatarCelular = (e) => {
  let v = e.target.value.replace(/\D/g, '')
  if (v.length <= 11) {
    v = v.replace(/^(\d{2})(\d)/, '($1) $2')
    v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2')
  }
  editCelular.value = v
}

// ── Busca dados do Firestore ──
const carregarDados = async () => {
  if (!authStore.user?.uid) {
    console.log('Usuário não autenticado, redirecionando...')
    router.push('/login')
    return
  }

  try {
    const userId = authStore.user.uid
    const snap = await getDoc(doc(db, 'usuarios', userId))

    if (snap.exists()) {
      const dados = snap.data()
      nome.value     = dados.nome  || ''
      celular.value  = dados.celular  || 'Não informado'
      fotoURL.value  = dados.fotoURL  || ''
      const data     = dados.criadoEm?.toDate?.() || new Date(dados.criadoEm)
      criadoEm.value = data.toLocaleDateString('pt-BR')
      mesMembro.value = data.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    } else {
      // Documento não existe, cria com dados básicos
      console.log('Documento do usuário não encontrado')
      nome.value = authStore.user.displayName || ''
      celular.value = 'Não informado'
    }

    // Conta transações (tratado silenciosamente se der erro)
    try {
      const transacoesSnap = await getDocs(collection(db, 'usuarios', userId, 'transacoes'))
      totalTransacoes.value = transacoesSnap.size
    } catch (err) {
      totalTransacoes.value = 0
    }

    // Conta metas (tratado silenciosamente se der erro)
    try {
      const metasSnap = await getDocs(collection(db, 'usuarios', userId, 'metas'))
      totalMetas.value = metasSnap.size
    } catch (err) {
      totalMetas.value = 0
    }

  } catch (e) {
    console.error('Erro ao carregar dados:', e)
    // Não redireciona, apenas mostra erro no console
  }
}

// ── Upload de foto ──
const selecionarFoto = () => {
  inputFoto.value?.click()
}

const uploadFoto = async (e) => {
  const arquivo = e.target.files?.[0]
  if (!arquivo) return

  if (!arquivo.type.startsWith('image/')) {
    alert('Por favor, selecione uma imagem.')
    return
  }

  if (arquivo.size > 2 * 1024 * 1024) {
    alert('A imagem deve ter no máximo 2MB.')
    return
  }

  carregandoFoto.value = true
  try {
    const fileRef = storageRef(storage, `fotos/${authStore.user.uid}`)
    await uploadBytes(fileRef, arquivo)
    const url = await getDownloadURL(fileRef)

    // Atualiza no Firestore
    await updateDoc(doc(db, 'usuarios', authStore.user.uid), { fotoURL: url })

    // Atualiza no Auth
    await updateProfile(auth.currentUser, { photoURL: url })

    fotoURL.value = url
  } catch (e) {
    console.error('Erro ao fazer upload:', e)
    alert('Erro ao enviar foto. Tente novamente.')
  } finally {
    carregandoFoto.value = false
  }
}

// ── Salvar nome ──
const iniciarEdicaoNome = () => {
  editNome.value = nome.value
  editandoNome.value = true
}

const salvarNome = async () => {
  if (!editNome.value.trim()) return

  try {
    await updateDoc(doc(db, 'usuarios', authStore.user.uid), {
      nome: editNome.value.trim()
    })
    nome.value = editNome.value.trim()
    editandoNome.value = false
  } catch (e) {
    console.error('Erro ao salvar nome:', e)
  }
}

// ── Salvar celular ──
const iniciarEdicaoCelular = () => {
  editCelular.value = celular.value === 'Não informado' ? '' : celular.value
  editandoCelular.value = true
  erroCelular.value = ''
}

const salvarCelular = async () => {
  erroCelular.value = ''
  sucessoCelular.value = false

  const limpo = editCelular.value.replace(/\D/g, '')
  if (limpo.length < 10) {
    erroCelular.value = 'Celular inválido. Use DDD + número.'
    return
  }

  await updateDoc(doc(db, 'usuarios', authStore.user.uid), {
    celular: editCelular.value
  })

  celular.value        = editCelular.value
  editandoCelular.value = false
  sucessoCelular.value  = true
  setTimeout(() => { sucessoCelular.value = false }, 3000)
}

// ── Salvar senha ──
const salvarSenha = async () => {
  erroSenha.value   = ''
  sucessoSenha.value = false

  if (!senhaAtual.value || !novaSenha.value || !confirmarSenha.value) {
    erroSenha.value = 'Preencha todos os campos.'
    return
  }
  if (novaSenha.value.length < 6) {
    erroSenha.value = 'A nova senha deve ter no mínimo 6 caracteres.'
    return
  }
  if (novaSenha.value !== confirmarSenha.value) {
    erroSenha.value = 'As senhas não coincidem.'
    return
  }

  try {
    const credencial = EmailAuthProvider.credential(email.value, senhaAtual.value)
    await reauthenticateWithCredential(auth.currentUser, credencial)
    await updatePassword(auth.currentUser, novaSenha.value)

    editandoSenha.value  = false
    sucessoSenha.value   = true
    senhaAtual.value     = ''
    novaSenha.value      = ''
    confirmarSenha.value = ''
    setTimeout(() => { sucessoSenha.value = false }, 3000)
  } catch (e) {
    if (e.code === 'auth/wrong-password') {
      erroSenha.value = 'Senha atual incorreta.'
    } else {
      erroSenha.value = 'Erro ao alterar senha. Tente novamente.'
    }
  }
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
      <p class="muted">Gerencie suas informações e preferências</p>
    </div>

    <!-- Card Principal com Avatar e Info -->
    <div class="perfil-card-principal">
      <div class="avatar-section">
        <div class="avatar-wrapper" @click="selecionarFoto">
          <img v-if="fotoURL" :src="fotoURL" alt="Foto de perfil" class="avatar-img" />
          <div v-else class="avatar-placeholder">
            <span class="avatar-letras">{{ iniciais }}</span>
          </div>
          <div class="avatar-overlay">
            <i class="fa-solid fa-camera"></i>
          </div>
          <div v-if="carregandoFoto" class="avatar-loading">
            <i class="fa-solid fa-spinner fa-spin"></i>
          </div>
        </div>
        <input
          ref="inputFoto"
          type="file"
          accept="image/*"
          @change="uploadFoto"
          style="display: none"
        />
        <button class="btn-foto" @click="selecionarFoto">
          <i class="fa-solid fa-camera"></i> Alterar foto
        </button>
      </div>

      <div class="info-section">
        <!-- Nome -->
        <div class="info-item">
          <div v-if="!editandoNome" class="info-display">
            <div>
              <span class="info-label">Nome</span>
              <span class="info-value">{{ nome || 'Adicione seu nome' }}</span>
            </div>
            <button class="btn-editar" @click="iniciarEdicaoNome">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
          <div v-else class="info-form">
            <label class="field">
              Nome
              <input v-model="editNome" type="text" placeholder="Seu nome" @keyup.enter="salvarNome" />
            </label>
            <div class="acoes-inline">
              <button @click="salvarNome" class="btn-salvar">
                <i class="fa-solid fa-check"></i> Salvar
              </button>
              <button @click="editandoNome = false" class="btn-cancelar">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
        </div>

        <!-- Email (não editável) -->
        <div class="info-item">
          <div class="info-display">
            <div>
              <span class="info-label">E-mail</span>
              <span class="info-value">{{ email }}</span>
            </div>
            <span class="badge-verificado"><i class="fa-solid fa-check-circle"></i> Verificado</span>
          </div>
        </div>

        <!-- Celular -->
        <div class="info-item">
          <div v-if="!editandoCelular" class="info-display">
            <div>
              <span class="info-label">Celular</span>
              <span class="info-value">{{ celular }}</span>
            </div>
            <button class="btn-editar" @click="iniciarEdicaoCelular">
              <i class="fa-solid fa-pen"></i>
            </button>
          </div>
          <div v-else class="info-form">
            <label class="field">
              Celular
              <input :value="editCelular" @input="formatarCelular" type="tel" placeholder="(11) 99999-9999" maxlength="15" />
            </label>
            <p v-if="erroCelular" class="error-text">
              <i class="fa-solid fa-triangle-exclamation"></i> {{ erroCelular }}
            </p>
            <div class="acoes-inline">
              <button @click="salvarCelular" class="btn-salvar">
                <i class="fa-solid fa-check"></i> Salvar
              </button>
              <button @click="editandoCelular = false" class="btn-cancelar">
                <i class="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>
          <p v-if="sucessoCelular" class="sucesso-msg">
            <i class="fa-solid fa-check-circle"></i> Celular atualizado!
          </p>
        </div>
      </div>
    </div>

    <!-- Estatísticas -->
    <div class="estatisticas-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <i class="fa-solid fa-receipt"></i>
        </div>
        <div class="stat-info">
          <span class="stat-valor">{{ totalTransacoes }}</span>
          <span class="stat-label">Transações</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon metas">
          <i class="fa-solid fa-bullseye"></i>
        </div>
        <div class="stat-info">
          <span class="stat-valor">{{ totalMetas }}</span>
          <span class="stat-label">Metas</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon membro">
          <i class="fa-solid fa-calendar-check"></i>
        </div>
        <div class="stat-info">
          <span class="stat-valor">{{ mesMembro || '...' }}</span>
          <span class="stat-label">Membro desde</span>
        </div>
      </div>
    </div>

    <!-- Segurança -->
    <div class="secao-seguranca">
      <h3><i class="fa-solid fa-shield-alt"></i> Segurança</h3>

      <div class="secao-content">
        <div class="info-item">
          <div v-if="!editandoSenha" class="info-display">
            <div>
              <span class="info-label">Senha</span>
              <span class="info-value">••••••••</span>
            </div>
            <button class="btn-editar" @click="editandoSenha = true">
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
              <input v-model="confirmarSenha" type="password" placeholder="Repita a nova senha" @keyup.enter="salvarSenha" />
            </label>
            <p v-if="erroSenha" class="error-text">
              <i class="fa-solid fa-triangle-exclamation"></i> {{ erroSenha }}
            </p>
            <div class="acoes-inline">
              <button @click="salvarSenha" class="btn-salvar">
                <i class="fa-solid fa-check"></i> Salvar senha
              </button>
              <button @click="editandoSenha = false" class="btn-cancelar">
                <i class="fa-solid fa-xmark"></i> Cancelar
              </button>
            </div>
          </div>

          <p v-if="sucessoSenha" class="sucesso-msg">
            <i class="fa-solid fa-check-circle"></i> Senha alterada com sucesso!
          </p>
        </div>
      </div>
    </div>

    <!-- Botão Sair -->
    <button class="btn-sair" @click="sair">
      <i class="fa-solid fa-right-from-bracket"></i> Sair da conta
    </button>

  </section>
</template>
