import { Capacitor } from '@capacitor/core'
import { ApiResponse, Exercise, Session, CreateSessionRequest, SessionExercise } from '@/types'
import { getPrismaClient } from './prisma-mobile'
import { exerciseApi as webExerciseApi, sessionApi as webSessionApi, templateApi as webTemplateApi } from './api'

// Direct database operations for mobile
async function createDirectExerciseApi() {
  const prisma = await getPrismaClient()
  
  return {
    getAll: async (): Promise<ApiResponse<Exercise[]>> => {
      try {
        const exercises = await prisma.exercise.findMany({
          orderBy: { name: 'asc' }
        })
        return { data: exercises, success: true }
      } catch (error) {
        throw new Error(`Failed to fetch exercises: ${error}`)
      }
    },

    getById: async (id: number): Promise<ApiResponse<Exercise>> => {
      try {
        const exercise = await prisma.exercise.findUnique({
          where: { id }
        })
        if (!exercise) {
          throw new Error('Exercise not found')
        }
        return { data: exercise, success: true }
      } catch (error) {
        throw new Error(`Failed to fetch exercise: ${error}`)
      }
    },

    create: async (exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Exercise>> => {
      try {
        const newExercise = await prisma.exercise.create({
          data: exercise
        })
        return { data: newExercise, success: true }
      } catch (error) {
        throw new Error(`Failed to create exercise: ${error}`)
      }
    },

    update: async (id: number, exercise: Partial<Exercise>): Promise<ApiResponse<Exercise>> => {
      try {
        const updatedExercise = await prisma.exercise.update({
          where: { id },
          data: exercise
        })
        return { data: updatedExercise, success: true }
      } catch (error) {
        throw new Error(`Failed to update exercise: ${error}`)
      }
    },

    delete: async (id: number): Promise<ApiResponse<null>> => {
      try {
        await prisma.exercise.delete({
          where: { id }
        })
        return { data: null, success: true }
      } catch (error) {
        throw new Error(`Failed to delete exercise: ${error}`)
      }
    }
  }
}

async function createDirectSessionApi() {
  const prisma = await getPrismaClient()
  
  return {
    getAll: async (): Promise<ApiResponse<Session[]>> => {
      try {
        const sessions = await prisma.session.findMany({
          include: {
            sessionExercises: {
              include: { exercise: true }
            }
          },
          orderBy: { date: 'desc' }
        })
        return { data: sessions, success: true }
      } catch (error) {
        throw new Error(`Failed to fetch sessions: ${error}`)
      }
    },

    getById: async (id: string): Promise<ApiResponse<Session>> => {
      try {
        const session = await prisma.session.findUnique({
          where: { id },
          include: {
            sessionExercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' }
            }
          }
        })
        if (!session) {
          throw new Error('Session not found')
        }
        return { data: session, success: true }
      } catch (error) {
        throw new Error(`Failed to fetch session: ${error}`)
      }
    },

    create: async (session: CreateSessionRequest): Promise<ApiResponse<Session>> => {
      try {
        const newSession = await prisma.session.create({
          data: {
            title: session.title,
            warmupSeconds: session.warmupSeconds,
            isTemplate: session.isTemplate,
            sessionExercises: {
              create: session.exercises.map((ex, index) => ({
                exerciseId: ex.exerciseId,
                order: index,
                sets: ex.sets,
                reps: ex.reps,
                durationSeconds: ex.durationSeconds,
                restBetweenSets: ex.restBetweenSets,
                restAfter: ex.restAfter,
                weight: ex.weight ? JSON.stringify(ex.weight) : null
              }))
            }
          },
          include: {
            sessionExercises: {
              include: { exercise: true }
            }
          }
        })
        return { data: newSession, success: true }
      } catch (error) {
        throw new Error(`Failed to create session: ${error}`)
      }
    },

    update: async (id: string, session: Partial<Session>): Promise<ApiResponse<Session>> => {
      try {
        const updatedSession = await prisma.session.update({
          where: { id },
          data: session,
          include: {
            sessionExercises: {
              include: { exercise: true }
            }
          }
        })
        return { data: updatedSession, success: true }
      } catch (error) {
        throw new Error(`Failed to update session: ${error}`)
      }
    },

    delete: async (id: string): Promise<ApiResponse<null>> => {
      try {
        await prisma.session.delete({
          where: { id }
        })
        return { data: null, success: true }
      } catch (error) {
        throw new Error(`Failed to delete session: ${error}`)
      }
    },

    rename: async (id: string, title: string): Promise<ApiResponse<Session>> => {
      try {
        const updatedSession = await prisma.session.update({
          where: { id },
          data: { title },
          include: {
            sessionExercises: {
              include: { exercise: true }
            }
          }
        })
        return { data: updatedSession, success: true }
      } catch (error) {
        throw new Error(`Failed to rename session: ${error}`)
      }
    },

    updateExercise: async (sessionId: string, exerciseId: number, data: {
      actualSets?: number;
      actualReps?: number[];
      weight?: number[];
    }): Promise<ApiResponse<SessionExercise>> => {
      try {
        const updateData: any = {}
        if (data.actualSets !== undefined) updateData.actualSets = data.actualSets
        if (data.actualReps !== undefined) updateData.actualReps = JSON.stringify(data.actualReps)
        if (data.weight !== undefined) updateData.weight = JSON.stringify(data.weight)

        const updatedSessionExercise = await prisma.sessionExercise.update({
          where: {
            sessionId_exerciseId: {
              sessionId,
              exerciseId
            }
          },
          data: updateData,
          include: { exercise: true }
        })
        return { data: updatedSessionExercise, success: true }
      } catch (error) {
        throw new Error(`Failed to update session exercise: ${error}`)
      }
    },

    terminate: async (sessionId: string, data: {
      actualDuration: number;
      completedExercises: {
        exerciseId: number;
        actualSets: number;
        actualReps: number[];
        weight: number[];
      }[];
    }): Promise<ApiResponse<Session>> => {
      try {
        // Update session as completed with duration
        await prisma.session.update({
          where: { id: sessionId },
          data: {
            completed: true,
            duration: data.actualDuration
          }
        })

        // Update each exercise with actual data
        for (const ex of data.completedExercises) {
          await prisma.sessionExercise.update({
            where: {
              sessionId_exerciseId: {
                sessionId,
                exerciseId: ex.exerciseId
              }
            },
            data: {
              actualSets: ex.actualSets,
              actualReps: JSON.stringify(ex.actualReps),
              weight: JSON.stringify(ex.weight)
            }
          })
        }

        // Fetch and return updated session
        const updatedSession = await prisma.session.findUnique({
          where: { id: sessionId },
          include: {
            sessionExercises: {
              include: { exercise: true }
            }
          }
        })

        return { data: updatedSession!, success: true }
      } catch (error) {
        throw new Error(`Failed to terminate session: ${error}`)
      }
    }
  }
}

async function createDirectTemplateApi() {
  const prisma = await getPrismaClient()
  
  return {
    getAll: async (): Promise<ApiResponse<Session[]>> => {
      try {
        const templates = await prisma.session.findMany({
          where: { isTemplate: true },
          include: {
            sessionExercises: {
              include: { exercise: true },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { title: 'asc' }
        })
        return { data: templates, success: true }
      } catch (error) {
        throw new Error(`Failed to fetch templates: ${error}`)
      }
    }
  }
}

// Unified API that works on both web and mobile
export const exerciseApi = Capacitor.isNativePlatform() 
  ? await createDirectExerciseApi()
  : webExerciseApi

export const sessionApi = Capacitor.isNativePlatform()
  ? await createDirectSessionApi()
  : webSessionApi

export const templateApi = Capacitor.isNativePlatform()
  ? await createDirectTemplateApi()
  : webTemplateApi