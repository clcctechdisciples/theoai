import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

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
        const ADMIN_ID = '00000000-0000-0000-0000-000000000000'

        // Check admin first
        if (credentials.username === adminUser) {
          const bcrypt = await import('bcryptjs')
          const isAdminPassValid = adminPass && (credentials.password === adminPass || await bcrypt.compare(credentials.password, adminPass))
          if (isAdminPassValid) {
            // Ensure admin exists in DB for foreign key relations
            try {
              const { upsertUser } = await import('./db')
              const hashedPass = await bcrypt.hash(adminPass, 10)
              console.log('Auth: Syncing admin user to DB with UUID:', ADMIN_ID)
              await upsertUser({
                id: ADMIN_ID,
                username: adminUser,
                password: hashedPass
              })
            } catch (e) { console.error('Admin sync error:', e) }

            return { id: ADMIN_ID, name: 'Admin', email: 'admin@clcc.church' }
          }
        }

        // Check local DB (Dynamic import to avoid Edge Runtime issues with 'fs')
        try {
          const { getUsers } = await import('./db')
          const users = await getUsers()
          const user = users.find((u: any) => u.username === credentials.username)
          if (user) {
            const bcrypt = await import('bcryptjs')
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
