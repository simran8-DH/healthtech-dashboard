const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DEMO_USERS = [
  {
    email: 'admin@healthtech.local',
    password: 'Admin@123',
    fullName: 'Clinic Administrator',
    role: 'ADMIN',
  },
  {
    email: 'doctor@healthtech.local',
    password: 'Doctor@123',
    fullName: 'Dr. Priya Sharma',
    role: 'DOCTOR',
  },
  {
    email: 'nurse@healthtech.local',
    password: 'Nurse@123',
    fullName: 'Nurse Ananya Reddy',
    role: 'NURSE',
  },
];

const SAMPLE_ENCOUNTERS = [
  { category: 'viral', severity: 'mild', symptoms: 'Fever, body ache, mild cough', diagnosis: 'Viral fever', treatment: 'Paracetamol, hydration, rest', ageGroup: '18-40', gender: 'FEMALE', villageCode: 'RJ-07' },
  { category: 'viral', severity: 'moderate', symptoms: 'High fever, sore throat, fatigue', diagnosis: 'Influenza-like illness', treatment: 'Supportive care, antipyretics', ageGroup: '6-17', gender: 'MALE', villageCode: 'RJ-07' },
  { category: 'seasonal', severity: 'mild', symptoms: 'Sneezing, watery eyes, itchy throat', diagnosis: 'Seasonal allergic rhinitis', treatment: 'Antihistamine', ageGroup: '41-60', gender: 'FEMALE', villageCode: 'RJ-12' },
  { category: 'diabetes', severity: 'moderate', symptoms: 'Polyuria, fatigue, blurred vision', diagnosis: 'Type 2 diabetes mellitus — follow-up', treatment: 'Metformin titration, diet counseling', ageGroup: '41-60', gender: 'MALE', villageCode: 'RJ-12' },
  { category: 'diabetes', severity: 'mild', symptoms: 'Routine sugar check, mild thirst', diagnosis: 'Prediabetes counseling', treatment: 'Lifestyle modification', ageGroup: '18-40', gender: 'FEMALE', villageCode: 'RJ-03' },
  { category: 'hypertension', severity: 'moderate', symptoms: 'Headache, elevated BP reading', diagnosis: 'Essential hypertension', treatment: 'Amlodipine started, salt restriction', ageGroup: '60+', gender: 'MALE', villageCode: 'RJ-03' },
  { category: 'respiratory', severity: 'severe', symptoms: 'Breathlessness, wheeze, low SpO2', diagnosis: 'Acute asthma exacerbation', treatment: 'Nebulization, steroids, referral', ageGroup: '6-17', gender: 'FEMALE', villageCode: 'RJ-07' },
  { category: 'gastrointestinal', severity: 'mild', symptoms: 'Loose stools, abdominal cramps', diagnosis: 'Acute gastroenteritis', treatment: 'ORS, zinc, hygiene advice', ageGroup: '0-5', gender: 'MALE', villageCode: 'RJ-12' },
  { category: 'maternal', severity: 'mild', symptoms: 'ANC visit, mild anemia symptoms', diagnosis: 'Antenatal care — mild anemia', treatment: 'Iron-folic acid, nutrition advice', ageGroup: '18-40', gender: 'FEMALE', villageCode: 'RJ-03' },
  { category: 'seasonal', severity: 'moderate', symptoms: 'Fever with chills, body pain', diagnosis: 'Suspected seasonal viral fever', treatment: 'Supportive, dengue NS1 advised', ageGroup: '18-40', gender: 'MALE', villageCode: 'RJ-07' },
  { category: 'viral', severity: 'mild', symptoms: 'Cold, mild fever 2 days', diagnosis: 'URI — viral', treatment: 'Symptomatic, isolation advice', ageGroup: '41-60', gender: 'OTHER', villageCode: 'RJ-12' },
  { category: 'hypertension', severity: 'mild', symptoms: 'BP check camp finding', diagnosis: 'Stage 1 hypertension', treatment: 'Lifestyle first-line, monitor', ageGroup: '41-60', gender: 'FEMALE', villageCode: 'RJ-03' },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(10 + (n % 6), 0, 0, 0);
  return d;
}

async function main() {
  console.log('Seeding HealthTech database...');

  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 12);
    await prisma.user.upsert({
      where: { email: u.email },
      update: { passwordHash, fullName: u.fullName, role: u.role, isActive: true },
      create: {
        email: u.email,
        passwordHash,
        fullName: u.fullName,
        role: u.role,
      },
    });
  }

  const doctor = await prisma.user.findUnique({ where: { email: 'doctor@healthtech.local' } });
  const nurse = await prisma.user.findUnique({ where: { email: 'nurse@healthtech.local' } });

  const existingCount = await prisma.encounter.count();
  if (existingCount === 0 && doctor && nurse && process.env.SEED_SAMPLES === 'true') {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    for (let i = 0; i < SAMPLE_ENCOUNTERS.length; i += 1) {
      const sample = SAMPLE_ENCOUNTERS[i];
      let code = 'PT-';
      for (let j = 0; j < 6; j += 1) code += alphabet[(i * 7 + j * 3) % alphabet.length];

      const patient = await prisma.patient.create({
        data: {
          anonymizedCode: code,
          ageGroup: sample.ageGroup,
          gender: sample.gender,
          villageCode: sample.villageCode,
        },
      });

      await prisma.encounter.create({
        data: {
          patientId: patient.id,
          createdById: i % 2 === 0 ? nurse.id : doctor.id,
          encounterDate: daysAgo(i * 3 + 1),
          symptoms: sample.symptoms,
          diagnosis: sample.diagnosis,
          treatment: sample.treatment,
          category: sample.category,
          severity: sample.severity,
          followUpNeeded: sample.severity !== 'mild',
          notes: i % 3 === 0 ? 'Telemedicine consult via PHC tablet' : null,
        },
      });
    }
    console.log(`Created ${SAMPLE_ENCOUNTERS.length} sample encounters`);
  } else if (process.env.SEED_SAMPLES !== 'true') {
    console.log('Skipping sample encounters (set SEED_SAMPLES=true to load demos)');
  } else {
    console.log('Encounters already present — skipping sample data');
  }

  console.log('Seed complete. Demo logins:');
  DEMO_USERS.forEach((u) => console.log(`  ${u.role}: ${u.email} / ${u.password}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
