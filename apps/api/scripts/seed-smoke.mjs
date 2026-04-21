import { PrismaClient } from "@prisma/client";
import { randomBytes, scrypt } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { loadWorkspaceEnv } from "../../../scripts/load-workspace-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../../..");
loadWorkspaceEnv(repoRoot);

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

const ACTIVE_BRAND = (process.env.PLATFORM_BRAND || "moveyou").trim();
const DEFAULT_PASSWORD = "dev-password";
const FIXTURE_TODAY = new Date();

const adminFixture = {
  email: (process.env.API_BOOTSTRAP_ADMIN_EMAIL || "support@moveyou.app").trim().toLowerCase(),
  password: process.env.API_BOOTSTRAP_ADMIN_PASSWORD || DEFAULT_PASSWORD,
  displayName: process.env.API_BOOTSTRAP_ADMIN_NAME || "MoveYOU Admin",
  role: "admin",
  status: "active",
  requestedRole: null
};

const coachFixture = {
  email: "coach.smoke@moveyou.app",
  password: DEFAULT_PASSWORD,
  displayName: "Coach Smoke",
  role: "coach",
  status: "active",
  requestedRole: null
};

const userFixture = {
  email: "user.smoke@moveyou.app",
  password: DEFAULT_PASSWORD,
  displayName: "User Smoke",
  role: "user",
  status: "active",
  requestedRole: null
};

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

async function upsertUser(fixture) {
  const passwordHash = await hashPassword(fixture.password);

  return prisma.user.upsert({
    where: {
      email: normalizeEmail(fixture.email)
    },
    update: {
      displayName: fixture.displayName,
      role: fixture.role,
      status: fixture.status,
      requestedRole: fixture.requestedRole,
      activeBrand: ACTIVE_BRAND,
      passwordHash
    },
    create: {
      email: normalizeEmail(fixture.email),
      displayName: fixture.displayName,
      role: fixture.role,
      status: fixture.status,
      requestedRole: fixture.requestedRole,
      activeBrand: ACTIVE_BRAND,
      passwordHash
    }
  });
}

async function upsertWorkout() {
  const existing = await prisma.workout.findFirst({
    where: {
      title: "Phase 5 Smoke Flow Workout"
    }
  });
  const exerciseFixtures = [
    {
      name: "Breath-led warm up",
      instruction: "Take steady breaths and loosen the shoulders.",
      timeTargetSeconds: 60,
      sequence: 1
    },
    {
      name: "Standing reach",
      instruction: "Alternate overhead reaches with slow control.",
      repTarget: "8 per side",
      restSeconds: 20,
      sequence: 2
    },
    {
      name: "Hip opener hold",
      instruction: "Sink gently and hold the stretch without bouncing.",
      timeTargetSeconds: 45,
      restSeconds: 20,
      sequence: 3
    }
  ];
  const data = {
    title: "Phase 5 Smoke Flow Workout",
    description: "A deterministic workout fixture used for local and CI smoke validation.",
    difficulty: "beginner",
    durationMinutes: 18,
    category: "Mobility",
    tags: ["smoke", "mobility", "phase-5"],
    status: "published",
    publishedAt: FIXTURE_TODAY
  };

  if (existing) {
    return prisma.workout.update({
      where: {
        id: existing.id
      },
      data: {
        ...data,
        exercises: {
          deleteMany: {},
          create: exerciseFixtures
        }
      },
      include: {
        exercises: true
      }
    });
  }

  return prisma.workout.create({
    data: {
      ...data,
      exercises: {
        create: exerciseFixtures
      }
    },
    include: {
      exercises: true
    }
  });
}

async function upsertRelaxation() {
  const existing = await prisma.relaxationTechnique.findFirst({
    where: {
      title: "Phase 5 Smoke Reset"
    }
  });
  const stepFixtures = [
    {
      title: "Arrive",
      instruction: "Sit comfortably and settle your breathing.",
      durationSeconds: 60,
      sequence: 1
    },
    {
      title: "Lengthen exhale",
      instruction: "Exhale slightly longer than you inhale.",
      durationSeconds: 120,
      sequence: 2
    },
    {
      title: "Quiet finish",
      instruction: "Rest and notice any change in body tension.",
      durationSeconds: 90,
      sequence: 3
    }
  ];
  const data = {
    title: "Phase 5 Smoke Reset",
    description: "A short guided reset fixture for deterministic smoke validation.",
    category: "Breathwork",
    tags: ["smoke", "reset"],
    estimatedDurationMinutes: 6,
    coverImageUrl: null,
    status: "published",
    publishedAt: FIXTURE_TODAY
  };

  if (existing) {
    return prisma.relaxationTechnique.update({
      where: {
        id: existing.id
      },
      data: {
        ...data,
        steps: {
          deleteMany: {},
          create: stepFixtures
        }
      },
      include: {
        steps: true
      }
    });
  }

  return prisma.relaxationTechnique.create({
    data: {
      ...data,
      steps: {
        create: stepFixtures
      }
    },
    include: {
      steps: true
    }
  });
}

async function upsertMusicTrack() {
  const existing = await prisma.musicTrack.findFirst({
    where: {
      title: "Phase 5 Smoke Soundscape"
    }
  });
  const data = {
    title: "Phase 5 Smoke Soundscape",
    description: "A lightweight hosted audio fixture for reset and player smoke checks.",
    category: "Ambient",
    tags: ["smoke", "focus"],
    artistName: "MoveYOU Fixtures",
    durationSeconds: 30,
    audioUrl: "https://samplelib.com/lib/preview/mp3/sample-3s.mp3",
    artworkUrl: null,
    status: "published",
    publishedAt: FIXTURE_TODAY
  };

  if (existing) {
    return prisma.musicTrack.update({
      where: {
        id: existing.id
      },
      data
    });
  }

  return prisma.musicTrack.create({
    data
  });
}

async function upsertProduct() {
  const existing = await prisma.catalogProduct.findFirst({
    where: {
      title: "Phase 5 Smoke Mobility Guide"
    },
    include: {
      prices: true
    }
  });

  const product = existing
    ? await prisma.catalogProduct.update({
        where: {
          id: existing.id
        },
        data: {
          title: "Phase 5 Smoke Mobility Guide",
          description: "A deterministic digital product fixture used by the store smoke tests.",
          category: "Guide",
          tags: ["smoke", "digital"],
          purchaseLabel: "Unlock guide",
          coverImageUrl: null,
          status: "published",
          publishedAt: FIXTURE_TODAY
        },
        include: {
          prices: true
        }
      })
    : await prisma.catalogProduct.create({
        data: {
          title: "Phase 5 Smoke Mobility Guide",
          description: "A deterministic digital product fixture used by the store smoke tests.",
          category: "Guide",
          tags: ["smoke", "digital"],
          purchaseLabel: "Unlock guide",
          coverImageUrl: null,
          status: "published",
          publishedAt: FIXTURE_TODAY
        },
        include: {
          prices: true
        }
      });

  await ensureCurrentPrice({
    table: "catalogProductPrice",
    foreignKey: "productId",
    foreignValue: product.id,
    market: "india",
    currency: "INR",
    amountMinor: 4900
  });
  await ensureCurrentPrice({
    table: "catalogProductPrice",
    foreignKey: "productId",
    foreignValue: product.id,
    market: "global",
    currency: "USD",
    amountMinor: 900
  });

  return product;
}

async function upsertPlan() {
  const existing = await prisma.subscriptionPlan.findFirst({
    where: {
      name: "Phase 5 Smoke Plus"
    },
    include: {
      prices: true
    }
  });

  const plan = existing
    ? await prisma.subscriptionPlan.update({
        where: {
          id: existing.id
        },
        data: {
          name: "Phase 5 Smoke Plus",
          description: "A deterministic subscription fixture used by store smoke checks.",
          userPlan: "plus",
          billingInterval: "month",
          features: ["Smoke access", "Published fixture plan"],
          status: "published",
          publishedAt: FIXTURE_TODAY
        },
        include: {
          prices: true
        }
      })
    : await prisma.subscriptionPlan.create({
        data: {
          name: "Phase 5 Smoke Plus",
          description: "A deterministic subscription fixture used by store smoke checks.",
          userPlan: "plus",
          billingInterval: "month",
          features: ["Smoke access", "Published fixture plan"],
          status: "published",
          publishedAt: FIXTURE_TODAY
        },
        include: {
          prices: true
        }
      });

  await ensureCurrentPrice({
    table: "subscriptionPlanPrice",
    foreignKey: "subscriptionPlanId",
    foreignValue: plan.id,
    market: "india",
    currency: "INR",
    amountMinor: 14900
  });
  await ensureCurrentPrice({
    table: "subscriptionPlanPrice",
    foreignKey: "subscriptionPlanId",
    foreignValue: plan.id,
    market: "global",
    currency: "USD",
    amountMinor: 2900
  });

  return plan;
}

async function ensureCurrentPrice({
  table,
  foreignKey,
  foreignValue,
  market,
  currency,
  amountMinor
}) {
  const priceModel = prisma[table];
  const existingCurrent = await priceModel.findFirst({
    where: {
      [foreignKey]: foreignValue,
      market,
      isCurrent: true
    }
  });

  if (
    existingCurrent &&
    existingCurrent.currency === currency &&
    existingCurrent.amountMinor === amountMinor
  ) {
    return existingCurrent;
  }

  await priceModel.updateMany({
    where: {
      [foreignKey]: foreignValue,
      market,
      isCurrent: true
    },
    data: {
      isCurrent: false
    }
  });

  return priceModel.create({
    data: {
      [foreignKey]: foreignValue,
      market,
      currency,
      amountMinor,
      isCurrent: true
    }
  });
}

async function ensureCoachWorkspace({ admin, coach, user, workout }) {
  await prisma.userCoachAssignment.upsert({
    where: {
      userId: user.id
    },
    update: {
      coachId: coach.id,
      assignedById: admin.id
    },
    create: {
      userId: user.id,
      coachId: coach.id,
      assignedById: admin.id
    }
  });

  await prisma.workoutAssignment.upsert({
    where: {
      workoutId_userId: {
        workoutId: workout.id,
        userId: user.id
      }
    },
    update: {
      coachId: coach.id,
      note: "Seeded assignment for smoke validation."
    },
    create: {
      workoutId: workout.id,
      userId: user.id,
      coachId: coach.id,
      note: "Seeded assignment for smoke validation."
    }
  });

  await prisma.coachNote.upsert({
    where: {
      userId_coachId: {
        userId: user.id,
        coachId: coach.id
      }
    },
    update: {
      note: "Seeded coach note for smoke validation."
    },
    create: {
      userId: user.id,
      coachId: coach.id,
      note: "Seeded coach note for smoke validation."
    }
  });

  const existingSession = await prisma.workoutSession.findFirst({
    where: {
      userId: user.id,
      workoutId: workout.id,
      notes: "Seeded smoke completion entry."
    },
    include: {
      exercises: true
    }
  });

  if (existingSession) {
    return existingSession;
  }

  return prisma.workoutSession.create({
    data: {
      workoutId: workout.id,
      userId: user.id,
      status: "completed",
      notes: "Seeded smoke completion entry.",
      startedAt: new Date(Date.now() - 20 * 60 * 1000),
      completedAt: new Date(Date.now() - 10 * 60 * 1000),
      exercises: {
        create: workout.exercises.map((exercise) => ({
          workoutExerciseId: exercise.id,
          name: exercise.name,
          instruction: exercise.instruction,
          repTarget: exercise.repTarget,
          timeTargetSeconds: exercise.timeTargetSeconds,
          distanceTargetMeters: exercise.distanceTargetMeters,
          restSeconds: exercise.restSeconds,
          sequence: exercise.sequence,
          completed: true,
          notes: "Seeded complete"
        }))
      }
    }
  });
}

async function main() {
  const admin = await upsertUser(adminFixture);
  const coach = await upsertUser(coachFixture);
  const user = await upsertUser(userFixture);
  const workout = await upsertWorkout();
  const relaxation = await upsertRelaxation();
  const music = await upsertMusicTrack();
  const product = await upsertProduct();
  const plan = await upsertPlan();

  await ensureCoachWorkspace({ admin, coach, user, workout });

  console.log(
    JSON.stringify(
      {
        seeded: {
          admin: admin.email,
          coach: coach.email,
          user: user.email,
          workoutId: workout.id,
          relaxationId: relaxation.id,
          musicTrackId: music.id,
          productId: product.id,
          planId: plan.id
        }
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect().catch(() => undefined);
  });
