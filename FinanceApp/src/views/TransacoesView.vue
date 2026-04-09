<script setup>
// Tela de transações: cadastro, filtros, categorias e histórico.
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useAuthStore } from '../stores/authStore'
import '../styles/views/TransacoesView.css'
import {
  DATA_CHANGE_EVENT,
  formatCurrencyBRL,
  generateId,
  notifyFinanceDataChanged,
  readUserJson,
  writeUserJson
} from '../utils/appData'

const authStore = useAuthStore()
const CATEGORIAS_PADRAO = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Vendas',
  'Renda extra',
  'Moradia',
  'Alimentação',
  'Transporte',
  'Contas',
  'Lazer',
  'Saúde',
  'Educação',
  'Assinaturas',
  'Compras',
  'Impostos',
  'Outros'
]

const descricao = ref('')
const valor = ref('')
const tipo = ref('despesa')
const categoria = ref('')
const erro = ref('')
const mostrarFormulario = ref(false)

const transacoes = ref([])

const filtroBusca = ref('')
const filtroTipo = ref('todos')
const filtroCategoria = ref('todas')
const filtroDataDe = ref('')
const filtroDataAte = ref('')

const categorias = ref([])
const novaCategoria = ref('')
const erroCategoria = ref('')
const modalCategorias = ref(false)

const modalAberto = ref(false)
const editId = ref('')
const editDescricao = ref('')
const editValor = ref('')
const editTipo = ref('')
const editCategoria = ref('')
const erroModal = ref('')

const normalizarCategoria = (nome) => nome.trim().toLowerCase()

// Cria uma base inicial de categorias para o usuário começar rápido.
const criarCategoriasPadrao = () =>
  CATEGORIAS_PADRAO.map(nome => ({
    id: gerarId(),
    nome,
    userId: authStore.user?.uid || ''
  }))

// Mescla categorias padrão com categorias já salvas sem duplicar nomes.
const combinarCategorias = (categoriasSalvas = []) => {
  const mapa = new Map()

  categoriasSalvas.forEach((categoria) => {
    if (!categoria?.nome) return
    mapa.set(normalizarCategoria(categoria.nome), categoria)
  })

  CATEGORIAS_PADRAO.forEach((nome) => {
    const chave = normalizarCategoria(nome)
    if (!mapa.has(chave)) {
      mapa.set(chave, {
        id: gerarId(),
        nome,
        userId: authStore.user?.uid || ''
      })
    }
  })

  return Array.from(mapa.values())
}

// Carrega transações e categorias do usuário atual.
const carregarDados = () => {
  if (!authStore.user) return

  try {
    const transacoesSalvas = readUserJson(authStore.user.uid, 'transacoes', [])
    transacoes.value = transacoesSalvas
      ? transacoesSalvas.map(t => ({ ...t, valor: Number(t.valor) || 0 }))
      : []
  } catch (e) {
    console.error('Erro ao carregar transacoes:', e)
    transacoes.value = []
  }

  try {
    const categoriasSalvas = readUserJson(authStore.user.uid, 'categorias', null)
    const categoriasBase = categoriasSalvas || criarCategoriasPadrao()
    categorias.value = combinarCategorias(categoriasBase)

    if (!categoriasSalvas || categorias.value.length !== categoriasBase.length) {
      salvarCategorias()
    }
  } catch (e) {
    console.error('Erro ao carregar categorias:', e)
    categorias.value = criarCategoriasPadrao()
    salvarCategorias()
  }
}

// Persiste transações e notifica outras telas para recalcular os dados.
const salvarTransacoes = () => {
  writeUserJson(authStore.user.uid, 'transacoes', transacoes.value)
  notifyFinanceDataChanged()
}

// Categorias ficam locais à tela, então não precisam disparar sincronização global.
const salvarCategorias = () => {
  writeUserJson(authStore.user.uid, 'categorias', categorias.value)
}

const gerarId = () => generateId()

// Aplica todos os filtros da listagem e ordena do mais recente para o mais antigo.
const transacoesFiltradas = computed(() =>
  transacoes.value
    .filter(t => {
      if (filtroTipo.value !== 'todos' && t.tipo !== filtroTipo.value) return false
      if (filtroBusca.value && !t.descricao.toLowerCase().includes(filtroBusca.value.toLowerCase())) return false
      if (filtroCategoria.value !== 'todas' && t.categoria !== filtroCategoria.value) return false

      if (filtroDataDe.value || filtroDataAte.value) {
        const data = new Date(t.criadoEm)
        if (filtroDataDe.value && data < new Date(filtroDataDe.value)) return false
        if (filtroDataAte.value && data > new Date(filtroDataAte.value + 'T23:59:59')) return false
      }

      return true
    })
    .sort((a, b) => new Date(b.criadoEm) - new Date(a.criadoEm))
)

// Resumo completo da base de transações.
const resumoGeral = computed(() => {
  const receitas = transacoes.value.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
  const despesas = transacoes.value.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)

  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    quantidade: transacoes.value.length
  }
})

// Resumo da visão filtrada para dar contexto à busca atual.
const totalFiltrado = computed(() => {
  const receitas = transacoesFiltradas.value.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0)
  const despesas = transacoesFiltradas.value.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0)

  return {
    receitas,
    despesas,
    saldo: receitas - despesas,
    quantidade: transacoesFiltradas.value.length
  }
})

const filtrosAtivos = computed(() =>
  !!filtroBusca.value ||
  filtroTipo.value !== 'todos' ||
  filtroCategoria.value !== 'todas' ||
  !!filtroDataDe.value ||
  !!filtroDataAte.value
)

const formatarValor = (v) => formatCurrencyBRL(v)

const formatarData = (ts) => {
  if (!ts) return ''
  return new Date(ts).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Identifica movimentações ligadas a cofrinhos para destacar na interface.
const isMetaMovimentacao = (transacao) =>
  transacao?.categoria === 'Metas' ||
  transacao?.categoria === 'Cofrinhos' ||
  !!transacao?.metaId

// Se a descrição vier vazia, usa a categoria como fallback.
const resolverDescricao = (descricaoAtual, categoriaAtual) => {
  const descricaoNormalizada = descricaoAtual.trim()
  if (descricaoNormalizada) return descricaoNormalizada
  return categoriaAtual.trim()
}

const limparFiltros = () => {
  filtroBusca.value = ''
  filtroTipo.value = 'todos'
  filtroCategoria.value = 'todas'
  filtroDataDe.value = ''
  filtroDataAte.value = ''
}

const abrirFormulario = () => {
  mostrarFormulario.value = true
}

const fecharFormulario = () => {
  mostrarFormulario.value = false
  erro.value = ''
}

// Salva uma nova transação mantendo a regra de descrição opcional.
const salvar = () => {
  erro.value = ''
  if (!valor.value || !categoria.value) {
    erro.value = 'Preencha valor e categoria.'
    mostrarFormulario.value = true
    return
  }
  if (Number(valor.value) <= 0) {
    erro.value = 'O valor deve ser maior que zero.'
    mostrarFormulario.value = true
    return
  }

  transacoes.value.push({
    id: gerarId(),
    descricao: resolverDescricao(descricao.value, categoria.value),
    valor: Number(valor.value),
    tipo: tipo.value,
    categoria: categoria.value,
    userId: authStore.user.uid,
    criadoEm: new Date().toISOString()
  })

  salvarTransacoes()
  descricao.value = ''
  valor.value = ''
  categoria.value = ''
  tipo.value = 'despesa'
  fecharFormulario()
}

// Abre o modal de gerenciamento de categorias.
const abrirCategorias = () => {
  modalCategorias.value = true
  erroCategoria.value = ''
}

const fecharCategorias = () => {
  modalCategorias.value = false
  erroCategoria.value = ''
}

// Adiciona uma categoria manual sem duplicar nomes existentes.
const adicionarCategoria = () => {
  erroCategoria.value = ''
  const nome = novaCategoria.value.trim()
  if (!nome) {
    erroCategoria.value = 'Digite um nome.'
    return
  }
  if (categorias.value.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
    erroCategoria.value = 'Categoria ja existe.'
    return
  }

  categorias.value.push({
    id: gerarId(),
    nome,
    userId: authStore.user.uid
  })
  salvarCategorias()
  novaCategoria.value = ''
}

// Remove uma categoria personalizada.
const excluirCategoria = (id) => {
  categorias.value = categorias.value.filter(c => c.id !== id)
  salvarCategorias()
}

// Preenche o modal de edição com os dados da transação escolhida.
const abrirEdicao = (t) => {
  editId.value = t.id
  editDescricao.value = t.descricao
  editValor.value = t.valor
  editTipo.value = t.tipo
  editCategoria.value = t.categoria
  erroModal.value = ''
  modalAberto.value = true
}

// Atualiza a transação já existente no armazenamento local.
const salvarEdicao = () => {
  erroModal.value = ''
  if (!editValor.value || !editCategoria.value) {
    erroModal.value = 'Preencha valor e categoria.'
    return
  }
  if (Number(editValor.value) <= 0) {
    erroModal.value = 'O valor deve ser maior que zero.'
    return
  }

  const index = transacoes.value.findIndex(t => t.id === editId.value)
  if (index !== -1) {
    transacoes.value[index] = {
      ...transacoes.value[index],
      descricao: resolverDescricao(editDescricao.value, editCategoria.value),
      valor: Number(editValor.value),
      tipo: editTipo.value,
      categoria: editCategoria.value
    }
    salvarTransacoes()
  }

  modalAberto.value = false
}

// Exclui uma transação do histórico principal.
const excluir = (id) => {
  if (confirm('Deseja excluir esta transacao?')) {
    transacoes.value = transacoes.value.filter(t => t.id !== id)
    salvarTransacoes()
  }
}

// Atualiza a tela quando dados mudam em outras views.
onMounted(() => {
  if (authStore.user) carregarDados()
  window.addEventListener(DATA_CHANGE_EVENT, carregarDados)
  window.addEventListener('storage', carregarDados)
})

onBeforeUnmount(() => {
  window.removeEventListener(DATA_CHANGE_EVENT, carregarDados)
  window.removeEventListener('storage', carregarDados)
})

watch(() => authStore.user, (newUser) => {
  if (newUser) carregarDados()
  else {
    transacoes.value = []
    categorias.value = []
  }
})
</script>

<template>
  <section class="transacoes-page">
    <div class="page-header transacoes-header">
      <div class="page-header-left">
        <h1><i class="fa-solid fa-list"></i> Transações</h1>
        <p>Centralize o controle das suas receitas e despesas com filtros, categorias e histórico detalhado.</p>
      </div>
      <button class="secondary btn-sm" @click="abrirCategorias">
        <i class="fa-solid fa-tags"></i>
        Gerenciar categorias
      </button>
    </div>

    <div class="transacoes-summary-grid">
      <article class="summary-card summary-card--green">
        <span class="summary-icon"><i class="fa-solid fa-arrow-trend-up"></i></span>
        <div class="summary-body">
          <span class="summary-label">Receitas</span>
          <strong class="summary-value valor-receita">{{ formatarValor(resumoGeral.receitas) }}</strong>
          <span class="summary-sub">Entradas registradas</span>
        </div>
      </article>

      <article class="summary-card summary-card--red">
        <span class="summary-icon"><i class="fa-solid fa-arrow-trend-down"></i></span>
        <div class="summary-body">
          <span class="summary-label">Despesas</span>
          <strong class="summary-value valor-despesa">{{ formatarValor(resumoGeral.despesas) }}</strong>
          <span class="summary-sub">Saídas registradas</span>
        </div>
      </article>

      <article class="summary-card" :class="resumoGeral.saldo >= 0 ? 'summary-card--teal' : 'summary-card--red-soft'">
        <span class="summary-icon"><i class="fa-solid fa-wallet"></i></span>
        <div class="summary-body">
          <span class="summary-label">Saldo atual</span>
          <strong class="summary-value" :class="resumoGeral.saldo >= 0 ? 'valor-receita' : 'valor-despesa'">{{ formatarValor(resumoGeral.saldo) }}</strong>
          <span class="summary-sub">Resultado acumulado</span>
        </div>
      </article>

      <article class="summary-card summary-card--blue">
        <span class="summary-icon"><i class="fa-solid fa-receipt"></i></span>
        <div class="summary-body">
          <span class="summary-label">Transações</span>
          <strong class="summary-value">{{ resumoGeral.quantidade }}</strong>
          <span class="summary-sub">Total cadastradas</span>
        </div>
      </article>
    </div>

    <div class="action-strip card">
      <div class="action-strip-main">
        <button @click="mostrarFormulario ? fecharFormulario() : abrirFormulario()">
          <i class="fa-solid fa-plus"></i>
          {{ mostrarFormulario ? 'Fechar criação' : 'Nova transação' }}
        </button>
        <button class="secondary" @click="abrirCategorias">
          <i class="fa-solid fa-tags"></i>
          Gerenciar categorias
        </button>
      </div>

      <div class="action-strip-filters">
        <button class="chip-filter" :class="filtroTipo === 'todos' && 'chip-filter--active'" @click="filtroTipo = 'todos'">Todas</button>
        <button class="chip-filter" :class="filtroTipo === 'receita' && 'chip-filter--active'" @click="filtroTipo = 'receita'">Receitas</button>
        <button class="chip-filter" :class="filtroTipo === 'despesa' && 'chip-filter--active'" @click="filtroTipo = 'despesa'">Despesas</button>
      </div>
    </div>

    <transition name="panel-slide">
      <section v-if="mostrarFormulario" class="card composer-card">
        <div class="composer-header">
          <div>
            <span class="section-eyebrow">Novo lançamento</span>
            <h2>Adicionar transação</h2>
            <p class="muted">Preencha os dados abaixo para registrar uma nova movimentação.</p>
          </div>
          <button class="secondary btn-sm" @click="fecharFormulario">
            <i class="fa-solid fa-xmark"></i>
            Fechar
          </button>
        </div>

        <div class="form-nova">
          <label class="field field--wide">
            Descrição
            <input v-model="descricao" placeholder="Ex: Aluguel, salário, supermercado..." />
          </label>

          <div class="tipo-toggle">
            <button class="tipo-btn" :class="tipo === 'receita' ? 'active-receita' : ''" @click="tipo = 'receita'" type="button">
              <i class="fa-solid fa-arrow-trend-up"></i>
              Receita
            </button>
            <button class="tipo-btn" :class="tipo === 'despesa' ? 'active-despesa' : ''" @click="tipo = 'despesa'" type="button">
              <i class="fa-solid fa-arrow-trend-down"></i>
              Despesa
            </button>
          </div>

          <div class="form-row-3">
            <label class="field">
              Valor (R$)
              <input v-model="valor" type="number" step="0.01" min="0.01" placeholder="0,00" />
            </label>

            <label class="field">
              Categoria
              <select v-model="categoria">
                <option value="" disabled>Selecione...</option>
                <option v-for="cat in categorias" :key="cat.id" :value="cat.nome">{{ cat.nome }}</option>
              </select>
            </label>
          </div>

          <p v-if="erro" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ erro }}</p>

          <div class="composer-actions">
            <button @click="salvar">
              <i class="fa-solid fa-check"></i>
              Salvar transação
            </button>
            <button class="secondary" @click="fecharFormulario">
              <i class="fa-solid fa-xmark"></i>
              Cancelar
            </button>
          </div>
        </div>
      </section>
    </transition>

    <section class="card filtros-card">
      <div class="filtros-header">
        <div>
          <span class="section-eyebrow">Filtrar resultados</span>
          <h2>Explorar histórico</h2>
        </div>
        <button class="secondary btn-sm" @click="limparFiltros" :disabled="!filtrosAtivos">
          <i class="fa-solid fa-xmark"></i>
          Limpar
        </button>
      </div>

      <div class="filtros-grid">
        <label class="field field--search">
          Buscar
          <input v-model="filtroBusca" placeholder="Buscar por descrição..." class="input-busca" />
        </label>

        <label class="field">
          Tipo
          <select v-model="filtroTipo">
            <option value="todos">Todos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>
        </label>

        <label class="field">
          Categoria
          <select v-model="filtroCategoria">
            <option value="todas">Todas</option>
            <option v-for="cat in categorias" :key="cat.id" :value="cat.nome">{{ cat.nome }}</option>
          </select>
        </label>

        <label class="field">
          De
          <input v-model="filtroDataDe" type="date" />
        </label>

        <label class="field">
          Até
          <input v-model="filtroDataAte" type="date" />
        </label>
      </div>
    </section>

    <section class="card transacoes-list-card">
      <div class="list-header">
        <div>
          <span class="section-eyebrow">Lista principal</span>
          <h2>Movimentações</h2>
          <p class="muted">Acompanhe as transações registradas e use os filtros para refinar sua visão.</p>
        </div>

        <div class="list-summary">
          <span class="chip chip-info"><i class="fa-solid fa-filter"></i> {{ totalFiltrado.quantidade }} resultado(s)</span>
          <span class="chip chip-success">+ {{ formatarValor(totalFiltrado.receitas) }}</span>
          <span class="chip chip-danger">- {{ formatarValor(totalFiltrado.despesas) }}</span>
        </div>
      </div>

      <div v-if="transacoesFiltradas.length" class="transactions-list">
        <article v-for="t in transacoesFiltradas" :key="t.id" class="transacao-row">
          <div class="transacao-main">
            <div class="transacao-badge" :class="t.tipo === 'receita' ? 'is-receita' : 'is-despesa'">
              <i :class="`fa-solid ${t.tipo === 'receita' ? 'fa-arrow-down-long' : 'fa-arrow-up-long'}`"></i>
            </div>

            <div class="transacao-info">
              <div class="transacao-topline">
                <span class="transacao-desc">{{ t.descricao }}</span>
                <span class="transacao-category">{{ t.categoria }}</span>
                <span v-if="isMetaMovimentacao(t)" class="transacao-tag">Cofrinho</span>
              </div>
              <span class="transacao-meta">{{ formatarData(t.criadoEm) }}</span>
            </div>
          </div>

          <div class="transacao-side">
            <span class="transacao-valor" :class="t.tipo === 'receita' ? 'valor-receita' : 'valor-despesa'">
              {{ t.tipo === 'receita' ? '+' : '-' }} {{ formatarValor(t.valor) }}
            </span>

            <div class="transacao-acoes">
              <button class="btn-icone" @click="abrirEdicao(t)" title="Editar">
                <i class="fa-solid fa-pen"></i>
              </button>
              <button class="btn-icone danger" @click="excluir(t.id)" title="Excluir">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon"><i class="fa-solid fa-receipt"></i></div>
        <span class="empty-title">Nenhuma transação encontrada</span>
        <span class="empty-sub">Cadastre sua primeira movimentação ou ajuste os filtros para ampliar os resultados.</span>
        <button @click="abrirFormulario">
          <i class="fa-solid fa-plus"></i>
          Adicionar primeira transação
        </button>
      </div>
    </section>
  </section>

  <div v-if="modalCategorias" class="modal-overlay" @click.self="fecharCategorias">
    <section class="card modal modal-categorias">
      <div class="modal-header">
        <div>
          <span class="section-eyebrow">Organização</span>
          <h2><i class="fa-solid fa-tags"></i> Gerenciar categorias</h2>
        </div>
        <button class="secondary btn-sm" @click="fecharCategorias">
          <i class="fa-solid fa-xmark"></i>
          Fechar
        </button>
      </div>

      <div class="cat-manager">
        <div class="cat-form">
          <input v-model="novaCategoria" placeholder="Nova categoria..." @keyup.enter="adicionarCategoria" />
          <button @click="adicionarCategoria"><i class="fa-solid fa-plus"></i> Adicionar</button>
        </div>
        <p v-if="erroCategoria" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ erroCategoria }}</p>

        <div v-if="categorias.length" class="cat-lista">
          <div v-for="cat in categorias" :key="cat.id" class="cat-item">
            <span>{{ cat.nome }}</span>
            <button class="btn-icone danger" @click="excluirCategoria(cat.id)" title="Excluir categoria">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div v-else class="empty-state empty-state--compact">
          <div class="empty-icon"><i class="fa-solid fa-tags"></i></div>
          <span class="empty-title">Nenhuma categoria criada</span>
          <span class="empty-sub">Crie categorias para organizar melhor suas movimentações.</span>
        </div>
      </div>
    </section>
  </div>

  <div v-if="modalAberto" class="modal-overlay" @click.self="modalAberto = false">
    <section class="card modal">
      <h2><i class="fa-solid fa-pen"></i> Editar Transacao</h2>
      <label class="field">Descricao<input v-model="editDescricao" /></label>

      <div class="tipo-toggle">
        <button class="tipo-btn" :class="editTipo === 'receita' ? 'active-receita' : ''" @click="editTipo = 'receita'" type="button">Receita</button>
        <button class="tipo-btn" :class="editTipo === 'despesa' ? 'active-despesa' : ''" @click="editTipo = 'despesa'" type="button">Despesa</button>
      </div>

      <div class="form-row-3">
        <label class="field">Valor (R$)<input v-model="editValor" type="number" step="0.01" min="0.01" /></label>
        <label class="field">Categoria
          <select v-model="editCategoria">
            <option value="" disabled>Selecione...</option>
            <option v-for="cat in categorias" :key="cat.id" :value="cat.nome">{{ cat.nome }}</option>
          </select>
        </label>
      </div>
      <p v-if="erroModal" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ erroModal }}</p>
      <div class="actions">
        <button @click="salvarEdicao"><i class="fa-solid fa-check"></i> Salvar</button>
        <button class="secondary" @click="modalAberto = false"><i class="fa-solid fa-xmark"></i> Cancelar</button>
      </div>
    </section>
  </div>
</template>
