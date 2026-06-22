import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Los 7 pasos del onboarding, en orden.
const STEPS = [
  {
    order: 1,
    key: "contract",
    title: "Firma de contrato",
    description: "Acuerdo legal con la compañía y el programa.",
    instructions:
      "El contrato es una copia impresa. Descárgalo o recógelo con tu manager, fírmalo y sube aquí una foto o escaneo claro de TODAS las páginas firmadas.",
    titleEn: "Contract signing",
    descriptionEn: "Legal agreement with the company and the program.",
    instructionsEn:
      "The contract is a printed copy. Download it or pick it up from your manager, sign it, and upload here a clear photo or scan of ALL signed pages.",
    requiresUpload: true,
    externalUrl: null,
    managerOnly: false,
  },
  {
    order: 2,
    key: "jotform",
    title: "Completar el JotForm",
    description: "Información profesional, disponibilidad y antecedentes.",
    instructions:
      "Completa el formulario JotForm con tu información. Mira el video de instrucciones (carpeta docs/jotform-instrucciones-video) antes de empezar. Cuando termines, marca este paso como enviado.",
    titleEn: "Complete the JotForm",
    descriptionEn: "Professional info, availability and background.",
    instructionsEn:
      "Fill out the JotForm with your information. Watch the instructions video (folder docs/jotform-instrucciones-video) before you start. When finished, mark this step as submitted.",
    requiresUpload: false,
    externalUrl: "https://form.jotform.com/261537220764153",
    managerOnly: false,
  },
  {
    order: 3,
    key: "id",
    title: "Identificación (licencia o ID)",
    description: "Licencia de conducir o identificación oficial del gobierno.",
    instructions:
      "Sube una foto o escaneo legible de tu licencia de conducir o identificación oficial. Asegúrate de que se vean todos los datos y que no esté borrosa.",
    titleEn: "Identification (driver's license or ID)",
    descriptionEn: "Driver's license or government-issued ID.",
    instructionsEn:
      "Upload a legible photo or scan of your driver's license or official ID. Make sure all details are visible and not blurry.",
    requiresUpload: true,
    externalUrl: null,
    managerOnly: false,
  },
  {
    order: 4,
    key: "photo",
    title: "Fotografía 2x2",
    description: "Foto tipo pasaporte (2x2 pulgadas).",
    instructions:
      "Sube una fotografía reciente tipo pasaporte (2x2), fondo claro, rostro visible y sin lentes oscuros ni gorra.",
    titleEn: "2x2 photograph",
    descriptionEn: "Passport-style photo (2x2 inches).",
    instructionsEn:
      "Upload a recent passport-style (2x2) photo: light background, face visible, no sunglasses or hat.",
    requiresUpload: true,
    externalUrl: null,
    managerOnly: false,
  },
  {
    order: 5,
    key: "hipaa",
    title: "Certificación HIPAA",
    description: "Reconocimiento y certificación de cumplimiento HIPAA.",
    instructions:
      "Completa la certificación HIPAA y sube el certificado o comprobante de finalización.",
    titleEn: "HIPAA certification",
    descriptionEn: "HIPAA compliance acknowledgment and certification.",
    instructionsEn:
      "Complete the HIPAA certification and upload the certificate or proof of completion.",
    requiresUpload: true,
    externalUrl: null,
    managerOnly: false,
  },
  {
    order: 6,
    key: "activation",
    title: "Activación de cuenta LSPC Data Health",
    description: "Habilitación de tu cuenta para recolectar pruebas e info.",
    instructions:
      "Una vez aprobados los pasos anteriores, tu manager activará tu cuenta en el sistema. Luego podrás ingresar en el portal de activación.",
    titleEn: "LSPC Data Health account activation",
    descriptionEn:
      "Enabling your account to collect tests and patient info.",
    instructionsEn:
      "Once the previous steps are approved, your manager will activate your account in the system. Then you can log in to the activation portal.",
    requiresUpload: false,
    externalUrl: "https://telemed.lspcdata.com/login",
    managerOnly: true,
  },
  {
    order: 7,
    key: "ready",
    title: "Listo para recolectar pruebas",
    description: "Aprobación final: estás listo para trabajar.",
    instructions:
      "Aprobación final de tu manager. Cuando este paso esté aprobado, ¡ya puedes empezar a recolectar pruebas!",
    titleEn: "Ready to collect tests",
    descriptionEn: "Final approval: you're ready to work.",
    instructionsEn:
      "Final approval from your manager. Once this step is approved, you can start collecting tests!",
    requiresUpload: false,
    externalUrl: null,
    managerOnly: true,
  },
];

async function main() {
  console.log("Sembrando pasos del onboarding...");
  for (const step of STEPS) {
    await prisma.step.upsert({
      where: { key: step.key },
      update: step,
      create: step,
    });
  }

  const managerPassword = await bcrypt.hash("manager123", 10);
  const techPassword = await bcrypt.hash("tecnico123", 10);
  const directorPassword = await bcrypt.hash("director123", 10);

  const manager = await prisma.user.upsert({
    where: { email: "manager@lspc.test" },
    update: {},
    create: {
      email: "manager@lspc.test",
      name: "Manager Demo",
      passwordHash: managerPassword,
      role: "MANAGER",
    },
  });

  const director = await prisma.user.upsert({
    where: { email: "director@lspc.test" },
    update: {},
    create: {
      email: "director@lspc.test",
      name: "Director Demo",
      passwordHash: directorPassword,
      role: "DIRECTOR",
    },
  });

  const tech = await prisma.user.upsert({
    where: { email: "tecnico@lspc.test" },
    update: {},
    create: {
      email: "tecnico@lspc.test",
      name: "Técnico Demo",
      passwordHash: techPassword,
      role: "TECHNICIAN",
    },
  });

  // Asegura que el técnico demo tenga una fila de submission por cada paso.
  const steps = await prisma.step.findMany();
  for (const step of steps) {
    await prisma.submission.upsert({
      where: { userId_stepId: { userId: tech.id, stepId: step.id } },
      update: {},
      create: { userId: tech.id, stepId: step.id },
    });
  }

  console.log("\nListo. Cuentas de demostración:");
  console.log(`  Manager   -> ${manager.email} / manager123`);
  console.log(`  Director  -> ${director.email} / director123`);
  console.log(`  Técnico   -> ${tech.email} / tecnico123`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
