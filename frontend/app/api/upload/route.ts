/**
 * File Upload API Route — Available to ALL tiers (including P2P/Free)
 *
 * Accepts files via FormData, stores metadata, returns file reference
 * for use in chat context. Supports images, documents, code, datasets.
 *
 * Max: 25MB per file, 5 files per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const maxDuration = 30;

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_FILES = 5;

const ALLOWED_TYPES: Record<string, string[]> = {
  image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: [
    'application/pdf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/xml',
    'text/html',
  ],
  code: [
    'text/javascript',
    'application/javascript',
    'text/typescript',
    'text/x-python',
    'text/x-java',
    'text/x-c',
    'text/x-go',
    'text/x-rust',
    'application/x-yaml',
    'text/yaml',
  ],
  spreadsheet: [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'text/csv',
  ],
  archive: ['application/zip', 'application/gzip'],
};

const ALL_ALLOWED = Object.values(ALLOWED_TYPES).flat();

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  category: string;
  size: number;
  url: string;
  uploadedAt: string;
}

function categorizeFile(mimeType: string): string {
  for (const [category, types] of Object.entries(ALLOWED_TYPES)) {
    if (types.includes(mimeType)) return category;
  }
  // Fall back to extension-based detection for code files
  return 'document';
}

function isCodeFile(filename: string): boolean {
  const codeExts = [
    '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java',
    '.c', '.cpp', '.h', '.rb', '.php', '.swift', '.kt', '.sh',
    '.yaml', '.yml', '.toml', '.sql', '.graphql', '.proto',
  ];
  return codeExts.some(ext => filename.toLowerCase().endsWith(ext));
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_FILES} files per upload` },
        { status: 400 },
      );
    }

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const uploaded: UploadedFile[] = [];

    for (const file of files) {
      // Size check
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${file.name}" exceeds 25MB limit` },
          { status: 400 },
        );
      }

      // Type check — allow code files by extension even if mime is generic
      const isAllowedType = ALL_ALLOWED.includes(file.type) ||
        file.type === 'application/octet-stream' && isCodeFile(file.name) ||
        file.type === '' && isCodeFile(file.name) ||
        file.type.startsWith('text/');

      if (!isAllowedType) {
        return NextResponse.json(
          { error: `File type "${file.type}" not supported for "${file.name}"` },
          { status: 400 },
        );
      }

      const id = randomUUID();
      const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : '';
      const storedName = `${id}${ext}`;
      const filePath = join(uploadDir, storedName);

      const bytes = await file.arrayBuffer();
      await writeFile(filePath, Buffer.from(bytes));

      const category = isCodeFile(file.name) ? 'code' : categorizeFile(file.type);

      uploaded.push({
        id,
        name: file.name,
        type: file.type || 'application/octet-stream',
        category,
        size: file.size,
        url: `/uploads/${storedName}`,
        uploadedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ files: uploaded });
  } catch (err: any) {
    console.error('[Upload] Error:', err);
    return NextResponse.json(
      { error: 'Upload failed: ' + (err.message || 'Unknown error') },
      { status: 500 },
    );
  }
}
