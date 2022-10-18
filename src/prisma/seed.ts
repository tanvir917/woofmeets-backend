import { PrismaClient } from '@prisma/client';
import { breeds } from './seeder/breeds';
import { country } from './seeder/country';
import { holidays } from './seeder/holidays';
import {
  homeAttributeBoardingHome,
  homeAttributeHostAble,
} from './seeder/homeAttributeTypes';
import { mappedPolicies } from './seeder/policies';
import { profileSkills } from './seeder/profileSkills';
import { quizSets } from './seeder/quiz';
import { rateTypes } from './seeder/rateTypes';
import { ServiceTypesSeeder } from './seeder/services';

const prisma = new PrismaClient();

const addServiceTypes = async () => {
  const serviceTypesSlugs = ServiceTypesSeeder.map((item) => item.slug);

  const previousServiceTypes = await prisma.serviceType.findMany({
    where: {
      slug: {
        in: serviceTypesSlugs,
      },
    },
    select: {
      id: true,
    },
  });

  const ids = previousServiceTypes.map((obj) => obj.id);

  await prisma.serviceType.updateMany({
    where: { id: { notIn: ids } },
    data: {
      deletedAt: new Date(),
    },
  });

  ServiceTypesSeeder.forEach(async (obj) => {
    await prisma.serviceType.upsert({
      where: {
        slug: obj.slug,
      },
      update: {
        name: obj?.name,
        displayName: obj?.displayName,
        description: obj?.description,
        icon: obj?.icon,
        active: obj?.active,
        location: obj?.location,
        petType: obj?.petType,
        browsable: obj?.browsable,
        start_date_selector_description: obj?.start_date_selector_description,
        end_date_selector_description: obj?.end_date_selector_description,
        appRequired: obj?.appRequired,
        sequence: obj?.sequence,
      },
      create: {
        slug: obj.slug,
        name: obj?.name,
        displayName: obj?.displayName,
        description: obj?.description,
        icon: obj?.icon,
        active: obj?.active,
        location: obj?.location,
        petType: obj?.petType,
        browsable: obj?.browsable,
        start_date_selector_description: obj?.start_date_selector_description,
        end_date_selector_description: obj?.end_date_selector_description,
        appRequired: obj?.appRequired,
        sequence: obj?.sequence,
      },
    });
  });
};

const addCountries = async () => {
  const previousCountries = await prisma.country.findMany({
    where: { deletedAt: null },
  });
  const mapCountries = previousCountries.map((obj) => obj?.name);
  await country.forEach(async (obj) => {
    if (!mapCountries.includes(obj?.name)) {
      await prisma.country.create({
        data: obj,
      });
    }
  });
};

const addHomeAttributeTypes = async () => {
  const get_owner_expectation = await prisma.homeAttributeTitle.findFirst({
    where: {
      displayName: 'What can pet owners expect when boarding at your home?',
      deletedAt: null,
    },
  });

  let owner_expectation;

  if (!get_owner_expectation) {
    owner_expectation = await prisma.homeAttributeTitle.create({
      data: {
        displayName: 'What can pet owners expect when boarding at your home?',
      },
    });
  }

  await homeAttributeBoardingHome.forEach(async (ob) => {
    await prisma.homeAttributeType.upsert({
      where: {
        slug: ob.slug,
      },
      create: {
        ...ob,
        homeAttributeTitleId:
          get_owner_expectation?.id ?? owner_expectation?.id,
      },
      update: {
        displayName: ob.displayName,
        homeAttributeTitleId:
          get_owner_expectation?.id ?? owner_expectation?.id,
        deletedAt: null,
      },
    });
  });

  const get_host_able = await prisma.homeAttributeTitle.findFirst({
    where: {
      displayName: 'Are you able to host any of the following?',
      deletedAt: null,
    },
  });

  let host_able;

  if (!get_host_able) {
    host_able = await prisma.homeAttributeTitle.create({
      data: {
        displayName: 'Are you able to host any of the following?',
      },
    });
  }

  await homeAttributeHostAble.forEach(async (ob) => {
    await prisma.homeAttributeType.upsert({
      where: {
        slug: ob.slug,
      },
      create: {
        ...ob,
        homeAttributeTitleId: get_host_able?.id ?? host_able?.id,
      },
      update: {
        displayName: ob.displayName,
        homeAttributeTitleId: get_host_able?.id ?? host_able?.id,
        deletedAt: null,
      },
    });
  });
};

const additionalSkills = async () => {
  await profileSkills.forEach(async (ob) => {
    await prisma.profileSkillType.upsert({
      where: {
        slug: ob.slug,
      },
      create: {
        ...ob,
      },
      update: {
        title: ob.title,
        deletedAt: null,
      },
    });
  });
};

const addBreeds = async () => {
  const previousBreeds = await prisma.breeds.findMany({
    where: { deletedAt: null },
  });
  const mapBreeds = previousBreeds.map((obj) => obj?.name);
  await breeds.forEach(async (obj) => {
    if (!mapBreeds.includes(obj?.name)) {
      await prisma.breeds.create({
        data: obj,
      });
    }
  });
};

const addPolicies = () => {
  mappedPolicies.forEach(async (item) => {
    await prisma.cancellationPolicy.upsert({
      where: { slug: item.slug },
      update: {
        time: item?.time,
        title: item?.title,
        percentage: item?.percentage,
        sequence: item?.sequence,
        details: item?.details,
      },
      create: {
        slug: item?.slug,
        title: item?.title,
        time: item?.time,
        percentage: item?.percentage,
        sequence: item?.sequence,
        details: item?.details,
      },
    });
  });
};

const addServiceRateTypes = async () => {
  const existingRateTypes = await prisma.serviceRateType.findMany({
    where: {
      deletedAt: null,
    },
  });

  const types = existingRateTypes.map((obj) => obj?.slug);

  await rateTypes.forEach(async (ob) => {
    if (!types.includes(ob?.slug)) {
      await prisma.serviceRateType.create({
        data: ob,
      });
    }
  });
};

const addQuizQuestions = async () => {
  const exists = await prisma.quiz.findMany({
    where: { deletedAt: null },
  });

  const quizs = exists.map((q) => q.question);
  await quizSets.forEach(async (obj) => {
    if (!quizs.includes(obj?.question)) {
      await prisma.quiz.create({
        data: obj,
      });
    }
  });
};

const addHolidays = async () => {
  await prisma.holidays.createMany({
    data: holidays,
    skipDuplicates: true,
  });
};

async function main() {
  console.log('.... Seeding Data ....');

  addServiceTypes();
  addCountries();
  addHomeAttributeTypes();
  additionalSkills();
  addBreeds();
  addPolicies();
  addServiceRateTypes();
  addQuizQuestions();
  addHolidays();

  console.log('✨  Seed Completed ✨');
}

main()
  .catch((e) => {
    console.log(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
