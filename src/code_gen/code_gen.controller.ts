import { Controller, Get } from '@nestjs/common';
import { CodeGenService } from './code_gen.service';
import { MataDataDto } from './dto/metadata.dto';

@Controller('code-gen')
export class CodeGenController {
    constructor(private readonly codeGenService: CodeGenService) { }

    @Get()
    async getConsultaDatos(): Promise<Record<string, MataDataDto[]>> {
        this.codeGenService.generarArchivosEntidad();
        return this.codeGenService.metadataAgrupadoPorTabla();
    }

}