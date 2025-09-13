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

export function getTypeOrmType(dataType: string, maxLen: number | null, numPrec: number | null): string {
    switch (dataType) {
        case 'text':
        case 'character varying':
            return 'varchar';
        case 'integer':
            return 'int';
        case 'numeric':
            return 'numeric';
        case 'date':
            return 'date';
        case 'timestamp with time zone':
            return 'timestamptz';
        case 'boolean':
            return 'boolean';
        default:
            return 'varchar';
    }
}

