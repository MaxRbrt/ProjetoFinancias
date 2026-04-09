// Utilitários compartilhados para persistência local e sincronização entre telas.

export const DATA_CHANGE_EVENT = 'financeapp:data-changed'

export const getUserStorageKey = (userId, type) => `user_${userId}_${type}`

export const readUserJson = (userId, type, fallback = null) => {
  try {
    const raw = localStorage.getItem(getUserStorageKey(userId, type))
    return raw ? JSON.parse(raw) : fallback
  } catch (error) {
    return fallback
  }
}

export const writeUserJson = (userId, type, value) => {
  localStorage.setItem(getUserStorageKey(userId, type), JSON.stringify(value))
}

export const readUserValue = (userId, type, fallback = '') =>
  localStorage.getItem(getUserStorageKey(userId, type)) ?? fallback

export const writeUserValue = (userId, type, value) => {
  localStorage.setItem(getUserStorageKey(userId, type), value)
}

export const notifyFinanceDataChanged = () => {
  window.dispatchEvent(new CustomEvent(DATA_CHANGE_EVENT))
}

export const generateId = () =>
  Date.now().toString(36) + Math.random().toString(36).slice(2)

export const formatCurrencyBRL = (value) =>
  Number(value).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
