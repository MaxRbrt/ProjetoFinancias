<script setup>
// ============================================================
// ARQUIVO: views/MetasView.vue
// Metas financeiras com progresso e depósitos
// ESTILOS: styles/views/MetasView.css
// ============================================================

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  collection, addDoc, onSnapshot, query,
  where, deleteDoc, updateDoc, doc
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'
import '../styles/views/MetasView.css'

// ── Estado ──
const metas       = ref([])
const transacoes  = ref([])

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

let unsubMetas       = null
let unsubTransacoes  = null

// Saldo disponível (receitas - despesas)
const saldoTotal = computed(() => {
  const r = transacoes.value.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
  const d = transacoes.value.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)
  return r - d
})

const formatarValor = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const progresso = (meta) => {
  if (!meta.valorMeta || meta.valorMeta === 0) return 0
  return Math.min((meta.valorAtual / meta.valorMeta) * 100, 100)
}

const corProgresso = (perc) => {
  if (perc >= 100) return '#00d68f'
  if (perc >= 60)  return '#f59e0b'
  return '#4f8eff'
}

// ── CREATE meta ──
const salvarMeta = async () => {
  errMeta.value = ''
  if (!nomeMeta.value || !valorMeta.value) {
    errMeta.value = 'Preencha nome e valor da meta.'
    return
  }
  if (Number(valorMeta.value) <= 0) {
    errMeta.value = 'O valor deve ser maior que zero.'
    return
  }
  await addDoc(collection(db, 'metas'), {
    nome:       nomeMeta.value,
    valorMeta:  Number(valorMeta.value),
    valorAtual: Number(valorAtual.value) || 0,
    userId:     auth.currentUser.uid,
    criadoEm:   new Date()
  })
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

const confirmarDeposito = async () => {
  erroDeposito.value = ''
  const v = Number(valorDeposito.value)
  if (!v || v <= 0) {
    erroDeposito.value = 'Digite um valor válido.'
    return
  }
  const novoValor = (metaSelecionada.value.valorAtual || 0) + v
  await updateDoc(doc(db, 'metas', metaSelecionada.value.id), {
    valorAtual: novoValor
  })
  modalDeposito.value = false
}

// ── DELETE meta ──
const excluirMeta = async (id) => {
  if (confirm('Deseja excluir esta meta?')) {
    await deleteDoc(doc(db, 'metas', id))
  }
}

const ouvirMetas = () => {
  const q = query(collection(db, 'metas'), where('userId', '==', auth.currentUser.uid))
  unsubMetas = onSnapshot(q, (snap) => {
    metas.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}

const ouvirTransacoes = () => {
  const q = query(collection(db, 'transacoes'), where('userId', '==', auth.currentUser.uid))
  unsubTransacoes = onSnapshot(q, (snap) => {
    transacoes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}

onMounted(() => {
  if (auth.currentUser) { ouvirMetas(); ouvirTransacoes() }
})
onBeforeUnmount(() => {
  if (unsubMetas) unsubMetas()
  if (unsubTransacoes) unsubTransacoes()
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
          <span class="muted">Acumulado: <strong style="color: var(--accent)">{{ formatarValor(meta.valorAtual) }}</strong></span>
          <span class="muted">Meta: <strong style="color: var(--text)">{{ formatarValor(meta.valorMeta) }}</strong></span>
          <span class="muted">Falta: <strong style="color: var(--danger)">{{ formatarValor(Math.max(meta.valorMeta - meta.valorAtual, 0)) }}</strong></span>
        </div>

        <!-- Alerta se meta não concluída -->
        <p v-if="progresso(meta) < 100" class="meta-alerta muted">
          💡 Deposite <strong>{{ formatarValor(meta.valorMeta - meta.valorAtual) }}</strong> para concluir esta meta
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