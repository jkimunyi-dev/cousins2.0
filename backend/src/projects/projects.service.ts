import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../config/database.config';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    const project = await this.prisma.project.create({
      data: createProjectDto,
    });

    return {
      success: true,
      message: 'Project created successfully',
      data: project,
    };
  }

  async findAll() {
    const projects = await this.prisma.project.findMany({
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Projects retrieved successfully',
      data: projects,
    };
  }

  async findUnassigned() {
    const projects = await this.prisma.project.findMany({
      where: {
        assignedUserId: null,
      },
    });

    return {
      success: true,
      message: 'Unassigned projects retrieved successfully',
      data: projects,
    };
  }

  async findByUserId(userId: string) {
    const project = await this.prisma.project.findFirst({
      where: {
        assignedUserId: userId,
      },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      return {
        success: true,
        message: 'No project assigned to this user',
        data: null,
      };
    }

    return {
      success: true,
      message: 'User project retrieved successfully',
      data: project,
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    const project = await this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });

    return {
      success: true,
      message: 'Project updated successfully',
      data: project,
    };
  }

  async remove(id: string) {
    const existingProject = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      throw new NotFoundException('Project not found');
    }

    await this.prisma.project.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Project deleted successfully',
    };
  }

  async assign(projectId: string, userId: string) {
    // Check if project exists
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Check if project is already assigned
    if (project.assignedUserId) {
      throw new ConflictException(
        'Project is already assigned to another user',
      );
    }

    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a project assigned
    const existingAssignment = await this.prisma.project.findFirst({
      where: {
        assignedUserId: userId,
      },
    });

    if (existingAssignment) {
      throw new ConflictException('User already has a project assigned');
    }

    // Assign project to user
    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { assignedUserId: userId },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Project assigned successfully',
      data: updatedProject,
    };
  }

  async unassign(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (!project.assignedUserId) {
      throw new ConflictException('Project is not assigned to any user');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { assignedUserId: null },
    });

    return {
      success: true,
      message: 'Project unassigned successfully',
      data: updatedProject,
    };
  }

  async complete(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.isCompleted) {
      throw new ConflictException('Project is already completed');
    }

    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { isCompleted: true },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return {
      success: true,
      message: 'Project marked as completed',
      data: updatedProject,
    };
  }
}
