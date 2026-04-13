import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials) return null
        
        // Root admin fallback
        const adminUser = process.env.ADMIN_USERNAME
        const adminPass = process.env.ADMIN_PASSWORD
        
        // Check admin first
        if (credentials.username === adminUser) {
           const isAdminPassValid = adminPass && (credentials.password === adminPass || await bcrypt.compare(credentials.password, adminPass))
           if (isAdminPassValid) {
             return { id: 'admin', name: 'Admin', email: 'admin@clcc.church' }
           }
        }

        // Check local DB (Dynamic import to avoid Edge Runtime issues with 'fs')
        try {
          const { getUsers } = await import('./db')
          const users = getUsers()
          const user = users.find((u: any) => u.username === credentials.username)
          if (user) {
            const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
            if (isPasswordValid) {
              return { id: user.id, name: user.username, email: `${user.username}@clcc.church` }
            }
          }
        } catch (err) {
          console.error('DB access error in auth:', err)
        }
        
        return null
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).id = token.id
      return session
    },
  },
}
