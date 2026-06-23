import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly key: Buffer;

  constructor() {
    // Usar la clave de encriptación dedicada o derivarla del JWT_SECRET
    const secret =
      process.env.ENCRYPTION_KEY ||
      process.env.JWT_SECRET ||
      'querylens_super_secret_jwt_key_for_local_dev_1234567890';

    // Crear un hash SHA-256 del secreto para garantizar una clave de exactamente 32 bytes
    this.key = crypto.createHash('sha256').update(secret).digest();
  }

  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(12); // GCM usa IV de 12 bytes
      const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);

      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');

      const authTag = cipher.getAuthTag().toString('hex');

      // Retornar iv, texto encriptado y tag de autenticación concatenados por ':'
      return `${iv.toString('hex')}:${encrypted}:${authTag}`;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al encriptar credenciales de base de datos',
      );
    }
  }

  decrypt(encryptedText: string): string {
    try {
      const parts = encryptedText.split(':');
      if (parts.length !== 3) {
        throw new Error('Formato de texto encriptado inválido');
      }

      const iv = Buffer.from(parts[0], 'hex');
      const encrypted = parts[1];
      const authTag = Buffer.from(parts[2], 'hex');

      const decipher = crypto.createDecipheriv(this.algorithm, this.key, iv);
      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al desencriptar credenciales de base de datos. Verifica la clave de la aplicación.',
      );
    }
  }
}
