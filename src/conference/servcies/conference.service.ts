import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck
} from 'src/global/exceptions/error-logic';
import { SecretService } from 'src/secret/secret.service';
import { HmsRoomTypeEnum } from 'src/utils/enums';
import { CreateRoomDto } from '../dto/create-room.dto';
import { FindRoomDto, JoinRoomDto, LeaveRoomDto } from '../dto/room.dto';

@Injectable()
export class ConferenceService {
  hmsBaseUrl: string;

  constructor(
    private secretService: SecretService,
    private readonly httpService: HttpService,
    private jwtService: JwtService,
  ) {
    this.hmsBaseUrl = this.secretService.getHmsCreds().hmsApiUrl;
  }

  private createJwt() {
    const { hmsAccess, hmsSecret } = this.secretService.getHmsCreds();
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const data = {
      iat: currentTimestamp,
      jti: 'jwt_nonce',
      type: 'management',
      version: 2,
      nbf: currentTimestamp,
      access_key: hmsAccess,
    };
    const token = this.jwtService.sign(data);
    return token;
  }

  private roomToken(roomId: string, userId: string | number) {
    const { hmsAccess } = this.secretService.getHmsCreds();
    const currentTimestamp = Math.floor(Date.now() / 1000);

    const data = {
      access_key: hmsAccess,
      room_id: roomId,
      user_id: userId.toString(),
      role: 'user',
      jti: currentTimestamp.toString(),
      type: 'app',
      version: 2,
    };
    const token = this.jwtService.sign(data);
    console.log(token);
    return token;
  }

  private async getRoomInfo(
    token: string,
    appointmentOpk: string,
    roomType: string,
  ) {
    const url = `${
      this.hmsBaseUrl
    }/v2/rooms?name=wm${roomType[0].toLocaleUpperCase()}-${appointmentOpk}`;

    const room = await this.httpService.axiosRef.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const roomData = room.data.data;
    throwBadRequestErrorCheck(
      !roomData || roomData.length === 0,
      'Room not found with specific conversation.',
    );

    return roomData;
  }

  async createRoom(body: CreateRoomDto) {
    const { appointmentOpk, roomType, provider, owner, createdAt } = body;
    const token = this.createJwt();
    const url = `${this.hmsBaseUrl}/v2/rooms`;
    const template_id =
      roomType === HmsRoomTypeEnum.VIDEO
        ? this.secretService.getHmsCreds().hmsVideoTemp
        : this.secretService.getHmsCreds().hmsAudioTemp;

    const hmsBody = {
      name: `wm${roomType[0].toLowerCase()}-${appointmentOpk}`,
      description: `${provider} - ${owner} ${roomType.toLowerCase()} conference room. Woofmeets.com`,
      template_id,
    };

    const room = await this.httpService.axiosRef.post(url, hmsBody, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    //console.log(room);
    console.log(room.status);
    throwBadRequestErrorCheck(+room.status >= 400, 'Room can not be created.');

    const data = {
      token,
      room: room.data,
    };
    return { data, message: 'Room created successfully.' };
  }

  async joinRoom(dto: JoinRoomDto) {
    const { appointmentOpk, roomType } = dto;
    const token = this.createJwt();
    const url = `${
      this.hmsBaseUrl
    }/v2/rooms?name=wm${roomType[0].toLocaleUpperCase()}-${appointmentOpk}`;

    const room = await this.httpService.axiosRef.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const roomData = room.data.data;
    throwBadRequestErrorCheck(
      !roomData || roomData.length === 0,
      'Room not found with specific conversation.',
    );

    if (!roomData[0].enabled) {
      const enableUrl = `${this.hmsBaseUrl}/v2/rooms/${roomData[0].id}`;
      const enable = await this.httpService.axiosRef.post(
        enableUrl,
        {
          enabled: true,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      throwBadRequestErrorCheck(
        +enable.status >= 400,
        'Something went wrong with room.',
      );
    }

    const roomToken = this.roomToken(roomData[0].id, 2);

    return { message: 'Room open to join.', data: roomToken };
  }

  async leaveRoom(dto: LeaveRoomDto) {
    const { appointmentOpk, roomType } = dto;
    const token = this.createJwt();

    const room = await this.getRoomInfo(token, appointmentOpk, roomType);

    throwNotFoundErrorCheck(
      !room || room.length === 0,
      'Room not found with the specific appointment.',
    );

    const url = `${this.hmsBaseUrl}/v2/rooms/${room[0].id}`;
    const hmsBody = {
      enabled: false,
    };

    const deactived = await this.httpService.axiosRef.post(url, hmsBody, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    throwBadRequestErrorCheck(
      !deactived?.data || deactived?.data?.enabled,
      "Room can't be deactivated. ",
    );

    return { data: { room: deactived.data } };
  }

  async findAll(query: FindRoomDto) {
    let { limit, start, enabled } = query;
    if (!limit) limit = 20;
    if (!start) start = '';
    if (!enabled) enabled = '';

    const token = this.createJwt();
    const url = `${this.hmsBaseUrl}/v2/rooms?limit=${limit}&start=${start}&enabled=${enabled}`;

    const rooms = await this.httpService.axiosRef.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    throwBadRequestErrorCheck(!rooms?.data, 'Room not found. ');

    return { data: rooms?.data };
  }
}
