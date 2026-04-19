import fs from 'fs'
import path from 'path'

const dbPath = path.join(process.cwd(), 'data')
const usersFile = path.join(dbPath, 'users.json')
const dataFile = path.join(dbPath, 'app_data.json') // Combined file for songs, backgrounds, audio

export function initDb() {
  try {
    if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true })
    if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, JSON.stringify([]))
    if (!fs.existsSync(dataFile)) fs.writeFileSync(dataFile, JSON.stringify({}))
  } catch (err) {
    console.warn('DB initialization failed:', err)
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
  const raw = fs.readFileSync(dataFile, 'utf8')
  const allData = JSON.parse(raw)
  if (!allData[userId]) {
    allData[userId] = { songs: [], backgrounds: [], audio: [] }
    fs.writeFileSync(dataFile, JSON.stringify(allData, null, 2))
  }
  return allData[userId]
}

export function saveData(userId: string, key: 'songs' | 'backgrounds' | 'audio', value: any) {
  const raw = fs.readFileSync(dataFile, 'utf8')
  const allData = JSON.parse(raw)
  if (!allData[userId]) allData[userId] = { songs: [], backgrounds: [], audio: [] }
  
  if (key === 'songs') {
    const existingIdx = allData[userId].songs.findIndex((s: any) => s.title === value.title)
    if (existingIdx > -1) allData[userId].songs[existingIdx] = { ...allData[userId].songs[existingIdx], ...value }
    else allData[userId].songs.push({ ...value, id: Date.now().toString() })
  } else {
    allData[userId][key] = value
  }
  
  fs.writeFileSync(dataFile, JSON.stringify(allData, null, 2))
}
