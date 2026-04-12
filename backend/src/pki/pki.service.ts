import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { generateKeyPair } from '../common/utils/pki.util';

const KEYS_DIR = path.join(process.cwd(), 'keys');
const PRIVATE_KEY_PATH = path.join(KEYS_DIR, 'server.private.pem');
const PUBLIC_KEY_PATH = path.join(KEYS_DIR, 'server.public.pem');

@Injectable()
export class PkiService implements OnModuleInit {
  private readonly logger = new Logger(PkiService.name);
  private privateKey: string;
  private publicKey: string;

  /**
   * On startup: if key files exist, load them.
   * If not, generate a new RSA-2048 key pair and save to disk.
   * Keys persist across restarts — signatures remain verifiable.
   */
  onModuleInit() {
    if (!fs.existsSync(KEYS_DIR)) {
      fs.mkdirSync(KEYS_DIR, { recursive: true });
    }

    if (fs.existsSync(PRIVATE_KEY_PATH) && fs.existsSync(PUBLIC_KEY_PATH)) {
      this.privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
      this.publicKey = fs.readFileSync(PUBLIC_KEY_PATH, 'utf8');
      this.logger.log('Server RSA key pair loaded from disk.');
    } else {
      this.logger.log(
        'No RSA key pair found. Generating new RSA-2048 key pair...',
      );
      const { publicKey, privateKey } = generateKeyPair();
      this.privateKey = privateKey;
      this.publicKey = publicKey;

      fs.writeFileSync(PRIVATE_KEY_PATH, privateKey, { mode: 0o600 }); // owner read-only
      fs.writeFileSync(PUBLIC_KEY_PATH, publicKey, { mode: 0o644 });

      this.logger.log(`RSA key pair generated and saved to ${KEYS_DIR}`);
    }
  }

  getPrivateKey(): string {
    return this.privateKey;
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  /**
   * Expose the public key via API so clients can independently
   * verify signatures if needed (PKI transparency).
   */
  getPublicKeyInfo(): { algorithm: string; publicKey: string } {
    return {
      algorithm: 'RSA-2048 / SHA-256',
      publicKey: this.publicKey,
    };
  }
}
