import { defineStore } from 'pinia'

const MONTH_NAMES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const MONTH_NAMES_LONG = ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

const getCurrentMonthPeriod = () => {
  const now = new Date()
  return {
    year: now.getFullYear(),
    month: now.getMonth()
  }
}

export const isMonthPeriod = (period) =>
  period?.mode === 'month' && Number.isInteger(period.year) && Number.isInteger(period.month)

const getTransactionDate = (transaction) => {
  if (!transaction?.criadoEm) return null
  const date = new Date(transaction.criadoEm)
  return Number.isNaN(date.getTime()) ? null : date
}

export const getLatestTransactionMonth = (transactions = []) => {
  let latest = null

  transactions.forEach((transaction) => {
    const date = getTransactionDate(transaction)
    if (!date) return

    const candidate = {
      year: date.getFullYear(),
      month: date.getMonth()
    }

    if (
      !latest ||
      candidate.year > latest.year ||
      (candidate.year === latest.year && candidate.month > latest.month)
    ) {
      latest = candidate
    }
  })

  return latest
}

const getPeriodKey = ({ year, month }) => `${year}-${String(month + 1).padStart(2, '0')}`

export const getPeriodSelectValue = (period) => {
  if (!isMonthPeriod(period)) return 'total'
  return `month:${getPeriodKey(period)}`
}

export const parsePeriodSelectValue = (value) => {
  if (value === 'total') {
    return { mode: 'total', year: null, month: null }
  }

  if (!value?.startsWith('month:')) return null

  const [year, month] = value.slice(6).split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month)) return null

  return {
    mode: 'month',
    year,
    month: month - 1
  }
}

export const formatPeriodLabel = (period, { style = 'short' } = {}) => {
  if (!isMonthPeriod(period)) return 'Total acumulado'

  const names = style === 'long' ? MONTH_NAMES_LONG : MONTH_NAMES_SHORT
  const monthName = names[period.month] || MONTH_NAMES_SHORT[period.month] || 'Mes'

  if (style === 'long') {
    return `${monthName} de ${period.year}`
  }

  return `${monthName} / ${period.year}`
}

export const buildPeriodOptions = (transactions = [], selectedPeriod = null) => {
  const options = new Map()

  transactions.forEach((transaction) => {
    const date = getTransactionDate(transaction)
    if (!date) return

    const period = {
      mode: 'month',
      year: date.getFullYear(),
      month: date.getMonth()
    }

    options.set(getPeriodKey(period), period)
  })

  if (isMonthPeriod(selectedPeriod)) {
    options.set(getPeriodKey(selectedPeriod), {
      mode: 'month',
      year: selectedPeriod.year,
      month: selectedPeriod.month
    })
  }

  if (!options.size) {
    const currentPeriod = getCurrentMonthPeriod()
    options.set(getPeriodKey(currentPeriod), {
      mode: 'month',
      year: currentPeriod.year,
      month: currentPeriod.month
    })
  }

  return Array.from(options.values())
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year
      return b.month - a.month
    })
    .map((period) => ({
      value: getPeriodSelectValue(period),
      label: formatPeriodLabel(period, { style: 'short' }),
      year: period.year,
      month: period.month
    }))
}

export const filterTransactionsByPeriod = (transactions = [], period = { mode: 'total' }) => {
  if (!isMonthPeriod(period)) {
    return [...transactions]
  }

  return transactions.filter((transaction) => {
    const date = getTransactionDate(transaction)
    if (!date) return false

    return date.getFullYear() === period.year && date.getMonth() === period.month
  })
}

export const useFinancePeriodStore = defineStore('financePeriod', {
  state: () => ({
    mode: 'month',
    year: null,
    month: null,
    initializedUserId: ''
  }),

  actions: {
    initializeForUser(userId, transactions = []) {
      if (!userId) {
        this.reset()
        return
      }

      if (this.initializedUserId === userId && (this.mode === 'total' || isMonthPeriod(this))) {
        return
      }

      const initialPeriod = getLatestTransactionMonth(transactions) || getCurrentMonthPeriod()
      this.mode = 'month'
      this.year = initialPeriod.year
      this.month = initialPeriod.month
      this.initializedUserId = userId
    },

    selectTotal() {
      this.mode = 'total'
      this.year = null
      this.month = null
    },

    selectMonth(year, month) {
      this.mode = 'month'
      this.year = year
      this.month = month
    },

    setFromSelect(value) {
      const parsed = parsePeriodSelectValue(value)
      if (!parsed) return

      if (parsed.mode === 'total') {
        this.selectTotal()
        return
      }

      this.selectMonth(parsed.year, parsed.month)
    },

    reset() {
      const currentPeriod = getCurrentMonthPeriod()
      this.mode = 'month'
      this.year = currentPeriod.year
      this.month = currentPeriod.month
      this.initializedUserId = ''
    }
  }
})


