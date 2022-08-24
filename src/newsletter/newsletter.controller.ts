import { Controller, Post, Body, UseInterceptors } from '@nestjs/common';
import { NewsletterService } from './newsletter.service';
import { CreateNewsletterDto } from './dto/create-newsletter.dto';
import { ApiTags } from '@nestjs/swagger';
import { TransformInterceptor } from 'src/transform.interceptor';

@ApiTags('Newsletter')
@Controller('newsletter')
@UseInterceptors(TransformInterceptor)
export class NewsletterController {
  constructor(private readonly newsletterService: NewsletterService) {}

  @Post()
  create(@Body() createNewsletterDto: CreateNewsletterDto) {
    return this.newsletterService.createSubcripton(createNewsletterDto);
  }
}
