import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { SecretService } from 'src/secret/secret.service';

@Injectable()
export class PasswordService {
  constructor(private readonly secretService: SecretService) {}

  async getHashedPassword(password: string) {
    const salt = await bcrypt.genSalt(
      this.secretService.getJwtCreds().saltRound,
    );
    return bcrypt.hash(password, salt);
  }

  /**
   *
   * @param plainPassword password to compare
   * @param hashedPassword hashed password
   * @returns
   */
  async comparePassword(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return bcrypt.compare(plainPassword, hashedPassword);
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
