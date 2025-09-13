import { MataDataDto } from "../dto/metadata.dto";

export function toPascalCase(str: string): string {
    return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('');
}

export function toCamelCase(str: string): string {
    const parts = str.split('_');
    const first = parts[0];
    const rest = parts.slice(1).map(word => word.charAt(0).toUpperCase() + word.slice(1));
    return first + rest.join('');
}

export function getTsType(dataType: string): string {
    const typeMap: Record<string, string> = {
        // 'text': 'string',
        'character varying': 'string',
        'integer': 'number',
        'numeric': 'number',
        'date': 'Date',
        // 'timestamp with time zone': 'Date',
        'boolean': 'boolean',
    };

    const result = typeMap[dataType];
    if (!result) {
        throw new Error(`Error getTsType: '${dataType}'`);
    }
    return result;
}

export function getValidatorDecorator(dataType: string): string | null {
    const validatorMap: Record<string, string> = {
        // 'text': '@IsString',
        'character varying': '@IsString',
        'integer': '@IsInt',
        'numeric': '@IsNumber',
        'date': '@IsDateString',
        // 'timestamp with time zone': '@IsDateString',
        'boolean': '@IsBoolean',
    };
    const result = validatorMap[dataType];
    if (!result) {
        throw new Error(`Error getValidatorDecorator: '${dataType}'`);
    }
    return result;
}

export function getOrmComplement(col: MataDataDto): string {
    const isNullableFlag = col.isNullable === 'YES' ? 'true' : 'false';
    const isNullableTxt = `, nullable: ${isNullableFlag}`
    let typeTxt = ''
    let proceso: boolean = false;

    if (col.dataType === 'character varying') {
        proceso = true;
        if (col.maximumLength) {
            typeTxt = `, type: 'varchar', length: ${col.maximumLength} `
        }
    }
    if (col.dataType === 'integer') {
        proceso = true;
        typeTxt = `, type: 'int'`
    }
    if (col.dataType === 'date') {
        proceso = true;
        typeTxt = `, type: 'date'`;//, default: () => 'CURRENT_DATE' `
    }
    if (col.dataType === 'numeric') {
        proceso = true;
        typeTxt = `, type: 'numeric', precision: ${col.numericPrecision} `
        if (col.numericScale) {
            typeTxt = `${typeTxt}, scale: ${col.numericScale} `
        }
    }
    if (!proceso) {
        console.log(col);
        throw new Error(`Error getOrmComplement: ${col.dataType}`);
    }
    return `${typeTxt} ${isNullableTxt}`;
}

