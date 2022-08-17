import {
  applyDecorators,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Observable } from 'rxjs';
import { CommonService } from 'src/common/common.service';
import { FileService } from '../file.service';

const UploadFileReceiverInterceptor = (fieldname = 'files', maxfiles = 10) =>
  FilesInterceptor(fieldname, maxfiles, {
    fileFilter: function (req, files, cb) {
      cb(null, CommonService.checkAllowedMimeType(files.mimetype));
    },
  });

@Injectable()
class AwsUploadInterceptor implements NestInterceptor {
  constructor(private readonly fileService: FileService) {}
  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const state = context.switchToHttp();
    // receive files beforehand from multer-express
    const req = state.getRequest();
    req.files = await this.fileService.processRequest(req);
    return next.handle();
  }
}

export function S3FileInterceptor(fieldname?: string, maxfiles?: number) {
  return applyDecorators(
    UseInterceptors(
      UploadFileReceiverInterceptor(fieldname, maxfiles),
      AwsUploadInterceptor,
    ),
  );
}
