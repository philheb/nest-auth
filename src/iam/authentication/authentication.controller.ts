import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { AuthenticationService } from './authentication.service';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto/sign-in.dto';
import { Auth } from './decorators/auth.decorator';
import { AuthType } from './enums/auth-type.enum';
import { RefreshTokenDto } from "./dto/refresh-token.dto";
// import { Response } from 'express';

@Auth(AuthType.None)
@Controller('authentication')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}

  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authenticationService.signUp(signUpDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('sign-in')
  async signIn(
    @Body() signInDto: SignInDto,
    // @Res({ passthrough: true }) response: Response,
  ) {
    return this.authenticationService.signIn(signInDto);
    // const accessToken = await this.authenticationService.signIn(signInDto);
    // response.cookie('accessToken', accessToken, {
    //   secure: true,
    //   httpOnly: true,
    //   sameSite: true,
    // });
  }

  @HttpCode(HttpStatus.OK)
  @Post('refresh-token')
  refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authenticationService.refreshToken(refreshTokenDto);
  }
}
