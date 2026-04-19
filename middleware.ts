export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/',
    '/display/:path*',
    '/worship/:path*',
    '/sermon/:path*',
    '/audio/:path*',
    '/audio-engine/:path*',
    '/api/songs/:path*',
    '/api/backgrounds/:path*',
    '/api/recordings/:path*',
    '/api/control/:path*',
    '/api/ai-process/:path*',
  ]
}
