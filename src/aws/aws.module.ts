import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { SecretModule } from 'src/secret/secret.module';
import { AwsService } from './aws.service';

@Module({
  imports: [CommonModule, SecretModule],
  providers: [AwsService],
  exports: [AwsService, CommonModule],
})
export class AwsModule {}
