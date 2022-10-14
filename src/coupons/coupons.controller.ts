import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TransformInterceptor } from '../transform.interceptor';
import { CouponUsersService } from './coupon-users.service';
import { CouponsService } from './coupons.service';
import { CreateCouponUsersDto } from './dto/create-coupon-users.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@ApiTags('Coupons')
@UseInterceptors(TransformInterceptor)
@Controller('coupons')
export class CouponsController {
  constructor(
    private readonly couponsService: CouponsService,
    private couponUsersService: CouponUsersService,
  ) {}

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createCouponDto: CreateCouponDto, @Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.couponsService.create(userId, createCouponDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/admin')
  getAllAdmin(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.couponsService.findAllCouponAdmin(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/get-all/users')
  getAllUsers(@Request() req: any) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.couponsService.findAllUsersCoupon(userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('/get-one/:code')
  getOne(@Request() req: any, @Param('code') code: string) {
    return this.couponsService.findOne(code);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Patch('/update/:id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateCouponDto: UpdateCouponDto,
  ) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.couponsService.update(userId, BigInt(id), updateCouponDto);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:id')
  delete(@Request() req: any, @Param('id') id: string) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.couponsService.remove(userId, BigInt(id));
  }

  @ApiOperation({ summary: 'Associate users to Coupon' })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Post('/users-coupon/:couponId')
  createManyCouponUsers(
    @Request() req: any,
    @Param('couponId') couponId: string,
    @Body() createCouponUsersDto: CreateCouponUsersDto,
  ) {
    const userId = BigInt(req.user.id) ?? BigInt(-1);
    return this.couponUsersService.addCouponUser(
      userId,
      BigInt(couponId),
      createCouponUsersDto,
    );
  }
}
