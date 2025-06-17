import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('MAIL_HOST', 'smtp.gmail.com'),
      port: this.configService.get<number>('MAIL_PORT', 587),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('MAIL_USER'),
        pass: this.configService.get<string>('MAIL_PASS'),
      },
    });
  }

  private getEmailTemplate(content: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Notification</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #f8fafc;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 32px 40px;
            text-align: center;
          }
          .header h1 {
            font-size: 28px;
            font-weight: 600;
            margin-bottom: 8px;
            letter-spacing: -0.02em;
          }
          .header p {
            font-size: 16px;
            opacity: 0.9;
            font-weight: 400;
          }
          .content {
            padding: 40px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #1a202c;
            margin-bottom: 24px;
          }
          .message {
            font-size: 16px;
            color: #4a5568;
            margin-bottom: 32px;
            line-height: 1.7;
          }
          .card {
            background-color: #f7fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
            border-left: 4px solid #667eea;
          }
          .card h3 {
            font-size: 20px;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 16px;
          }
          .card-detail {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .card-detail:last-child {
            border-bottom: none;
          }
          .card-label {
            font-weight: 600;
            color: #4a5568;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .card-value {
            font-weight: 500;
            color: #2d3748;
            text-align: right;
            max-width: 60%;
          }
          .action-list {
            background-color: #f0fff4;
            border: 1px solid #c6f6d5;
            border-radius: 12px;
            padding: 24px;
            margin: 24px 0;
          }
          .action-list h4 {
            font-size: 18px;
            font-weight: 600;
            color: #22543d;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
          }
          .action-list h4::before {
            content: "🚀";
            margin-right: 8px;
          }
          .action-list ul {
            list-style: none;
            margin: 0;
            padding: 0;
          }
          .action-list li {
            padding: 8px 0;
            color: #2f855a;
            font-weight: 500;
            position: relative;
            padding-left: 24px;
          }
          .action-list li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #38a169;
            font-weight: bold;
          }
          .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            margin: 24px 0;
            transition: transform 0.2s ease;
          }
          .cta-button:hover {
            transform: translateY(-2px);
          }
          .status-badge {
            display: inline-block;
            background-color: #d69e2e;
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .status-badge.completed {
            background-color: #38a169;
          }
          .footer {
            background-color: #f7fafc;
            padding: 32px 40px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
          }
          .footer p {
            font-size: 14px;
            color: #718096;
            margin-bottom: 8px;
          }
          .signature {
            font-weight: 600;
            color: #4a5568;
            margin-top: 16px;
          }
          @media (max-width: 600px) {
            .email-container {
              margin: 0;
              border-radius: 0;
            }
            .header, .content, .footer {
              padding: 24px 20px;
            }
            .card-detail {
              flex-direction: column;
              align-items: flex-start;
            }
            .card-value {
              text-align: left;
              max-width: 100%;
              margin-top: 4px;
            }
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          ${content}
        </div>
      </body>
      </html>
    `;
  }

  async sendProjectAssignmentNotification(
    userEmail: string,
    userName: string,
    project: any,
  ) {
    const content = `
      <div class="header">
        <h1>New Project Assignment</h1>
        <p>You've been assigned to an exciting new project</p>
      </div>
      <div class="content">
        <div class="greeting">Hello ${userName}! 👋</div>
        <div class="message">
          Great news! You have been assigned to a new project. We're confident you'll do an excellent job bringing this project to life.
        </div>
        
        <div class="card">
          <h3>${project.name}</h3>
          <div class="card-detail">
            <span class="card-label">Description</span>
            <span class="card-value">${project.description}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Due Date</span>
            <span class="card-value">${new Date(
              project.endDate,
            ).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Status</span>
            <span class="card-value"><span class="status-badge">Assigned</span></span>
          </div>
        </div>

        <div class="action-list">
          <h4>Next Steps</h4>
          <ul>
            <li>Log in to your dashboard to view full project details</li>
            <li>Review project requirements and timeline</li>
            <li>Connect with your team members</li>
            <li>Begin planning your approach</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="#" class="cta-button">View Project Details</a>
        </div>
      </div>
      <div class="footer">
        <p>Need help? Contact our support team anytime.</p>
        <div class="signature">
          Best regards,<br>
          <strong>Project Management Team</strong>
        </div>
      </div>
    `;

    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to: userEmail,
      subject: '🎯 New Project Assignment - Action Required',
      html: this.getEmailTemplate(content),
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(
        `Project assignment email sent successfully to ${userEmail}, ${result.messageId}`,
      );
    } catch (error) {
      console.error('Error sending project assignment email:', error);
    }
  }

  async sendProjectCompletionNotification(
    adminEmail: string,
    project: any,
    user: any,
  ) {
    const content = `
      <div class="header">
        <h1>Project Completed</h1>
        <p>A team member has successfully completed their project</p>
      </div>
      <div class="content">
        <div class="greeting">Project Completion Alert 🎉</div>
        <div class="message">
          Excellent news! One of your team members has successfully completed their assigned project. Please review the completion details below.
        </div>
        
        <div class="card">
          <h3>${project.name}</h3>
          <div class="card-detail">
            <span class="card-label">Description</span>
            <span class="card-value">${project.description}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Completed By</span>
            <span class="card-value">${user.name}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Email</span>
            <span class="card-value">${user.email}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Due Date</span>
            <span class="card-value">${new Date(
              project.endDate,
            ).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Completed On</span>
            <span class="card-value">${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Status</span>
            <span class="card-value"><span class="status-badge completed">Completed</span></span>
          </div>
        </div>

        <div class="action-list">
          <h4>Recommended Actions</h4>
          <ul>
            <li>Review the completed project deliverables</li>
            <li>Provide feedback to the team member</li>
            <li>Update project status in the system</li>
            <li>Consider the team member for future projects</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="#" class="cta-button">Review Project</a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated notification from your project management system.</p>
        <div class="signature">
          Best regards,<br>
          <strong>System Administrator</strong>
        </div>
      </div>
    `;

    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to: adminEmail,
      subject: '✅ Project Completed - Review Required',
      html: this.getEmailTemplate(content),
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log('Project completion email sent successfully');
    } catch (error) {
      console.error('Error sending project completion email:', error);
    }
  }

  async sendWelcomeNotificationToUser(userEmail: string, userName: string) {
    console.log('📬 [MAIL SERVICE] Sending welcome email to user:', userEmail);

    const content = `
      <div class="header">
        <h1>Welcome to Our Platform!</h1>
        <p>We're thrilled to have you join our community</p>
      </div>
      <div class="content">
        <div class="greeting">Welcome aboard, ${userName}! 🎉</div>
        <div class="message">
          Thank you for registering with our platform. We're incredibly excited to have you as part of our growing community of professionals and innovators.
        </div>
        
        <div class="action-list">
          <h4>Get Started Today</h4>
          <ul>
            <li>Complete your profile setup to personalize your experience</li>
            <li>Explore available projects and opportunities</li>
            <li>Connect with team members and collaborators</li>
            <li>Access your personalized dashboard</li>
            <li>Join our community discussions and forums</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="#" class="cta-button">Complete Your Profile</a>
        </div>

        <div class="message">
          Our support team is here to help you every step of the way. Don't hesitate to reach out if you have any questions or need assistance getting started.
        </div>
      </div>
      <div class="footer">
        <p>Questions? We're here to help! Contact our support team anytime.</p>
        <div class="signature">
          Welcome to the team!<br>
          <strong>The Platform Team</strong>
        </div>
      </div>
    `;

    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to: userEmail,
      subject: "🎉 Welcome to Our Platform - Let's Get Started!",
      html: this.getEmailTemplate(content),
    };

    try {
      console.log(
        '📤 [MAIL SERVICE] Attempting to send welcome email to user...',
      );
      await this.transporter.sendMail(mailOptions);
      console.log(
        '✅ [MAIL SERVICE] Welcome email sent successfully to user:',
        userEmail,
      );
    } catch (error) {
      console.error(
        '❌ [MAIL SERVICE] Error sending welcome email to user:',
        error,
      );
    }
  }

  async sendNewUserNotificationToAdmins(adminEmails: string[], newUser: any) {
    console.log(
      '📬 [MAIL SERVICE] Sending new user notification to admins:',
      adminEmails,
    );

    const content = `
      <div class="header">
        <h1>New User Registration</h1>
        <p>A new member has joined your platform</p>
      </div>
      <div class="content">
        <div class="greeting">New User Alert 👤</div>
        <div class="message">
          A new user has successfully registered on the platform. Please review their information and consider any onboarding actions that may be required.
        </div>
        
        <div class="card">
          <h3>User Registration Details</h3>
          <div class="card-detail">
            <span class="card-label">Full Name</span>
            <span class="card-value">${newUser.name}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Email Address</span>
            <span class="card-value">${newUser.email}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Role</span>
            <span class="card-value">${newUser.role || 'User'}</span>
          </div>
          <div class="card-detail">
            <span class="card-label">Registration Date</span>
            <span class="card-value">${new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}</span>
          </div>
        </div>

        <div class="action-list">
          <h4>Recommended Admin Actions</h4>
          <ul>
            <li>Review the new user's profile and information</li>
            <li>Assign appropriate permissions and access levels</li>
            <li>Consider adding them to relevant project teams</li>
            <li>Send a personalized welcome message if needed</li>
            <li>Update any relevant documentation or records</li>
          </ul>
        </div>

        <div style="text-align: center;">
          <a href="#" class="cta-button">View User Profile</a>
        </div>
      </div>
      <div class="footer">
        <p>This is an automated notification from your user management system.</p>
        <div class="signature">
          Best regards,<br>
          <strong>System Administrator</strong>
        </div>
      </div>
    `;

    const adminEmailList = adminEmails.join(', ');
    const mailOptions = {
      from: this.configService.get<string>('MAIL_USER'),
      to: adminEmailList,
      subject: '👤 New User Registration - Admin Review Required',
      html: this.getEmailTemplate(content),
    };

    try {
      console.log(
        '📤 [MAIL SERVICE] Attempting to send admin notification emails...',
      );
      await this.transporter.sendMail(mailOptions);
      console.log(
        '✅ [MAIL SERVICE] New user notification email sent successfully to admins',
      );
    } catch (error) {
      console.error(
        '❌ [MAIL SERVICE] Error sending new user notification email to admins:',
        error,
      );
    }
  }

  async sendWelcomeEmails(newUser: any, adminEmails: string[]) {
    console.log('🚀 [MAIL SERVICE] Starting sendWelcomeEmails process');
    console.log('👤 New user:', newUser);
    console.log('👥 Admin emails:', adminEmails);

    // Send welcome email to the new user
    console.log(
      '📧 [MAIL SERVICE] Step 1: Sending welcome email to new user...',
    );
    await this.sendWelcomeNotificationToUser(newUser.email, newUser.name);

    // Send notification to all admins
    console.log('📧 [MAIL SERVICE] Step 2: Sending notification to admins...');
    await this.sendNewUserNotificationToAdmins(adminEmails, newUser);

    console.log('✅ [MAIL SERVICE] sendWelcomeEmails process completed');
  }
}
