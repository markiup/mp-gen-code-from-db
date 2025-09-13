import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MataDataDto } from './dto/metadata.dto';
import {
    toPascalCase,
    toCamelCase,
    getTsType,
    getOrmComplement,
    getValidatorDecorator,
} from './utils/type-mapping.util';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CodeGenService {
    private readonly schemaName = 'sc_renagro_z1';

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
        WHERE c.table_schema = '${this.schemaName}'
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

    async generarArchivosEntidad(): Promise<void> {
        const groupedMetadata = await this.metadataAgrupadoPorTabla();
        let contents: string[] = [];

        //const outputDir = path.join(__dirname, '..', 'generated-entities');
        const outputDir = '/opt/sgm/git/ati/glagro/mp-gen-code-from-db/src/code_gen/entities';

        await fs.mkdir(outputDir, { recursive: true });

        for (const tableName in groupedMetadata) {
            const entityName = toPascalCase(tableName);
            contents = []
            contents.push(`import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';\n`);
            contents.push(`@Entity({ name: '${tableName}' , schema: '${this.schemaName}'})\n`);
            contents.push(`export class ${entityName} {\n`);

            const columns = groupedMetadata[tableName];
            let primero = true;
            columns.forEach(col => {
                const propName = toCamelCase(col.columnName);
                const propType = getTsType(col.dataType);
                const ormComplement = getOrmComplement(col);
                if (primero) {
                    contents.push(`@PrimaryGeneratedColumn({ name: '${col.columnName}' })\n`);
                    primero = false
                } else {
                    contents.push(`@Column({ name: '${col.columnName}' ${ormComplement} })\n`);
                }
                contents.push(`${propName}: ${propType};\n`);
            });
            contents.push(`}\n`);

            const fileName = `${tableName}.entity.ts`;
            const filePath = path.join(outputDir, fileName);
            await fs.writeFile(filePath, contents);
            console.log(`Entidad generada y guardada en: ${filePath}`);
        }
    }
}