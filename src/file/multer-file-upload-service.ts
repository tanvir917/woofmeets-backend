import { Injectable } from '@nestjs/common';
import { SecretService } from 'src/secret/secret.service';
import { FileService } from './file.service';

interface IFileUploadResponse {
  url: string;
  type: string;
  key: string;
  Key: string;
}

@Injectable()
export class MulterFileUploadService {
  constructor(
    private fileService: FileService,
    private secretService: SecretService,
  ) {}

  async uploadMultiple(files: Express.Multer.File[], path: string) {
    let mappedFiles: IFileUploadResponse[] = [];

    try {
      if (files) {
        //console.log(images);
        const uploaded = await this.fileService.processMultipleFiles([
          ...files?.map((file) => ({
            buffer: file.buffer,
            encoding: file.encoding,
            originalname: file.originalname,
            mimetype: file.mimetype,
            fieldname: path ?? this.secretService.getAwsCreds().awsUploadPath,
            size: file.size + '',
          })),
        ]);

        //console.log(uploaded);
        mappedFiles = uploaded?.map((item) => {
          return {
            url: item.Location,
            type: item.MimeType,
            key: item.key,
            Key: item.Key,
          };
        });
      }
      return mappedFiles;
    } catch (e) {
      console.error('File uplaod error', e);
      return [];
    }
  }
}
