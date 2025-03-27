import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_IMAGE_URL = ""; // Use empty string instead of null

async function main() {
  const character = await prisma.homeCharacter.upsert({
    where: { id: "munnabhai" }, // Use the unique `id` field
    update: {},
    create: {
      id: "munnabhai", // Provide a unique `id` for the new character
      name: "Munna Bhai",
      description: "Lovable gangster from the movie Munnabhai MBBS who undergoes a transformation",
      imageUrl: "", // Let the system generate the avatar later
      category: "popular",
      displayOrder: 7, // Adjust the display order as needed
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
