import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth'
import {
  DEMO_USER_CREATED_AT,
  DEMO_USER_DISPLAY_NAME,
  DEMO_USER_PHONE,
  DEMO_USER_SEED_VERSION,
  isDemoAuthUser,
  isDemoCredentialPair
} from './config'
import { buildDemoUserSeed } from './seedData'
import {
  notifyFinanceDataChanged,
  readUserJson,
  readUserValue,
  writeUserJson,
  writeUserValue
} from '../utils/appData'
const DEMO_RETRYABLE_SIGNIN_CODES = new Set([
  'auth/invalid-credential',
  'auth/invalid-login-credentials',
  'auth/user-not-found'
])
const DEMO_SEED_KEY = 'demoSeedVersion'
const hasExistingFinanceData = (userId) => {
  const transacoes = readUserJson(userId, 'transacoes', null)
  const metas = readUserJson(userId, 'metas', null)
  const categorias = readUserJson(userId, 'categorias', null)
  return (
    (Array.isArray(transacoes) && transacoes.length > 0) ||
    (Array.isArray(metas) && metas.length > 0) ||
    (Array.isArray(categorias) && categorias.length > 0)
  )
}
const ensureDemoProfile = async (user) => {
  if (!user || user.displayName === DEMO_USER_DISPLAY_NAME) return
  await updateProfile(user, { displayName: DEMO_USER_DISPLAY_NAME })
}
export const ensureDemoUserSeed = async (user) => {
  if (!isDemoAuthUser(user)) return false
  const currentSeedVersion = readUserValue(user.uid, DEMO_SEED_KEY, '')
  const hasFinanceData = hasExistingFinanceData(user.uid)
  const shouldReseed = currentSeedVersion !== DEMO_USER_SEED_VERSION
  if (!shouldReseed && hasFinanceData) {
    try {
      await ensureDemoProfile(user)
    } catch (error) {
      console.error('Erro ao atualizar o perfil do usu?rio demo:', error)
    }
    return false
  }
  const seed = buildDemoUserSeed(user.uid)
  writeUserJson(user.uid, 'categorias', seed.categorias)
  writeUserJson(user.uid, 'metas', seed.metas)
  writeUserJson(user.uid, 'transacoes', seed.transacoes)
  writeUserValue(user.uid, 'celular', DEMO_USER_PHONE)
  writeUserValue(user.uid, 'criadoEm', DEMO_USER_CREATED_AT)
  writeUserValue(user.uid, DEMO_SEED_KEY, DEMO_USER_SEED_VERSION)
  try {
    await ensureDemoProfile(user)
  } catch (error) {
    console.error('Erro ao atualizar o perfil do usu?rio demo:', error)
  }
  notifyFinanceDataChanged()
  return true
}
export const signInWithDemoSupport = async (auth, email, password) => {
  const normalizedEmail = email.trim().toLowerCase()
  if (!isDemoCredentialPair(normalizedEmail, password)) {
    return signInWithEmailAndPassword(auth, email, password)
  }
  try {
    const cred = await signInWithEmailAndPassword(auth, normalizedEmail, password)
    await ensureDemoUserSeed(cred.user)
    return cred
  } catch (error) {
    if (!DEMO_RETRYABLE_SIGNIN_CODES.has(error?.code)) {
      throw error
    }
    try {
      const cred = await createUserWithEmailAndPassword(auth, normalizedEmail, password)
      await ensureDemoProfile(cred.user)
      await ensureDemoUserSeed(cred.user)
      return cred
    } catch (createError) {
      if (createError?.code === 'auth/email-already-in-use') {
        throw error
      }
      throw createError
    }
  }
}
