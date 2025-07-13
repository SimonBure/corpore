import { PrismaClient, ExerciseCategory } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  // Exercices classiques de force
  { name: 'Pompes', category: 'FORCE' as ExerciseCategory, muscleGroups: ['pectoraux', 'épaules', 'triceps'], defaultSets: 3, defaultReps: 12, defaultRestBetweenSets: 60, defaultRestAfter: 120 },
  { name: 'Pompes murales', category: 'FORCE' as ExerciseCategory, muscleGroups: ['pectoraux', 'triceps'], defaultSets: 3, defaultReps: 15, defaultRestBetweenSets: 45, defaultRestAfter: 90 },
  { name: 'Squats', category: 'FORCE' as ExerciseCategory, muscleGroups: ['quadriceps', 'fessiers'], defaultSets: 3, defaultReps: 15, defaultRestBetweenSets: 60, defaultRestAfter: 120 },
  { name: 'Tractions', category: 'FORCE' as ExerciseCategory, muscleGroups: ['dos', 'biceps'], defaultSets: 3, defaultReps: 8, defaultRestBetweenSets: 90, defaultRestAfter: 120 },
  { name: 'Crunchs', category: 'FORCE' as ExerciseCategory, muscleGroups: ['abdos'], defaultSets: 3, defaultReps: 20, defaultRestBetweenSets: 45, defaultRestAfter: 90 },
  
  // Exercices de maintien
  { name: 'Planche', category: 'FORCE' as ExerciseCategory, muscleGroups: ['abdos'], defaultSets: 3, defaultReps: null, defaultDuration: 30, defaultRestBetweenSets: 60, defaultRestAfter: 120, isDurationBased: true },
];

const templates = [
  {
    title: 'Force haut du corps',
    date: new Date(),
    warmupSeconds: 300,
    isTemplate: true,
    exercises: [
      { name: 'Pompes', sets: 3, reps: 12, restBetweenSets: 60, restAfter: 120, order: 1 },
      { name: 'Tractions', sets: 3, reps: 8, restBetweenSets: 90, restAfter: 120, order: 2 },
      { name: 'Pompes murales', sets: 3, reps: 15, restBetweenSets: 45, restAfter: 90, order: 3 },
    ]
  },
  {
    title: 'Puissance bas du corps',
    date: new Date(),
    warmupSeconds: 300,
    isTemplate: true,
    exercises: [
      { name: 'Squats', sets: 3, reps: 15, restBetweenSets: 60, restAfter: 120, order: 1 },
      { name: 'Crunchs', sets: 3, reps: 20, restBetweenSets: 45, restAfter: 90, order: 2 },
    ]
  },
  {
    title: 'Explosif abdos',
    date: new Date(),
    warmupSeconds: 180,
    isTemplate: true,
    exercises: [
      { name: 'Planche', sets: 3, durationSeconds: 30, restBetweenSets: 60, restAfter: 120, order: 1 },
      { name: 'Crunchs', sets: 3, reps: 20, restBetweenSets: 45, restAfter: 90, order: 2 },
    ]
  },
];

async function main() {
  console.log('Début du seeding...');
  
  // Effacer les données existantes
  await prisma.sessionExercise.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.exercise.deleteMany({});
  
  // Seeding des exercices
  for (const exercise of exercises) {
    await prisma.exercise.create({
      data: {
        ...exercise,
        muscleGroups: JSON.stringify(exercise.muscleGroups)
      }
    });
  }
  
  // Seeding des templates
  for (const template of templates) {
    // Trouver les IDs des exercices
    const templateExercises = await Promise.all(
      template.exercises.map(async (ex) => {
        const exercise = await prisma.exercise.findUnique({
          where: { name: ex.name }
        });
        return {
          ...ex,
          exerciseId: exercise!.id
        };
      })
    );
    
    await prisma.session.create({
      data: {
        title: template.title,
        date: template.date,
        warmupSeconds: template.warmupSeconds,
        isTemplate: template.isTemplate,
        sessionExercises: {
          create: templateExercises.map(ex => ({
            exerciseId: ex.exerciseId,
            sets: ex.sets,
            reps: ex.reps || null,
            durationSeconds: ex.durationSeconds || null,
            restBetweenSets: ex.restBetweenSets,
            restAfter: ex.restAfter,
            order: ex.order
          }))
        }
      }
    });
  }
  
  console.log('Seeding terminé !');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });