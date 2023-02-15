import {
  Body,
  ConflictException,
  HttpCode,
  HttpStatus,
  Inject,
  Injectable,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto/sign-up.dto';
import { SignInDto } from './dto/sign-in.dto/sign-in.dto';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';
import { ActiveUserDataInterface } from '../interfaces/active-user-data.interface';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { randomUUID } from 'crypto';
import {
  InvalidatedRefreshTokenError,
  RefreshTokenIdsStorage
} from "./refresh-token-ids.storage/refresh-token-ids.storage";

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY) // 👈
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      const user = new User();
      user.email = signUpDto.email;
      user.password = await this.hashingService.hash(signUpDto.password);

      await this.usersRepository.save(user);
    } catch (err) {
      const pgUniqueViolationErrorCode = '23505';
      if (err.code === pgUniqueViolationErrorCode) {
        throw new ConflictException('User already exists');
      }
      throw err;
    }
  }

  async signIn(signInDto: SignInDto) {
    const user = await this.usersRepository.findOne({
      where: { email: signInDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('User does not exists');
    }
    const passwordMatches = await this.hashingService.compare(
      signInDto.password,
      user.password,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Password does not match');
    }

    return await this.generateTokens(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserDataInterface, 'sub'> & { refreshTokenId: string }
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });
      const user = await this.usersRepository.findOneByOrFail({
        id: sub,
      });
      const isValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );
      if (isValid) {
        await this.refreshTokenIdsStorage.invalidate(user.id);
      } else {
        throw new Error('Refresh token is invalid');
      }
      return this.generateTokens(user);
    } catch (err) {
      if (err instanceof InvalidatedRefreshTokenError) {
        throw new UnauthorizedException('Access denied');
      }
      throw new UnauthorizedException('Refresh token is invalid');
    }
  }

  private async signToken<T>(userId: number, expiresIn: number, payload?: T) {
    return await this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }

  async generateTokens(user: User) {
    const refreshTokenId = randomUUID();
    const [accessToken, refreshToken] = await Promise.all([
      this.signToken<Partial<ActiveUserDataInterface>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        {
          email: user.email,
          role: user.role,
          // ⚠️ WARNING: Normally would be in the database
          permissions: user.permissions,
        },
      ),
      this.signToken(user.id, this.jwtConfiguration.refreshTokenTtl, {
        refreshTokenId,
      }),
    ]);
    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);
    return {
      accessToken,
      refreshToken,
    };
  }
}
