const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
console.log('Recording model exists:', !!prisma.recording)
prisma.$disconnect()
