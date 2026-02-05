import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/db';

const JWT_ACCESS_SECRET =
  process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'zylofm-jwt-secret-key-2024';
const JWT_REFRESH_SECRET = `${JWT_ACCESS_SECRET}-refresh`;
const JWT_ACCESS_TTL = 3600; // 1 hora
const JWT_REFRESH_TTL = 2592000; // 30 días

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

function buildLoginResponse(user: { id: string; email: string; role: string; name?: string }) {
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_TTL }
  );

  const refreshToken = jwt.sign(
    { sub: user.id, role: user.role },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_TTL }
  );

  return {
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresInSec: JWT_ACCESS_TTL,
      },
    },
  };
}

function tryDevLogin(email: string, password: string) {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const match = devUsers.find(
    (user) => user.email.toLowerCase().trim() === email.toLowerCase().trim()
  );

  if (!match || match.password !== password) {
    return null;
  }

  return match;
}

async function ensureDevUser(devUser: DevUser) {
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
}

export async function POST(request: NextRequest) {
  let email: string | undefined;
  let password: string | undefined;

  try {
    const body = await request.json();
    email = body?.email;
    password = body?.password;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_INPUT', message: 'Email y contraseña son requeridos' } },
        { status: 400 }
      );
    }

    // Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      const devUser = tryDevLogin(email, password);
      if (devUser) {
        const persisted = await ensureDevUser(devUser);
        return NextResponse.json(buildLoginResponse(persisted));
      }
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      const devUser = tryDevLogin(email, password);
      if (devUser) {
        const persisted = await ensureDevUser(devUser);
        return NextResponse.json(buildLoginResponse(persisted));
      }
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } },
        { status: 401 }
      );
    }

    return NextResponse.json(
      buildLoginResponse({
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name ?? undefined,
      })
    );
  } catch (error: any) {
    if (email && password) {
      const devUser = tryDevLogin(email, password);
      if (devUser) {
        const persisted = await ensureDevUser(devUser);
        return NextResponse.json(buildLoginResponse(persisted));
      }
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Error del servidor' } },
      { status: 500 }
    );
  }
}
