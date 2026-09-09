import "dotenv/config";
import bcrypt from "bcryptjs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { generateGradientPng } from "../src/lib/placeholder-image";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL || "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const sampleListings = [
  {
    title: "Studio cosy au centre-ville",
    city: "Paris",
    country: "France",
    address: "12 rue de Rivoli, 75004 Paris",
    description:
      "Studio lumineux entièrement rénové, à deux pas du métro et des commerces. Idéal pour un séjour en solo ou en couple.",
    pricePerNight: 89,
    cleaningFee: 30,
    maxGuests: 2,
    bedrooms: 1,
    bathrooms: 1,
    beds: 1,
    amenities: ["Wifi", "Cuisine équipée", "Climatisation", "Lave-linge"],
    accessDetails:
      "Boîte à clés sécurisée à l'entrée de l'immeuble (digicode 4821). Le code de la boîte à clés vous sera communiqué avec votre code d'accès personnel.",
    photos: [
      { top: [244, 208, 63] as const, bottom: [230, 126, 34] as const },
      { top: [235, 152, 78] as const, bottom: [211, 84, 0] as const },
    ],
  },
  {
    title: "Appartement familial avec balcon",
    city: "Lyon",
    country: "France",
    address: "8 quai Saint-Antoine, 69002 Lyon",
    description:
      "Grand appartement de 3 chambres avec vue sur la Saône. Parfait pour les familles, proche des commodités et des transports.",
    pricePerNight: 145,
    cleaningFee: 50,
    maxGuests: 6,
    bedrooms: 3,
    bathrooms: 2,
    beds: 4,
    amenities: ["Wifi", "Parking", "Balcon", "Cuisine équipée", "Ascenseur", "Lave-vaisselle"],
    accessDetails:
      "Accès à l'immeuble via l'interphone (nom : GESTION LOCATIVE). Le gardien remet les clés en main propre entre 15h et 20h, ou boîte à clés sur demande.",
    photos: [
      { top: [133, 193, 233] as const, bottom: [40, 116, 166] as const },
      { top: [174, 214, 241] as const, bottom: [52, 152, 219] as const },
      { top: [93, 173, 226] as const, bottom: [21, 67, 96] as const },
    ],
  },
  {
    title: "Loft moderne avec vue mer",
    city: "Nice",
    country: "France",
    address: "3 promenade des Anglais, 06000 Nice",
    description:
      "Loft design au 5e étage avec vue imprenable sur la Méditerranée. Terrasse privative, climatisation, à 5 minutes de la plage.",
    pricePerNight: 210,
    cleaningFee: 60,
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    beds: 2,
    amenities: ["Wifi", "Climatisation", "Terrasse", "Piscine", "Vue mer", "Parking"],
    accessDetails:
      "Un smart lock est installé sur la porte d'entrée. Le code d'accès numérique vous permet d'entrer directement, sans remise de clés.",
    photos: [
      { top: [72, 201, 176] as const, bottom: [22, 160, 133] as const },
      { top: [130, 224, 170] as const, bottom: [24, 106, 59] as const },
    ],
  },
  {
    title: "Pied-à-terre charmant dans le Marais",
    city: "Paris",
    country: "France",
    address: "27 rue des Rosiers, 75004 Paris",
    description:
      "Charmant appartement typiquement parisien avec poutres apparentes, au cœur du quartier historique du Marais.",
    pricePerNight: 120,
    cleaningFee: 35,
    maxGuests: 3,
    bedrooms: 1,
    bathrooms: 1,
    beds: 2,
    amenities: ["Wifi", "Cuisine équipée", "Lave-linge", "Animaux acceptés"],
    accessDetails:
      "Boîte à clés fixée à côté de la porte cochère. Code à 4 chiffres transmis après validation de votre check-in.",
    photos: [
      { top: [210, 180, 222] as const, bottom: [142, 68, 173] as const },
      { top: [187, 143, 206] as const, bottom: [91, 44, 111] as const },
    ],
  },
];

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const adminName = process.env.ADMIN_NAME || "Administrateur";

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName },
    create: { email: adminEmail, passwordHash, name: adminName },
  });
  console.log(`Compte admin prêt : ${adminEmail}`);

  for (const listing of sampleListings) {
    const slug = slugify(listing.title);
    const existing = await prisma.listing.findUnique({ where: { slug } });
    if (existing) {
      console.log(`Annonce déjà présente : ${listing.title}`);
      continue;
    }

    const photoDir = path.join(process.cwd(), "public", "seed-images");
    await mkdir(photoDir, { recursive: true });

    const photoUrls: string[] = [];
    for (let i = 0; i < listing.photos.length; i++) {
      const { top, bottom } = listing.photos[i];
      const png = generateGradientPng(1200, 800, [...top], [...bottom]);
      const filename = `${slug}-${i + 1}.png`;
      await writeFile(path.join(photoDir, filename), png);
      photoUrls.push(`/seed-images/${filename}`);
    }

    await prisma.listing.create({
      data: {
        slug,
        title: listing.title,
        description: listing.description,
        address: listing.address,
        city: listing.city,
        country: listing.country,
        pricePerNight: listing.pricePerNight,
        cleaningFee: listing.cleaningFee,
        maxGuests: listing.maxGuests,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        beds: listing.beds,
        amenities: JSON.stringify(listing.amenities),
        accessDetails: listing.accessDetails,
        photos: {
          create: photoUrls.map((url, position) => ({ url, position })),
        },
      },
    });
    console.log(`Annonce créée : ${listing.title}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
