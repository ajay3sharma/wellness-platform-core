import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import type {
  MusicTrackDetail,
  MusicTrackListItem,
  RelaxationTechniqueDetail,
  RelaxationTechniqueListItem,
  TodayWellnessSnapshot
} from "@platform/types";
import { AccessTokenGuard } from "../auth/auth.guard";
import { WellnessDailyQueryDto } from "./dto/wellness-daily-query.dto";
import { WellnessService } from "./wellness.service";

@Controller("wellness")
@UseGuards(AccessTokenGuard)
export class WellnessController {
  constructor(private readonly wellnessService: WellnessService) {}

  @Get("relaxation")
  listRelaxation(): Promise<RelaxationTechniqueListItem[]> {
    return this.wellnessService.listVisibleRelaxation();
  }

  @Get("relaxation/:techniqueId")
  detailRelaxation(@Param("techniqueId") techniqueId: string): Promise<RelaxationTechniqueDetail> {
    return this.wellnessService.getVisibleRelaxation(techniqueId);
  }

  @Get("music")
  listMusic(): Promise<MusicTrackListItem[]> {
    return this.wellnessService.listVisibleMusic();
  }

  @Get("music/:trackId")
  detailMusic(@Param("trackId") trackId: string): Promise<MusicTrackDetail> {
    return this.wellnessService.getVisibleMusic(trackId);
  }

  @Get("daily")
  daily(@Query() query: WellnessDailyQueryDto): Promise<TodayWellnessSnapshot> {
    return this.wellnessService.getDailySnapshot(query.timeZone);
  }
}
