import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { AwsModule } from 'src/aws/aws.module';
import { MulterFileUploadService } from './multer-file-upload-service';
import { SecretModule } from 'src/secret/secret.module';

@Module({
  imports: [AwsModule, SecretModule],
  providers: [FileService, MulterFileUploadService],
  controllers: [FileController],
  exports: [FileService, MulterFileUploadService],
})
export class FileModule {}
