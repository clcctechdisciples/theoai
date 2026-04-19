import fs from 'fs'
import path from 'path'

const isVercel = process.env.VERCEL === '1'
const dbPath = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data')
const usersFile = path.join(dbPath, 'users.json')
const dataFile = path.join(dbPath, 'app_data.json')

export function initDb() {
  try {
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })
    if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]))
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}))
  } catch (err) {
    console.error('DB initialization failed:', err)
  }
}

export function getUsers() {
  initDb()
  const data = fs.readFileSync(usersFile, 'utf8')
  return JSON.parse(data)
}

export function addUser(user: any) {
  const users = getUsers()
  users.push(user)
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
}

export function getData(userId: string) {
  initDb()
  try {
    const raw = fs.readFileSync(dataFile, 'utf8')
    const allData = JSON.parse(raw)
    if (!allData[userId]) {
      allData[userId] = { songs: [], backgrounds: [], audio: [] }
      fs.writeFileSync(dataFile, JSON.stringify(allData, null, 2))
    }
    return allData[userId]
  } catch (e) {
    return { songs: [], backgrounds: [], audio: [] }
  }
}

export function saveData(userId: string, key: 'songs' | 'backgrounds' | 'audio', value: any) {
  initDb()
  const raw = fs.readFileSync(dataFile, 'utf8')
  const allData = JSON.parse(raw)
  if (!allData[userId]) allData[userId] = { songs: [], backgrounds: [], audio: [] }
  
  if (key === 'songs') {
    const existingIdx = allData[userId].songs.findIndex((s: any) => s.title === value.title)
    if (existingIdx > -1) allData[userId].songs[existingIdx] = { ...allData[userId].songs[existingIdx], ...value, updatedAt: new Date().toISOString() }
    else allData[userId].songs.push({ ...value, id: Date.now().toString(), createdAt: new Date().toISOString() })
  } else {
    allData[userId][key] = value
  }
  
  fs.writeFileSync(dataFile, JSON.stringify(allData, null, 2))
}

export function resetPassword(username: string, newHashedPassword: string) {
  const users = getUsers()
  const idx = users.findIndex((u: any) => u.username === username)
  if (idx > -1) {
    users[idx].password = newHashedPassword
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
    return true
  }
  return false
}
