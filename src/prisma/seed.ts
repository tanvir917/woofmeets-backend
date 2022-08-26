import { PrismaClient } from '@prisma/client';
import { country } from './seeder/country';
import { ServiceTypesSeeder } from './seeder/services';
import {
  homeAttributeBoardingHome,
  homeAttributeHostAble,
} from './seeder/homeAttributeTypes';
import { profileSkills } from './seeder/profileSkills';

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
  const owner_expectation = await prisma.homeAttributeTitle.create({
    data: {
      displayName: 'What can pet owners expect when boarding at your home?',
    },
  });

  await homeAttributeBoardingHome.forEach(async (ob) => {
    await prisma.homeAttributeType.upsert({
      where: {
        slug: ob.slug,
      },
      create: {
        ...ob,
        homeAttributeTitleId: owner_expectation.id,
      },
      update: {
        displayName: ob.displayName,
        homeAttributeTitleId: owner_expectation.id,
        deletedAt: null,
      },
    });
  });

  const host_able = await prisma.homeAttributeTitle.create({
    data: {
      displayName: 'Are you able to host any of the following?',
    },
  });

  await homeAttributeHostAble.forEach(async (ob) => {
    await prisma.homeAttributeType.upsert({
      where: {
        slug: ob.slug,
      },
      create: {
        ...ob,
        homeAttributeTitleId: host_able.id,
      },
      update: {
        displayName: ob.displayName,
        homeAttributeTitleId: host_able.id,
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

async function main() {
  console.log('.... Seeding Data ....');

  addServiceTypes();
  addCountries();
  addHomeAttributeTypes();
  additionalSkills();

  console.log('✨  Seed Completed ✨ ');
}

main()
  .catch((e) => {
    console.log(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
