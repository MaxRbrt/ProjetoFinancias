<script setup>
// ============================================================
// ARQUIVO: views/MetasView.vue
// Metas financeiras com progresso e depósitos
// Armazenamento: localStorage (instantâneo, sem Firestore)
// ============================================================

import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import '../styles/views/MetasView.css'

const authStore = useAuthStore()

// ── Estado ──
const metas      = ref([])
const transacoes = ref([])

// ── Formulário nova meta ──
const nomeMeta    = ref('')
const valorMeta   = ref('')
const valorAtual  = ref('')
const errMeta     = ref('')
const mostrarForm = ref(false)

// ── Modal depósito ──
const modalDeposito   = ref(false)
const metaSelecionada = ref(null)
const valorDeposito   = ref('')
const erroDeposito    = ref('')

// ── Chave do localStorage por usuário ──
const getStorageKey = (type) => `user_${authStore.user?.uid}_${type}`

// ── Carregar dados do localStorage ──
const carregarDados = () => {
  if (!authStore.user) return

  try {
    // Carregar metas
    const metasSalvas = localStorage.getItem(getStorageKey('metas'))
    if (metasSalvas) {
      const parsed = JSON.parse(metasSalvas)
      // Garantir que valores são números
      metas.value = parsed.map(m => ({
        ...m,
        valorMeta: Number(m.valorMeta) || 0,
        valorAtual: Number(m.valorAtual) || 0
      }))
    } else {
      metas.value = []
    }
  } catch (e) {
    console.error('Erro ao carregar metas:', e)
    metas.value = []
  }

  try {
    // Carregar transações (para calcular saldo)
    const transacoesSalvas = localStorage.getItem(getStorageKey('transacoes'))
    if (transacoesSalvas) {
      const parsed = JSON.parse(transacoesSalvas)
      transacoes.value = parsed.map(t => ({
        ...t,
        valor: Number(t.valor) || 0
      }))
    } else {
      transacoes.value = []
    }
  } catch (e) {
    console.error('Erro ao carregar transações:', e)
    transacoes.value = []
  }

  // Atualizar contagem para o perfil
  localStorage.setItem(getStorageKey('metas_count'), metas.value.length.toString())
}

// ── Salvar metas no localStorage ──
const salvarMetas = () => {
  localStorage.setItem(getStorageKey('metas'), JSON.stringify(metas.value))
  localStorage.setItem(getStorageKey('metas_count'), metas.value.length.toString())
}

// ── Gerar ID único ──
const gerarId = () => Date.now().toString(36) + Math.random().toString(36).substr(2)

// Saldo disponível (receitas - despesas)
const saldoTotal = computed(() => {
  const r = transacoes.value.filter(t => t.tipo === 'receita').reduce((a, t) => a + (Number(t.valor) || 0), 0)
  const d = transacoes.value.filter(t => t.tipo === 'despesa').reduce((a, t) => a + (Number(t.valor) || 0), 0)
  return r - d
})

const formatarValor = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const progresso = (meta) => {
  const vMeta = Number(meta.valorMeta) || 0
  const vAtual = Number(meta.valorAtual) || 0
  if (vMeta === 0) return 0
  return Math.min((vAtual / vMeta) * 100, 100)
}

const corProgresso = (perc) => {
  if (perc >= 100) return '#00d68f'
  if (perc >= 60)  return '#f59e0b'
  return '#4f8eff'
}

// ── CREATE meta ──
const salvarMeta = () => {
  errMeta.value = ''
  if (!nomeMeta.value || !valorMeta.value) {
    errMeta.value = 'Preencha nome e valor da meta.'
    return
  }
  if (Number(valorMeta.value) <= 0) {
    errMeta.value = 'O valor deve ser maior que zero.'
    return
  }

  metas.value.push({
    id: gerarId(),
    nome: nomeMeta.value,
    valorMeta: Number(valorMeta.value),
    valorAtual: Number(valorAtual.value) || 0,
    userId: authStore.user.uid,
    criadoEm: new Date().toISOString()
  })

  salvarMetas()

  nomeMeta.value    = ''
  valorMeta.value   = ''
  valorAtual.value  = ''
  mostrarForm.value = false
}

// ── Depositar na meta ──
const abrirDeposito = (meta) => {
  metaSelecionada.value = meta
  valorDeposito.value   = ''
  erroDeposito.value    = ''
  modalDeposito.value   = true
}

const confirmarDeposito = () => {
  erroDeposito.value = ''
  const v = Number(valorDeposito.value)
  if (!v || v <= 0) {
    erroDeposito.value = 'Digite um valor válido.'
    return
  }

  const index = metas.value.findIndex(m => m.id === metaSelecionada.value.id)
  if (index !== -1) {
    metas.value[index].valorAtual = (metas.value[index].valorAtual || 0) + v
    salvarMetas()
  }

  modalDeposito.value = false
}

// ── DELETE meta ──
const excluirMeta = (id) => {
  if (confirm('Deseja excluir esta meta?')) {
    metas.value = metas.value.filter(m => m.id !== id)
    salvarMetas()
  }
}

onMounted(() => {
  if (authStore.user) {
    carregarDados()
  }
})

// Recarregar quando o usuário mudar
watch(() => authStore.user, (newUser) => {
  if (newUser) {
    carregarDados()
  } else {
    metas.value = []
    transacoes.value = []
  }
})
</script>

<template>
  <section class="card">

    <div class="topo-header">
      <div>
        <h1><i class="fa-solid fa-bullseye"></i> Metas</h1>
        <p class="muted">Defina e acompanhe seus objetivos financeiros</p>
      </div>
      <button @click="mostrarForm = !mostrarForm">
        <i class="fa-solid fa-plus"></i>
        {{ mostrarForm ? 'Cancelar' : 'Nova meta' }}
      </button>
    </div>

    <!-- Saldo disponível -->
    <div class="saldo-info">
      <span class="muted">Seu saldo atual:</span>
      <span :class="saldoTotal >= 0 ? 'valor-receita' : 'valor-despesa'" class="saldo-valor">
        {{ formatarValor(saldoTotal) }}
      </span>
    </div>

    <!-- Formulário nova meta -->
    <div v-if="mostrarForm" class="form-meta">
      <h3>Nova Meta</h3>
      <div class="form-row-3">
        <label class="field">
          Nome da meta
          <input v-model="nomeMeta" placeholder="Ex: Viagem, Reserva..." />
        </label>
        <label class="field">
          Valor da meta (R$)
          <input v-model="valorMeta" type="number" step="0.01" min="0.01" placeholder="10.000,00" />
        </label>
        <label class="field">
          Valor inicial (R$)
          <input v-model="valorAtual" type="number" step="0.01" min="0" placeholder="0,00 (opcional)" />
        </label>
      </div>
      <p v-if="errMeta" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ errMeta }}</p>
      <button @click="salvarMeta"><i class="fa-solid fa-check"></i> Criar meta</button>
    </div>

    <h3>Minhas metas ({{ metas.length }})</h3>

    <!-- Lista de metas -->
    <div v-if="metas.length" class="metas-lista">
      <div v-for="meta in metas" :key="meta.id" class="meta-card">

        <div class="meta-header">
          <div>
            <span class="meta-nome">{{ meta.nome }}</span>
            <span v-if="progresso(meta) >= 100" class="badge-concluida">✅ Concluída!</span>
          </div>
          <button class="btn-icone danger" @click="excluirMeta(meta.id)" title="Excluir">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>

        <!-- Barra de progresso -->
        <div class="progresso-wrap">
          <div class="progresso-barra">
            <div
              class="progresso-fill"
              :style="{
                width: progresso(meta) + '%',
                background: corProgresso(progresso(meta))
              }"
            ></div>
          </div>
          <span class="progresso-perc">{{ progresso(meta).toFixed(0) }}%</span>
        </div>

        <div class="meta-valores">
          <span class="muted">Acumulado: <strong style="color: var(--accent)">{{ formatarValor(meta.valorAtual || 0) }}</strong></span>
          <span class="muted">Meta: <strong style="color: var(--text)">{{ formatarValor(meta.valorMeta || 0) }}</strong></span>
          <span class="muted">Falta: <strong style="color: var(--danger)">{{ formatarValor(Math.max((meta.valorMeta || 0) - (meta.valorAtual || 0), 0)) }}</strong></span>
        </div>

        <!-- Alerta se meta não concluída -->
        <p v-if="progresso(meta) < 100" class="meta-alerta muted">
          💡 Deposite <strong>{{ formatarValor((meta.valorMeta || 0) - (meta.valorAtual || 0)) }}</strong> para concluir esta meta
        </p>

        <button
          v-if="progresso(meta) < 100"
          class="secondary btn-depositar"
          @click="abrirDeposito(meta)"
        >
          <i class="fa-solid fa-plus"></i> Registrar depósito
        </button>

      </div>
    </div>

    <p v-else class="muted">Nenhuma meta criada ainda. Crie sua primeira meta acima!</p>

  </section>

  <!-- Modal depósito -->
  <div v-if="modalDeposito" class="modal-overlay" @click.self="modalDeposito = false">
    <section class="card modal">
      <h2><i class="fa-solid fa-piggy-bank"></i> Registrar Depósito</h2>
      <p class="muted">Meta: <strong style="color: var(--text)">{{ metaSelecionada?.nome }}</strong></p>
      <p class="muted" style="margin-bottom: 16px">
        Progresso atual: {{ formatarValor(metaSelecionada?.valorAtual) }} / {{ formatarValor(metaSelecionada?.valorMeta) }}
      </p>
      <label class="field">
        Valor do depósito (R$)
        <input v-model="valorDeposito" type="number" step="0.01" min="0.01" placeholder="0,00" @keyup.enter="confirmarDeposito" />
      </label>
      <p v-if="erroDeposito" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ erroDeposito }}</p>
      <div class="actions">
        <button @click="confirmarDeposito"><i class="fa-solid fa-check"></i> Confirmar</button>
        <button class="secondary" @click="modalDeposito = false"><i class="fa-solid fa-xmark"></i> Cancelar</button>
      </div>
    </section>
  </div>
</template>