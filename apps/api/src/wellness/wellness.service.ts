import { HttpStatus, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import type {
  DailyPanchangRecord,
  DailyQuoteRecord,
  MusicTrackDetail,
  MusicTrackListItem,
  RelaxationStepRecord,
  RelaxationTechniqueDetail,
  RelaxationTechniqueListItem,
  SaveDailyPanchangRequest,
  SaveDailyQuoteRequest,
  SaveMusicTrackRequest,
  SaveRelaxationTechniqueRequest,
  TodayWellnessSnapshot
} from "@platform/types";
import { createApiException } from "../common/api-error.util";
import { PrismaService } from "../prisma/prisma.service";

type RelaxationRecord = Prisma.RelaxationTechniqueGetPayload<{
  include: {
    steps: true;
  };
}>;

type MusicRecord = Prisma.MusicTrackGetPayload<Record<string, never>>;
type QuoteRecord = Prisma.DailyQuoteEntryGetPayload<Record<string, never>>;
type PanchangRecord = Prisma.DailyPanchangEntryGetPayload<Record<string, never>>;

@Injectable()
export class WellnessService {
  constructor(private readonly prisma: PrismaService) {}

  async listVisibleRelaxation(): Promise<RelaxationTechniqueListItem[]> {
    const techniques = await this.prisma.relaxationTechnique.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }]
    });

    return techniques.map((technique) => this.toRelaxationListItem(technique));
  }

  async getVisibleRelaxation(techniqueId: string): Promise<RelaxationTechniqueDetail> {
    const technique = await this.prisma.relaxationTechnique.findFirst({
      where: {
        id: techniqueId,
        status: "published"
      },
      include: {
        steps: {
          orderBy: {
            sequence: "asc"
          }
        }
      }
    });

    if (!technique) {
      throw createApiException(
        HttpStatus.NOT_FOUND,
        "RELAXATION_TECHNIQUE_NOT_FOUND",
        "Relaxation technique not found."
      );
    }

    return this.toRelaxationDetail(technique);
  }

  async listAdminRelaxation(): Promise<RelaxationTechniqueListItem[]> {
    const techniques = await this.prisma.relaxationTechnique.findMany({
      orderBy: [{ updatedAt: "desc" }]
    });

    return techniques.map((technique) => this.toRelaxationListItem(technique));
  }

  async getAdminRelaxationDetail(techniqueId: string): Promise<RelaxationTechniqueDetail> {
    const technique = await this.prisma.relaxationTechnique.findUnique({
      where: { id: techniqueId },
      include: {
        steps: {
          orderBy: {
            sequence: "asc"
          }
        }
      }
    });

    if (!technique) {
      throw createApiException(
        HttpStatus.NOT_FOUND,
        "RELAXATION_TECHNIQUE_NOT_FOUND",
        "Relaxation technique not found."
      );
    }

    return this.toRelaxationDetail(technique);
  }

  async createRelaxationTechnique(
    payload: SaveRelaxationTechniqueRequest
  ): Promise<RelaxationTechniqueDetail> {
    const technique = await this.prisma.relaxationTechnique.create({
      data: {
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category?.trim() || null,
        tags: payload.tags.map((tag) => tag.trim()).filter(Boolean),
        estimatedDurationMinutes: payload.estimatedDurationMinutes,
        coverImageUrl: payload.coverImageUrl?.trim() || null,
        steps: {
          create: payload.steps
            .slice()
            .sort((left, right) => left.sequence - right.sequence)
            .map((step) => ({
              title: step.title.trim(),
              instruction: step.instruction.trim(),
              durationSeconds: step.durationSeconds,
              sequence: step.sequence
            }))
        }
      },
      include: {
        steps: {
          orderBy: {
            sequence: "asc"
          }
        }
      }
    });

    return this.toRelaxationDetail(technique);
  }

  async updateRelaxationTechnique(
    techniqueId: string,
    payload: SaveRelaxationTechniqueRequest
  ): Promise<RelaxationTechniqueDetail> {
    await this.assertRelaxationTechniqueExists(techniqueId);

    const technique = await this.prisma.$transaction(async (tx) => {
      await tx.relaxationStep.deleteMany({
        where: {
          relaxationTechniqueId: techniqueId
        }
      });

      return tx.relaxationTechnique.update({
        where: { id: techniqueId },
        data: {
          title: payload.title.trim(),
          description: payload.description.trim(),
          category: payload.category?.trim() || null,
          tags: payload.tags.map((tag) => tag.trim()).filter(Boolean),
          estimatedDurationMinutes: payload.estimatedDurationMinutes,
          coverImageUrl: payload.coverImageUrl?.trim() || null,
          steps: {
            create: payload.steps
              .slice()
              .sort((left, right) => left.sequence - right.sequence)
              .map((step) => ({
                title: step.title.trim(),
                instruction: step.instruction.trim(),
                durationSeconds: step.durationSeconds,
                sequence: step.sequence
              }))
          }
        },
        include: {
          steps: {
            orderBy: {
              sequence: "asc"
            }
          }
        }
      });
    });

    return this.toRelaxationDetail(technique);
  }

  async setRelaxationTechniqueStatus(
    techniqueId: string,
    status: "draft" | "published"
  ): Promise<RelaxationTechniqueDetail> {
    await this.assertRelaxationTechniqueExists(techniqueId);

    const technique = await this.prisma.relaxationTechnique.update({
      where: { id: techniqueId },
      data: {
        status,
        publishedAt: status === "published" ? new Date() : null
      },
      include: {
        steps: {
          orderBy: {
            sequence: "asc"
          }
        }
      }
    });

    return this.toRelaxationDetail(technique);
  }

  async listVisibleMusic(): Promise<MusicTrackListItem[]> {
    const tracks = await this.prisma.musicTrack.findMany({
      where: { status: "published" },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }]
    });

    return tracks.map((track) => this.toMusicTrack(track));
  }

  async getVisibleMusic(trackId: string): Promise<MusicTrackDetail> {
    const track = await this.prisma.musicTrack.findFirst({
      where: {
        id: trackId,
        status: "published"
      }
    });

    if (!track) {
      throw createApiException(HttpStatus.NOT_FOUND, "MUSIC_TRACK_NOT_FOUND", "Music track not found.");
    }

    return this.toMusicTrack(track);
  }

  async listAdminMusic(): Promise<MusicTrackListItem[]> {
    const tracks = await this.prisma.musicTrack.findMany({
      orderBy: [{ updatedAt: "desc" }]
    });

    return tracks.map((track) => this.toMusicTrack(track));
  }

  async createMusicTrack(payload: SaveMusicTrackRequest): Promise<MusicTrackDetail> {
    const track = await this.prisma.musicTrack.create({
      data: {
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category?.trim() || null,
        tags: payload.tags.map((tag) => tag.trim()).filter(Boolean),
        artistName: payload.artistName.trim(),
        durationSeconds: payload.durationSeconds,
        audioUrl: payload.audioUrl.trim(),
        artworkUrl: payload.artworkUrl?.trim() || null
      }
    });

    return this.toMusicTrack(track);
  }

  async updateMusicTrack(trackId: string, payload: SaveMusicTrackRequest): Promise<MusicTrackDetail> {
    await this.assertMusicTrackExists(trackId);

    const track = await this.prisma.musicTrack.update({
      where: { id: trackId },
      data: {
        title: payload.title.trim(),
        description: payload.description.trim(),
        category: payload.category?.trim() || null,
        tags: payload.tags.map((tag) => tag.trim()).filter(Boolean),
        artistName: payload.artistName.trim(),
        durationSeconds: payload.durationSeconds,
        audioUrl: payload.audioUrl.trim(),
        artworkUrl: payload.artworkUrl?.trim() || null
      }
    });

    return this.toMusicTrack(track);
  }

  async setMusicTrackStatus(trackId: string, status: "draft" | "published"): Promise<MusicTrackDetail> {
    await this.assertMusicTrackExists(trackId);

    const track = await this.prisma.musicTrack.update({
      where: { id: trackId },
      data: {
        status,
        publishedAt: status === "published" ? new Date() : null
      }
    });

    return this.toMusicTrack(track);
  }

  async listAdminDailyQuotes(): Promise<DailyQuoteRecord[]> {
    const quotes = await this.prisma.dailyQuoteEntry.findMany({
      orderBy: [{ entryDate: "desc" }]
    });

    return quotes.map((quote) => this.toDailyQuote(quote));
  }

  async createDailyQuote(payload: SaveDailyQuoteRequest): Promise<DailyQuoteRecord> {
    const entryDate = this.parseDateOnly(payload.entryDate);

    try {
      const quote = await this.prisma.dailyQuoteEntry.create({
        data: {
          entryDate,
          quoteText: payload.quoteText.trim(),
          author: payload.author?.trim() || null
        }
      });

      return this.toDailyQuote(quote);
    } catch (error) {
      this.rethrowUniqueDateConflict(
        error,
        "DAILY_QUOTE_DATE_EXISTS",
        "A daily quote already exists for this date."
      );
    }
  }

  async updateDailyQuote(quoteId: string, payload: SaveDailyQuoteRequest): Promise<DailyQuoteRecord> {
    await this.assertDailyQuoteExists(quoteId);
    const entryDate = this.parseDateOnly(payload.entryDate);

    try {
      const quote = await this.prisma.dailyQuoteEntry.update({
        where: { id: quoteId },
        data: {
          entryDate,
          quoteText: payload.quoteText.trim(),
          author: payload.author?.trim() || null
        }
      });

      return this.toDailyQuote(quote);
    } catch (error) {
      this.rethrowUniqueDateConflict(
        error,
        "DAILY_QUOTE_DATE_EXISTS",
        "A daily quote already exists for this date."
      );
    }
  }

  async setDailyQuoteStatus(quoteId: string, status: "draft" | "published"): Promise<DailyQuoteRecord> {
    await this.assertDailyQuoteExists(quoteId);

    const quote = await this.prisma.dailyQuoteEntry.update({
      where: { id: quoteId },
      data: {
        status,
        publishedAt: status === "published" ? new Date() : null
      }
    });

    return this.toDailyQuote(quote);
  }

  async listAdminPanchang(): Promise<DailyPanchangRecord[]> {
    const entries = await this.prisma.dailyPanchangEntry.findMany({
      orderBy: [{ entryDate: "desc" }]
    });

    return entries.map((entry) => this.toDailyPanchang(entry));
  }

  async createDailyPanchang(payload: SaveDailyPanchangRequest): Promise<DailyPanchangRecord> {
    const entryDate = this.parseDateOnly(payload.entryDate);

    try {
      const entry = await this.prisma.dailyPanchangEntry.create({
        data: {
          entryDate,
          headline: payload.headline.trim(),
          tithi: payload.tithi.trim(),
          nakshatra: payload.nakshatra.trim(),
          sunriseTime: payload.sunriseTime.trim(),
          sunsetTime: payload.sunsetTime.trim(),
          focusText: payload.focusText.trim(),
          notes: payload.notes?.trim() || null
        }
      });

      return this.toDailyPanchang(entry);
    } catch (error) {
      this.rethrowUniqueDateConflict(
        error,
        "PANCHANG_DATE_EXISTS",
        "A panchang entry already exists for this date."
      );
    }
  }

  async updateDailyPanchang(
    entryId: string,
    payload: SaveDailyPanchangRequest
  ): Promise<DailyPanchangRecord> {
    await this.assertDailyPanchangExists(entryId);
    const entryDate = this.parseDateOnly(payload.entryDate);

    try {
      const entry = await this.prisma.dailyPanchangEntry.update({
        where: { id: entryId },
        data: {
          entryDate,
          headline: payload.headline.trim(),
          tithi: payload.tithi.trim(),
          nakshatra: payload.nakshatra.trim(),
          sunriseTime: payload.sunriseTime.trim(),
          sunsetTime: payload.sunsetTime.trim(),
          focusText: payload.focusText.trim(),
          notes: payload.notes?.trim() || null
        }
      });

      return this.toDailyPanchang(entry);
    } catch (error) {
      this.rethrowUniqueDateConflict(
        error,
        "PANCHANG_DATE_EXISTS",
        "A panchang entry already exists for this date."
      );
    }
  }

  async setDailyPanchangStatus(
    entryId: string,
    status: "draft" | "published"
  ): Promise<DailyPanchangRecord> {
    await this.assertDailyPanchangExists(entryId);

    const entry = await this.prisma.dailyPanchangEntry.update({
      where: { id: entryId },
      data: {
        status,
        publishedAt: status === "published" ? new Date() : null
      }
    });

    return this.toDailyPanchang(entry);
  }

  async getDailySnapshot(timeZone: string): Promise<TodayWellnessSnapshot> {
    this.assertValidTimeZone(timeZone);

    const resolvedDate = this.resolveLocalDateString(timeZone);
    const entryDate = this.parseDateOnly(resolvedDate);

    const [quote, panchang] = await Promise.all([
      this.prisma.dailyQuoteEntry.findFirst({
        where: {
          entryDate,
          status: "published"
        }
      }),
      this.prisma.dailyPanchangEntry.findFirst({
        where: {
          entryDate,
          status: "published"
        }
      })
    ]);

    return {
      resolvedDate,
      timeZone,
      quote: quote ? this.toDailyQuote(quote) : null,
      panchang: panchang ? this.toDailyPanchang(panchang) : null
    };
  }

  private async assertRelaxationTechniqueExists(techniqueId: string) {
    const technique = await this.prisma.relaxationTechnique.findUnique({
      where: { id: techniqueId },
      select: { id: true }
    });

    if (!technique) {
      throw createApiException(
        HttpStatus.NOT_FOUND,
        "RELAXATION_TECHNIQUE_NOT_FOUND",
        "Relaxation technique not found."
      );
    }
  }

  private async assertMusicTrackExists(trackId: string) {
    const track = await this.prisma.musicTrack.findUnique({
      where: { id: trackId },
      select: { id: true }
    });

    if (!track) {
      throw createApiException(HttpStatus.NOT_FOUND, "MUSIC_TRACK_NOT_FOUND", "Music track not found.");
    }
  }

  private async assertDailyQuoteExists(quoteId: string) {
    const quote = await this.prisma.dailyQuoteEntry.findUnique({
      where: { id: quoteId },
      select: { id: true }
    });

    if (!quote) {
      throw createApiException(HttpStatus.NOT_FOUND, "DAILY_QUOTE_NOT_FOUND", "Daily quote not found.");
    }
  }

  private async assertDailyPanchangExists(entryId: string) {
    const entry = await this.prisma.dailyPanchangEntry.findUnique({
      where: { id: entryId },
      select: { id: true }
    });

    if (!entry) {
      throw createApiException(HttpStatus.NOT_FOUND, "DAILY_PANCHANG_NOT_FOUND", "Daily panchang not found.");
    }
  }

  private assertValidTimeZone(timeZone: string) {
    try {
      new Intl.DateTimeFormat("en-US", {
        timeZone
      }).format(new Date());
    } catch {
      throw createApiException(
        HttpStatus.BAD_REQUEST,
        "INVALID_TIMEZONE",
        "The supplied time zone is invalid."
      );
    }
  }

  private resolveLocalDateString(timeZone: string) {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = formatter.formatToParts(new Date());
    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      throw createApiException(
        HttpStatus.BAD_REQUEST,
        "INVALID_TIMEZONE",
        "The supplied time zone is invalid."
      );
    }

    return `${year}-${month}-${day}`;
  }

  private parseDateOnly(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      throw createApiException(
        HttpStatus.BAD_REQUEST,
        "INVALID_DATE",
        "Date values must use YYYY-MM-DD format."
      );
    }

    const [yearValue, monthValue, dayValue] = value.split("-").map((segment) => Number(segment));
    const date = new Date(Date.UTC(yearValue, monthValue - 1, dayValue));

    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw createApiException(HttpStatus.BAD_REQUEST, "INVALID_DATE", "The supplied date is invalid.");
    }

    return date;
  }

  private rethrowUniqueDateConflict(error: unknown, code: string, message: string): never {
    if (
      typeof error === "object" &&
      error &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      throw createApiException(HttpStatus.CONFLICT, code, message);
    }

    throw error;
  }

  private toRelaxationListItem(record: RelaxationRecord | Prisma.RelaxationTechniqueGetPayload<Record<string, never>>): RelaxationTechniqueListItem {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      tags: record.tags,
      estimatedDurationMinutes: record.estimatedDurationMinutes,
      coverImageUrl: record.coverImageUrl,
      status: record.status,
      publishedAt: record.publishedAt?.toISOString() ?? null,
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private toRelaxationDetail(record: RelaxationRecord): RelaxationTechniqueDetail {
    return {
      ...this.toRelaxationListItem(record),
      steps: record.steps
        .slice()
        .sort((left, right) => left.sequence - right.sequence)
        .map(
          (step): RelaxationStepRecord => ({
            id: step.id,
            title: step.title,
            instruction: step.instruction,
            durationSeconds: step.durationSeconds,
            sequence: step.sequence
          })
        )
    };
  }

  private toMusicTrack(record: MusicRecord): MusicTrackDetail {
    return {
      id: record.id,
      title: record.title,
      description: record.description,
      category: record.category,
      tags: record.tags,
      artistName: record.artistName,
      durationSeconds: record.durationSeconds,
      audioUrl: record.audioUrl,
      artworkUrl: record.artworkUrl,
      status: record.status,
      publishedAt: record.publishedAt?.toISOString() ?? null,
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private toDailyQuote(record: QuoteRecord): DailyQuoteRecord {
    return {
      id: record.id,
      entryDate: record.entryDate.toISOString().slice(0, 10),
      quoteText: record.quoteText,
      author: record.author,
      status: record.status,
      publishedAt: record.publishedAt?.toISOString() ?? null,
      updatedAt: record.updatedAt.toISOString()
    };
  }

  private toDailyPanchang(record: PanchangRecord): DailyPanchangRecord {
    return {
      id: record.id,
      entryDate: record.entryDate.toISOString().slice(0, 10),
      headline: record.headline,
      tithi: record.tithi,
      nakshatra: record.nakshatra,
      sunriseTime: record.sunriseTime,
      sunsetTime: record.sunsetTime,
      focusText: record.focusText,
      notes: record.notes,
      status: record.status,
      publishedAt: record.publishedAt?.toISOString() ?? null,
      updatedAt: record.updatedAt.toISOString()
    };
  }
}
