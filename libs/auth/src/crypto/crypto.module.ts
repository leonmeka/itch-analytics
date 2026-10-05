import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { TOKEN_ENC_KEY } from '../auth.constants';
import { TokenCipherService } from './token-cipher.service';

@Module({
  providers: [
    {
      provide: TOKEN_ENC_KEY,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): string =>
        configService.getOrThrow<string>('API_TOKEN_SECRET'),
    },
    TokenCipherService,
  ],
  exports: [TokenCipherService],
})
export class CryptoModule {}
