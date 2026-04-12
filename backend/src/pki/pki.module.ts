import { Module, Global, Controller, Get } from '@nestjs/common';
import { PkiService } from './pki.service';

/**
 * GET /pki/public-key
 * Returns the server's RSA public key so any party can
 * independently verify resume and message signatures.
 * No auth required — public key is meant to be public.
 */
@Controller('pki')
export class PkiController {
  constructor(private readonly pkiService: PkiService) {}

  @Get('public-key')
  getPublicKey() {
    return this.pkiService.getPublicKeyInfo();
  }
}

@Global()
@Module({
  controllers: [PkiController],
  providers: [PkiService],
  exports: [PkiService],
})
export class PkiModule {}
