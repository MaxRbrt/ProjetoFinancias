export const DEMO_USER_EMAIL = 'demo.financeapp@example.com'
export const DEMO_USER_PASSWORD = 'Demo@2026'
export const DEMO_USER_DISPLAY_NAME = 'FinanceApp Demo'
export const DEMO_USER_PHONE = '(11) 99999-1234'
export const DEMO_USER_CREATED_AT = '10/04/2026'
export const DEMO_USER_SEED_VERSION = 'demo-v2'
const normalizeEmail = (email = '') => email.trim().toLowerCase()
export const isDemoEmail = (email = '') => normalizeEmail(email) === DEMO_USER_EMAIL
export const isDemoCredentialPair = (email = '', password = '') =>
  isDemoEmail(email) && password === DEMO_USER_PASSWORD
export const isDemoAuthUser = (user) => isDemoEmail(user?.email || '')
