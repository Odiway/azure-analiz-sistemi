import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/login',
  },
});

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/calendar/:path*',
    '/activities/:path*',
    '/reports/:path*',
    '/settings/:path*',
  ],
};
