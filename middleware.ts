import { withAuth } from "next-auth/middleware"

export default withAuth({
  pages: {
    signIn: "/login",
  },
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /static (inside /public)
     * 4. /favicon.ico, /logo.png, etc.
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|signup|logo.png).*)",
  ],
}
