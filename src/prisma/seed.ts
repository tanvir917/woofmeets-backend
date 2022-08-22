import { PrismaClient } from '@prisma/client';
import { country } from './seeder/country';
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

async function main() {
  console.log('.... Sedding Data ....');

  addServiceTypes();
}

main()
  .catch((e) => {
    console.log(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
