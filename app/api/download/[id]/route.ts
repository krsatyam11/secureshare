// File: app/api/download/[id]/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { pin } = await request.json();
    const fileRecord = await prisma.sharedFile.findUnique({ where: { id: params.id } });

    if (!fileRecord) return new NextResponse('Not found', { status: 404 });

    if (fileRecord.expiresAt && new Date() > new Date(fileRecord.expiresAt)) {
      // Optionally delete the expired file record and blob
      return new NextResponse('Link has expired', { status: 410 });
    }
    
    if (fileRecord.pinHash) {
      if (!pin) return new NextResponse('PIN_REQUIRED', { status: 401 });
      const isValid = await bcrypt.compare(pin, fileRecord.pinHash);
      if (!isValid) return new NextResponse('INVALID_PIN', { status: 403 });
    }

    const response = await fetch(fileRecord.blobUrl);
    if (!response.ok) throw new Error("Failed to fetch from Vercel Blob");

    await prisma.sharedFile.update({
      where: { id: params.id },
      data: { downloads: { increment: 1 } }
    });

    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('X-Filename', fileRecord.originalName);
    headers.set('X-MimeType', fileRecord.mimeType);

    return new NextResponse(response.body, { status: 200, headers });
  } catch (error) {
    console.error("Download error:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}