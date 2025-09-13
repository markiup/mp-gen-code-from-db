import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MataDataDto } from './dto/metadata.dto';

@Injectable()
export class CodeGenService {
    constructor(
        private readonly dataSource: DataSource,
    ) { }

    async obtenerDatosConsultaNativo(): Promise<MataDataDto[]> {
        const sqlQuery = `
        SELECT
            c.table_name                AS "tableName",
            c.column_name               AS "columnName",
            c.data_type                 AS "dataType",
            c.character_maximum_length  AS "maximumLength",
            c.numeric_precision         AS "numericPrecision",
            c.is_nullable               AS "isNullable",
            pgd.description             AS "comment"
        FROM information_schema.columns c
        LEFT JOIN pg_catalog.pg_statio_all_tables st
            ON st.relname = c.table_name
            AND st.schemaname = c.table_schema
        LEFT JOIN pg_catalog.pg_description pgd
            ON pgd.objoid = st.relid
            AND pgd.objsubid = c.ordinal_position
        WHERE c.table_schema = 'sc_renagro_z1'
        ORDER BY c.table_name, c.ordinal_position; 
   `;
        const resultados = await this.dataSource.query(sqlQuery);
        return resultados;
    }

    async metadataAgrupadoPorTabla(): Promise<Record<string, MataDataDto[]>> {
        const metadata = await this.obtenerDatosConsultaNativo();
        const groupedData: Record<string, MataDataDto[]> = {};

        metadata.forEach(item => {
            const { tableName } = item;
            if (!groupedData[tableName]) {
                groupedData[tableName] = [];
            }
            groupedData[tableName].push(item);
        });

        return groupedData;
    }
}