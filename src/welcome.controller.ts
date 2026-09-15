import { Controller, Get } from '@nestjs/common';
import { WelcomeService } from './welcome.service.js';

@Controller('welcome')
export class WelcomeController {
  constructor(private readonly welcomeService: WelcomeService) {}

  @Get()
  getWelcomeMessage(): { message: string } {
    return this.welcomeService.getMessage();
  }
}
