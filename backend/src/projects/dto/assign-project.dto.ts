import { IsNotEmpty, IsString } from 'class-validator';

export class AssignProjectDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
