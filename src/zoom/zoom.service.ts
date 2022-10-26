import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as CryptoJS from 'crypto-js';
import { CommonService } from 'src/common/common.service';
import {
  throwBadRequestErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { PrismaService } from 'src/prisma/prisma.service';
import { SecretService } from 'src/secret/secret.service';
import { CreateZoomInfoDto } from './dto/create.zoominfo.dto';
import { CreateZoomLinkDto } from './dto/create.zoomlink.dto';

@Injectable()
export class ZoomService {
  constructor(
    private jwtService: JwtService,
    private readonly secretService: SecretService,
    private readonly commonService: CommonService,
    private readonly prismaService: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async getUserDetails(req: any, res: any) {
    try {
      // Step 1:
      // Check if the code parameter is in the url
      // if an authorization code is available, the user has most likely been redirected from Zoom OAuth
      // if not, the user needs to be redirected to Zoom OAuth to authorize

      if (req?.query?.code) {
        // Step 3:
        // Request an access token using the auth code

        return req?.query?.code;

        // const url =
        //   'https://zoom.us/oauth/token?grant_type=authorization_code&code=' +
        //   req?.query?.code +
        //   '&redirect_uri=' +
        //   this.secretService.getZoomJwtCreds().oAuthRedirectUri;

        // const tokenResult = await this.httpService.axiosRef.post(
        //   url,
        //   {},
        //   {
        //     headers: {
        //       Host: 'zoom.us',
        //       Authorization:
        //         'Basic ' +
        //         Buffer.from(
        //           this.secretService.getZoomJwtCreds().oAuthId +
        //             ':' +
        //             this.secretService.getZoomJwtCreds().oAuthSecret,
        //         ).toString('base64'),
        //       'content-type': 'application/x-www-form-urlencoded',
        //       accept: 'application/json',
        //     },
        //   },
        // );

        // console.log({ tokenResult });

        // const JSONResponse =
        //   '<pre><code>' +
        //   JSON.stringify(
        //     Object({
        //       ...tokenResult?.data,
        //     }),
        //     null,
        //     2,
        //   ) +
        //   '</code></pre>';

        // return res.send(`
        //     <html>
        //     <style>
        //       @import url('https://fonts.googleapis.com/css?family=Open+Sans:400,600&display=swap');@import url('https://necolas.github.io/normalize.css/8.0.1/normalize.css');html {color: #232333;font-family: 'Open Sans', Helvetica, Arial, sans-serif;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;}h2 {font-weight: 700;font-size: 24px;}h4 {font-weight: 600;font-size: 14px;}.container {margin: 24px auto;padding: 16px;max-width: 720px;}.info {display: flex;align-items: center;}.info>div>span, .info>div>p {font-weight: 400;font-size: 13px;color: #747487;line-height: 16px;}.info>div>span::before {content: "👋";}.info>div>h2 {padding: 8px 0 6px;margin: 0;}.info>div>p {padding: 0;margin: 0;}.info>img {background: #747487;height: 96px;width: 96px;border-radius: 31.68px;overflow: hidden;margin: 0 20px 0 0;}.response {margin: 32px 0;display: flex;flex-wrap: wrap;align-items: center;justify-content: space-between;}.response>a {text-decoration: none;color: #2D8CFF;font-size: 14px;}.response>pre {overflow-x: scroll;background: #f6f7f9;padding: 1.2em 1.4em;border-radius: 10.56px;width: 100%;box-sizing: border-box;}
        //     </style>
        //     <body>
        //       <div>
        //         <h3>
        //         ${JSONResponse}
        //         </h3>
        //       </div>
        //     </body>
        //     </html>
        //     `);

        // if (tokenResult?.data?.access_token) {
        // Step 4:
        // We can now use the access token to authenticate API calls

        // Send a request to get your user information using the /me context
        // The `/me` context restricts an API call to the user the token belongs to
        // This helps make calls to user-specific endpoints instead of storing the userID

        // const result = await this.httpService.axiosRef.get(
        //   'https://api.zoom.us/v2/users/me',
        //   {
        //     headers: {
        //       Authorization: 'Bearer ' + tokenResult?.data?.access_token,
        //       'User-Agent': 'Zoom-api-Jwt-Request',
        //       'content-type': 'application/json',
        //     },
        //   },
        // );

        // const JSONResponse =
        //   '<pre><code>' +
        //   JSON.stringify(
        //     Object({
        //       ...tokenResult?.data,
        //       ...result?.data,
        //     }),
        //     null,
        //     2,
        //   ) +
        //   '</code></pre>';
        // return res.send(`
        //   <style>
        //   @import url('https://fonts.googleapis.com/css?family=Open+Sans:400,600&display=swap');@import url('https://necolas.github.io/normalize.css/8.0.1/normalize.css');html {color: #232333;font-family: 'Open Sans', Helvetica, Arial, sans-serif;-webkit-font-smoothing: antialiased;-moz-osx-font-smoothing: grayscale;}h2 {font-weight: 700;font-size: 24px;}h4 {font-weight: 600;font-size: 14px;}.container {margin: 24px auto;padding: 16px;max-width: 720px;}.info {display: flex;align-items: center;}.info>div>span, .info>div>p {font-weight: 400;font-size: 13px;color: #747487;line-height: 16px;}.info>div>span::before {content: "👋";}.info>div>h2 {padding: 8px 0 6px;margin: 0;}.info>div>p {padding: 0;margin: 0;}.info>img {background: #747487;height: 96px;width: 96px;border-radius: 31.68px;overflow: hidden;margin: 0 20px 0 0;}.response {margin: 32px 0;display: flex;flex-wrap: wrap;align-items: center;justify-content: space-between;}.response>a {text-decoration: none;color: #2D8CFF;font-size: 14px;}.response>pre {overflow-x: scroll;background: #f6f7f9;padding: 1.2em 1.4em;border-radius: 10.56px;width: 100%;box-sizing: border-box;}
        //   </style>
        //   <div class="container">
        //       <div class="info">
        //           <img src="${result?.data?.pic_url}" alt="User photo" />
        //           <div>
        //               <span>Hello World!</span>
        //               <h2>${result?.data?.first_name} ${result?.data?.last_name}</h2>
        //               <p>${result?.data?.role_name}, ${result?.data?.company}</p>
        //           </div>
        //       </div>
        //       <div class="response">
        //           <h4>JSON Response:</h4>
        //           <a href="https://marketplace.zoom.us/docs/api-reference/zoom-api/users/user" target="_blank">
        //               API Reference
        //           </a>
        //           ${JSONResponse}
        //       </div>
        //   </div>
        // `);
        // }
      }

      //Step 2:
      //If no authorization code is available, redirect to Zoom OAuth to authorize
      return res.redirect(
        'https://zoom.us/oauth/authorize?response_type=code&client_id=' +
          this.secretService.getZoomJwtCreds().oAuthId +
          '&redirect_uri=' +
          this.secretService.getZoomJwtCreds().oAuthRedirectUri,
      );
    } catch (error) {
      return {
        status: error?.reponse?.status,
        message: error?.message,
        data: error?.response?.data,
      };
    }
  }

  async getRefreshAccessToken(refreshToken: string) {
    try {
      const url =
        'https://zoom.us/oauth/token?grant_type=refresh_token&refresh_token=' +
        refreshToken;

      const result = await this.httpService.axiosRef.post(
        url,
        {},
        {
          headers: {
            Host: 'zoom.us',
            Authorization:
              'Basic ' +
              Buffer.from(
                this.secretService.getZoomJwtCreds().oAuthId +
                  ':' +
                  this.secretService.getZoomJwtCreds().oAuthSecret,
              ).toString('base64'),
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
          },
        },
      );
      return {
        message: 'Refresh access token successfully',
        data: result?.data,
      };
    } catch (error) {
      return {
        status: error?.reponse?.status,
        message: error?.message,
        data: error?.response?.data,
      };
    }
  }

  async getRevokeAccessToken(accessToken: string) {
    try {
      const url = 'https://zoom.us/oauth/revoke?token=' + accessToken;

      const result = await this.httpService.axiosRef.post(
        url,
        {},
        {
          headers: {
            Host: 'zoom.us',
            Authorization:
              'Basic ' +
              Buffer.from(
                this.secretService.getZoomJwtCreds().oAuthId +
                  ':' +
                  this.secretService.getZoomJwtCreds().oAuthSecret,
              ).toString('base64'),
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
          },
        },
      );

      return {
        message: 'Revoke access token successfully',
        data: result?.data,
      };
    } catch (error) {
      return {
        status: error?.reponse?.status,
        message: error?.message,
        data: error?.response?.data,
      };
    }
  }

  async getHostDetails(token: string) {
    try {
      const result = await this.httpService.axiosRef.get(
        'https://api.zoom.us/v2/meetings/',
        {
          headers: {
            Authorization: 'Bearer ' + token,
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json',
          },
        },
      );

      return {
        message: 'Host details found successfully',
        data: {
          zoomAccessToken: token,
          zoomLinkDetails: result?.data,
        },
      };
    } catch (error) {
      return {
        status: error?.reponse?.status,
        message: error?.message,
        data: error?.response?.data,
      };
    }
  }

  async getZoomLink(userId: bigint, meetingId: string, token: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');
    try {
      const result = await this.httpService.axiosRef.get(
        'https://api.zoom.us/v2/meetings/' + meetingId,
        {
          headers: {
            Authorization: 'Bearer ' + token,
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json',
          },
        },
      );

      const [joinLink] = result?.data?.join_url?.split('?');

      return {
        message: 'Zoom link found successfully',
        data: {
          id: result?.data?.id,
          topic: result?.data?.topic,
          agenda: result?.data?.agenda,
          joinLink,
          password: result?.data?.password,
        },
      };
    } catch (error) {
      throwNotFoundErrorCheck(
        error?.reposne?.status == 404,
        'Zoom link not found',
      );
      return {
        status: error?.reponse?.status,
        message: error?.message,
        data: error?.response?.data,
      };
    }
  }

  async saveRefreshToken(userId: bigint, createZoomInfoDto: CreateZoomInfoDto) {
    const { zoomCode, redirectUri } = createZoomInfoDto;
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        provider: {
          select: {
            id: true,
          },
        },
      },
    });

    throwNotFoundErrorCheck(!user?.provider, 'Provider not found.');

    const url =
      'https://zoom.us/oauth/token?grant_type=authorization_code&code=' +
      zoomCode +
      '&redirect_uri=' +
      redirectUri;
    //this.secretService.getZoomJwtCreds().oAuthRedirectUri;

    let tokenResult;
    try {
      tokenResult = await this.httpService.axiosRef.post(
        url,
        {},
        {
          headers: {
            Host: 'zoom.us',
            Authorization:
              'Basic ' +
              Buffer.from(
                this.secretService.getZoomJwtCreds().oAuthId +
                  ':' +
                  this.secretService.getZoomJwtCreds().oAuthSecret,
              ).toString('base64'),
            'content-type': 'application/x-www-form-urlencoded',
            accept: 'application/json',
          },
        },
      );
    } catch (error) {
      console.log(error);
      return;
    }

    // Encryption
    const ciphertext = CryptoJS.AES.encrypt(
      tokenResult?.data?.refresh_token,
      this.secretService.getCryptoCreds().secret,
    ).toString();

    const zoomInfo = await this.prismaService.zoomInfo.upsert({
      where: {
        providerId: user?.provider?.id,
      },
      update: { refreshToken: ciphertext },
      create: {
        providerId: user?.provider?.id,
        refreshToken: ciphertext,
      },
    });

    throwBadRequestErrorCheck(!zoomInfo, 'Zoominfo can not create now.');

    return {
      message: 'Zomm info saved successfully',
    };
  }

  async createValidZoomLink(userId: bigint) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: {
        provider: {
          select: {
            zoomInfo: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user?.provider, 'Provider not found.');

    try {
      const payload = {
        iss: this.secretService.getZoomJwtCreds().jwtApiKey,
        exp:
          new Date().getTime() + this.secretService.getZoomJwtCreds().jwtExpire,
      };

      const jwtToken = this.jwtService.sign(payload);

      // Decryption
      const originalRefreshToken = CryptoJS.AES.decrypt(
        user?.provider?.zoomInfo?.refreshToken,
        this.secretService.getCryptoCreds().secret,
      );

      const tokenInfo = await this.getRefreshAccessToken(
        originalRefreshToken.toString(CryptoJS.enc.Utf8),
      );

      const password = this.commonService.getOpk();

      const result = await this.httpService.axiosRef.post(
        'https://api.zoom.us/v2/users/me/meetings',
        {
          topic: 'Woofmeets Video calling',
          type: 2,
          start_time: new Date(),
          duration: 40,
          password,
          agenda: 'Video calling with clients',
          settings: {
            host_video: true,
            participant_video: true,
            cn_meeting: false,
            in_meeting: true,
            join_before_host: false,
            mute_upon_entry: false,
            watermark: false,
            use_pmi: true,
            approval_type: 2,
            audio: 'both',
            //auto_recording: 'local',
            enforce_login: false,
            registrants_email_notification: false,
            waiting_room: true,
            allow_multiple_devices: true,
          },
        },
        {
          headers: {
            Authorization: 'Bearer ' + tokenInfo?.data?.access_token,
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json',
          },
        },
      );

      // Encryption
      const ciphertext = CryptoJS.AES.encrypt(
        tokenInfo?.data?.refresh_token,
        this.secretService.getCryptoCreds().secret,
      ).toString();

      await this.prismaService.zoomInfo.update({
        where: {
          id: user?.provider?.zoomInfo?.id,
        },
        data: {
          refreshToken: ciphertext,
        },
      });

      const [joinLink] = result?.data?.join_url?.split('?');

      return {
        message: 'Zoom link created successfully',
        data: {
          id: result?.data?.id,
          topic: result?.data?.topic,
          agenda: result?.data?.agenda,
          joinLink,
          password,
        },
      };
    } catch (error) {
      return {
        status: error?.reponse?.status,
        message: error?.message,
        data: error?.response?.data,
      };
    }
  }

  async updateZoomLink(
    userId: bigint,
    meetingId: string,
    token: string,
    createZoomLinkDto: CreateZoomLinkDto,
  ) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    const { topic, agenda } = createZoomLinkDto;

    try {
      let result = await this.httpService.axiosRef.patch(
        'https://api.zoom.us/v2/meetings/' + meetingId,
        {
          topic: topic ?? 'Woofmeets Video calling',
          type: 2,
          start_time: new Date(),
          duration: 40,
          password: '1234567',
          agenda: agenda ?? 'Video calling with clients',
          settings: {
            host_video: true,
            participant_video: true,
            cn_meeting: false,
            in_meeting: true,
            join_before_host: false,
            mute_upon_entry: false,
            watermark: false,
            use_pmi: false,
            approval_type: 2,
            audio: 'both',
            //auto_recording: 'local',
            enforce_login: false,
            registrants_email_notification: false,
            waiting_room: true,
            allow_multiple_devices: true,
          },
        },
        {
          headers: {
            Authorization: 'Bearer ' + token,
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json',
          },
        },
      );

      result = await this.httpService.axiosRef.get(
        'https://api.zoom.us/v2/meetings/' + meetingId,
        {
          headers: {
            Authorization: 'Bearer ' + token,
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json',
          },
        },
      );

      const [meetingLink] = result?.data?.join_url?.split('?');

      return {
        message: 'Zoom link updated successfully',
        data: {
          topic: result?.data?.topic,
          agenda: result?.data?.agenda,
          meetingLink,
          password: result?.data?.password,
        },
      };
    } catch (error) {
      return {
        status: error?.reponse?.status,
        message: error?.message,
        data: error?.response?.data,
      };
    }
  }

  async deleteZoomLink(userId: bigint, meetingId: string, token: string) {
    const user = await this.prismaService.user.findFirst({
      where: { id: userId, deletedAt: null },
    });

    throwBadRequestErrorCheck(!user, 'User not found.');

    try {
      const result = await this.httpService.axiosRef.delete(
        'https://api.zoom.us/v2/meetings/' + meetingId,
        {
          headers: {
            Authorization: 'Bearer ' + token,
            'User-Agent': 'Zoom-api-Jwt-Request',
            'content-type': 'application/json',
          },
        },
      );

      return {
        message: 'Zoom link deleted successfully',
        data: result?.data,
      };
    } catch (error) {
      return {
        status: error?.reponse?.status,
        message: error?.message,
        data: error?.response?.data,
      };
    }
  }
}
