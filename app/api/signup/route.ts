import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const body = await request?.json?.();
    const { name, email, password } = body ?? {};

    // Validaciones básicas
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      );
    }

    if ((password?.length ?? 0) < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await prisma?.user?.findUnique?.({
      where: { email: email?.toLowerCase?.()?.trim?.() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Este email ya está registrado' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt?.hash?.(password, 12);

    // Crear usuario
    const user = await prisma?.user?.create?.({
      data: {
        name: name?.trim?.() ?? null,
        email: email?.toLowerCase?.()?.trim?.(),
        password: hashedPassword,
        role: 'LISTENER',
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user?.id,
        email: user?.email,
        name: user?.name,
      },
    });
  } catch (error) {
    console?.error?.('Error en signup:', error);
    return NextResponse.json(
      { error: 'Error al crear la cuenta' },
      { status: 500 }
    );
  }
}
