import { ApiProperty } from '@nestjs/swagger';

export class PostMessageDto {
  @ApiProperty({ required: false })
  message?: string;
}

export class CreateGroupDTO {
  @ApiProperty({ required: true, description: 'Sender Id' })
  sender: number;
  @ApiProperty({ required: true, description: 'Receiver Id' })
  receiver: number;
  @ApiProperty({ required: true, description: 'Appointment Id in String' })
  appointmentId: string;
}
