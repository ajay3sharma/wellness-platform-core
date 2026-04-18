import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  CurrentUser,
  SaveWorkoutRequest,
  WorkoutAssignmentRecord,
  WorkoutDetail,
  WorkoutExerciseRecord,
  WorkoutListItem,
  WorkoutStatus
} from "@platform/types";
import { createApiException } from "../common/api-error.util";
import { PrismaService } from "../prisma/prisma.service";

type WorkoutRecord = Prisma.WorkoutGetPayload<{
  include: {
    exercises: true;
    assignments: {
      include: {
        coach: true;
      };
    };
  };
}>;

type WorkoutPreviewRecord = Prisma.WorkoutGetPayload<{
  include: {
    exercises: true;
  };
}>;

@Injectable()
export class WorkoutsService {
  constructor(private readonly prisma: PrismaService) {}

  async listVisibleWorkouts(user: CurrentUser): Promise<WorkoutListItem[]> {
    const workouts = await this.prisma.workout.findMany({
      where: user.role === "admin" ? undefined : { status: "published" },
      include: {
        exercises: true,
        assignments:
          user.role === "user"
            ? {
                where: { userId: user.id },
                include: { coach: true }
              }
            : {
                where: { userId: "__none__" },
                include: { coach: true }
              }
      },
      orderBy: [{ updatedAt: "desc" }]
    });

    return workouts.map((workout) => this.toWorkoutListItem(workout));
  }

  async getVisibleWorkout(user: CurrentUser, workoutId: string): Promise<WorkoutDetail> {
    const workout = await this.prisma.workout.findFirst({
      where:
        user.role === "admin"
          ? { id: workoutId }
          : {
              id: workoutId,
              status: "published"
            },
      include: {
        exercises: {
          orderBy: {
            sequence: "asc"
          }
        },
        assignments:
          user.role === "user"
            ? {
                where: { userId: user.id },
                include: { coach: true }
              }
            : {
                where: { userId: "__none__" },
                include: { coach: true }
              }
      }
    });

    if (!workout) {
      throw createApiException(HttpStatus.NOT_FOUND, "WORKOUT_NOT_FOUND", "Workout not found.");
    }

    return this.toWorkoutDetail(workout);
  }

  async listAdminWorkouts(): Promise<WorkoutListItem[]> {
    const workouts = await this.prisma.workout.findMany({
      include: {
        exercises: true
      },
      orderBy: [{ updatedAt: "desc" }]
    });

    return workouts.map((workout) => this.toWorkoutListItem(workout));
  }

  async createWorkout(payload: SaveWorkoutRequest): Promise<WorkoutDetail> {
    const workout = await this.prisma.workout.create({
      data: {
        title: payload.title.trim(),
        description: payload.description.trim(),
        difficulty: payload.difficulty,
        durationMinutes: payload.durationMinutes,
        category: payload.category?.trim() || null,
        tags: payload.tags.map((tag) => tag.trim()).filter(Boolean),
        exercises: {
          create: payload.exercises
            .slice()
            .sort((left, right) => left.sequence - right.sequence)
            .map((exercise) => ({
              name: exercise.name.trim(),
              instruction: exercise.instruction?.trim() || null,
              repTarget: exercise.repTarget?.trim() || null,
              timeTargetSeconds: exercise.timeTargetSeconds ?? null,
              distanceTargetMeters: exercise.distanceTargetMeters ?? null,
              restSeconds: exercise.restSeconds ?? null,
              sequence: exercise.sequence
            }))
        }
      },
      include: {
        exercises: {
          orderBy: {
            sequence: "asc"
          }
        },
        assignments: {
          where: { userId: "__none__" },
          include: { coach: true }
        }
      }
    });

    return this.toWorkoutDetail(workout);
  }

  async updateWorkout(workoutId: string, payload: SaveWorkoutRequest): Promise<WorkoutDetail> {
    await this.assertWorkoutExists(workoutId);

    const workout = await this.prisma.$transaction(async (tx) => {
      await tx.workoutExercise.deleteMany({
        where: { workoutId }
      });

      return tx.workout.update({
        where: { id: workoutId },
        data: {
          title: payload.title.trim(),
          description: payload.description.trim(),
          difficulty: payload.difficulty,
          durationMinutes: payload.durationMinutes,
          category: payload.category?.trim() || null,
          tags: payload.tags.map((tag) => tag.trim()).filter(Boolean),
          exercises: {
            create: payload.exercises
              .slice()
              .sort((left, right) => left.sequence - right.sequence)
              .map((exercise) => ({
                name: exercise.name.trim(),
                instruction: exercise.instruction?.trim() || null,
                repTarget: exercise.repTarget?.trim() || null,
                timeTargetSeconds: exercise.timeTargetSeconds ?? null,
                distanceTargetMeters: exercise.distanceTargetMeters ?? null,
                restSeconds: exercise.restSeconds ?? null,
                sequence: exercise.sequence
              }))
          }
        },
        include: {
          exercises: {
            orderBy: {
              sequence: "asc"
            }
          },
          assignments: {
            where: { userId: "__none__" },
            include: { coach: true }
          }
        }
      });
    });

    return this.toWorkoutDetail(workout);
  }

  async setWorkoutStatus(workoutId: string, status: WorkoutStatus): Promise<WorkoutDetail> {
    await this.assertWorkoutExists(workoutId);

    const workout = await this.prisma.workout.update({
      where: { id: workoutId },
      data: {
        status,
        publishedAt: status === "published" ? new Date() : null
      },
      include: {
        exercises: {
          orderBy: {
            sequence: "asc"
          }
        },
        assignments: {
          where: { userId: "__none__" },
          include: { coach: true }
        }
      }
    });

    return this.toWorkoutDetail(workout);
  }

  private async assertWorkoutExists(workoutId: string) {
    const exists = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      select: { id: true }
    });

    if (!exists) {
      throw createApiException(HttpStatus.NOT_FOUND, "WORKOUT_NOT_FOUND", "Workout not found.");
    }
  }

  private toWorkoutListItem(workout: WorkoutRecord | WorkoutPreviewRecord): WorkoutListItem {
    const assignment =
      "assignments" in workout && Array.isArray(workout.assignments) ? workout.assignments[0] : null;

    return {
      id: workout.id,
      title: workout.title,
      description: workout.description,
      difficulty: workout.difficulty,
      durationMinutes: workout.durationMinutes,
      category: workout.category,
      tags: workout.tags,
      status: workout.status,
      exerciseCount: workout.exercises.length,
      publishedAt: workout.publishedAt?.toISOString() ?? null,
      updatedAt: workout.updatedAt.toISOString(),
      assignment: assignment ? this.toWorkoutAssignment(assignment, workout.title) : null
    };
  }

  private toWorkoutDetail(workout: WorkoutRecord): WorkoutDetail {
    return {
      ...this.toWorkoutListItem(workout),
      exercises: workout.exercises
        .slice()
        .sort((left, right) => left.sequence - right.sequence)
        .map((exercise): WorkoutExerciseRecord => ({
          id: exercise.id,
          name: exercise.name,
          instruction: exercise.instruction,
          repTarget: exercise.repTarget,
          timeTargetSeconds: exercise.timeTargetSeconds,
          distanceTargetMeters: exercise.distanceTargetMeters,
          restSeconds: exercise.restSeconds,
          sequence: exercise.sequence
        }))
    };
  }

  private toWorkoutAssignment(
    assignment: WorkoutRecord["assignments"][number],
    workoutTitle: string
  ): WorkoutAssignmentRecord {
    return {
      id: assignment.id,
      workoutId: assignment.workoutId,
      workoutTitle,
      userId: assignment.userId,
      coachId: assignment.coachId,
      coachDisplayName: assignment.coach.displayName,
      note: assignment.note,
      assignedAt: assignment.assignedAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString()
    };
  }
}
