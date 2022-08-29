import { ApiProperty } from '@nestjs/swagger';

class ContactResponse {
  @ApiProperty()
  id: number;
  @ApiProperty()
  phone: string;
  @ApiProperty({
    required: false,
  })
  userId: number;
  @ApiProperty({
    required: false,
  })
  verifiedAt: string;
  @ApiProperty({
    required: false,
  })
  updatedAt: string;
  @ApiProperty()
  createdAt: string;
}

class EmergencyContactResponse extends ContactResponse {
  @ApiProperty({
    required: false,
  })
  name: string;
  @ApiProperty({
    required: false,
  })
  email: string;
}

class ContactResponseDto {
  @ApiProperty({
    required: false,
  })
  contact: ContactResponse;
  @ApiProperty({
    required: false,
  })
  emergencyContact: EmergencyContactResponse;
}

export class ContactResponseDataDto {
  @ApiProperty()
  data: ContactResponseDto;
}
