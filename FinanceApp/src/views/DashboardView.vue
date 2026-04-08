<script setup>
// ============================================================
// ARQUIVO: views/DashboardView.vue
// Dashboard completo: saldo, gráficos e análises
// Armazenamento: localStorage (instantâneo, sem Firestore)
// ============================================================

import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import '../styles/views/DashboardView.css'

const authStore  = useAuthStore()
const transacoes = ref([])

// ── Chave do localStorage por usuário ──
const getStorageKey = () => `user_${authStore.user?.uid}_transacoes`

// ── Carregar dados do localStorage ──
const carregarDados = () => {
  if (!authStore.user) return

  try {
    const salvas = localStorage.getItem(getStorageKey())
    if (salvas) {
      const parsed = JSON.parse(salvas)
      // Garantir que valor é número
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
}

// ── Mês atual ──
const agora      = new Date()
const mesAtual   = agora.getMonth()
const anoAtual   = agora.getFullYear()

const nomesMeses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

// ── Totais gerais (com segurança contra NaN) ──
const totalReceitas = computed(() =>
  transacoes.value
    .filter(t => t.tipo === 'receita')
    .reduce((a, t) => a + (Number(t.valor) || 0), 0)
)
const totalDespesas = computed(() =>
  transacoes.value
    .filter(t => t.tipo === 'despesa')
    .reduce((a, t) => a + (Number(t.valor) || 0), 0)
)
const saldo = computed(() => totalReceitas.value - totalDespesas.value)

// ── Totais do mês atual ──
const transacoesMes = computed(() =>
  transacoes.value.filter(t => {
    if (!t.criadoEm) return false
    const data = new Date(t.criadoEm)
    return data.getMonth() === mesAtual && data.getFullYear() === anoAtual
  })
)
const receitasMes  = computed(() =>
  transacoesMes.value
    .filter(t => t.tipo === 'receita')
    .reduce((a, t) => a + (Number(t.valor) || 0), 0)
)
const despesasMes  = computed(() =>
  transacoesMes.value
    .filter(t => t.tipo === 'despesa')
    .reduce((a, t) => a + (Number(t.valor) || 0), 0)
)
const saldoMes     = computed(() => receitasMes.value - despesasMes.value)

// ── Formatação ──
const formatarValor = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

// ── Últimas 5 transações ──
const ultimasTransacoes = computed(() =>
  [...transacoes.value]
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .slice(0, 5)
)

// ── Gráfico 1: Despesas por categoria ──
const graficoCategorias = computed(() => {
  const mapa = {}
  transacoes.value
    .filter(t => t.tipo === 'despesa')
    .forEach(t => {
      const v = Number(t.valor) || 0
      mapa[t.categoria] = (mapa[t.categoria] || 0) + v
    })

  const itens = Object.entries(mapa).map(([nome, valor]) => ({ nome, valor }))
  itens.sort((a, b) => b.valor - a.valor)

  const max = itens[0]?.valor || 1
  return itens.map(i => ({ ...i, perc: (i.valor / max) * 100 }))
})

// ── Gráfico 2: Receitas vs Despesas últimos 6 meses ──
const graficoMeses = computed(() => {
  const resultado = []

  for (let i = 5; i >= 0; i--) {
    const data   = new Date(anoAtual, mesAtual - i, 1)
    const mes    = data.getMonth()
    const ano    = data.getFullYear()
    const nome   = nomesMeses[mes]

    const doMes = transacoes.value.filter(t => {
      if (!t.criadoEm) return false
      const d = new Date(t.criadoEm)
      return d.getMonth() === mes && d.getFullYear() === ano
    })

    resultado.push({
      nome,
      receita: doMes.filter(t => t.tipo === 'receita').reduce((a, t) => a + (Number(t.valor) || 0), 0),
      despesa: doMes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + (Number(t.valor) || 0), 0)
    })
  }

  const max = Math.max(...resultado.map(m => Math.max(m.receita, m.despesa)), 1)
  return resultado.map(m => ({
    ...m,
    percReceita: (m.receita / max) * 100,
    percDespesa: (m.despesa / max) * 100
  }))
})

// ── Análise automática ──
const analise = computed(() => {
  const msgs = []

  if (transacoes.value.length === 0) return msgs

  // Categoria que mais gastou
  const mapa = {}
  transacoes.value.filter(t => t.tipo === 'despesa').forEach(t => {
    const v = Number(t.valor) || 0
    mapa[t.categoria] = (mapa[t.categoria] || 0) + v
  })
  const top = Object.entries(mapa).sort((a, b) => b[1] - a[1])[0]
  if (top) msgs.push(`💸 Você mais gasta em <strong>${top[0]}</strong> (${formatarValor(top[1])})`)

  // Saldo do mês
  if (saldoMes.value < 0)
    msgs.push(`⚠️ Você gastou <strong>${formatarValor(Math.abs(saldoMes.value))}</strong> a mais do que recebeu este mês`)
  else if (saldoMes.value > 0)
    msgs.push(`✅ Você economizou <strong>${formatarValor(saldoMes.value)}</strong> este mês — parabéns!`)

  // Proporção despesas/receitas
  if (totalReceitas.value > 0) {
    const proporcao = (totalDespesas.value / totalReceitas.value) * 100
    if (proporcao > 80)
      msgs.push(`📊 Suas despesas representam <strong>${proporcao.toFixed(0)}%</strong> das receitas — considere reduzir gastos`)
  }

  return msgs
})

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
    transacoes.value = []
  }
})
</script>

<template>
  <section class="card">

    <h1><i class="fa-solid fa-chart-pie"></i> Dashboard</h1>
    <p class="muted">Bem-vindo, {{ authStore.user?.email }} — sua visão financeira completa</p>

    <!-- ── CARDS TOTAIS GERAIS ── -->
    <div class="resumo-grid">
      <div class="resumo-card" :class="saldo >= 0 ? 'card-verde' : 'card-vermelho'">
        <span class="resumo-label">💰 Saldo Total</span>
        <span class="resumo-valor">{{ formatarValor(saldo) }}</span>
        <span class="resumo-sub muted">{{ saldo >= 0 ? 'Situação positiva' : 'Atenção: negativo' }}</span>
      </div>
      <div class="resumo-card card-verde-suave">
        <span class="resumo-label">📈 Receitas</span>
        <span class="resumo-valor valor-receita">{{ formatarValor(totalReceitas) }}</span>
        <span class="resumo-sub muted">{{ transacoes.filter(t => t.tipo === 'receita').length }} lançamento(s)</span>
      </div>
      <div class="resumo-card card-vermelho-suave">
        <span class="resumo-label">📉 Despesas</span>
        <span class="resumo-valor valor-despesa">{{ formatarValor(totalDespesas) }}</span>
        <span class="resumo-sub muted">{{ transacoes.filter(t => t.tipo === 'despesa').length }} lançamento(s)</span>
      </div>
    </div>

    <!-- ── CARDS MÊS ATUAL ── -->
    <h3>📅 {{ nomesMeses[mesAtual] }}/{{ anoAtual }} — Mês atual</h3>
    <div class="resumo-grid">
      <div class="resumo-card" :class="saldoMes >= 0 ? 'card-verde' : 'card-vermelho'">
        <span class="resumo-label">Saldo do mês</span>
        <span class="resumo-valor">{{ formatarValor(saldoMes) }}</span>
      </div>
      <div class="resumo-card card-verde-suave">
        <span class="resumo-label">Receitas do mês</span>
        <span class="resumo-valor valor-receita">{{ formatarValor(receitasMes) }}</span>
      </div>
      <div class="resumo-card card-vermelho-suave">
        <span class="resumo-label">Despesas do mês</span>
        <span class="resumo-valor valor-despesa">{{ formatarValor(despesasMes) }}</span>
      </div>
    </div>

    <!-- ── ANÁLISE AUTOMÁTICA ── -->
    <div v-if="analise.length" class="analise-box">
      <h3 style="margin-top:0; padding-top:0; border:none;">🤖 Análise automática</h3>
      <ul class="analise-lista">
        <li v-for="(msg, i) in analise" :key="i" v-html="msg"></li>
      </ul>
    </div>

    <!-- ── GRÁFICO 1: Receitas vs Despesas por mês ── -->
    <h3>📊 Receitas vs Despesas — últimos 6 meses</h3>

    <div v-if="graficoMeses.some(m => m.receita > 0 || m.despesa > 0)" class="grafico-meses">
      <div v-for="m in graficoMeses" :key="m.nome" class="grafico-mes-col">
        <div class="barras-col">
          <div class="barra-col-wrap">
            <div
              class="barra-col barra-receita"
              :style="{ height: m.percReceita + '%' }"
              :title="'Receita: ' + formatarValor(m.receita)"
            ></div>
          </div>
          <div class="barra-col-wrap">
            <div
              class="barra-col barra-despesa"
              :style="{ height: m.percDespesa + '%' }"
              :title="'Despesa: ' + formatarValor(m.despesa)"
            ></div>
          </div>
        </div>
        <span class="mes-nome">{{ m.nome }}</span>
      </div>
      <div class="grafico-legenda">
        <span class="leg-item"><span class="leg-cor receita-bg"></span> Receitas</span>
        <span class="leg-item"><span class="leg-cor despesa-bg"></span> Despesas</span>
      </div>
    </div>
    <p v-else class="muted">Sem dados suficientes para o gráfico.</p>

    <!-- ── GRÁFICO 2: Despesas por categoria ── -->
    <h3>🗂️ Despesas por categoria</h3>

    <div v-if="graficoCategorias.length" class="grafico-cats">
      <div v-for="item in graficoCategorias" :key="item.nome" class="grafico-linha">
        <span class="grafico-nome">{{ item.nome }}</span>
        <div class="barra-wrap">
          <div class="barra barra-despesa-h" :style="{ width: item.perc + '%' }"></div>
          <span class="barra-valor valor-despesa">{{ formatarValor(item.valor) }}</span>
        </div>
      </div>
    </div>
    <p v-else class="muted">Nenhuma despesa cadastrada ainda.</p>

    <!-- ── ÚLTIMAS TRANSAÇÕES ── -->
    <h3>🕐 Últimas transações</h3>

    <ul v-if="ultimasTransacoes.length">
      <li v-for="t in ultimasTransacoes" :key="t.id" class="transacao-item">
        <div class="transacao-info">
          <span class="transacao-desc">{{ t.descricao }}</span>
          <span class="transacao-cat muted">{{ t.categoria }}</span>
        </div>
        <span class="transacao-valor" :class="t.tipo === 'receita' ? 'valor-receita' : 'valor-despesa'">
          {{ t.tipo === 'receita' ? '+' : '-' }} {{ formatarValor(t.valor) }}
        </span>
      </li>
    </ul>
    <p v-else class="muted">Nenhuma transação ainda. Acesse Transações para começar!</p>

  </section>
</template>