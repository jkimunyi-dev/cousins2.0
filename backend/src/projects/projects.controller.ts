import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AssignProjectDto } from './dto/assign-project.dto';
import { JwtAuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/role.decorators';
import { Role } from '../common/enum/role.enum';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.projectsService.findAll();
  }

  @Get('unassigned')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findUnassigned() {
    return this.projectsService.findUnassigned();
  }

  @Get('my-project')
  getMyProject(@Request() req) {
    return this.projectsService.findByUserId(req.user.id);
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(id, updateProjectDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @Post(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  assign(@Param('id') id: string, @Body() assignProjectDto: AssignProjectDto) {
    return this.projectsService.assign(id, assignProjectDto.userId);
  }

  @Post(':id/unassign')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  unassign(@Param('id') id: string) {
    return this.projectsService.unassign(id);
  }

  @Post(':id/complete')
  async complete(@Param('id') id: string, @Request() req) {
    // Check if the project is assigned to the current user
    const project = await this.projectsService.findOne(id);

    // Fixed: Remove .data since findOne returns the project directly
    if (!project || project.assignedUserId !== req.user.id) {
      throw new ForbiddenException(
        'You can only complete projects assigned to you',
      );
    }

    return this.projectsService.complete(id);
  }
}
