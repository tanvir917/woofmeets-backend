import { Injectable } from '@nestjs/common';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProviderCreationDto } from './dto/creation.dto';
import { customAlphabet, nanoid } from 'nanoid';
import { LoginProviderEnum } from 'src/utils/enums';
import {
  throwBadRequestErrorCheck,
  throwConflictErrorCheck,
  throwNotFoundErrorCheck,
} from 'src/global/exceptions/error-logic';
import { checkZipcode } from 'src/utils/tools/zipcode.checker.tools';
import { PasswordService } from 'src/auth/password.service';
import { CommonService } from 'src/common/common.service';
import {
  HomeTypeEnum,
  YardTypeEnum,
} from 'src/provider-home/entities/provider-home.entity';

@Injectable()
export class ProviderCreationService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly commonService: CommonService,
  ) {}

  async seed(body: ProviderCreationDto) {
    /**
     * user create
     * provider-services/:servcie-type-id
     * rate
     * /availability
     * /provider-home
     * /pet-preference put
     * cancellation-policy/provider-policy/:policyId
     * TODO subscription
     * /user-profile/basic-info
     * /user-profile/provider-detail
     * /user-profile/add-contact-number
     * /user-profile/add-emergency-contact-info
     * /user-profile/check-have-pets -> no
     * /quiz/complete/:userId
     */

    // return { body };
    const { user, opk } = await this.createUser(body);
    const { service, shortCode } = await this.createService(user);
    const { rate } = await this.createRate(service);
    const { days } = await this.createAvailability(service);
    const { data: attribute } = await this.createHome(service);
    const { pet_pref } = await this.createPetpref(service);
    const { provider } = await this.cancellation(service);
    const { basicInfo } = await this.basicInfo(user);
    const { providerDetails } = await this.createProviderDetail(provider);
    const { contact } = await this.addContact(user);
    const { emergency } = await this.addEmergencyContact(user);
    const { updatedProvider } = await this.rest(provider);

    const data = {
      user,
      service,
      rate,
      days,
      pet_pref,
      provider,
      basicInfo,
      providerDetails,
      contact,
      emergency,
      updatedProvider,
    };

    return { message: 'complete', data };
  }

  async createUser(body) {
    const { firstName, lastName, email, zipcode } = body;
    const password = 'String123';
    const emailTaken = await this.prismaService.user.findFirst({
      where: {
        email: email,
        deletedAt: null,
      },
    });

    //check if email is taken or not and zipcode
    throwConflictErrorCheck(!!emailTaken, 'Email already taken');
    throwNotFoundErrorCheck(!checkZipcode(body.zipcode), 'Zipcode not found');

    const hashedPassword = await this.passwordService.getHashedPassword(
      password,
    );

    let opk = this.commonService.getOpk();
    let opkGenerated = false;
    while (!opkGenerated) {
      const checkOpk = await this.prismaService.user.findFirst({
        where: {
          opk,
          deletedAt: null,
        },
      });
      if (checkOpk) {
        opk = this.commonService.getOpk();
      } else {
        opkGenerated = true;
      }
    }

    const user = await this.prismaService.user.create({
      data: {
        opk,
        firstName,
        lastName,
        email,
        password: hashedPassword,
        zipcode,
        loginProvider: LoginProviderEnum.LOCAL,
      },
      include: {
        provider: {
          select: {
            isApproved: true,
          },
        },
      },
    });

    throwBadRequestErrorCheck(!user, 'User is not created');

    return { user, opk };
  }

  async createService(user) {
    const shortCode = customAlphabet('abcdefghijklmnopqrstuvwxyz', 6)();

    const serviceType = await this.prismaService.serviceType.findFirst({
      where: { deletedAt: null, slug: 'boarding' },
    });
    throwBadRequestErrorCheck(!serviceType, 'Service type not found');

    let slug = this.commonService.getSlug(
      user?.firstName + ' ' + user?.lastName,
    );
    let generatedSlug = true;
    while (generatedSlug) {
      const provider = await this.prismaService.provider.findFirst({
        where: {
          slug,
          deletedAt: null,
        },
      });
      if (!provider) {
        generatedSlug = false;
      } else {
        const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz', 6);
        slug = this.commonService.getSlug(
          user?.firstName + ' ' + user?.lastName + ' ' + nanoid(6),
        );
      }
    }
    const provider = await this.prismaService.provider.create({
      data: {
        userId: user.id,
        slug,
      },
    });

    throwBadRequestErrorCheck(!provider, 'Provider can not be created');
    const providerSlug = `${slug}-${serviceType.slug}`;

    const service = await this.prismaService.providerServices.create({
      data: {
        providerId: provider?.id,
        serviceTypeId: serviceType.id,
        slug: providerSlug,
      },
      include: {
        serviceType: true,
        provider: true,
      },
    });

    return { service, shortCode };
  }

  async createRate(service) {
    const rateTypes = await this.prismaService.serviceTypeHasRates.findMany({
      where: {
        serviceTypeId: service.serviceTypeId,
        deletedAt: null,
      },
      take: 3,
    });

    const rateTypeIds = [];
    rateTypes.map((type) => {
      rateTypeIds.push({
        providerServicesId: service.id,
        serviceTypeHasRatesId: type.id,
        amount: 100,
      });
    });

    console.log(rateTypeIds);
    const rate = await this.prismaService.serviceHasRates.createMany({
      data: rateTypeIds,
      skipDuplicates: true,
    });
    return { rate };
  }

  async createAvailability(service) {
    const days = await this.prismaService.availableDay.create({
      data: {
        providerServiceId: service.id,
        sat: true,
        sun: true,
        mon: true,
      },
    });
    return { days };
  }

  async createHome(service) {
    const data = await this.prismaService.provider.update({
      where: { id: service?.provider.id },
      data: {
        homeType: HomeTypeEnum.APARTMENT,
        yardType: YardTypeEnum.NO_YARD,
      },
    });
    // home attributes not mandatory
    return { data };
  }

  async createPetpref(service) {
    const pet_pref = await this.prismaService.servicePetPreference.create({
      data: {
        providerId: service?.provider?.id,
        petPerDay: 1,
        smallDog: true,
        mediumDog: true,
        largeDog: false,
        giantDog: false,
        cat: true,
      },
    });
    return { pet_pref };
  }

  async cancellation(service) {
    const policy = await this.prismaService.cancellationPolicy.findFirst({
      where: { deletedAt: null },
      orderBy: { sequence: 'asc' },
    });
    if (!policy) {
      return null;
    }
    const provider = await this.prismaService.provider.update({
      where: { id: service?.provider.id },
      data: {
        cancellationPolicyId: policy.id,
      },
      include: {
        cancellationPolicy: true,
      },
    });
    return { provider };
  }

  async subscription() {
    return 'subscription';
  }

  async basicInfo(user) {
    const country = await this.prismaService.country.findFirst({
      where: { deletedAt: null },
      orderBy: { id: 'asc' },
    });

    throwBadRequestErrorCheck(!country, 'Country not found');

    const basicInfo = await this.prismaService.basicInfo.create({
      data: {
        userId: user.id,
        dob: new Date('2001-01-01').toISOString(),
        addressLine1: `Hell's kitchen. NY`,
        city: 'New York',
        state: 'NY',
        countryId: country?.id,
        zipCode: user.zipcode,
        latitude: 40.763515,
        longitude: -73.992709,
        detailsSubmitted: true,
      },
    });
    return { basicInfo };
  }

  async createProviderDetail(provider) {
    const providerDetails = await this.prismaService.providerDetails.create({
      data: {
        providerId: provider?.id,
        headline: 'Super high level sitter.',
        dogsExperience: 'Massive experience',
        environmentDescription: 'Good one',
        experienceDescription: 'Experience description section',
        scheduleDescription: 'Good one too',
        yearsOfExperience: 5,
        detailsSubmitted: true,
      },
    });

    const skill = await this.prismaService.profileSkillType.findFirst({
      where: {
        deletedAt: null,
      },
    });

    throwBadRequestErrorCheck(!skill, 'Skills not found.');

    await this.prismaService.providerSkills.create({
      data: {
        providerId: provider?.id,
        skillTypeId: BigInt(skill.id),
      },
    });

    return { providerDetails };
  }

  async addContact(user) {
    const contact = await this.prismaService.userContact.create({
      data: {
        userId: user.id,
        phone: `+8801${customAlphabet('0123456789', 9)()}`,
        verifiedAt: new Date(Date.now()),
      },
    });
    return { contact };
  }

  async addEmergencyContact(user) {
    const emergency = await this.prismaService.userEmergencyContact.create({
      data: {
        userId: user.id,
        email: 'emergency@contact.com',
        name: `Mr. ${customAlphabet('abcdefghijklmnopqrstuvwxyz', 6)()}`,
        phone: `+8801${customAlphabet('0123456789', 9)()}`,
      },
    });
    return { emergency };
  }

  async rest(provider) {
    const updatedProvider = await this.prismaService.provider.update({
      where: {
        id: provider?.id,
      },
      data: {
        havePets: 'YES',
        isApproved: true,
        quizPassed: true,
        photoSubmitted: true,
      },
    });
    return { updatedProvider };
  }
}
