import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'node:fs'

const serviceAccount = JSON.parse(
  readFileSync('./serviceAccountKey.json', 'utf8')
)

if (getApps().length === 0) {
  initializeApp({
    credential: cert(serviceAccount)
  })
}

export const db = getFirestore()