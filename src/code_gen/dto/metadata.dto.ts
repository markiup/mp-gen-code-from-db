import { IsString, IsNumber, IsOptional } from 'class-validator';

export class MataDataDto {
    @IsString()
    tableName: string;

    @IsString()
    columnName: string;

    @IsString()
    dataType: string;

    @IsOptional()
    @IsNumber()
    maximumLength: number | null;

    @IsOptional()
    @IsNumber()
    numericPrecision: number | null;

    @IsOptional()
    @IsNumber()
    numericScale: number | null;

    @IsString()
    isNullable: string;

    @IsOptional()
    @IsString()
    comment: string | null;
}