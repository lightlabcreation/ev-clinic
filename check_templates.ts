
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const templates = await prisma.formtemplate.findMany();
    console.log('Templates:', templates);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
