import { Injectable } from '@nestjs/common';
import { CommonService } from 'src/common/common.service';
import { SecretService } from 'src/secret/secret.service';
import { SuccessfulUploadObject } from './dto/aws-file.dto';

@Injectable()
export class AwsService {
  constructor(
    private readonly commonService: CommonService,
    private readonly secretService: SecretService,
  ) {}

  async getAwsMethods() {
    const { S3 } = await import('aws-sdk');

    const credentials = this.secretService.getAwsCreds();
    const client = new S3({
      region: credentials.awsRegion,
      credentials: {
        accessKeyId: credentials.awsAccessId,
        secretAccessKey: credentials.awsSecret,
      },
    });

    return {
      /**
       * Allows to access AWS S3 upload functionality
       * with most credentials passed in
       * @param Key
       * @param ContentType
       * @param Body
       * @param ContentEncoding
       * @param ACL
       * @returns
       */
      upload: async (
        Key: string,
        ContentType: string,
        Body: Buffer,
        ContentEncoding = 'base64',
        ACL: 'public-read' | 'public-write' | undefined = 'public-read',
      ): Promise<SuccessfulUploadObject | null> => {
        try {
          const result = await client
            .upload({
              Bucket: credentials.awsBucket,
              Key,
              ContentEncoding,
              ContentType,
              Body,
              ACL,
            })
            .promise();
          return { ...result, MimeType: ContentType } as SuccessfulUploadObject;
        } catch (error) {
          console.log(error);
          return null;
        }
      },

      delete: async (key: string) => {
        try {
          const params = {
            Bucket: credentials.awsBucket,
            Key: key,
          };
          const result = await client.deleteObject(params).promise();
          return result;
        } catch (error) {
          console.log(error);
          return null;
        }
      },
    };
  }
}
