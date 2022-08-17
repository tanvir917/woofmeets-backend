export class UploadFile {
  name: string;
  buffer: Buffer;
  contentType: string;
  contentEncoding: string;
}

export class SuccessfulUploadResponse {
  url: string;
  type: string;
  key: string;
  Key: string;
}
