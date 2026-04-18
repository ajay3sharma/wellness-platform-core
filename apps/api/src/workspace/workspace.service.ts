import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  AssignCoachRequest,
  AssignWorkoutRequest,
  CoachNoteRecord,
  CoachUserHistory,
  CoachUserRecord,
  CurrentUser,
  SaveCoachNoteRequest,
  UserDirectoryRecord,
  WorkoutAssignmentRecord,
  WorkoutSessionSummary
} from "@platform/types";
import { createApiException } from "../common/api-error.util";
import { PrismaService } from "../prisma/prisma.service";

type DirectoryUserRecord = Prisma.UserGetPayload<{
  include: {
    coachAssignment: {
      include: {
        coach: true;
      };
    };
  };
}>;

type CoachAssignmentListRecord = Prisma.UserCoachAssignmentGetPayload<{
  include: {
    user: {
      include: {
        workoutAssignments: {
          include: {
            workout: true;
            coach: true;
          };
        };
        coachNotes: true;
        workoutSessions: {
          include: {
            workout: true;
            exercises: true;
          };
        };
      };
    };
  };
}>;

type CoachHistoryUserRecord = Prisma.UserGetPayload<{
  include: {
    coachAssignment: {
      include: {
        coach: true;
      };
    };
    workoutAssignments: {
      include: {
        workout: true;
        coach: true;
      };
    };
    coachNotes: true;
    workoutSessions: {
      include: {
        workout: true;
        exercises: true;
      };
    };
  };
}>;

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  async listAdminUsers(): Promise<UserDirectoryRecord[]> {
    const users = await this.prisma.user.findMany({
      include: {
        coachAssignment: {
          include: {
            coach: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return users.map((user) => this.toUserDirectoryRecord(user));
  }

  async approveRole(userId: string): Promise<UserDirectoryRecord> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        coachAssignment: {
          include: {
            coach: true
          }
        }
      }
    });

    if (!user) {
      throw createApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found.");
    }

    if (user.status !== "pending_approval" || !user.requestedRole) {
      throw createApiException(
        HttpStatus.BAD_REQUEST,
        "ROLE_APPROVAL_NOT_REQUIRED",
        "This user does not have a pending role request."
      );
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: user.requestedRole,
        requestedRole: null,
        status: "active"
      },
      include: {
        coachAssignment: {
          include: {
            coach: true
          }
        }
      }
    });

    return this.toUserDirectoryRecord(updated);
  }

  async assignCoach(
    userId: string,
    payload: AssignCoachRequest,
    admin: CurrentUser
  ): Promise<UserDirectoryRecord> {
    const [user, coach] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId }
      }),
      this.prisma.user.findUnique({
        where: { id: payload.coachId }
      })
    ]);

    if (!user) {
      throw createApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found.");
    }

    if (!coach) {
      throw createApiException(HttpStatus.NOT_FOUND, "COACH_NOT_FOUND", "Coach not found.");
    }

    if (user.role !== "user" || user.status !== "active") {
      throw createApiException(
        HttpStatus.BAD_REQUEST,
        "COACH_ASSIGNMENT_INVALID_USER",
        "Only active users can be assigned to a coach."
      );
    }

    if (coach.role !== "coach" || coach.status !== "active") {
      throw createApiException(
        HttpStatus.BAD_REQUEST,
        "COACH_ASSIGNMENT_INVALID_COACH",
        "Only active coaches can receive user assignments."
      );
    }

    await this.prisma.userCoachAssignment.upsert({
      where: {
        userId
      },
      update: {
        coachId: coach.id,
        assignedById: admin.id
      },
      create: {
        userId,
        coachId: coach.id,
        assignedById: admin.id
      }
    });

    const updated = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        coachAssignment: {
          include: {
            coach: true
          }
        }
      }
    });

    if (!updated) {
      throw createApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found.");
    }

    return this.toUserDirectoryRecord(updated);
  }

  async listCoachUsers(coach: CurrentUser): Promise<CoachUserRecord[]> {
    const assignments = await this.prisma.userCoachAssignment.findMany({
      where: {
        coachId: coach.id
      },
      include: {
        user: {
          include: {
            workoutAssignments: {
              where: {
                coachId: coach.id
              },
              include: {
                workout: true,
                coach: true
              }
            },
            coachNotes: {
              where: {
                coachId: coach.id
              }
            },
            workoutSessions: {
              where: {
                status: "completed"
              },
              orderBy: {
                completedAt: "desc"
              },
              take: 1,
              include: {
                workout: true,
                exercises: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return assignments.map((assignment) => this.toCoachUserRecord(assignment));
  }

  async assignWorkout(
    coach: CurrentUser,
    userId: string,
    payload: AssignWorkoutRequest
  ): Promise<void> {
    await this.assertCoachOwnsUser(coach.id, userId);

    const workout = await this.prisma.workout.findFirst({
      where: {
        id: payload.workoutId,
        status: "published"
      }
    });

    if (!workout) {
      throw createApiException(HttpStatus.NOT_FOUND, "WORKOUT_NOT_FOUND", "Workout not found.");
    }

    await this.prisma.workoutAssignment.upsert({
      where: {
        workoutId_userId: {
          workoutId: workout.id,
          userId
        }
      },
      update: {
        coachId: coach.id,
        note: payload.note?.trim() || null
      },
      create: {
        workoutId: workout.id,
        userId,
        coachId: coach.id,
        note: payload.note?.trim() || null
      }
    });
  }

  async getCoachUserHistory(coach: CurrentUser, userId: string): Promise<CoachUserHistory> {
    await this.assertCoachOwnsUser(coach.id, userId);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        coachAssignment: {
          include: {
            coach: true
          }
        },
        workoutAssignments: {
          where: {
            coachId: coach.id
          },
          include: {
            workout: true,
            coach: true
          }
        },
        coachNotes: {
          where: {
            coachId: coach.id
          }
        },
        workoutSessions: {
          orderBy: {
            startedAt: "desc"
          },
          include: {
            workout: true,
            exercises: true
          }
        }
      }
    });

    if (!user) {
      throw createApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found.");
    }

    return this.toCoachUserHistory(user);
  }

  async saveCoachNote(
    coach: CurrentUser,
    userId: string,
    payload: SaveCoachNoteRequest
  ): Promise<CoachUserHistory> {
    await this.assertCoachOwnsUser(coach.id, userId);

    await this.prisma.coachNote.upsert({
      where: {
        userId_coachId: {
          userId,
          coachId: coach.id
        }
      },
      update: {
        note: payload.note.trim()
      },
      create: {
        userId,
        coachId: coach.id,
        note: payload.note.trim()
      }
    });

    return this.getCoachUserHistory(coach, userId);
  }

  private async assertCoachOwnsUser(coachId: string, userId: string) {
    const assignment = await this.prisma.userCoachAssignment.findFirst({
      where: {
        coachId,
        userId
      },
      select: {
        id: true
      }
    });

    if (!assignment) {
      throw createApiException(
        HttpStatus.FORBIDDEN,
        "COACH_USER_ACCESS_DENIED",
        "You do not have access to this user."
      );
    }
  }

  private toUserDirectoryRecord(user: DirectoryUserRecord): UserDirectoryRecord {
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      status: user.status,
      requestedRole: user.requestedRole,
      coachId: user.coachAssignment?.coachId ?? null,
      coachDisplayName: user.coachAssignment?.coach.displayName ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString()
    };
  }

  private toCoachUserRecord(assignment: CoachAssignmentListRecord): CoachUserRecord {
    const latestCompletedSession = assignment.user.workoutSessions[0] ?? null;
    const latestCoachNote = assignment.user.coachNotes[0] ?? null;

    return {
      id: assignment.user.id,
      email: assignment.user.email,
      displayName: assignment.user.displayName,
      coachAssignmentId: assignment.id,
      assignedAt: assignment.createdAt.toISOString(),
      assignedWorkouts: assignment.user.workoutAssignments.map((workoutAssignment) =>
        this.toWorkoutAssignmentRecord(workoutAssignment)
      ),
      latestCoachNote: latestCoachNote ? this.toCoachNoteRecord(latestCoachNote) : null,
      lastCompletedSessionAt: latestCompletedSession?.completedAt?.toISOString() ?? null
    };
  }

  private toCoachUserHistory(user: CoachHistoryUserRecord): CoachUserHistory {
    return {
      user: this.toUserDirectoryRecord(user),
      assignments: user.workoutAssignments.map((assignment) => this.toWorkoutAssignmentRecord(assignment)),
      note: user.coachNotes[0] ? this.toCoachNoteRecord(user.coachNotes[0]) : null,
      sessions: user.workoutSessions.map((session) => this.toWorkoutSessionSummary(session))
    };
  }

  private toWorkoutAssignmentRecord(
    assignment: CoachAssignmentListRecord["user"]["workoutAssignments"][number]
  ): WorkoutAssignmentRecord {
    return {
      id: assignment.id,
      workoutId: assignment.workoutId,
      workoutTitle: assignment.workout.title,
      userId: assignment.userId,
      coachId: assignment.coachId,
      coachDisplayName: assignment.coach.displayName,
      note: assignment.note,
      assignedAt: assignment.assignedAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString()
    };
  }

  private toCoachNoteRecord(
    note: CoachAssignmentListRecord["user"]["coachNotes"][number]
  ): CoachNoteRecord {
    return {
      id: note.id,
      userId: note.userId,
      coachId: note.coachId,
      note: note.note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString()
    };
  }

  private toWorkoutSessionSummary(
    session: CoachHistoryUserRecord["workoutSessions"][number]
  ): WorkoutSessionSummary {
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
