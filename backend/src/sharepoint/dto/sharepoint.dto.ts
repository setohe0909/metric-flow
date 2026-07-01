import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class DiscoverSharePointResourcesQueryDto {
  @IsString()
  @IsNotEmpty()
  siteId: string;
}

export class ApproveSharePointResourceDto {
  @IsString()
  @IsNotEmpty()
  siteId: string;

  @IsString()
  @IsNotEmpty()
  siteName: string;

  @IsEnum(['list', 'documentLibrary'])
  resourceType: 'list' | 'documentLibrary';

  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @IsString()
  @IsNotEmpty()
  resourceName: string;

  @IsString()
  @IsNotEmpty()
  webUrl: string;
}
