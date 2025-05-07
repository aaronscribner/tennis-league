import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, MinLength } from 'class-validator';

export class UpdateEventSeriesDto {
  @ApiProperty({ 
    description: 'Title of the event',
    example: 'Sunday Tennis Match'
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  title?: string;
  
  @ApiProperty({ 
    description: 'Maximum number of singles players allowed',
    example: 8
  })
  @IsOptional()
  @IsNumber()
  @Min(2)
  maxSinglesPlayers?: number;
  
  @ApiProperty({ 
    description: 'Maximum number of doubles players allowed',
    example: 16
  })
  @IsOptional()
  @IsNumber()
  @Min(4)
  maxDoublesPlayers?: number;
  
  @ApiProperty({ 
    description: 'Start time in 24-hour format (HH:MM)',
    example: '14:00'
  })
  @IsOptional()
  @IsString()
  startTime?: string;
  
  @ApiProperty({ 
    description: 'End time in 24-hour format (HH:MM)',
    example: '16:00'
  })
  @IsOptional()
  @IsString()
  endTime?: string;
}