import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../config/database.config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../common/enum/role.enum';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    return this.prisma.user.create({
      data: {
        ...createUserDto,
        role: createUserDto.role || Role.USER,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        assignedProject: {
          select: {
            id: true,
            name: true,
            description: true,
            endDate: true,
            isCompleted: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        assignedProject: {
          select: {
            id: true,
            name: true,
            description: true,
            endDate: true,
            isCompleted: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        assignedProject: true,
      },
    });
  }

  async update(id:  string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.delete({ where: { id } });
  }

  async findUsersWithoutProjects() {
    return this.prisma.user.findMany({
      where: {
        assignedProject: null,
        role: Role.USER,
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });
  }
}
