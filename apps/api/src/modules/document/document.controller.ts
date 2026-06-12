import { Body, Controller, Get, Param, Post, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '../auth/auth.guard';
import { DocumentService } from './document.service';

@Controller('documents')
@UseGuards(AuthGuard)
export class DocumentController {
  constructor(private readonly documents: DocumentService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    limits: { fileSize: 25 * 1024 * 1024 },
  }))
  upload(@UploadedFile() file: any, @Body('category') category?: string) {
    return this.documents.save(file, category);
  }

  @Get(':storageKey')
  download(@Param('storageKey') storageKey: string, @Res() response: any) {
    return this.documents.stream(storageKey, response);
  }
}
