import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: 'file:./dev.db',
        },
    },
});

async function main() {
    const prospects = await prisma.performProspect.findMany({
        take: 5,
        select: {
            firstName: true,
            lastName: true,
            school: true,
            position: true,
        },
    });
    console.log('Prospects:', JSON.stringify(prospects, null, 2));

    const teams = await prisma.performTeam.findMany({
        take: 5,
        select: {
            schoolName: true,
            mascot: true,
        },
    });
    console.log('Teams:', JSON.stringify(teams, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
