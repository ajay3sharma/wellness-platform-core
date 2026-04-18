import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  CompleteWorkoutSessionRequest,
  CurrentUser,
  StartWorkoutSessionRequest,
  UpdateWorkoutSessionRequest,
  WorkoutSessionRecord,
  WorkoutSessionSummary
} from "@platform/types";
import { createApiException } from "../common/api-error.util";
import { PrismaService } from "../prisma/prisma.service";

type SessionRecord = Prisma.WorkoutSessionGetPayload<{
  include: {
    workout: true;
    exercises: true;
  };
}>;

@Injectable()
export class WorkoutSessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(user: CurrentUser): Promise<WorkoutSessionSummary[]> {
    const sessions = await this.prisma.workoutSession.findMany({
      where: {
        userId: user.id
      },
      include: {
        workout: true,
        exercises: true
      },
      orderBy: {
        startedAt: "desc"
      }
    });

    return sessions.map((session) => this.toWorkoutSessionSummary(session));
  }

  async detail(user: CurrentUser, sessionId: string): Promise<WorkoutSessionRecord> {
    const session = await this.getOwnedSession(user.id, sessionId);
    return this.toWorkoutSessionRecord(session);
  }

  async start(user: CurrentUser, payload: StartWorkoutSessionRequest): Promise<WorkoutSessionRecord> {
    const workout = await this.prisma.workout.findFirst({
      where: {
        id: payload.workoutId,
        status: "published"
      },
      include: {
        exercises: {
          orderBy: {
            sequence: "asc"
          }
        }
      }
    });

    if (!workout) {
      throw createApiException(HttpStatus.NOT_FOUND, "WORKOUT_NOT_FOUND", "Workout not found.");
    }

    const session = await this.prisma.workoutSession.create({
      data: {
        workoutId: workout.id,
        userId: user.id,
        exercises: {
          create: workout.exercises.map((exercise) => ({
            workoutExerciseId: exercise.id,
            name: exercise.name,
            instruction: exercise.instruction,
            repTarget: exercise.repTarget,
            timeTargetSeconds: exercise.timeTargetSeconds,
            distanceTargetMeters: exercise.distanceTargetMeters,
            restSeconds: exercise.restSeconds,
            sequence: exercise.sequence
          }))
        }
      },
      include: {
        workout: true,
        exercises: {
          orderBy: {
            sequence: "asc"
          }
        }
      }
    });

    return this.toWorkoutSessionRecord(session);
  }

  async update(
    user: CurrentUser,
    sessionId: string,
    payload: UpdateWorkoutSessionRequest
  ): Promise<WorkoutSessionRecord> {
    const session = await this.getOwnedSession(user.id, sessionId);

    if (session.status === "completed") {
      throw createApiException(
        HttpStatus.BAD_REQUEST,
        "WORKOUT_SESSION_COMPLETED",
        "Completed sessions cannot be updated."
      );
    }

    await this.applySessionUpdates(sessionId, payload);

    const updated = await this.getOwnedSession(user.id, sessionId);
    return this.toWorkoutSessionRecord(updated);
  }

  async complete(
    user: CurrentUser,
    sessionId: string,
    payload: CompleteWorkoutSessionRequest
  ): Promise<WorkoutSessionRecord> {
    const session = await this.getOwnedSession(user.id, sessionId);

    if (session.status === "completed") {
      return this.toWorkoutSessionRecord(session);
    }

    await this.applySessionUpdates(sessionId, payload);

    const updated = await this.prisma.workoutSession.update({
      where: {
        id: sessionId
      },
      data: {
        status: "completed",
        completedAt: new Date(),
        notes: payload.notes ?? session.notes
      },
      include: {
        workout: true,
        exercises: {
          orderBy: {
            sequence: "asc"
          }
        }
      }
    });

    return this.toWorkoutSessionRecord(updated);
  }

  private async getOwnedSession(userId: string, sessionId: string): Promise<SessionRecord> {
    const session = await this.prisma.workoutSession.findFirst({
      where: {
        id: sessionId,
        userId
      },
      include: {
        workout: true,
        exercises: {
          orderBy: {
            sequence: "asc"
          }
        }
      }
    });

    if (!session) {
      throw createApiException(
        HttpStatus.NOT_FOUND,
        "WORKOUT_SESSION_NOT_FOUND",
        "Workout session not found."
      );
    }

    return session;
  }

  private async applySessionUpdates(
    sessionId: string,
    payload: UpdateWorkoutSessionRequest | CompleteWorkoutSessionRequest
  ) {
    await this.prisma.$transaction(async (tx) => {
      if (payload.notes !== undefined) {
        await tx.workoutSession.update({
          where: {
            id: sessionId
          },
          data: {
            notes: payload.notes
          }
        });
      }

      for (const exercise of payload.exercises ?? []) {
        await tx.workoutSessionExercise.updateMany({
          where: {
            id: exercise.id,
            workoutSessionId: sessionId
          },
          data: {
            completed: exercise.completed,
            notes: exercise.notes
          }
        });
      }
    });
  }

  private toWorkoutSessionRecord(session: SessionRecord): WorkoutSessionRecord {
    return {
      id: session.id,
      workoutId: session.workoutId,
      workoutTitle: session.workout.title,
      status: session.status,
      notes: session.notes,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      updatedAt: session.updatedAt.toISOString(),
      exercises: session.exercises.map((exercise) => ({
        id: exercise.id,
        workoutExerciseId: exercise.workoutExerciseId,
        name: exercise.name,
        instruction: exercise.instruction,
        repTarget: exercise.repTarget,
        timeTargetSeconds: exercise.timeTargetSeconds,
        distanceTargetMeters: exercise.distanceTargetMeters,
        restSeconds: exercise.restSeconds,
        sequence: exercise.sequence,
        completed: exercise.completed,
        notes: exercise.notes
      }))
    };
  }

  private toWorkoutSessionSummary(session: SessionRecord): WorkoutSessionSummary {
    const completedExercises = session.exercises.filter((exercise) => exercise.completed).length;

    return {
      id: session.id,
      workoutId: session.workoutId,
      workoutTitle: session.workout.title,
      status: session.status,
      notes: session.notes,
      startedAt: session.startedAt.toISOString(),
      completedAt: session.completedAt?.toISOString() ?? null,
      updatedAt: session.updatedAt.toISOString(),
      completedExercises,
      totalExercises: session.exercises.length
    };
  }
}
