<script setup>
// ============================================================
// ARQUIVO: views/TransacoesView.vue
// CRUD completo + filtros avançados (data, categoria, tipo, busca)
// + Categorias customizáveis pelo usuário
// ============================================================

import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import {
  collection, addDoc, onSnapshot, query,
  where, deleteDoc, updateDoc, doc, serverTimestamp
} from 'firebase/firestore'
import { auth, db } from '../firebase/config'

// ── Formulário nova transação ──
const descricao = ref('')
const valor     = ref('')
const tipo      = ref('despesa')
const categoria = ref('')
const erro      = ref('')

// ── Lista ──
const transacoes = ref([])

// ── Filtros ──
const filtroBusca     = ref('')
const filtroTipo      = ref('todos')
const filtroCategoria = ref('todas')
const filtroDataDe    = ref('')
const filtroDataAte   = ref('')

// ── Categorias ──
const categorias        = ref([])
const novaCategoria     = ref('')
const erroCategoria     = ref('')
const mostrarCategorias = ref(false)
let unsubCategorias     = null

// ── Modal edição ──
const modalAberto   = ref(false)
const editId        = ref('')
const editDescricao = ref('')
const editValor     = ref('')
const editTipo      = ref('')
const editCategoria = ref('')
const erroModal     = ref('')

let unsubscribe = null

// ── Computed: transações filtradas ──
const transacoesFiltradas = computed(() => {
  return transacoes.value
    .filter(t => {
      // Filtro tipo
      if (filtroTipo.value !== 'todos' && t.tipo !== filtroTipo.value) return false

      // Filtro busca
      if (filtroBusca.value && !t.descricao.toLowerCase().includes(filtroBusca.value.toLowerCase())) return false

      // Filtro categoria
      if (filtroCategoria.value !== 'todas' && t.categoria !== filtroCategoria.value) return false

      // Filtro data
      if (filtroDataDe.value || filtroDataAte.value) {
        const data = t.criadoEm?.toDate ? t.criadoEm.toDate() : new Date(t.criadoEm)
        if (filtroDataDe.value && data < new Date(filtroDataDe.value)) return false
        if (filtroDataAte.value && data > new Date(filtroDataAte.value + 'T23:59:59')) return false
      }

      return true
    })
    .sort((a, b) => (b.criadoEm?.seconds || 0) - (a.criadoEm?.seconds || 0))
})

// Totais das transações filtradas
const totalFiltrado = computed(() => ({
  receitas: transacoesFiltradas.value.filter(t => t.tipo === 'receita').reduce((a, t) => a + t.valor, 0),
  despesas: transacoesFiltradas.value.filter(t => t.tipo === 'despesa').reduce((a, t) => a + t.valor, 0),
}))

const formatarValor = (v) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const formatarData = (ts) => {
  if (!ts) return ''
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('pt-BR')
}

const limparFiltros = () => {
  filtroBusca.value     = ''
  filtroTipo.value      = 'todos'
  filtroCategoria.value = 'todas'
  filtroDataDe.value    = ''
  filtroDataAte.value   = ''
}

// ── CREATE transação ──
const salvar = async () => {
  erro.value = ''
  if (!descricao.value || !valor.value || !categoria.value) {
    erro.value = 'Preencha todos os campos.'
    return
  }
  if (Number(valor.value) <= 0) {
    erro.value = 'O valor deve ser maior que zero.'
    return
  }
  await addDoc(collection(db, 'transacoes'), {
    descricao:  descricao.value,
    valor:      Number(valor.value),
    tipo:       tipo.value,
    categoria:  categoria.value,
    userId:     auth.currentUser.uid,
    criadoEm:   serverTimestamp()
  })
  descricao.value = ''
  valor.value     = ''
  categoria.value = ''
}

// ── READ ──
const ouvirTransacoes = () => {
  const q = query(collection(db, 'transacoes'), where('userId', '==', auth.currentUser.uid))
  unsubscribe = onSnapshot(q, (snap) => {
    transacoes.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}

const ouvirCategorias = () => {
  const q = query(collection(db, 'categorias'), where('userId', '==', auth.currentUser.uid))
  unsubCategorias = onSnapshot(q, (snap) => {
    categorias.value = snap.docs.map(d => ({ id: d.id, ...d.data() }))
  })
}

// ── CREATE categoria ──
const adicionarCategoria = async () => {
  erroCategoria.value = ''
  const nome = novaCategoria.value.trim()
  if (!nome) { erroCategoria.value = 'Digite um nome.'; return }
  if (categorias.value.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
    erroCategoria.value = 'Categoria já existe.'
    return
  }
  await addDoc(collection(db, 'categorias'), { nome, userId: auth.currentUser.uid })
  novaCategoria.value = ''
}

// ── DELETE categoria ──
const excluirCategoria = async (id) => {
  await deleteDoc(doc(db, 'categorias', id))
}

// ── EDITAR ──
const abrirEdicao = (t) => {
  editId.value        = t.id
  editDescricao.value = t.descricao
  editValor.value     = t.valor
  editTipo.value      = t.tipo
  editCategoria.value = t.categoria
  erroModal.value     = ''
  modalAberto.value   = true
}

const salvarEdicao = async () => {
  erroModal.value = ''
  if (!editDescricao.value || !editValor.value || !editCategoria.value) {
    erroModal.value = 'Preencha todos os campos.'
    return
  }
  if (Number(editValor.value) <= 0) {
    erroModal.value = 'O valor deve ser maior que zero.'
    return
  }
  await updateDoc(doc(db, 'transacoes', editId.value), {
    descricao: editDescricao.value,
    valor:     Number(editValor.value),
    tipo:      editTipo.value,
    categoria: editCategoria.value
  })
  modalAberto.value = false
}

// ── DELETE transação ──
const excluir = async (id) => {
  if (confirm('Deseja excluir esta transação?')) {
    await deleteDoc(doc(db, 'transacoes', id))
  }
}

onMounted(() => {
  if (auth.currentUser) { ouvirTransacoes(); ouvirCategorias() }
})
onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
  if (unsubCategorias) unsubCategorias()
})
</script>

<template>
  <section class="card">

    <div class="topo-header">
      <div>
        <h1><i class="fa-solid fa-list"></i> Transações</h1>
        <p class="muted">Gerencie suas receitas e despesas</p>
      </div>
      <button class="secondary btn-sm" @click="mostrarCategorias = !mostrarCategorias">
        <i class="fa-solid fa-tags"></i>
        {{ mostrarCategorias ? 'Fechar' : 'Categorias' }}
      </button>
    </div>

    <!-- Gerenciador de categorias -->
    <div v-if="mostrarCategorias" class="cat-manager">
      <h3>Minhas Categorias</h3>
      <div class="cat-form">
        <input v-model="novaCategoria" placeholder="Nova categoria..." @keyup.enter="adicionarCategoria" />
        <button @click="adicionarCategoria"><i class="fa-solid fa-plus"></i> Adicionar</button>
      </div>
      <p v-if="erroCategoria" class="error"><i class="fa-solid fa-triangle-exclamation"></i> {{ erroCategoria }}</p>
      <div v-if="categorias.length" class="cat-lista">
        <div v-for="cat in categorias" :key="cat.id" class="cat-item">
          <span>{{ cat.nome }}</span>
          <button class="btn-icone danger" @click="excluirCategoria(cat.id)"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
      <p v-else class="muted">Nenhuma categoria criada ainda.</p>
    </div>

    <!-- Formulário nova transação -->
    <div class="form-nova">
      <label class="field">
        Descrição
        <input v-model="descricao" placeholder="Ex: Aluguel, Salário..." />
      </label>
      <div class="form-row-3">
        <label class="field">
          Valor (R$)
          <input v-model="valor" type="number" step="0.01" min="0.01" placeholder="0,00" />
        </label>
        <label class="field">
          Tipo
          <select v-model="tipo">
            <option value="despesa">💸 Despesa</option>
            <option value="receita">💰 Receita</option>
          </select>
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
      <button @click="salvar"><i class="fa-solid fa-plus"></i> Adicionar transação</button>
    </div>

    <!-- ── FILTROS AVANÇADOS ── -->
    <div class="filtros-box">
      <div class="filtros-titulo">
        <span>🔍 Filtros</span>
        <button class="secondary btn-sm" @click="limparFiltros">
          <i class="fa-solid fa-xmark"></i> Limpar
        </button>
      </div>

      <div class="filtros-grid">
        <!-- Busca -->
        <label class="field" style="margin:0">
          Buscar
          <input v-model="filtroBusca" placeholder="Buscar descrição..." class="input-busca" />
        </label>

        <!-- Tipo -->
        <label class="field" style="margin:0">
          Tipo
          <select v-model="filtroTipo">
            <option value="todos">Todos</option>
            <option value="receita">💰 Receitas</option>
            <option value="despesa">💸 Despesas</option>
          </select>
        </label>

        <!-- Categoria -->
        <label class="field" style="margin:0">
          Categoria
          <select v-model="filtroCategoria">
            <option value="todas">Todas</option>
            <option v-for="cat in categorias" :key="cat.id" :value="cat.nome">{{ cat.nome }}</option>
          </select>
        </label>

        <!-- Data de -->
        <label class="field" style="margin:0">
          De
          <input v-model="filtroDataDe" type="date" />
        </label>

        <!-- Data até -->
        <label class="field" style="margin:0">
          Até
          <input v-model="filtroDataAte" type="date" />
        </label>
      </div>
    </div>

    <!-- Resumo dos filtrados -->
    <div class="resumo-filtrado" v-if="transacoesFiltradas.length">
      <span class="muted">{{ transacoesFiltradas.length }} resultado(s)</span>
      <span class="valor-receita">+{{ formatarValor(totalFiltrado.receitas) }}</span>
      <span class="valor-despesa">-{{ formatarValor(totalFiltrado.despesas) }}</span>
    </div>

    <!-- Lista -->
    <ul v-if="transacoesFiltradas.length">
      <li v-for="t in transacoesFiltradas" :key="t.id" class="transacao-item">
        <div class="transacao-info">
          <span class="transacao-desc">{{ t.descricao }}</span>
          <span class="transacao-meta muted">{{ t.categoria }} · {{ formatarData(t.criadoEm) }}</span>
        </div>
        <div class="transacao-direita">
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
      </li>
    </ul>
    <p v-else class="muted">Nenhuma transação encontrada com os filtros aplicados.</p>

  </section>

  <!-- Modal edição -->
  <div v-if="modalAberto" class="modal-overlay" @click.self="modalAberto = false">
    <section class="card modal">
      <h2><i class="fa-solid fa-pen"></i> Editar Transação</h2>
      <label class="field">Descrição<input v-model="editDescricao" /></label>
      <div class="form-row-3">
        <label class="field">Valor (R$)<input v-model="editValor" type="number" step="0.01" min="0.01" /></label>
        <label class="field">Tipo
          <select v-model="editTipo">
            <option value="despesa">💸 Despesa</option>
            <option value="receita">💰 Receita</option>
          </select>
        </label>
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

<style scoped>
.topo-header { display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 12px; }
.btn-sm { font-size: 0.8rem !important; padding: 7px 14px !important; }

.cat-manager {
  margin: 14px 0; padding: 18px;
  background: rgba(255,255,255,0.03);
  border: 1px solid var(--glass-border); border-radius: 14px;
  animation: fadeUp 0.3s ease;
}
@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

.cat-form { display: flex; gap: 10px; margin-bottom: 12px; }
.cat-form input {
  flex: 1; padding: 10px 14px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  border-radius: 8px; color: var(--text);
  font-family: inherit; font-size: 0.95rem; outline: none;
}
.cat-form input:focus { border-color: var(--accent); }
.cat-form input::placeholder { color: var(--text-muted); }
.cat-lista { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
.cat-item {
  display: flex; align-items: center; gap: 8px;
  padding: 5px 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border); border-radius: 999px;
  font-size: 0.86rem; color: var(--text-soft);
}

.form-nova { margin: 18px 0; display: grid; gap: 10px; }
.form-row-3 { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }

select {
  padding: 11px 13px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  border-radius: 8px; color: var(--text);
  font-family: inherit; font-size: 0.95rem; outline: none;
  cursor: pointer; width: 100%; transition: border-color 0.2s;
}
select:focus { border-color: var(--accent); }
select option { background: #0c1518; color: var(--text); }

/* Filtros avançados */
.filtros-box {
  background: rgba(255,255,255,0.02);
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  padding: 16px 18px;
  margin: 16px 0;
}
.filtros-titulo {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
  font-size: 0.85rem; font-weight: 600; color: var(--text-soft);
}
.filtros-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}
.filtros-grid input[type="date"] {
  padding: 11px 13px;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  border-radius: 8px; color: var(--text);
  font-family: inherit; font-size: 0.95rem; outline: none; width: 100%;
  transition: border-color 0.2s;
}
.filtros-grid input[type="date"]:focus { border-color: var(--accent); }
.input-busca {
  padding: 11px 13px; width: 100%;
  background: rgba(255,255,255,0.04);
  border: 1px solid var(--glass-border);
  border-radius: 8px; color: var(--text);
  font-family: inherit; font-size: 0.95rem; outline: none;
}
.input-busca::placeholder { color: var(--text-muted); }
.input-busca:focus { border-color: var(--accent); }

.resumo-filtrado {
  display: flex; gap: 16px; align-items: center;
  padding: 10px 0; font-size: 0.88rem; font-weight: 600;
}

/* Lista */
.transacao-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 13px 0; border-bottom: 1px solid rgba(255,255,255,0.05); gap: 12px;
}
.transacao-item:last-child { border-bottom: none; }
.transacao-info { display: flex; flex-direction: column; gap: 2px; flex: 1; }
.transacao-desc { font-weight: 600; color: var(--text); font-size: 0.93rem; }
.transacao-meta { font-size: 0.78rem; }
.transacao-direita { display: flex; align-items: center; gap: 12px; }
.transacao-valor { font-weight: 700; font-size: 0.93rem; white-space: nowrap; }
.valor-receita { color: var(--success) !important; }
.valor-despesa { color: var(--danger) !important; }
.transacao-acoes { display: flex; gap: 5px; }

.btn-icone {
  padding: 7px 10px !important; font-size: 0.8rem !important;
  background: rgba(255,255,255,0.04) !important;
  color: var(--text-soft) !important;
  border: 1px solid var(--glass-border) !important;
  box-shadow: none !important; animation: none !important;
}
.btn-icone::before { display: none !important; }
.btn-icone:hover { background: var(--accent-dim) !important; color: var(--accent) !important; border-color: rgba(0,214,143,0.3) !important; transform: translateY(-1px) !important; }
.btn-icone.danger:hover { background: var(--danger-dim) !important; color: var(--danger) !important; border-color: rgba(255,80,80,0.3) !important; }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.82);
  backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 100;
}
.modal { max-width: 500px; width: 100%; animation: popIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both; }
@keyframes popIn { from { opacity:0; transform:scale(0.88); } to { opacity:1; transform:scale(1); } }
</style>