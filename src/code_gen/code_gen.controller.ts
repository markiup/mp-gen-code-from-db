import { Controller, Get } from '@nestjs/common';
import { CodeGenService } from './code_gen.service';
import { MataDataDto } from './dto/metadata.dto';

@Controller('code-gen')
export class CodeGenController {
    constructor(private readonly codeGenService: CodeGenService) { }

    @Get()
    async getConsultaDatos(): Promise<MataDataDto[]> {
        return this.codeGenService.obtenerDatosConsultaNativo();
    }

}