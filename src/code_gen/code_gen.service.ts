import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MataDataDto } from './dto/metadata.dto';
import {
    toPascalCase,
    toCamelCase,
    getTsType,
    getOrmComplement,
    getValidatorDecorator,
    addEntityProperty,
    addDtoProperty,
} from './utils/type-mapping.util';
import * as fs from 'fs/promises';
import * as path from 'path';
import { generaService } from './utils/genera-service';
import { generaController } from './utils/genera-controller';

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
            c.numeric_scale             AS "numericScale",            
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
        let entityBody: string = '';
        let dtoBody: string = '';

        // const outputDir = path.join(__dirname, '..', 'generated-entities');
        const outputDir = '/opt/sgm/tmp/gen_code/micro';
        for (const tableName in groupedMetadata) {

            const outputDirEntities = path.join(outputDir, tableName, 'entities');
            await fs.mkdir(outputDirEntities, { recursive: true });

            const outputDirDto = path.join(outputDir, tableName, 'dto');
            await fs.mkdir(outputDirDto, { recursive: true });

            const outputDirSrv = path.join(outputDir, tableName, 'services');
            await fs.mkdir(outputDirSrv, { recursive: true });

            const outputDirCtrl = path.join(outputDir, tableName, 'controllers');
            await fs.mkdir(outputDirCtrl, { recursive: true });

            const entityName = toPascalCase(tableName);
            entityBody = ''
            entityBody += `import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';\n`;
            entityBody += `@Entity({ name: '${tableName}' , schema: '${this.schemaName}'})\n`;
            entityBody += `export class ${entityName}Entity extends BaseEntity {\n`;

            dtoBody = ''
            dtoBody += `import { ApiProperty } from "@nestjs/swagger";\n\n`;
            dtoBody += `export class ${entityName}Dto {\n`;

            const columns = groupedMetadata[tableName];
            let primero = true;
            columns.forEach(col => {
                const propName = toCamelCase(col.columnName);
                const propType = getTsType(col.dataType);
                const ormComplement = getOrmComplement(col);
                if (primero) {
                    entityBody += `@PrimaryGeneratedColumn({ name: '${col.columnName}' })\n`;
                    primero = false
                } else {
                    entityBody += `@Column({ name: '${col.columnName}' ${ormComplement} })\n`;
                }
                entityBody += `${propName}: ${propType};\n\n`;

                dtoBody += `@ApiProperty({\n`;
                dtoBody += `title: '${col.columnName}', description: ''\n`;
                dtoBody += `})\n`;
                dtoBody += `${propName}: ${propType};\n\n`;

            });

            const campoRegUsu = {
                tableName: tableName,
                columnName: `${tableName.substring(0, 3)}_reg_usu`,
                dataType: 'integer',
                isNullable: 'NO',
                comment: 'Usuario de registro',
                maximumLength: null,
                numericPrecision: null,
                numericScale: null
            }
            entityBody += addEntityProperty(columns, campoRegUsu);
            dtoBody += addDtoProperty(columns, campoRegUsu);

            const campoRegFecha = {
                ...campoRegUsu,
                columnName: `${tableName.substring(0, 3)}_reg_fecha`,
                dataType: 'date',
                isNullable: 'NO',
                comment: 'Fecha en la que se registro',
            }
            entityBody += addEntityProperty(columns, campoRegFecha);
            dtoBody += addDtoProperty(columns, campoRegFecha);

            const campoActUsu = {
                ...campoRegUsu,
                columnName: `${tableName.substring(0, 3)}_act_usu`,
                dataType: 'integer',
                isNullable: 'YES',
                comment: 'Usuario que actualiza',
            }
            entityBody += addEntityProperty(columns, campoActUsu);
            dtoBody += addDtoProperty(columns, campoActUsu);

            const campoActFecha = {
                ...campoRegUsu,
                columnName: `${tableName.substring(0, 3)}_act_fecha`,
                dataType: 'date',
                isNullable: 'YES',
                comment: 'Fecha en la que se actualizo',
            }
            entityBody += addEntityProperty(columns, campoActFecha);
            dtoBody += addDtoProperty(columns, campoActFecha);

            const campoEstado = {
                ...campoRegUsu,
                columnName: `${tableName.substring(0, 3)}_estado`,
                dataType: 'integer',
                isNullable: 'NO',
                comment: 'estado del registro',
            }
            entityBody += addEntityProperty(columns, campoEstado);
            dtoBody += addDtoProperty(columns, campoEstado);

            const campoEliminado = {
                ...campoRegUsu,
                columnName: `${tableName.substring(0, 3)}_eliminado`,
                dataType: 'boolean',
                isNullable: 'NO',
                comment: 'eliminado',
            }
            entityBody += addEntityProperty(columns, campoEliminado);
            dtoBody += addDtoProperty(columns, campoEliminado);

            entityBody += `}\n`;
            const fileName = `${tableName}.entity.ts`;
            const filePath = path.join(outputDirEntities, fileName);
            await fs.writeFile(filePath, entityBody);
            console.log(`Entidad generada: ${filePath}`);

            dtoBody += `}\n`;
            const dtoFileName = `${tableName}.dto.ts`;
            const dtoFilePath = path.join(outputDirDto, dtoFileName);
            await fs.writeFile(dtoFilePath, dtoBody);
            console.log(`DTO generada: ${dtoFilePath}`);

            const srvFileName = `${tableName}.service.ts`;
            const srvFilePath = path.join(outputDirSrv, srvFileName);
            await fs.writeFile(srvFilePath, generaService(columns));
            console.log(`srv generada: ${srvFilePath}`);

            const ctrlFileName = `${tableName}.controller.ts`;
            const ctrlFilePath = path.join(outputDirCtrl, ctrlFileName);
            await fs.writeFile(ctrlFilePath, generaController(columns));
            console.log(`Ctrl generada: ${ctrlFilePath}`);
        }
    }
}