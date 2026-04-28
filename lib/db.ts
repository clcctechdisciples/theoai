import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// User Management
export async function getUsers() {
  return await prisma.user.findMany()
}

export async function addUser(user: any) {
  return await prisma.user.create({
    data: {
      username: user.username,
      password: user.password,
      securityQuestion: user.recoveryQuestion, // Matches the register API
      securityAnswer: user.recoveryAnswer,
    }
  })
}

// Data Management
export async function getData(userId: string) {
  const songs = await prisma.song.findMany({ 
    where: { userId },
    orderBy: { updatedAt: 'desc' }
  })
  const backgrounds = await prisma.background.findMany({ where: { userId } })
  
  // Format for frontend
  return { 
    songs: songs.map(s => ({ ...s, lyrics: [s.lyrics] })), // Frontend expects array of strings
    backgrounds, 
    audio: [] 
  }
}

export async function saveData(userId: string, key: 'songs' | 'backgrounds' | 'audio' | 'slides', value: any) {
  if (key === 'songs') {
    // Check if song with same title exists for this user
    const existing = await prisma.song.findFirst({
      where: { userId, title: value.title }
    })

    if (existing) {
      return await prisma.song.update({
        where: { id: existing.id },
        data: {
          lyrics: Array.isArray(value.lyrics) ? value.lyrics.join('\n') : value.lyrics,
        }
      })
    } else {
      return await prisma.song.create({
        data: {
          title: value.title,
          lyrics: Array.isArray(value.lyrics) ? value.lyrics.join('\n') : value.lyrics,
          userId: userId,
        }
      })
    }
  } else if (key === 'backgrounds') {
    if (Array.isArray(value)) {
      // Sync backgrounds: delete those not in the list, update/create others
      // For simplicity in this app's current architecture (which sends full state):
      await prisma.background.deleteMany({ where: { userId } })
      for (const bg of value) {
        await prisma.background.create({
          data: {
            url: bg.url,
            userId: userId
          }
        })
      }
    }
  } else if (key === 'slides') {
    return await prisma.slide.create({
      data: {
        title: value.title,
        url: value.url,
        userId: userId
      }
    })
  }
}

export async function resetPassword(username: string, newHashedPassword: string) {
  try {
    await prisma.user.update({
      where: { username },
      data: { password: newHashedPassword }
    })
    return true
  } catch (e) {
    return false
  }
}
