import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import Cache from 'cache-manager';
import { PinoLogger } from 'nestjs-pino';
import { throwNotFoundErrorCheck } from './global/exceptions/error-logic';
import { SecretService } from './secret/secret.service';

@Injectable()
export class AppService {
  mapApiKey: string;

  constructor(
    private readonly secretService: SecretService,
    private readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.mapApiKey = this.secretService.getGoogleMapsKey();
    this.logger.setContext(AppService.name);
  }

  getHello(): string {
    return 'Hello World!';
  }

  async getAddress(address: string) {
    try {
      const cachedLocation = await this.cacheManager.get(address);

      if (!!cachedLocation) {
        this.logger.info(`Retrieve ${address} from cache`);
        return cachedLocation;
      }
    } catch (error) {
      this.logger.error(error);
    }

    try {
      const res = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${address},USA&key=${this.mapApiKey}`,
      );

      if (res.status == 200) {
        try {
          await this.cacheManager.set(address, res.data);
        } catch (error) {
          this.logger.error(
            `Failed to store address: ${address} in cache`,
            error,
          );
        }
      }

      return res.data;
    } catch (error) {
      this.logger.error(error);
      throwNotFoundErrorCheck(!!error, 'Location search failed');
    }
  }
}
