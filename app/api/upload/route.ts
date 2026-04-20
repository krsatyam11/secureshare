// File: app/api/upload/route.ts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const originalName = formData.get('originalName') as string;
    const mimeType = formData.get('mimeType') as string;
    const expiryInSeconds = parseInt(formData.get('expiryInSeconds') as string || '0', 10);
    const pin = formData.get('pin') as string;

    const blob = await put(`secure/${crypto.randomUUID()}.dat`, file, { 
      access: 'public' 
    });

    const pinHash = pin ? await bcrypt.hash(pin, 10) : null;
    const expiresAt = expiryInSeconds > 0 ? new Date(Date.now() + expiryInSeconds * 1000) : null;
    let userId = null;
    
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email } });
      userId = user?.id;
    }

    const dbFile = await prisma.sharedFile.create({
      data: {
        originalName,
        mimeType,
        blobUrl: blob.url,
        expiresAt,
        pinHash,
        userId
      },
    });

    return NextResponse.json({ success: true, fileId: dbFile.id });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}