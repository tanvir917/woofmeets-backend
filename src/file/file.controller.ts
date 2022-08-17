import {
  Body,
  Controller,
  Delete,
  HttpException,
  InternalServerErrorException,
  Param,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConsumes,
  ApiInternalServerErrorResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FileUploadBody } from './dto/file-upload-body.dto';
import { FileService } from './file.service';
import { FilesInterceptor } from '@nestjs/platform-express';
import { throwBadRequestErrorCheck } from 'src/utils';
import { MulterFileUploadService } from './multer-file-upload-service';
import { SuccessfulUploadResponse } from './dto/upload-flie.dto';

@ApiTags('File System (Only For Backend Use)')
@Controller('file')
export class FileController {
  constructor(
    private readonly fileService: FileService,
    private multerFileUploadService: MulterFileUploadService,
  ) {}

  @Post()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('files', 10))
  async postFile(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: FileUploadBody,
  ): Promise<SuccessfulUploadResponse[]> {
    console.log('files', files);
    throwBadRequestErrorCheck(!files?.length, 'No files uploaded');
    const uploadedFiles = await this.multerFileUploadService.uploadMultiple(
      files,
      'test-files',
    );

    return uploadedFiles;
  }

  @ApiInternalServerErrorResponse()
  @ApiBadRequestResponse()
  @ApiParam({ name: 'key' })
  @Delete('/:key')
  async deleteFileController(@Param('key') key: string) {
    try {
      await this.fileService.deleteFile(key);
      return { message: 'File deleted from s3 successfully...' };
    } catch (e) {
      if (e instanceof HttpException) {
        throw e;
      }
      console.error(e);
      throw new InternalServerErrorException();
    }
  }
}
