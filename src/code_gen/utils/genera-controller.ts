import { MataDataDto } from "../dto/metadata.dto";
import { toPascalCase } from "./type-mapping.util";

export function generaController(columns: MataDataDto[]): String {
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
import { Body, Controller, Get, Param, Post, UseFilters, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { HttpExceptionFilter } from "src/providers/http-exception.filter";
import { ${entityName}Dto } from "../dto/${tableName}.dto";
import { ${entityName}Service } from "../services/${tableName}.service";

@ApiTags('Micro ${entityName}')
@Controller('micro-renagro/${tableName}')
@ApiSecurity('X-API-KEY', ['X-API-KEY'])
@UseFilters(new HttpExceptionFilter())

export class ${entityName}Controller {
    constructor(private service: ${entityName}Service) { }

    @ApiOperation({
        summary: 'Registra entidad ${tableName}',
        description: 'Guarda la entidad ${tableName} dentro de la base de datos'
    })
    @Post('/create')
    @UseGuards(AuthGuard('api-key'))
    async createRegisterEntity(@Body() body: ${entityName}Dto) {
        return await this.service.createRegisterEntity(body);
    }

    @ApiOperation({
        summary: 'Obtener todos los registros de la entidad',
        description: 'Recupera todos los registros de la entidad ${entityName} cuyo campo eliminado sea false',
    })
    @Get('/find')
    @UseGuards(AuthGuard('api-key'))
    async findAll() {
        return await this.service.findAll();
    }
}               
        `;
}
