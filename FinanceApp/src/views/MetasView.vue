<script setup>
// ============================================================
// ARQUIVO: views/MetasView.vue
// Cofrinhos financeiros com progresso e depósitos
// Armazenamento: localStorage (instantâneo, sem Firestore)
// ============================================================

import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import '../styles/views/MetasView.css'
import {
  DATA_CHANGE_EVENT,
  formatCurrencyBRL,
  generateId,
  notifyFinanceDataChanged,
  readUserJson,
  writeUserJson
} from '../utils/appData'

const authStore = useAuthStore()

// ── Estado ──
const metas      = ref([])
const transacoes = ref([])

// ── Formulário novo cofrinho ──
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

// ── Modal edição ──
const modalEdicao      = ref(false)
const editId           = ref('')
const editNomeMeta     = ref('')
const editValorMeta    = ref('')
const editValorAtual   = ref('')
const erroEdicao       = ref('')

// Carrega os cofrinhos e as transações do usuário para manter o saldo coerente.
const carregarDados = () => {
  if (!authStore.user) return

  try {
    // Carregar cofrinhos
    const metasSalvas = readUserJson(authStore.user.uid, 'metas', [])
    if (metasSalvas) {
      // Garantir que valores são números
      metas.value = metasSalvas.map(m => ({
        ...m,
        valorMeta: Number(m.valorMeta) || 0,
        valorAtual: Number(m.valorAtual) || 0
      }))
    } else {
      metas.value = []
    }
  } catch (e) {
    console.error('Erro ao carregar cofrinhos:', e)
    metas.value = []
  }

  try {
    // Carregar transações (para calcular saldo)
    const transacoesSalvas = readUserJson(authStore.user.uid, 'transacoes', [])
    if (transacoesSalvas) {
      transacoes.value = transacoesSalvas.map(t => ({
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

}

// Persiste os cofrinhos e avisa outras telas para recalcular indicadores.
const salvarMetas = () => {
  writeUserJson(authStore.user.uid, 'metas', metas.value)
  notifyFinanceDataChanged()
}

// Persiste movimentações geradas por aportes ou saldo inicial.
const salvarTransacoes = () => {
  writeUserJson(authStore.user.uid, 'transacoes', transacoes.value)
  notifyFinanceDataChanged()
}

// ── Gerar ID único ──
const gerarId = () => generateId()

// O saldo disponível considera o histórico real de receitas e despesas.
const saldoTotal = computed(() => {
  const r = transacoes.value.filter(t => t.tipo === 'receita').reduce((a, t) => a + (Number(t.valor) || 0), 0)
  const d = transacoes.value.filter(t => t.tipo === 'despesa').reduce((a, t) => a + (Number(t.valor) || 0), 0)
  return r - d
})

const totalGuardadoEmMetas = computed(() =>
  metas.value.reduce((a, m) => a + (Number(m.valorAtual) || 0), 0)
)

const saldoDisponivel = computed(() => saldoTotal.value)

const depositoAtual = computed(() => Number(valorDeposito.value) || 0)
const saldoAposDeposito = computed(() => saldoDisponivel.value - depositoAtual.value)
const depositoInsuficiente = computed(() =>
  depositoAtual.value > 0 && saldoAposDeposito.value < 0
)

const formatarValor = (v) => formatCurrencyBRL(v)

// Sempre que dinheiro entra em um cofrinho, também registramos uma despesa real.
const registrarMovimentacaoCofrinho = ({ descricao, valor, cofrinhoId }) => {
  transacoes.value.push({
    id: gerarId(),
    descricao,
    valor,
    tipo: 'despesa',
    categoria: 'Cofrinhos',
    metaId: cofrinhoId,
    userId: authStore.user.uid,
    criadoEm: new Date().toISOString()
  })
  salvarTransacoes()
}

// Calcula o progresso do cofrinho em relação ao objetivo definido.
const progresso = (meta) => {
  const vMeta = Number(meta.valorMeta) || 0
  const vAtual = Number(meta.valorAtual) || 0
  if (vMeta === 0) return 0
  return Math.min((vAtual / vMeta) * 100, 100)
}

// Ajusta a cor da barra de acordo com o estágio de conclusão.
const corProgresso = (perc) => {
  if (perc >= 100) return '#00d68f'
  if (perc >= 60)  return '#f59e0b'
  return '#4f8eff'
}

// Cria um novo cofrinho e, se houver saldo inicial, gera a despesa correspondente.
const salvarMeta = () => {
  errMeta.value = ''
  if (!nomeMeta.value || !valorMeta.value) {
    errMeta.value = 'Preencha nome e valor do cofrinho.'
    return
  }
  if (Number(valorMeta.value) <= 0) {
    errMeta.value = 'O valor deve ser maior que zero.'
    return
  }

  const valorInicial = Number(valorAtual.value) || 0
  if (valorInicial < 0) {
    errMeta.value = 'O valor inicial não pode ser negativo.'
    return
  }
  if (valorInicial > saldoDisponivel.value) {
    errMeta.value = `O valor inicial deixaria seu saldo negativo. Disponível: ${formatarValor(saldoDisponivel.value)}.`
    return
  }

  const novoCofrinho = {
    id: gerarId(),
    nome: nomeMeta.value.trim(),
    valorMeta: Number(valorMeta.value),
    valorAtual: valorInicial,
    userId: authStore.user.uid,
    criadoEm: new Date().toISOString()
  }

  metas.value.push(novoCofrinho)

  salvarMetas()

  if (valorInicial > 0) {
    registrarMovimentacaoCofrinho({
      descricao: `Saldo inicial do cofrinho: ${novoCofrinho.nome}`,
      valor: valorInicial,
      cofrinhoId: novoCofrinho.id
    })
  }

  nomeMeta.value    = ''
  valorMeta.value   = ''
  valorAtual.value  = ''
  mostrarForm.value = false
}

// Abre o modal de aporte para o cofrinho selecionado.
const abrirDeposito = (meta) => {
  metaSelecionada.value = meta
  valorDeposito.value   = ''
  erroDeposito.value    = ''
  modalDeposito.value   = true
}

// Registra um novo aporte sem permitir que o saldo fique negativo.
const confirmarDeposito = () => {
  erroDeposito.value = ''
  const v = Number(valorDeposito.value)
  if (!v || v <= 0) {
    erroDeposito.value = 'Digite um valor válido.'
    return
  }

  if (saldoDisponivel.value <= 0) {
    erroDeposito.value = 'Seu saldo disponível já está negativo ou zerado. Não é possível registrar depósito.'
    return
  }

  if (v > saldoDisponivel.value) {
    erroDeposito.value = `Esse depósito deixaria seu saldo negativo. Disponível: ${formatarValor(saldoDisponivel.value)}.`
    return
  }

  const index = metas.value.findIndex(m => m.id === metaSelecionada.value.id)
  if (index !== -1) {
    metas.value[index].valorAtual = (metas.value[index].valorAtual || 0) + v
    salvarMetas()

    registrarMovimentacaoCofrinho({
      descricao: `Aporte para cofrinho: ${metas.value[index].nome}`,
      valor: v,
      cofrinhoId: metas.value[index].id
    })
  }

  modalDeposito.value = false
}

// Carrega os dados do cofrinho atual no modal de edição.
const abrirEdicao = (meta) => {
  editId.value = meta.id
  editNomeMeta.value = meta.nome
  editValorMeta.value = meta.valorMeta
  editValorAtual.value = meta.valorAtual
  erroEdicao.value = ''
  modalEdicao.value = true
}

// Atualiza somente os dados estruturais do cofrinho.
const salvarEdicao = () => {
  erroEdicao.value = ''

  if (!editNomeMeta.value || !editValorMeta.value) {
    erroEdicao.value = 'Preencha nome e valor do cofrinho.'
    return
  }

  if (Number(editValorMeta.value) <= 0) {
    erroEdicao.value = 'O valor do cofrinho deve ser maior que zero.'
    return
  }

  if (Number(editValorAtual.value) < 0) {
    erroEdicao.value = 'O valor acumulado não pode ser negativo.'
    return
  }

  const index = metas.value.findIndex(m => m.id === editId.value)
  if (index === -1) return

  metas.value[index] = {
    ...metas.value[index],
    nome: editNomeMeta.value,
    valorMeta: Number(editValorMeta.value),
    valorAtual: Number(editValorAtual.value) || 0
  }

  salvarMetas()
  modalEdicao.value = false
}

// Remove o cofrinho da lista do usuário.
const excluirMeta = (id) => {
  if (confirm('Deseja excluir este cofrinho?')) {
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
        <h1><i class="fa-solid fa-piggy-bank"></i> Cofrinhos</h1>
        <p class="muted">Separe dinheiro para objetivos e acompanhe cada reserva</p>
      </div>
      <button @click="mostrarForm = !mostrarForm">
        <i class="fa-solid fa-plus"></i>
        {{ mostrarForm ? 'Cancelar' : 'Novo cofrinho' }}
      </button>
    </div>

    <!-- Saldo disponível -->
    <div class="saldo-info">
      <span class="muted">Seu saldo disponível:</span>
      <span :class="saldoDisponivel >= 0 ? 'valor-receita' : 'valor-despesa'" class="saldo-valor">
        {{ formatarValor(saldoDisponivel) }}
      </span>
      <span class="muted">Saldo geral: {{ formatarValor(saldoTotal) }}</span>
      <span class="muted">Guardado em cofrinhos: {{ formatarValor(totalGuardadoEmMetas) }}</span>
    </div>

    <!-- Formulário novo cofrinho -->
    <div v-if="mostrarForm" class="form-meta">
      <h3>Novo cofrinho</h3>
      <div class="form-row-3">
        <label class="field">
          Nome do cofrinho
          <input v-model="nomeMeta" placeholder="Ex: Viagem, Reserva..." />
        </label>
        <label class="field">
          Objetivo (R$)
          <input v-model="valorMeta" type="number" step="0.01" min="0.01" placeholder="10.000,00" />
        </label>
        <label class="field">
          Valor inicial (R$)
          <input v-model="valorAtual" type="number" step="0.01" min="0" placeholder="0,00 (opcional)" />
        </label>
      </div>
      <p v-if="errMeta" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ errMeta }}</p>
      <button @click="salvarMeta"><i class="fa-solid fa-check"></i> Criar cofrinho</button>
    </div>

    <h3>Meus cofrinhos ({{ metas.length }})</h3>

    <!-- Lista de metas -->
    <div v-if="metas.length" class="metas-lista">
      <div v-for="meta in metas" :key="meta.id" class="meta-card">

        <div class="meta-header">
          <div>
            <span class="meta-nome">{{ meta.nome }}</span>
            <span v-if="progresso(meta) >= 100" class="badge-concluida">✅ Concluída!</span>
          </div>
          <div class="meta-acoes">
            <button class="btn-icone" @click="abrirEdicao(meta)" title="Editar">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn-icone danger" @click="excluirMeta(meta.id)" title="Excluir">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
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

        <!-- Alerta se cofrinho não concluído -->
        <p v-if="progresso(meta) < 100" class="meta-alerta muted">
          💡 Deposite <strong>{{ formatarValor((meta.valorMeta || 0) - (meta.valorAtual || 0)) }}</strong> para concluir este cofrinho
        </p>

        <button
          v-if="progresso(meta) < 100"
          class="secondary btn-depositar"
          @click="abrirDeposito(meta)"
        >
          <i class="fa-solid fa-plus"></i> Registrar aporte
        </button>

      </div>
    </div>

    <p v-else class="muted">Nenhum cofrinho criado ainda. Crie o primeiro acima!</p>

  </section>

  <!-- Modal depósito -->
  <div v-if="modalDeposito" class="modal-overlay" @click.self="modalDeposito = false">
    <section class="card modal">
      <h2><i class="fa-solid fa-piggy-bank"></i> Registrar aporte</h2>
      <p class="muted">Cofrinho: <strong style="color: var(--text)">{{ metaSelecionada?.nome }}</strong></p>
      <p class="muted" style="margin-bottom: 16px">
        Progresso atual: {{ formatarValor(metaSelecionada?.valorAtual) }} / {{ formatarValor(metaSelecionada?.valorMeta) }}
      </p>
      <div class="deposito-resumo">
        <span class="muted">Saldo disponível agora: <strong :class="saldoDisponivel >= 0 ? 'valor-receita' : 'valor-despesa'">{{ formatarValor(saldoDisponivel) }}</strong></span>
      </div>
      <label class="field">
        Valor do aporte (R$)
        <input v-model="valorDeposito" type="number" step="0.01" min="0.01" placeholder="0,00" @keyup.enter="confirmarDeposito" />
      </label>
      <div v-if="depositoInsuficiente" class="deposito-alerta">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>Esse aporte vai negativar o saldo disponível. Saldo após aporte: {{ formatarValor(saldoAposDeposito) }}</span>
      </div>
      <p v-if="erroDeposito" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ erroDeposito }}</p>
      <div class="actions">
        <button @click="confirmarDeposito" :disabled="depositoInsuficiente"><i class="fa-solid fa-check"></i> Confirmar</button>
        <button class="secondary" @click="modalDeposito = false"><i class="fa-solid fa-xmark"></i> Cancelar</button>
      </div>
    </section>
  </div>

  <!-- Modal edição -->
  <div v-if="modalEdicao" class="modal-overlay" @click.self="modalEdicao = false">
    <section class="card modal">
      <h2><i class="fa-solid fa-pen"></i> Editar cofrinho</h2>
      <label class="field">
        Nome do cofrinho
        <input v-model="editNomeMeta" placeholder="Ex: Viagem, Reserva..." />
      </label>
      <label class="field">
        Objetivo (R$)
        <input v-model="editValorMeta" type="number" step="0.01" min="0.01" placeholder="0,00" />
      </label>
      <label class="field">
        Valor acumulado (R$)
        <input v-model="editValorAtual" type="number" step="0.01" min="0" placeholder="0,00" @keyup.enter="salvarEdicao" />
      </label>
      <p v-if="erroEdicao" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ erroEdicao }}</p>
      <div class="actions">
        <button @click="salvarEdicao"><i class="fa-solid fa-check"></i> Salvar</button>
        <button class="secondary" @click="modalEdicao = false"><i class="fa-solid fa-xmark"></i> Cancelar</button>
      </div>
    </section>
  </div>
</template>
