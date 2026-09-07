import { Controller, Get } from '@nestjs/common'; //1
import { WelcomeService } from './welcome.service.js'; //2

@Controller('Welcome') //3
export class WelcomeController { //4
  constructor(private readonly welcomeService: WelcomeService) {} //5
    @Get() //6
    getWelcomeMessage(): { message: string } { //7
      return this.welcomeService.getMessage();
    }
}