<script setup>
// ============================================================
// ARQUIVO: views/DashboardView.vue
// Dashboard redesenhado — inspirado em "Minhas Finanças"
// Dados: localStorage (dinâmico por usuário)
// ============================================================

import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import '../styles/views/DashboardView.css'
import {
  DATA_CHANGE_EVENT,
  formatCurrencyBRL,
  readUserJson
} from '../utils/appData'

const authStore  = useAuthStore()
const transacoes = ref([])
const metas = ref([])
const modalCalendario = ref(false)
const diaSelecionado = ref(null)

// Carrega o resumo financeiro base usado por todos os cards e gráficos.
const carregarDados = () => {
  if (!authStore.user) return
  try {
    const salvas = readUserJson(authStore.user.uid, 'transacoes', [])
    transacoes.value = salvas
      ? salvas.map(t => ({ ...t, valor: Number(t.valor) || 0 }))
      : []
  } catch (e) {
    transacoes.value = []
  }

  try {
    const metasSalvas = readUserJson(authStore.user.uid, 'metas', [])
    metas.value = metasSalvas
      ? metasSalvas.map(m => ({
          ...m,
          valorMeta: Number(m.valorMeta) || 0,
          valorAtual: Number(m.valorAtual) || 0
        }))
      : []
  } catch (e) {
    metas.value = []
  }
}

// ── Datas ──
const agora      = new Date()
const mesAtual   = agora.getMonth()
const anoAtual   = agora.getFullYear()
const nomesMeses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const nomeMesAtual = nomesMeses[mesAtual]

// ── Totais gerais ──
const totalReceitas = computed(() =>
  transacoes.value.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
)
const totalDespesas = computed(() =>
  transacoes.value.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)
)
const saldo = computed(() => totalReceitas.value - totalDespesas.value)
const totalGuardadoEmMetas = computed(() =>
  metas.value.reduce((a, meta) => a + meta.valorAtual, 0)
)
const metasAtivas = computed(() =>
  metas.value.filter(meta => meta.valorAtual < meta.valorMeta).length
)

// ── Totais do mês atual ──
const transacoesMes = computed(() =>
  transacoes.value.filter(t => {
    if (!t.criadoEm) return false
    const d = new Date(t.criadoEm)
    return d.getMonth() === mesAtual && d.getFullYear() === anoAtual
  })
)
const transacoesPorDiaNoMes = computed(() => {
  const mapa = new Map()

  transacoesMes.value.forEach((transacao) => {
    const dia = new Date(transacao.criadoEm).getDate()
    const itens = mapa.get(dia) || []
    itens.push(transacao)
    mapa.set(dia, itens)
  })

  return mapa
})
const receitasMes = computed(() =>
  transacoesMes.value.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
)
const despesasMes = computed(() =>
  transacoesMes.value.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)
)
const saldoMes = computed(() => receitasMes.value - despesasMes.value)
const primeiroDiaMes = computed(() => new Date(anoAtual, mesAtual, 1))
const ultimoDiaMes = computed(() => new Date(anoAtual, mesAtual + 1, 0))
const inicioGradeCalendario = computed(() => (primeiroDiaMes.value.getDay() + 6) % 7)
const diasNoMes = computed(() => ultimoDiaMes.value.getDate())
const nomesDiasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const diasCalendario = computed(() => {
  const dias = []
  const totalCelulas = Math.ceil((inicioGradeCalendario.value + diasNoMes.value) / 7) * 7

  for (let i = 0; i < totalCelulas; i += 1) {
    const numeroDia = i - inicioGradeCalendario.value + 1

    if (numeroDia < 1 || numeroDia > diasNoMes.value) {
      dias.push({ chave: `empty-${i}`, vazio: true })
      continue
    }

    const transacoesDoDia = transacoesPorDiaNoMes.value.get(numeroDia) || []
    dias.push({
      chave: `day-${numeroDia}`,
      vazio: false,
      dia: numeroDia,
      total: transacoesDoDia.length,
      possuiMovimentacao: transacoesDoDia.length > 0
    })
  }

  return dias
})
const transacoesDiaSelecionado = computed(() => {
  if (!diaSelecionado.value) return []

  return [...(transacoesPorDiaNoMes.value.get(diaSelecionado.value) || [])]
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
})

// ── Formatação ──
const fmt = v => formatCurrencyBRL(v)

// Lista recente usada no card lateral de movimentações.
const ultimasTransacoes = computed(() =>
  [...transacoes.value]
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
    .slice(0, 6)
)

// Base mensal para o gráfico comparativo de receitas e despesas.
const dadosMeses = computed(() => {
  const resultado = []
  for (let i = 5; i >= 0; i--) {
    const data = new Date(anoAtual, mesAtual - i, 1)
    const mes  = data.getMonth()
    const ano  = data.getFullYear()
    const doMes = transacoes.value.filter(t => {
      if (!t.criadoEm) return false
      const d = new Date(t.criadoEm)
      return d.getMonth() === mes && d.getFullYear() === ano
    })
    resultado.push({
      nome: nomesMeses[mes],
      receita: doMes.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0),
      despesa: doMes.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)
    })
  }
  return resultado
})

// Configuração geométrica do gráfico principal em SVG.
const chartWidth  = 560
const chartHeight = 180
const chartPadL   = 52
const chartPadR   = 20
const chartPadT   = 16
const chartPadB   = 32

const chartPoints = computed(() => {
  const dados = dadosMeses.value
  const maxVal = Math.max(...dados.map(d => Math.max(d.receita, d.despesa)), 1)
  const w = chartWidth - chartPadL - chartPadR
  const h = chartHeight - chartPadT - chartPadB
  const step = w / (dados.length - 1 || 1)

  return {
    maxVal,
    receita: dados.map((d, i) => ({
      x: chartPadL + i * step,
      y: chartPadT + h - (d.receita / maxVal) * h,
      val: d.receita
    })),
    despesa: dados.map((d, i) => ({
      x: chartPadL + i * step,
      y: chartPadT + h - (d.despesa / maxVal) * h,
      val: d.despesa
    })),
    labels: dados.map((d, i) => ({
      x: chartPadL + i * step,
      y: chartHeight - 6,
      nome: d.nome
    })),
    yLabels: [0, 0.25, 0.5, 0.75, 1].map(pct => ({
      y: chartPadT + (chartHeight - chartPadT - chartPadB) * (1 - pct),
      val: maxVal * pct
    }))
  }
})

const toPolyline = pts => pts.map(p => `${p.x},${p.y}`).join(' ')

const toAreaPath = (pts, bottom) => {
  if (!pts.length) return ''
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const close = `L${pts[pts.length-1].x},${bottom} L${pts[0].x},${bottom} Z`
  return line + ' ' + close
}

const chartBottom = computed(() => chartPadT + (chartHeight - chartPadT - chartPadB))

// Controla o tooltip exibido sobre os pontos do gráfico.
const tooltip = ref(null)
const showTooltip = (e, point, tipo) => {
  tooltip.value = { x: point.x, y: point.y, val: point.val, tipo }
}
const hideTooltip = () => { tooltip.value = null }

// Agrupa despesas por categoria para montar o donut e sua legenda.
const despesasPorCategoria = computed(() => {
  const mapa = {}
  transacoes.value
    .filter(t => t.tipo === 'despesa')
    .forEach(t => { mapa[t.categoria] = (mapa[t.categoria] || 0) + t.valor })

  const total = Object.values(mapa).reduce((a, v) => a + v, 0)
  const cores = ['#ef4444','#3b82f6','#f59e0b','#8b5cf6','#06b6d4','#ec4899','#10b981','#f97316']
  let startAngle = -90

  return Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([nome, valor], i) => {
      const pct   = total > 0 ? valor / total : 0
      const angle = pct * 360
      const start = startAngle
      startAngle += angle
      return { nome, valor, pct, angle, startAngle: start, cor: cores[i % cores.length] }
    })
})

const totalDespesasCat = computed(() =>
  despesasPorCategoria.value.reduce((a, d) => a + d.valor, 0)
)

// Converte ângulos em coordenadas para desenhar arcos no SVG.
const polarToXY = (cx, cy, r, angleDeg) => {
  const rad = (angleDeg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

const donutArcs = computed(() => {
  const cx = 90, cy = 90, r = 70, ir = 44
  return despesasPorCategoria.value.map(d => {
    const startRad = d.startAngle
    const endRad   = d.startAngle + d.angle
    const s = polarToXY(cx, cy, r, startRad)
    const e = polarToXY(cx, cy, r, endRad)
    const si = polarToXY(cx, cy, ir, startRad)
    const ei = polarToXY(cx, cy, ir, endRad)
    const large = d.angle > 180 ? 1 : 0
    return {
      ...d,
      path: `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y} L ${ei.x} ${ei.y} A ${ir} ${ir} 0 ${large} 0 ${si.x} ${si.y} Z`
    }
  })
})

// Gera mensagens rápidas de insight com base nos dados atuais.
const analise = computed(() => {
  const msgs = []
  if (!transacoes.value.length) return msgs

  const mapa = {}
  transacoes.value.filter(t => t.tipo === 'despesa').forEach(t => {
    mapa[t.categoria] = (mapa[t.categoria] || 0) + t.valor
  })
  const top = Object.entries(mapa).sort((a, b) => b[1] - a[1])[0]
  if (top) msgs.push({ icon: 'fa-fire', cor: 'warning', texto: `Maior gasto: <strong>${top[0]}</strong> (${fmt(top[1])})` })

  if (saldoMes.value < 0)
    msgs.push({ icon: 'fa-triangle-exclamation', cor: 'danger', texto: `Você gastou <strong>${fmt(Math.abs(saldoMes.value))}</strong> a mais que recebeu este mês` })
  else if (saldoMes.value > 0)
    msgs.push({ icon: 'fa-circle-check', cor: 'success', texto: `Você economizou <strong>${fmt(saldoMes.value)}</strong> em ${nomeMesAtual}` })

  if (totalReceitas.value > 0) {
    const prop = (totalDespesas.value / totalReceitas.value) * 100
    if (prop > 80)
      msgs.push({ icon: 'fa-chart-line', cor: 'danger', texto: `Despesas em <strong>${prop.toFixed(0)}%</strong> das receitas — considere reduzir` })
    else if (prop < 40 && prop > 0)
      msgs.push({ icon: 'fa-star', cor: 'success', texto: `Ótimo! Despesas em apenas <strong>${prop.toFixed(0)}%</strong> das suas receitas` })
  }

  return msgs
})

const formatarData = ts => {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const formatarDataCompleta = ts => {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  })
}

// Destaca movimentações criadas por cofrinhos no card de recentes.
const isMetaMovimentacao = (transacao) =>
  transacao?.categoria === 'Metas' ||
  transacao?.categoria === 'Cofrinhos' ||
  !!transacao?.metaId

// Recarrega o dashboard quando outra tela altera o armazenamento local.
const sincronizarDashboard = () => {
  if (authStore.user) carregarDados()
}

const abrirCalendario = () => {
  modalCalendario.value = true
  if (!diaSelecionado.value) {
    const primeiroDiaComMovimentacao = diasCalendario.value.find((dia) => !dia.vazio && dia.possuiMovimentacao)
    diaSelecionado.value = primeiroDiaComMovimentacao?.dia || null
  }
}

const fecharCalendario = () => {
  modalCalendario.value = false
}

const selecionarDia = (dia) => {
  if (!dia.possuiMovimentacao) return
  diaSelecionado.value = dia.dia
}

onMounted(() => {
  if (authStore.user) carregarDados()
  window.addEventListener(DATA_CHANGE_EVENT, sincronizarDashboard)
  window.addEventListener('storage', sincronizarDashboard)
})

onBeforeUnmount(() => {
  window.removeEventListener(DATA_CHANGE_EVENT, sincronizarDashboard)
  window.removeEventListener('storage', sincronizarDashboard)
})

watch(() => authStore.user, u => {
  if (u) carregarDados()
  else {
    transacoes.value = []
    metas.value = []
  }
})
</script>

<template>
  <div class="dashboard">

    <!-- ══ HEADER ══ -->
    <div class="dash-header">
      <div>
        <h1>Dashboard</h1>
        <p class="dash-sub">Olá, <strong>{{ authStore.user?.email?.split('@')[0] }}</strong> — aqui está sua visão financeira completa</p>
      </div>
      <button class="dash-period dash-period-button" type="button" @click="abrirCalendario">
        <i class="fa-regular fa-calendar"></i>
        {{ nomeMesAtual }} / {{ anoAtual }}
      </button>
    </div>

    <!-- ══ STAT CARDS ══ -->
    <div class="stat-cards-row">

      <!-- Saldo -->
      <div class="scard" :class="saldo >= 0 ? 'scard--teal' : 'scard--red'">
        <div class="scard-icon">
          <i class="fa-solid fa-wallet"></i>
        </div>
        <div class="scard-body">
          <span class="scard-label">Saldo Total</span>
          <span class="scard-value">{{ fmt(saldo) }}</span>
          <span class="scard-sub">{{ saldo >= 0 ? 'Situação positiva' : 'Atenção: negativo' }}</span>
        </div>
      </div>

      <!-- Receitas -->
      <div class="scard scard--green">
        <div class="scard-icon">
          <i class="fa-solid fa-arrow-trend-up"></i>
        </div>
        <div class="scard-body">
          <span class="scard-label">Receitas</span>
          <span class="scard-value">{{ fmt(totalReceitas) }}</span>
          <span class="scard-sub">{{ transacoes.filter(t => t.tipo === 'receita').length }} lançamento(s)</span>
        </div>
      </div>

      <!-- Despesas -->
      <div class="scard scard--red">
        <div class="scard-icon">
          <i class="fa-solid fa-arrow-trend-down"></i>
        </div>
        <div class="scard-body">
          <span class="scard-label">Despesas</span>
          <span class="scard-value">{{ fmt(totalDespesas) }}</span>
          <span class="scard-sub">{{ transacoes.filter(t => t.tipo === 'despesa').length }} lançamento(s)</span>
        </div>
      </div>

      <!-- Saldo do Mês -->
      <div class="scard scard--yellow">
        <div class="scard-icon">
          <i class="fa-solid fa-calendar-check"></i>
        </div>
        <div class="scard-body">
          <span class="scard-label">Este mês</span>
          <span class="scard-value">{{ fmt(saldoMes) }}</span>
          <span class="scard-sub">{{ nomeMesAtual }} · {{ transacoesMes.length }} transação(ões)</span>
        </div>
      </div>

      <!-- Reservado em Cofrinhos -->
      <div class="scard scard--blue">
        <div class="scard-icon">
          <i class="fa-solid fa-piggy-bank"></i>
        </div>
        <div class="scard-body">
          <span class="scard-label">Em cofrinhos</span>
          <span class="scard-value">{{ fmt(totalGuardadoEmMetas) }}</span>
          <span class="scard-sub">{{ metasAtivas }} cofrinho(s) em andamento</span>
        </div>
      </div>

    </div>

    <!-- ══ ANÁLISE + ÚLTIMAS TRANSAÇÕES ══ -->
    <div v-if="analise.length" class="insights-bar">
      <div
        v-for="(msg, i) in analise"
        :key="i"
        class="insight-pill"
        :class="`insight-pill--${msg.cor}`"
      >
        <i :class="`fa-solid ${msg.icon}`"></i>
        <span v-html="msg.texto"></span>
      </div>
    </div>

    <!-- ══ GRÁFICOS ══ -->
    <div class="charts-row">

      <!-- Line Chart — Receitas vs Despesas -->
      <div class="chart-card chart-card--wide">
        <div class="chart-card-header">
          <div>
            <span class="chart-title">Evolução Financeira</span>
            <span class="chart-sub">Receitas e despesas · últimos 6 meses</span>
          </div>
          <div class="chart-legend">
            <span class="leg-dot leg-dot--green"></span><span>Receitas</span>
            <span class="leg-dot leg-dot--red"></span><span>Despesas</span>
          </div>
        </div>

        <div v-if="dadosMeses.some(m => m.receita > 0 || m.despesa > 0)" class="chart-wrap">
          <svg
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            preserveAspectRatio="xMidYMid meet"
            class="line-chart-svg"
          >
            <defs>
              <linearGradient id="gradReceita" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#00d68f" stop-opacity="0.25"/>
                <stop offset="100%" stop-color="#00d68f" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="gradDespesa" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ef4444" stop-opacity="0.2"/>
                <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <!-- Grid lines -->
            <line
              v-for="(yl, i) in chartPoints.yLabels"
              :key="'gy'+i"
              class="chart-grid-line"
              :x1="chartPadL" :y1="yl.y"
              :x2="chartWidth - chartPadR" :y2="yl.y"
            />

            <!-- Y labels -->
            <text
              v-for="(yl, i) in chartPoints.yLabels"
              :key="'yt'+i"
              :x="chartPadL - 8" :y="yl.y + 4"
              class="chart-axis-label"
              text-anchor="end"
            >{{ yl.val >= 1000 ? (yl.val/1000).toFixed(0)+'k' : yl.val.toFixed(0) }}</text>

            <!-- Area receita -->
            <path
              :d="toAreaPath(chartPoints.receita, chartBottom)"
              class="chart-area chart-area--green"
              fill="url(#gradReceita)"
            />
            <!-- Area despesa -->
            <path
              :d="toAreaPath(chartPoints.despesa, chartBottom)"
              class="chart-area chart-area--red"
              fill="url(#gradDespesa)"
            />

            <!-- Line receita -->
            <polyline
              :points="toPolyline(chartPoints.receita)"
              class="chart-line chart-line--green"
              fill="none"
              stroke-linejoin="round"
              stroke-linecap="round"
            />
            <!-- Line despesa -->
            <polyline
              :points="toPolyline(chartPoints.despesa)"
              class="chart-line chart-line--red"
              fill="none"
              stroke-linejoin="round"
              stroke-linecap="round"
            />

            <!-- Dots receita -->
            <circle
              v-for="(p, i) in chartPoints.receita"
              :key="'dr'+i"
              class="chart-dot chart-dot--green"
              :cx="p.x" :cy="p.y" r="4"
            />
            <circle
              v-for="(p, i) in chartPoints.receita"
              :key="'hr'+i"
              class="chart-hit-area"
              :cx="p.x" :cy="p.y" r="12"
              @mouseenter="showTooltip($event, p, 'Receita')"
              @mouseleave="hideTooltip"
            />
            <!-- Dots despesa -->
            <circle
              v-for="(p, i) in chartPoints.despesa"
              :key="'dd'+i"
              class="chart-dot chart-dot--red"
              :cx="p.x" :cy="p.y" r="4"
            />
            <circle
              v-for="(p, i) in chartPoints.despesa"
              :key="'hd'+i"
              class="chart-hit-area"
              :cx="p.x" :cy="p.y" r="12"
              @mouseenter="showTooltip($event, p, 'Despesa')"
              @mouseleave="hideTooltip"
            />

            <!-- X labels -->
            <text
              v-for="(lbl, i) in chartPoints.labels"
              :key="'xl'+i"
              :x="lbl.x" :y="lbl.y"
              class="chart-axis-label"
              text-anchor="middle"
            >{{ lbl.nome }}</text>

            <!-- Tooltip -->
            <g v-if="tooltip">
              <rect
                :x="tooltip.x + 8" :y="tooltip.y - 28"
                width="90" height="22"
                rx="5"
                class="chart-tooltip-box"
              />
              <text
                :x="tooltip.x + 14" :y="tooltip.y - 12"
                class="chart-tooltip-text"
                :fill="tooltip.tipo === 'Receita' ? '#00d68f' : '#ef4444'"
              >{{ tooltip.tipo }}: {{ fmt(tooltip.val) }}</text>
            </g>
          </svg>
        </div>

        <div v-else class="chart-empty">
          <div class="empty-icon"><i class="fa-solid fa-chart-line"></i></div>
          <span class="empty-title">Sem dados suficientes</span>
          <span class="empty-sub">Adicione transações para ver a evolução</span>
        </div>
      </div>

      <!-- Donut Chart — Despesas por categoria -->
      <div class="chart-card chart-card--narrow">
        <div class="chart-card-header">
          <div>
            <span class="chart-title">Por Categoria</span>
            <span class="chart-sub">Distribuição das despesas</span>
          </div>
        </div>

        <div v-if="despesasPorCategoria.length" class="donut-wrap">
          <svg viewBox="0 0 180 180" class="donut-svg">
            <g v-for="(arc, i) in donutArcs" :key="i">
              <path
                :d="arc.path"
                :fill="arc.cor"
                opacity="0.85"
                class="donut-arc"
              />
            </g>
            <!-- Centro -->
            <text x="90" y="85" text-anchor="middle" font-size="9" fill="rgba(255,255,255,0.4)">Total</text>
            <text x="90" y="100" text-anchor="middle" font-size="11" font-weight="700" fill="white">
              {{ fmt(totalDespesasCat).replace('R$','').trim() }}
            </text>
          </svg>

          <div class="donut-legend">
            <div
              v-for="(cat, i) in despesasPorCategoria"
              :key="i"
              class="donut-leg-item"
            >
              <span class="donut-leg-dot" :style="{ background: cat.cor }"></span>
              <span class="donut-leg-nome">{{ cat.nome }}</span>
              <span class="donut-leg-pct">{{ (cat.pct * 100).toFixed(0) }}%</span>
            </div>
          </div>
        </div>

        <div v-else class="chart-empty">
          <div class="empty-icon"><i class="fa-solid fa-chart-pie"></i></div>
          <span class="empty-title">Sem despesas</span>
          <span class="empty-sub">Cadastre despesas para ver a distribuição</span>
        </div>
      </div>

    </div>

    <!-- ══ MÊS ATUAL + ÚLTIMAS TRANSAÇÕES ══ -->
    <div class="bottom-row">

      <!-- Resumo do Mês -->
      <div class="month-card">
        <div class="chart-card-header" style="margin-bottom: 16px;">
          <span class="chart-title">{{ nomeMesAtual }} {{ anoAtual }}</span>
          <span class="chart-sub">Resumo do mês</span>
        </div>

        <div class="month-stats">
          <div class="month-stat">
            <div class="ms-bar-wrap">
              <div class="ms-bar ms-bar--green"
                :style="{ width: receitasMes > 0 ? '100%' : '0%' }">
              </div>
            </div>
            <div class="ms-info">
              <span class="ms-label"><i class="fa-solid fa-circle-arrow-up" style="color:#00d68f"></i> Receitas</span>
              <span class="ms-value" style="color:var(--success)">{{ fmt(receitasMes) }}</span>
            </div>
          </div>

          <div class="month-stat">
            <div class="ms-bar-wrap">
              <div class="ms-bar ms-bar--red"
                :style="{ width: despesasMes > 0 && receitasMes > 0 ? (despesasMes/receitasMes*100)+'%' : despesasMes > 0 ? '100%' : '0%' }">
              </div>
            </div>
            <div class="ms-info">
              <span class="ms-label"><i class="fa-solid fa-circle-arrow-down" style="color:#ef4444"></i> Despesas</span>
              <span class="ms-value" style="color:var(--danger)">{{ fmt(despesasMes) }}</span>
            </div>
          </div>

          <div class="month-saldo" :class="saldoMes >= 0 ? 'pos' : 'neg'">
            <span>Saldo do mês</span>
            <span class="ms-value-big">{{ fmt(saldoMes) }}</span>
          </div>
        </div>
      </div>

      <!-- Últimas Transações -->
      <div class="recent-card">
        <div class="chart-card-header" style="margin-bottom: 14px;">
          <span class="chart-title">Últimas Transações</span>
          <RouterLink to="/transacoes" class="ver-tudo-link">
            Ver todas <i class="fa-solid fa-arrow-right"></i>
          </RouterLink>
        </div>

        <div v-if="ultimasTransacoes.length" class="recent-list">
          <div
            v-for="t in ultimasTransacoes"
            :key="t.id"
            class="recent-item"
          >
            <div class="recent-icon" :class="t.tipo === 'receita' ? 'ri--green' : 'ri--red'">
              <i :class="`fa-solid ${t.tipo === 'receita' ? 'fa-arrow-down-long' : 'fa-arrow-up-long'}`"></i>
            </div>
            <div class="recent-info">
              <span class="recent-desc">
                {{ t.descricao }}
                <span v-if="isMetaMovimentacao(t)" class="recent-tag">Cofrinho</span>
              </span>
              <span class="recent-meta">{{ t.categoria }} · {{ formatarData(t.criadoEm) }}</span>
            </div>
            <span class="recent-valor" :class="t.tipo === 'receita' ? 'valor-receita' : 'valor-despesa'">
              {{ t.tipo === 'receita' ? '+' : '-' }} {{ fmt(t.valor) }}
            </span>
          </div>
        </div>

        <div v-else class="chart-empty" style="padding: 32px 0">
          <div class="empty-icon"><i class="fa-solid fa-receipt"></i></div>
          <span class="empty-title">Nenhuma transação</span>
          <span class="empty-sub">Acesse Transações para começar</span>
        </div>
      </div>

    </div>

    <div v-if="modalCalendario" class="modal-overlay" @click.self="fecharCalendario">
      <section class="card modal dashboard-calendar-modal">
        <div class="dashboard-calendar-header">
          <div>
            <h2><i class="fa-regular fa-calendar-days"></i> {{ nomeMesAtual }} {{ anoAtual }}</h2>
            <p class="muted">Veja os dias do mês que tiveram movimentação e consulte os lançamentos.</p>
          </div>
          <button class="secondary btn-sm" type="button" @click="fecharCalendario">
            <i class="fa-solid fa-xmark"></i>
            Fechar
          </button>
        </div>

        <div class="dashboard-calendar-grid">
          <span v-for="diaSemana in nomesDiasSemana" :key="diaSemana" class="calendar-weekday">{{ diaSemana }}</span>

          <button
            v-for="dia in diasCalendario"
            :key="dia.chave"
            type="button"
            class="calendar-day"
            :class="[
              dia.vazio && 'calendar-day--empty',
              dia.possuiMovimentacao && 'calendar-day--active',
              diaSelecionado === dia.dia && 'calendar-day--selected'
            ]"
            :disabled="dia.vazio"
            @click="selecionarDia(dia)"
          >
            <span v-if="!dia.vazio" class="calendar-day-number">{{ dia.dia }}</span>
            <span v-if="dia.possuiMovimentacao" class="calendar-day-count">{{ dia.total }}</span>
          </button>
        </div>

        <div class="calendar-day-panel">
          <div class="calendar-day-panel-header">
            <span class="calendar-day-title">
              {{ diaSelecionado ? `Movimentações do dia ${String(diaSelecionado).padStart(2, '0')}` : 'Nenhum dia com movimentação selecionado' }}
            </span>
            <span v-if="diaSelecionado" class="calendar-day-sub">{{ transacoesDiaSelecionado.length }} lançamento(s)</span>
          </div>

          <div v-if="transacoesDiaSelecionado.length" class="calendar-day-list">
            <div v-for="transacao in transacoesDiaSelecionado" :key="transacao.id" class="calendar-day-item">
              <div class="calendar-day-item-main">
                <span class="calendar-day-item-desc">{{ transacao.descricao }}</span>
                <span class="calendar-day-item-meta">{{ transacao.categoria }} · {{ formatarDataCompleta(transacao.criadoEm) }}</span>
              </div>
              <span class="calendar-day-item-value" :class="transacao.tipo === 'receita' ? 'valor-receita' : 'valor-despesa'">
                {{ transacao.tipo === 'receita' ? '+' : '-' }} {{ fmt(transacao.valor) }}
              </span>
            </div>
          </div>

          <div v-else class="chart-empty calendar-empty">
            <div class="empty-icon"><i class="fa-regular fa-calendar-xmark"></i></div>
            <span class="empty-title">Nenhuma movimentação neste dia</span>
            <span class="empty-sub">Selecione um dia marcado para ver os lançamentos.</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
