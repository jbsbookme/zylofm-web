import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

type DevUser = {
  id: string;
  email: string;
  password: string;
  role: 'LISTENER' | 'DJ' | 'ADMIN';
  name?: string;
};

const devUsers: DevUser[] = [
  {
    id: 'dev-listener-demo',
    email: 'cliente@demo.com',
    password: 'cliente123',
    role: 'LISTENER',
    name: 'Cliente Demo',
  },
  {
    id: 'dev-admin',
    email: 'john@doe.com',
    password: 'johndoe123',
    role: 'ADMIN',
    name: 'John Doe',
  },
  {
    id: 'dev-dj-demo',
    email: 'dj@demo.com',
    password: 'dj123',
    role: 'DJ',
    name: 'DJ Demo',
  },
  {
    id: 'dev-dj-cosmic',
    email: 'djcosmic@zylofm.com',
    password: 'cosmic123',
    role: 'DJ',
    name: 'DJ Cosmic',
  },
  {
    id: 'dev-dj-luna',
    email: 'lunabeats@zylofm.com',
    password: 'luna123',
    role: 'DJ',
    name: 'Luna Beats',
  },
  {
    id: 'dev-dj-neon',
    email: 'neonwave@zylofm.com',
    password: 'neon123',
    role: 'DJ',
    name: 'NeonWave',
  },
  {
    id: 'dev-dj-tropical',
    email: 'tropicalsoul@zylofm.com',
    password: 'tropical123',
    role: 'DJ',
    name: 'Tropical Soul',
  },
];

const tryDevAuth = (email: string, password: string) => {
  if (process.env.NODE_ENV === 'production') return null;
  const match = devUsers.find(
    (user) => user.email.toLowerCase().trim() === email.toLowerCase().trim()
  );
  if (!match || match.password !== password) return null;
  return {
    id: match.id,
    email: match.email,
    name: match.name,
    role: match.role,
  };
};

const ensureDevUser = async (devUser: { email: string; name?: string; role: string }) => {
  const hashedPassword = await bcrypt.hash('dev-password', 10);
  return prisma.user.upsert({
    where: { email: devUser.email.toLowerCase().trim() },
    update: {
      name: devUser.name ?? null,
      role: devUser.role,
    },
    create: {
      email: devUser.email.toLowerCase().trim(),
      name: devUser.name ?? null,
      role: devUser.role,
      password: hashedPassword,
    },
  });
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials?.email?.toLowerCase()?.trim();
        const password = credentials?.password ?? '';

        try {
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (user) {
            const isPasswordValid = await bcrypt.compare(password, user?.password ?? '');
            if (isPasswordValid) {
              return {
                id: user?.id ?? '',
                email: user?.email ?? '',
                name: user?.name ?? '',
                role: user?.role ?? 'LISTENER',
              };
            }
          }
        } catch {
          // Ignorar errores de DB y permitir fallback dev
        }

        const devUser = tryDevAuth(email, password);
        if (!devUser) return null;

        try {
          const persisted = await ensureDevUser(devUser);
          return {
            id: persisted.id,
            email: persisted.email,
            name: persisted.name ?? '',
            role: persisted.role ?? 'LISTENER',
          };
        } catch {
          return devUser;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user?.id;
        token.role = (user as any)?.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        (session?.user as any).id = token?.id;
        (session?.user as any).role = token?.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
