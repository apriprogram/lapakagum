import { withAuth } from "next-auth/middleware";

export default withAuth({
  callbacks: {
    authorized: ({ req, token }) => {
      // Hanya izinkan akses jika rolenya ADMIN untuk route /admin
      if (req.nextUrl.pathname.startsWith('/admin')) {
        return token?.role === 'ADMIN';
      }
      return !!token;
    },
  },
});

export const config = {
  matcher: ['/admin/:path*'],
};
