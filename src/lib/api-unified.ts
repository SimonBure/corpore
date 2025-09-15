import { Capacitor } from '@capacitor/core'
import { ApiResponse, Exercise, Session, CreateSessionRequest, SessionExercise } from '@/types'
import { getPrismaClient } from './prisma-mobile'

// Lazy import function for web APIs
async function getWebApis() {
  const webApis = await import('./api')
  return {
    exerciseApi: webApis.exerciseApi,
    sessionApi: webApis.sessionApi,
    templateApi: webApis.templateApi
  }
}

// Mobile API implementations
class MobileExerciseApi {
  async getAll(): Promise<ApiResponse<Exercise[]>> {
    const prisma = await getPrismaClient()
    try {
      const exercises = await prisma.exercise.findMany({
        orderBy: { name: 'asc' }
      })
      return { data: exercises, success: true }
    } catch (error) {
      throw new Error(`Failed to fetch exercises: ${error}`)
    }
  }

  async getById(id: number): Promise<ApiResponse<Exercise>> {
    const prisma = await getPrismaClient()
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
  }

  async create(exercise: Omit<Exercise, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Exercise>> {
    const prisma = await getPrismaClient()
    try {
      const newExercise = await prisma.exercise.create({
        data: exercise
      })
      return { data: newExercise, success: true }
    } catch (error) {
      throw new Error(`Failed to create exercise: ${error}`)
    }
  }

  async update(id: number, exercise: Partial<Exercise>): Promise<ApiResponse<Exercise>> {
    const prisma = await getPrismaClient()
    try {
      const updatedExercise = await prisma.exercise.update({
        where: { id },
        data: exercise
      })
      return { data: updatedExercise, success: true }
    } catch (error) {
      throw new Error(`Failed to update exercise: ${error}`)
    }
  }

  async delete(id: number): Promise<ApiResponse<null>> {
    const prisma = await getPrismaClient()
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

class MobileSessionApi {
  async getAll(): Promise<ApiResponse<Session[]>> {
    const prisma = await getPrismaClient()
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
  }

  async getById(id: string): Promise<ApiResponse<Session>> {
    const prisma = await getPrismaClient()
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
  }

  async create(session: CreateSessionRequest): Promise<ApiResponse<Session>> {
    const prisma = await getPrismaClient()
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
  }

  async update(id: string, session: Partial<Session>): Promise<ApiResponse<Session>> {
    const prisma = await getPrismaClient()
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
  }

  async delete(id: string): Promise<ApiResponse<null>> {
    const prisma = await getPrismaClient()
    try {
      await prisma.session.delete({
        where: { id }
      })
      return { data: null, success: true }
    } catch (error) {
      throw new Error(`Failed to delete session: ${error}`)
    }
  }

  async rename(id: string, title: string): Promise<ApiResponse<Session>> {
    const prisma = await getPrismaClient()
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
  }

  async updateExercise(sessionId: string, exerciseId: number, data: {
    actualSets?: number;
    actualReps?: number[];
    weight?: number[];
  }): Promise<ApiResponse<SessionExercise>> {
    const prisma = await getPrismaClient()
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
  }

  async terminate(sessionId: string, data: {
    actualDuration: number;
    completedExercises: {
      exerciseId: number;
      actualSets: number;
      actualReps: number[];
      weight: number[];
    }[];
  }): Promise<ApiResponse<Session>> {
    const prisma = await getPrismaClient()
    try {
      await prisma.session.update({
        where: { id: sessionId },
        data: {
          completed: true,
          duration: data.actualDuration
        }
      })

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

class MobileTemplateApi {
  async getAll(): Promise<ApiResponse<Session[]>> {
    const prisma = await getPrismaClient()
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

// Create unified API instances
const createUnifiedApis = async () => {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    // Mobile platform - use direct Prisma
    return {
      exerciseApi: new MobileExerciseApi(),
      sessionApi: new MobileSessionApi(),
      templateApi: new MobileTemplateApi()
    }
  } else {
    // Web platform - use HTTP APIs
    const webApis = await getWebApis()
    return webApis
  }
}

// Export unified APIs (lazy loaded)
let apiInstances: any = null

export const exerciseApi = {
  async getAll() {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.exerciseApi.getAll()
  },
  async getById(id: number) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.exerciseApi.getById(id)
  },
  async create(exercise: any) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.exerciseApi.create(exercise)
  },
  async update(id: number, exercise: any) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.exerciseApi.update(id, exercise)
  },
  async delete(id: number) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.exerciseApi.delete(id)
  }
}

export const sessionApi = {
  async getAll() {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.sessionApi.getAll()
  },
  async getById(id: string) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.sessionApi.getById(id)
  },
  async create(session: any) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.sessionApi.create(session)
  },
  async update(id: string, session: any) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.sessionApi.update(id, session)
  },
  async delete(id: string) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.sessionApi.delete(id)
  },
  async rename(id: string, title: string) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.sessionApi.rename(id, title)
  },
  async updateExercise(sessionId: string, exerciseId: number, data: any) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.sessionApi.updateExercise(sessionId, exerciseId, data)
  },
  async terminate(sessionId: string, data: any) {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.sessionApi.terminate(sessionId, data)
  }
}

export const templateApi = {
  async getAll() {
    if (!apiInstances) apiInstances = await createUnifiedApis()
    return apiInstances.templateApi.getAll()
  }
}