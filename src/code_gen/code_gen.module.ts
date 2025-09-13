import { Module } from '@nestjs/common';
import { CodeGenService } from './code_gen.service';
import { CodeGenController } from './code_gen.controller';

@Module({
  providers: [CodeGenService],
  controllers: [CodeGenController]
})
export class CodeGenModule {}
