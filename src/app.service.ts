import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import axios from 'axios';
import Cache from 'cache-manager';
import { PinoLogger } from 'nestjs-pino';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from './global/exceptions/error-logic';
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

  async getPredictedLocations(inputPlace: string) {
    let predictions;
    try {
      const cachedPredictionsLocation = await this.cacheManager.get(
        predictions,
      );

      if (!!cachedPredictionsLocation) {
        this.logger.info(`Retrieve location ${predictions} from cache`);
        return {
          message: 'Location predictions found successfully.',
          data: cachedPredictionsLocation,
        };
      }
    } catch (error) {
      this.logger.error(error);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${inputPlace}&region=${this.secretService.getGoogleMapsSearchRegion()}&key=${this.secretService.getGoogleMapsKey()}`;

      const { data, status } = await axios.get(url);

      predictions = data?.predictions?.map((pred) => ({
        description: pred.description,
        place_id: pred.place_id,
      }));

      if (status == 200) {
        try {
          await this.cacheManager.set(predictions, data);
        } catch (error) {
          this.logger.error(
            `Failed to store predictions address: ${predictions} in cache`,
            error,
          );
        }
      }
    } catch (error) {
      console.log(error?.message);
      return;
    }

    throwBadRequestErrorCheck(
      !predictions,
      'No predicted location is not found.',
    );

    return {
      message: 'Location predictions found successfully.',
      data: predictions,
    };
  }

  async getPlaceIdToLatLong(placeId: string) {
    let result;

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?placeid=${placeId}&key=${this.secretService.getGoogleMapsKey()}`;
      const { data } = await axios.get(url);
      result = data?.result?.geometry?.location;
    } catch (error) {
      console.log(error?.message);
      return;
    }

    throwBadRequestErrorCheck(
      !result,
      'Wrong placeid. Please input a valid place id',
    );

    return {
      message: 'Lat long found successfully.',
      data: result,
    };
  }
}
