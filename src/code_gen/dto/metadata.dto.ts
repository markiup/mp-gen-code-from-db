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
    characterMaximumLength: number | null;

    @IsOptional()
    @IsNumber()
    numericPrecision: number | null;

    @IsString()
    isNullable: string;

    @IsOptional()
    @IsString()
    comment: string | null;
}