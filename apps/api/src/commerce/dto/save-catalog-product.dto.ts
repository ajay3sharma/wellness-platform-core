import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested
} from "class-validator";
import { PriceInputDto } from "./price-input.dto";

export class SaveCatalogProductDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsOptional()
  @IsString()
  category?: string | null;

  @IsArray()
  @IsString({ each: true })
  tags!: string[];

  @IsOptional()
  @IsUrl({
    require_protocol: true
  })
  coverImageUrl?: string | null;

  @IsOptional()
  @IsString()
  purchaseLabel?: string | null;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PriceInputDto)
  prices!: PriceInputDto[];
}
