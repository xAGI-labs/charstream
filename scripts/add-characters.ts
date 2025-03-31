import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_IMAGE_URL = ""; 

async function main() {
  const character = await prisma.homeCharacter.upsert({
    where: { id: "jordan" }, 
    update: {},
    create: {
      id: "jordan", 
      name: "Jordan",
      description: "The Protagonist from the famous movie 'Rockstar' - Jordan, whose real name is Janardan Jakhar ('JJ')",
      imageUrl: "", 
      category: "popular",
      displayOrder: 9, 
    },
  });

  console.log("Added or updated character:", character);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
