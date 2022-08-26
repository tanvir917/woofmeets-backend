import { Module } from '@nestjs/common';
import { FileModule } from 'src/file/file.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SecretModule } from 'src/secret/secret.module';
import { GalleryController } from './gallery.controller';
import { GalleryService } from './gallery.service';

@Module({
  imports: [PrismaModule, FileModule, SecretModule],
  controllers: [GalleryController],
  providers: [GalleryService],
})
export class GalleryModule {}
