import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

type UploadedFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

const allowedMimeTypes = new Set([
  'application/pdf',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
  'text/plain',
  'text/csv',
]);

@Injectable()
export class DocumentService {
  constructor(private readonly config: ConfigService) {}

  async save(file: UploadedFile | undefined, category?: string) {
    if (!file) {
      throw new BadRequestException('Document file is required');
    }
    if (!allowedMimeTypes.has(file.mimetype)) {
      throw new BadRequestException('Document type is not allowed');
    }

    const root = this.storageRoot();
    await mkdir(root, { recursive: true });

    const extension = this.safeExtension(file.originalname);
    const storageKey = `${randomUUID()}${extension}`;
    const filePath = join(root, storageKey);
    const metaPath = `${filePath}.json`;

    await writeFile(filePath, file.buffer);
    await writeFile(metaPath, JSON.stringify({
      name: this.safeName(file.originalname),
      type: file.mimetype,
      size: file.size,
      category: category?.trim() || 'Document',
      storageKey,
    }, null, 2));

    return {
      name: this.safeName(file.originalname),
      type: file.mimetype,
      size: file.size,
      category: category?.trim() || 'Document',
      storageKey,
      url: `/documents/${storageKey}`,
    };
  }

  async stream(storageKey: string, response: any) {
    if (!/^[a-f0-9-]+\.[a-z0-9]{1,8}$/i.test(storageKey)) {
      throw new NotFoundException('Document not found');
    }

    const root = this.storageRoot();
    const filePath = join(root, storageKey);
    let metadata: Record<string, unknown> = {};

    try {
      await stat(filePath);
      metadata = JSON.parse(await readFile(`${filePath}.json`, 'utf8')) as Record<string, unknown>;
    } catch {
      throw new NotFoundException('Document not found');
    }

    const name = typeof metadata.name === 'string' ? metadata.name : storageKey;
    const type = typeof metadata.type === 'string' ? metadata.type : 'application/octet-stream';

    response.setHeader('Content-Type', type);
    response.setHeader('Content-Disposition', `attachment; filename="${name.replace(/"/g, '')}"`);
    createReadStream(filePath).pipe(response);
  }

  private storageRoot() {
    return this.config.get<string>('DOCUMENT_STORAGE_DIR')?.trim() || join(process.cwd(), 'storage', 'documents');
  }

  private safeExtension(name: string) {
    const extension = extname(name).toLowerCase().replace(/[^a-z0-9.]/g, '');
    return extension && extension.length <= 9 ? extension : '.bin';
  }

  private safeName(name: string) {
    return name.replace(/[^\w.\- ()]/g, '').trim() || 'document';
  }
}
