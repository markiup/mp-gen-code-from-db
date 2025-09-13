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
        // return 'varchar';
        return ''
    }
    if (col.dataType === 'integer') {
        proceso = true;
        typeTxt = `type: 'int'`
        //   @Column({ name: 'ava_valor', type: 'numeric', precision: 20, scale: 4 })
    }
    // if (dataType === 'integer') {
    //     proceso = true;
    //     typeTxt = `type: '${typeOrmType}'`
    //     //   @Column({ name: 'ava_valor', type: 'numeric', precision: 20, scale: 4 })
    // }
    if (!proceso) {
        console.log(MataDataDto);
        throw new Error(`Error getOrmComplement: ${col}`);
    }
    return `${typeTxt} ${isNullableTxt}`;
}

