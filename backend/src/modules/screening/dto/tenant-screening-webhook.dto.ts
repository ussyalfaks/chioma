import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';
import {
  UserScreeningRiskLevel,
  UserScreeningStatus,
} from '../screening.enums';

export class TenantScreeningWebhookDto {
  @ApiProperty()
  @IsString()
  providerReference: string;

  @ApiProperty({ enum: UserScreeningStatus })
  @IsEnum(UserScreeningStatus)
  status: UserScreeningStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  providerReportId?: string;

  @ApiPropertyOptional({ enum: UserScreeningRiskLevel })
  @IsOptional()
  @IsEnum(UserScreeningRiskLevel)
  riskLevel?: UserScreeningRiskLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  failureReason?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  report?: Record<string, unknown>;
}
