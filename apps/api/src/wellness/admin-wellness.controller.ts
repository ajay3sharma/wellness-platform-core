import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import type {
  DailyPanchangRecord,
  DailyQuoteRecord,
  MusicTrackDetail,
  MusicTrackListItem,
  RelaxationTechniqueDetail,
  RelaxationTechniqueListItem,
  SaveDailyPanchangRequest,
  SaveDailyQuoteRequest,
  SaveMusicTrackRequest,
  SaveRelaxationTechniqueRequest
} from "@platform/types";
import { AccessTokenGuard } from "../auth/auth.guard";
import { Roles } from "../common/roles.decorator";
import { RolesGuard } from "../common/roles.guard";
import { SaveDailyPanchangDto } from "./dto/save-daily-panchang.dto";
import { SaveDailyQuoteDto } from "./dto/save-daily-quote.dto";
import { SaveMusicTrackDto } from "./dto/save-music-track.dto";
import { SaveRelaxationTechniqueDto } from "./dto/save-relaxation-technique.dto";
import { WellnessService } from "./wellness.service";

@Controller("admin/wellness")
@UseGuards(AccessTokenGuard, RolesGuard)
@Roles("admin")
export class AdminWellnessController {
  constructor(private readonly wellnessService: WellnessService) {}

  @Get("relaxation")
  listRelaxation(): Promise<RelaxationTechniqueListItem[]> {
    return this.wellnessService.listAdminRelaxation();
  }

  @Get("relaxation/:techniqueId")
  detailRelaxation(@Param("techniqueId") techniqueId: string): Promise<RelaxationTechniqueDetail> {
    return this.wellnessService.getAdminRelaxationDetail(techniqueId);
  }

  @Post("relaxation")
  createRelaxation(@Body() body: SaveRelaxationTechniqueDto): Promise<RelaxationTechniqueDetail> {
    return this.wellnessService.createRelaxationTechnique(body as SaveRelaxationTechniqueRequest);
  }

  @Patch("relaxation/:techniqueId")
  updateRelaxation(
    @Param("techniqueId") techniqueId: string,
    @Body() body: SaveRelaxationTechniqueDto
  ): Promise<RelaxationTechniqueDetail> {
    return this.wellnessService.updateRelaxationTechnique(
      techniqueId,
      body as SaveRelaxationTechniqueRequest
    );
  }

  @Post("relaxation/:techniqueId/publish")
  publishRelaxation(@Param("techniqueId") techniqueId: string): Promise<RelaxationTechniqueDetail> {
    return this.wellnessService.setRelaxationTechniqueStatus(techniqueId, "published");
  }

  @Post("relaxation/:techniqueId/unpublish")
  unpublishRelaxation(@Param("techniqueId") techniqueId: string): Promise<RelaxationTechniqueDetail> {
    return this.wellnessService.setRelaxationTechniqueStatus(techniqueId, "draft");
  }

  @Get("music")
  listMusic(): Promise<MusicTrackListItem[]> {
    return this.wellnessService.listAdminMusic();
  }

  @Post("music")
  createMusic(@Body() body: SaveMusicTrackDto): Promise<MusicTrackDetail> {
    return this.wellnessService.createMusicTrack(body as SaveMusicTrackRequest);
  }

  @Patch("music/:trackId")
  updateMusic(@Param("trackId") trackId: string, @Body() body: SaveMusicTrackDto): Promise<MusicTrackDetail> {
    return this.wellnessService.updateMusicTrack(trackId, body as SaveMusicTrackRequest);
  }

  @Post("music/:trackId/publish")
  publishMusic(@Param("trackId") trackId: string): Promise<MusicTrackDetail> {
    return this.wellnessService.setMusicTrackStatus(trackId, "published");
  }

  @Post("music/:trackId/unpublish")
  unpublishMusic(@Param("trackId") trackId: string): Promise<MusicTrackDetail> {
    return this.wellnessService.setMusicTrackStatus(trackId, "draft");
  }

  @Get("daily-quotes")
  listDailyQuotes(): Promise<DailyQuoteRecord[]> {
    return this.wellnessService.listAdminDailyQuotes();
  }

  @Post("daily-quotes")
  createDailyQuote(@Body() body: SaveDailyQuoteDto): Promise<DailyQuoteRecord> {
    return this.wellnessService.createDailyQuote(body as SaveDailyQuoteRequest);
  }

  @Patch("daily-quotes/:quoteId")
  updateDailyQuote(
    @Param("quoteId") quoteId: string,
    @Body() body: SaveDailyQuoteDto
  ): Promise<DailyQuoteRecord> {
    return this.wellnessService.updateDailyQuote(quoteId, body as SaveDailyQuoteRequest);
  }

  @Post("daily-quotes/:quoteId/publish")
  publishDailyQuote(@Param("quoteId") quoteId: string): Promise<DailyQuoteRecord> {
    return this.wellnessService.setDailyQuoteStatus(quoteId, "published");
  }

  @Post("daily-quotes/:quoteId/unpublish")
  unpublishDailyQuote(@Param("quoteId") quoteId: string): Promise<DailyQuoteRecord> {
    return this.wellnessService.setDailyQuoteStatus(quoteId, "draft");
  }

  @Get("panchang")
  listPanchang(): Promise<DailyPanchangRecord[]> {
    return this.wellnessService.listAdminPanchang();
  }

  @Post("panchang")
  createPanchang(@Body() body: SaveDailyPanchangDto): Promise<DailyPanchangRecord> {
    return this.wellnessService.createDailyPanchang(body as SaveDailyPanchangRequest);
  }

  @Patch("panchang/:entryId")
  updatePanchang(
    @Param("entryId") entryId: string,
    @Body() body: SaveDailyPanchangDto
  ): Promise<DailyPanchangRecord> {
    return this.wellnessService.updateDailyPanchang(entryId, body as SaveDailyPanchangRequest);
  }

  @Post("panchang/:entryId/publish")
  publishPanchang(@Param("entryId") entryId: string): Promise<DailyPanchangRecord> {
    return this.wellnessService.setDailyPanchangStatus(entryId, "published");
  }

  @Post("panchang/:entryId/unpublish")
  unpublishPanchang(@Param("entryId") entryId: string): Promise<DailyPanchangRecord> {
    return this.wellnessService.setDailyPanchangStatus(entryId, "draft");
  }
}
