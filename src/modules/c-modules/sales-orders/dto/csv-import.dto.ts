import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CsvImportDto {
  @ApiProperty({
    description: 'Raw CSV string with header row: soCode,customer,orderDate,itemCode,sku,firmwareVersion,quantity,notes',
    example: 'soCode,customer,orderDate,itemCode,sku,firmwareVersion,quantity,notes\nSO-2026-001,Daviteq IoT,2026-09-20,ITEM-001,WSLRW-ATH,1.4,50,Lot 1\nSO-2026-001,Daviteq IoT,2026-09-20,ITEM-002,WSLRW-CLW,1.0,20,Lot 2',
  })
  @IsNotEmpty()
  @IsString()
  csvContent: string;

  @ApiPropertyOptional({ description: 'Whether to overwrite existing SO if soCode matches', default: false })
  @IsOptional()
  @IsBoolean()
  overwriteExisting?: boolean = false;
}
