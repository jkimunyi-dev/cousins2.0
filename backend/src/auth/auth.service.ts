import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../config/database.config';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(userData: { name: string; email: string; password: string }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: 'USER',
      },
    });

    // Get all admin emails for notification
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: { email: true },
    });
    const adminEmails = admins.map((admin) => admin.email);

    console.log('🔍 [AUTH SERVICE - REGISTER] About to send welcome emails');
    console.log('📧 User data:', {
      name: user.name,
      email: user.email,
      role: user.role,
      id: user.id,
    });
    console.log('👥 Admin emails:', adminEmails);

    // Send welcome emails (to user and admins)
    try {
      console.log(
        '📤 [AUTH SERVICE - REGISTER] Calling mailService.sendWelcomeEmails...',
      );
      await this.mailService.sendWelcomeEmails(
        {
          name: user.name,
          email: user.email,
          role: user.role,
          id: user.id,
        },
        adminEmails,
      );
      console.log(
        '✅ [AUTH SERVICE - REGISTER] Welcome emails sent successfully',
      );
    } catch (error) {
      console.error(
        '❌ [AUTH SERVICE - REGISTER] Failed to send welcome emails:',
        error,
      );
      // Don't throw error here - user registration should still succeed
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async registerAdmin(userData: {
    name: string;
    email: string;
    password: string;
  }) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create admin user
    const user = await this.prisma.user.create({
      data: {
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        role: 'ADMIN',
      },
    });

    // Get all admin emails for notification
    const admins = await this.prisma.user.findMany({
      where: { role: 'ADMIN', id: { not: user.id } }, // Exclude the newly created admin
      select: { email: true },
    });
    const adminEmails = admins.map((admin) => admin.email);

    console.log('🔍 [AUTH SERVICE - REGISTER ADMIN] About to send welcome emails');
    console.log('📧 Admin user data:', {
      name: user.name,
      email: user.email,
      role: user.role,
      id: user.id,
    });
    console.log('👥 Existing admin emails (excluding new admin):', adminEmails);

    // Send welcome emails (to user and existing admins)
    try {
      console.log(
        '📤 [AUTH SERVICE - REGISTER ADMIN] Calling mailService.sendWelcomeEmails...',
      );
      await this.mailService.sendWelcomeEmails(
        {
          name: user.name,
          email: user.email,
          role: user.role,
          id: user.id,
        },
        adminEmails,
      );
      console.log(
        '✅ [AUTH SERVICE - REGISTER ADMIN] Welcome emails sent successfully',
      );
    } catch (error) {
      console.error(
        '❌ [AUTH SERVICE - REGISTER ADMIN] Failed to send welcome emails:',
        error,
      );
      // Don't throw error here - user registration should still succeed
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(loginData: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginData.email },
    });

    if (!user || !(await bcrypt.compare(loginData.password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
