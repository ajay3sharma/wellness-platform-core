import { IsString, MinLength } from "class-validator";

export class SaveCoachNoteDto {
  @IsString()
  @MinLength(2)
  note!: string;
}
