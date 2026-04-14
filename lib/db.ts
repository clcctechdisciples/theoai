import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data')
const usersFile = path.join(dbPath, 'users.json')

export function initDb() {
  try {
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })
    if (!fs.existsSync(usersFile)) {
      fs.writeFileSync(usersFile, JSON.stringify([]))
    }
  } catch (err) {
    console.warn('DB initialization failed (likely read-only filesystem):', err)
  }
}

export function getUsers() {
  initDb()
  const data = fs.readFileSync(usersFile, 'utf8')
  return JSON.parse(data)
}

export function addUser(user: any) {
  try {
    const users = getUsers()
    users.push(user)
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
  } catch (err) {
    console.error('Failed to add user (read-only filesystem):', err)
  }
}
