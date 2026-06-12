import { IsArray, IsBoolean, IsDateString, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class RfqLineItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @Type(() => Number)
  quantity!: number;

  @IsString()
  unit!: string;
}

class RfqDocumentDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsNumber()
  @Type(() => Number)
  size!: number;

  @IsString()
  @IsOptional()
  type?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  storageKey?: string;

  @IsString()
  @IsOptional()
  url?: string;
}

class RfqExternalInviteDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  companyName?: string;
}

export class CreateRfqDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsString()
  @IsNotEmpty()
  country!: string;

  @IsOptional()
  @IsString()
  deliveryLocation?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  estimatedBudget?: number;

  @IsDateString()
  closingDate!: string;

  @IsOptional()
  @IsString()
  buyerOrganizationId?: string;

  @IsOptional()
  @IsString()
  createdById?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RfqLineItemDto)
  lineItems!: RfqLineItemDto[];

  @IsOptional()
  @IsString()
  technicalNotes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RfqDocumentDto)
  supportingDocuments?: RfqDocumentDto[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  selectedSupplierProfileIds?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RfqExternalInviteDto)
  externalInvites?: RfqExternalInviteDto[];

  @IsOptional()
  @IsBoolean()
  autoMatch?: boolean;
}
