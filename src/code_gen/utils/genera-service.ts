import { MataDataDto } from "../dto/metadata.dto";
import { toPascalCase } from "./type-mapping.util";

export function generaService(columns: MataDataDto[]): String {
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
import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Parameters } from "src/utils/parameters";
import { Repository } from "typeorm";
import { ${entityName}Dto } from "../dto/${tableName}.dto";
import { ${entityName}Entity } from "../entities/${tableName}.entity";

@Injectable()
export class ${entityName}Service {
    tableName: string;
    constructor(
        @InjectRepository(${entityName}Entity)
        private repository: Repository<${entityName}Entity>
    ) {
        this.tableName = "${tableName}"
    }

    /**
    * Registra en la tabla la entidad
    * @param data
    * @returns 
    */
    async createRegisterEntity(data: ${entityName}Dto) {
        if (!data || Object.keys(data).length === 0) {
            throw new HttpException(Parameters.OBJ_IS_NULL, HttpStatus.BAD_REQUEST);
        }
        try {
            var registro = data as ${entityName}Entity;
            if (registro.id === 0) {
                registro.id = null;
            }
            return await this.repository.save(registro);
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Recuperar todos los registros
     * @param id Identificador de la entidad
     * @returns Entity
     */
    async findAll() {
        try {
            return await this.repository.findOne({ where: { ${eliminado}: false } }) || {}
        } catch (error) {
            throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}               
        `;
}
