import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsJSON, IsString } from 'class-validator';

export class OptionDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  text: string;
}

export class CreateQuizDto {
  @ApiProperty()
  @IsString()
  question: string;

  @Transform(({ obj }) => {
    const { options } = obj;
    try {
      JSON.stringify(options);
    } catch (e) {
      throw new BadRequestException(
        "Format of the property 'options' is not found.",
      );
    }
    if (options.length === 0) {
      throw new BadRequestException("'options' property can not be empty.");
    }
    options.map((option) => {
      if (!option.key) {
        throw new BadRequestException(
          "'key' of the property 'options' is not found.",
        );
      }
      if (!option.text) {
        throw new BadRequestException(
          "'text' of the property 'options' is not found.",
        );
      }
    });
    return options;
  })
  @ApiProperty({ example: '[{"key":"a","text":"Dhaka"}]' })
  options: any;

  @ApiProperty({ example: 'a' })
  @IsString()
  answer: string;

  @ApiProperty()
  @IsBoolean()
  active: boolean;
}
