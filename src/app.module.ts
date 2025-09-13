import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CodeGenModule } from './code_gen/code_gen.module';

@Module({
  imports: [CodeGenModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
