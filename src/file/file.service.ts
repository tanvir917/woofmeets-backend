import { Injectable } from '@nestjs/common';
import { AwsService } from 'src/aws/aws.service';
import * as uuid from 'uuid';
import { RawUploadFormFile } from './dto/raw-upload-form-file.dto';
import { UploadFile } from './dto/upload-flie.dto';
import { IMulterFileParam } from './types/MulterFileParam';

@Injectable()
export class FileService {
  constructor(private readonly awsService: AwsService) {}

  mapFileToType(file: RawUploadFormFile): UploadFile {
    return {
      name: `${file.fieldname}/${uuid.v4()}-${file.originalname}`,
      buffer: file.buffer,
      contentEncoding: file.encoding,
      contentType: file.mimetype,
    };
  }

  async uploadToS3(file: UploadFile) {
    const s3Function = await this.awsService.getAwsMethods();
    return s3Function.upload(
      file.name,
      file.contentType,
      file.buffer,
      file.contentEncoding,
    );
  }

  async uploadManyToS3(files: UploadFile[]) {
    const results = files.map((file) => {
      return this.uploadToS3(file);
    });

    return Promise.all(results);
  }

  async processRequest(req: any) {
    const files: RawUploadFormFile[] = req?.files ?? [];

    if (!files) {
      return [];
    }

    const mapped = files.map((file) => this.mapFileToType(file));
    return mapped ?? [];
  }

  async processMultipleFiles(files: IMulterFileParam[]) {
    if (!files) {
      return [];
    }

    const mapped = files.map((file) => this.mapFileToType(file));
    const awsFiles = await this.uploadManyToS3(mapped ?? []);
    return awsFiles.filter((value) => value !== null);
  }

  async deleteFile(key: string) {
    const s3Function = await this.awsService.getAwsMethods();
    return s3Function.delete(key);
  }
}
