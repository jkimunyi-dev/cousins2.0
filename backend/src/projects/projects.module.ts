import { Module } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { PrismaService } from '../config/database.config';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  providers: [ProjectsService, PrismaService],
  controllers: [ProjectsController],
  exports: [ProjectsService],
})
export class ProjectsModule {}
