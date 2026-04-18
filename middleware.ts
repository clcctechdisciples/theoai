import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  const { pathname } = req.nextUrl
  
  // Protected routes
  const isRoot = pathname === "/"
  const isProtectedRoute = 
    isRoot || 
    pathname.startsWith("/worship") || 
    pathname.startsWith("/sermon") || 
    pathname.startsWith("/display") || 
    pathname.startsWith("/audio")

  if (isProtectedRoute && !token) {
    const url = req.nextUrl.clone()
    url.pathname = "/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/",
    "/worship/:path*",
    "/sermon/:path*",
    "/display/:path*",
    "/audio/:path*",
    "/audio-engine/:path*",
  ],
}
