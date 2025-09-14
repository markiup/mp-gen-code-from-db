import { MataDataDto } from "../dto/metadata.dto";
import { toPascalCase } from "./type-mapping.util";

export function generaModule(columns: MataDataDto[]): String {
    const tableName = columns[0].tableName;
    const entityName = toPascalCase(tableName);
    let estado = '';
    let eliminado = '';
    columns.forEach(col => {
        if (col.columnName.substring(4) === 'estado') {
            estado = col.columnName;
        }
        if (col.columnName.substring(4) === 'eliminado') {
            eliminado = col.columnName;
        }
    })

    return `
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ${entityName}Controller } from "./controllers/${tableName}.controller";
import { ${entityName}Entity } from "./entities/${tableName}.entity";
import { ${entityName}Service } from "./services/${tableName}.service";

@Module({
    imports: [TypeOrmModule.forFeature([${entityName}Entity]), ConfigModule],
    providers: [${entityName}Service],
    controllers: [${entityName}Controller]
})
export class ${entityName}Module { }              
        `;
}









