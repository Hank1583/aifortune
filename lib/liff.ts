// lib/liff.ts
import liff from '@line/liff'

const LIFF_ID = '1654243071-fCXuKtLf'

export async function initLiff() {
  await liff.init({ liffId: LIFF_ID })
  return liff
}

export function getIdToken() {
  return liff.getIDToken()
}

export function isLoggedIn() {
  return liff.isLoggedIn()
}
