const DEFAULT_CATEGORIES = [
  'Sal\u00e1rio',
  'Freelance',
  'Investimentos',
  'Vendas',
  'Renda extra',
  'Moradia',
  'Alimenta\u00e7\u00e3o',
  'Transporte',
  'Contas',
  'Lazer',
  'Sa\u00fade',
  'Educa\u00e7\u00e3o',
  'Assinaturas',
  'Compras',
  'Impostos',
  'Outros',
  'Cofrinhos'
]

const createDate = (year, monthIndex, day, hour = 12, minute = 0) =>
  new Date(year, monthIndex, day, hour, minute, 0, 0).toISOString()

const createCategory = (userId, nome, index) => ({
  id: 'demo-cat-' + (index + 1),
  nome,
  userId
})

const createMeta = ({ id, nome, valorMeta, valorAtual, criadoEm, userId }) => ({
  id,
  nome,
  valorMeta,
  valorAtual,
  userId,
  criadoEm
})

const createTransaction = ({
  id,
  descricao,
  valor,
  tipo,
  categoria,
  criadoEm,
  userId,
  metaId
}) => ({
  id,
  descricao,
  valor,
  tipo,
  categoria,
  userId,
  criadoEm,
  ...(metaId ? { metaId } : {})
})

export const buildDemoUserSeed = (userId) => {
  const metas = [
    createMeta({ id: 'demo-meta-reserva', nome: 'Reserva de emerg\u00eancia', valorMeta: 5000, valorAtual: 900, criadoEm: createDate(2026, 0, 7, 9), userId }),
    createMeta({ id: 'demo-meta-notebook', nome: 'Notebook novo', valorMeta: 4200, valorAtual: 550, criadoEm: createDate(2026, 0, 10, 10), userId }),
    createMeta({ id: 'demo-meta-viagem', nome: 'Viagem de f\u00e9rias', valorMeta: 2800, valorAtual: 350, criadoEm: createDate(2026, 1, 12, 10), userId })
  ]

  const transacoes = [
    createTransaction({ id: 'demo-tx-001', descricao: 'Sal\u00e1rio', valor: 5000, tipo: 'receita', categoria: 'Sal\u00e1rio', criadoEm: createDate(2026, 0, 5, 8), userId }),
    createTransaction({ id: 'demo-tx-002', descricao: 'Aluguel', valor: 1600, tipo: 'despesa', categoria: 'Moradia', criadoEm: createDate(2026, 0, 6, 10), userId }),
    createTransaction({ id: 'demo-tx-003', descricao: 'Mercado do m\u00eas', valor: 680, tipo: 'despesa', categoria: 'Alimenta\u00e7\u00e3o', criadoEm: createDate(2026, 0, 8, 18), userId }),
    createTransaction({ id: 'demo-tx-004', descricao: 'Conta de luz e internet', valor: 320, tipo: 'despesa', categoria: 'Contas', criadoEm: createDate(2026, 0, 10, 11), userId }),
    createTransaction({ id: 'demo-tx-005', descricao: 'Transporte do m\u00eas', valor: 220, tipo: 'despesa', categoria: 'Transporte', criadoEm: createDate(2026, 0, 12, 19), userId }),
    createTransaction({ id: 'demo-tx-006', descricao: 'Aporte no cofrinho: Reserva de emerg\u00eancia', valor: 300, tipo: 'despesa', categoria: 'Cofrinhos', criadoEm: createDate(2026, 0, 15, 12), userId, metaId: 'demo-meta-reserva' }),
    createTransaction({ id: 'demo-tx-007', descricao: 'Consulta m\u00e9dica', valor: 140, tipo: 'despesa', categoria: 'Sa\u00fade', criadoEm: createDate(2026, 0, 18, 15), userId }),
    createTransaction({ id: 'demo-tx-008', descricao: 'Freelance de manuten\u00e7\u00e3o', valor: 280, tipo: 'receita', categoria: 'Freelance', criadoEm: createDate(2026, 0, 23, 16), userId }),
    createTransaction({ id: 'demo-tx-009', descricao: 'Lazer no fim de semana', valor: 160, tipo: 'despesa', categoria: 'Lazer', criadoEm: createDate(2026, 0, 26, 21), userId }),
    createTransaction({ id: 'demo-tx-010', descricao: 'Aporte no cofrinho: Notebook novo', valor: 200, tipo: 'despesa', categoria: 'Cofrinhos', criadoEm: createDate(2026, 0, 28, 13), userId, metaId: 'demo-meta-notebook' }),

    createTransaction({ id: 'demo-tx-011', descricao: 'Sal\u00e1rio', valor: 5000, tipo: 'receita', categoria: 'Sal\u00e1rio', criadoEm: createDate(2026, 1, 5, 8), userId }),
    createTransaction({ id: 'demo-tx-012', descricao: 'Aluguel', valor: 1600, tipo: 'despesa', categoria: 'Moradia', criadoEm: createDate(2026, 1, 6, 10), userId }),
    createTransaction({ id: 'demo-tx-013', descricao: 'Supermercado', valor: 720, tipo: 'despesa', categoria: 'Alimenta\u00e7\u00e3o', criadoEm: createDate(2026, 1, 8, 18), userId }),
    createTransaction({ id: 'demo-tx-014', descricao: '\u00c1gua, luz e internet', valor: 340, tipo: 'despesa', categoria: 'Contas', criadoEm: createDate(2026, 1, 9, 11), userId }),
    createTransaction({ id: 'demo-tx-015', descricao: 'Transporte do m\u00eas', valor: 240, tipo: 'despesa', categoria: 'Transporte', criadoEm: createDate(2026, 1, 11, 18), userId }),
    createTransaction({ id: 'demo-tx-016', descricao: 'Assinaturas', valor: 89, tipo: 'despesa', categoria: 'Assinaturas', criadoEm: createDate(2026, 1, 14, 9), userId }),
    createTransaction({ id: 'demo-tx-017', descricao: 'Aporte no cofrinho: Reserva de emerg\u00eancia', valor: 300, tipo: 'despesa', categoria: 'Cofrinhos', criadoEm: createDate(2026, 1, 16, 12), userId, metaId: 'demo-meta-reserva' }),
    createTransaction({ id: 'demo-tx-018', descricao: 'Venda de cadeira usada', valor: 180, tipo: 'receita', categoria: 'Vendas', criadoEm: createDate(2026, 1, 18, 16), userId }),
    createTransaction({ id: 'demo-tx-019', descricao: 'Aporte no cofrinho: Notebook novo', valor: 200, tipo: 'despesa', categoria: 'Cofrinhos', criadoEm: createDate(2026, 1, 20, 13), userId, metaId: 'demo-meta-notebook' }),
    createTransaction({ id: 'demo-tx-020', descricao: 'Jantar e cinema', valor: 190, tipo: 'despesa', categoria: 'Lazer', criadoEm: createDate(2026, 1, 22, 20), userId }),
    createTransaction({ id: 'demo-tx-021', descricao: 'Aporte no cofrinho: Viagem de f\u00e9rias', valor: 100, tipo: 'despesa', categoria: 'Cofrinhos', criadoEm: createDate(2026, 1, 25, 12), userId, metaId: 'demo-meta-viagem' }),
    createTransaction({ id: 'demo-tx-022', descricao: 'Farm\u00e1cia', valor: 130, tipo: 'despesa', categoria: 'Sa\u00fade', criadoEm: createDate(2026, 1, 27, 11), userId }),

    createTransaction({ id: 'demo-tx-023', descricao: 'Sal\u00e1rio', valor: 5000, tipo: 'receita', categoria: 'Sal\u00e1rio', criadoEm: createDate(2026, 2, 5, 8), userId }),
    createTransaction({ id: 'demo-tx-024', descricao: 'Aluguel', valor: 1600, tipo: 'despesa', categoria: 'Moradia', criadoEm: createDate(2026, 2, 6, 10), userId }),
    createTransaction({ id: 'demo-tx-025', descricao: 'Mercado do m\u00eas', valor: 760, tipo: 'despesa', categoria: 'Alimenta\u00e7\u00e3o', criadoEm: createDate(2026, 2, 9, 18), userId }),
    createTransaction({ id: 'demo-tx-026', descricao: 'Conta de luz, \u00e1gua e internet', valor: 330, tipo: 'despesa', categoria: 'Contas', criadoEm: createDate(2026, 2, 10, 11), userId }),
    createTransaction({ id: 'demo-tx-027', descricao: 'Transporte do m\u00eas', valor: 210, tipo: 'despesa', categoria: 'Transporte', criadoEm: createDate(2026, 2, 12, 18), userId }),
    createTransaction({ id: 'demo-tx-028', descricao: 'Freelance de arte para Instagram', valor: 220, tipo: 'receita', categoria: 'Freelance', criadoEm: createDate(2026, 2, 15, 16), userId }),
    createTransaction({ id: 'demo-tx-029', descricao: 'Aporte no cofrinho: Reserva de emerg\u00eancia', valor: 300, tipo: 'despesa', categoria: 'Cofrinhos', criadoEm: createDate(2026, 2, 17, 12), userId, metaId: 'demo-meta-reserva' }),
    createTransaction({ id: 'demo-tx-030', descricao: 'Aporte no cofrinho: Notebook novo', valor: 150, tipo: 'despesa', categoria: 'Cofrinhos', criadoEm: createDate(2026, 2, 19, 13), userId, metaId: 'demo-meta-notebook' }),
    createTransaction({ id: 'demo-tx-031', descricao: 'Aporte no cofrinho: Viagem de f\u00e9rias', valor: 250, tipo: 'despesa', categoria: 'Cofrinhos', criadoEm: createDate(2026, 2, 21, 12), userId, metaId: 'demo-meta-viagem' }),
    createTransaction({ id: 'demo-tx-032', descricao: 'Happy hour com amigos', valor: 180, tipo: 'despesa', categoria: 'Lazer', criadoEm: createDate(2026, 2, 23, 21), userId }),
    createTransaction({ id: 'demo-tx-033', descricao: 'Consulta e exames', valor: 190, tipo: 'despesa', categoria: 'Sa\u00fade', criadoEm: createDate(2026, 2, 26, 15), userId }),
    createTransaction({ id: 'demo-tx-034', descricao: 'Material para o escrit\u00f3rio', valor: 140, tipo: 'despesa', categoria: 'Compras', criadoEm: createDate(2026, 2, 28, 17), userId })
  ]

  return {
    categorias: DEFAULT_CATEGORIES.map((nome, index) => createCategory(userId, nome, index)),
    metas,
    transacoes
  }
}
