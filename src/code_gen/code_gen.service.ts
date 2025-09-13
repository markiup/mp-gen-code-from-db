import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MataDataDto } from './dto/metadata.dto';
import {
    toPascalCase,
    toCamelCase,
    getTsType,
    getTypeOrmType,
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
        const outputDir = path.join(__dirname, '..', 'generated-entities');

        // Asegurarse de que el directorio de salida existe
        await fs.mkdir(outputDir, { recursive: true });

        for (const tableName in groupedMetadata) {
            if (Object.prototype.hasOwnProperty.call(groupedMetadata, tableName)) {
                const columns = groupedMetadata[tableName];

                const entityName = toPascalCase(tableName);
                const imports = new Set(['Entity', 'Column']);
                const validatorImports = new Set();
                let entityBody = '';

                columns.forEach(col => {
                    const propName = toCamelCase(col.columnName);

                    const propType = getTsType(col.dataType);
                    const typeOrmType = getTypeOrmType(col.dataType, col.maximumLength, col.numericPrecision);
                    const isNullable = col.isNullable === 'YES' ? 'true' : 'false';

                    const validatorDecorator = getValidatorDecorator(col.dataType);
                    if (validatorDecorator) {
                        validatorImports.add(validatorDecorator.slice(1));
                    }
                    if (col.isNullable === 'YES') {
                        validatorImports.add('IsOptional');
                    }

                    entityBody += `\n  // ${col.comment || 'Sin comentario'}\n`;
                    if (col.isNullable === 'YES') {
                        entityBody += `  @IsOptional()\n`;
                    }
                    if (validatorDecorator) {
                        entityBody += `  ${validatorDecorator}()\n`;
                    }
                    entityBody += `  @Column({ type: '${typeOrmType}', nullable: ${isNullable} })\n`;
                    entityBody += `  ${propName}: ${propType}${col.isNullable === 'YES' ? ' | null' : ''};\n`;
                });

                const importStatements = `import { ${Array.from(imports).join(', ')} } from 'typeorm';\n`;
                const validatorStatements = validatorImports.size > 0
                    ? `import { ${Array.from(validatorImports).join(', ')} } from 'class-validator';\n`
                    : '';

                const fileContent = `
${importStatements}${validatorStatements}
@Entity({ schema: '${this.schemaName}', name: '${tableName}' })
export class ${entityName} {
  // Nota: Deberás identificar y reemplazar el decorador @Column() con @PrimaryColumn() para la llave primaria.
${entityBody}
}
`;
                const fileName = `${entityName}.entity.ts`;
                const filePath = path.join(outputDir, fileName);

                await fs.writeFile(filePath, fileContent);
                console.log(`Entidad generada y guardada en: ${filePath}`);
            }
        }
    }
}