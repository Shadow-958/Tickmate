const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Check if email credentials are provided
      if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
        console.log('⚠️ Email service not configured - emails will be logged only');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
        tls: {
          rejectUnauthorized: false // For development only
        }
      });

      // Verify connection
      await this.transporter.verify();
      console.log('✅ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Email service initialization failed:', error.message);
      console.log('📧 Emails will be logged to console instead');
      this.transporter = null;
    }
  }

  async loadTemplate(templateName) {
    try {
      const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.html`);
      const template = await fs.readFile(templatePath, 'utf8');
      return template;
    } catch (error) {
      console.error(`Error loading email template ${templateName}:`, error);
      // Return a simple fallback template
      return this.getFallbackTemplate(templateName);
    }
  }

  getFallbackTemplate(templateName) {
    if (templateName === 'ticket-confirmation') {
      return `
        <html>
          <head>
            <meta charset="utf-8">
            <title>Ticket Confirmation</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4; }
              .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
              .ticket-box { background: #f8f9fa; border: 2px dashed #dee2e6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 5px; }
              .ticket-number { font-family: monospace; font-size: 20px; font-weight: bold; color: #667eea; background: white; padding: 10px; border-radius: 5px; }
              .details { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
              .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Ticket Confirmed!</h1>
                <p>Your booking has been successfully confirmed</p>
              </div>
              
              <p>Hello {{attendeeName}},</p>
              <p>Thank you for booking your ticket for <strong>{{eventTitle}}</strong>!</p>
              
              <div class="ticket-box">
                <h3>🎫 Your Ticket Number</h3>
                <div class="ticket-number">{{ticketNumber}}</div>
                <p><strong>Save this number - you'll need it for entry!</strong></p>
              </div>
              
              <div class="details">
                <h3>📅 Event Details</h3>
                <p><strong>Event:</strong> {{eventTitle}}</p>
                <p><strong>Date & Time:</strong> {{eventDateTime}}</p>
                <p><strong>Location:</strong> {{eventLocation}}</p>
                <p><strong>Amount Paid:</strong> ${{pricePaid}}</p>
                <p><strong>Booking Date:</strong> {{bookingDate}}</p>
              </div>
              
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h4>📋 Important:</h4>
                <ul>
                  <li>Bring valid ID matching your booking details</li>
                  <li>Arrive 15-30 minutes before event start</li>
                  <li>Show your ticket number at the entrance</li>
                  <li>Keep this confirmation email safe</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>&copy; 2025 TapIn Event Platform. All rights reserved.</p>
                <p>This is an automated confirmation email.</p>
              </div>
            </div>
          </body>
        </html>
      `;
    }

    if (templateName === 'event-reminder') {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #667eea;">🔔 Event Reminder</h1>
            <p>Hello {{attendeeName}},</p>
            <p>This is a reminder that <strong>{{eventTitle}}</strong> is coming up soon!</p>
            <p><strong>Date:</strong> {{eventDateTime}}</p>
            <p><strong>Location:</strong> {{eventLocation}}</p>
            <p>Don't forget to bring your ticket: <strong>{{ticketNumber}}</strong></p>
            <p>See you there!</p>
          </body>
        </html>
      `;
    }

    return '<p>Email template not found</p>';
  }

  replaceTemplateVariables(template, data) {
    let result = template;
    
    // Replace all template variables
    const replacements = {
      '{{attendeeName}}': data.attendeeName || 'Valued Customer',
      '{{eventTitle}}': data.eventTitle || 'Event',
      '{{ticketNumber}}': data.ticketNumber || 'N/A',
      '{{eventDateTime}}': data.eventDateTime || 'TBD',
      '{{eventLocation}}': data.eventLocation || 'TBD',
      '{{pricePaid}}': data.pricePaid ? ((data.pricePaid / 100).toFixed(2)) : '0.00',
      '{{bookingDate}}': data.bookingDate || new Date().toLocaleDateString(),
      '{{qrCodeUrl}}': data.qrCodeUrl || '',
      '{{dashboardUrl}}': `${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-bookings`,
      '{{eventUrl}}': `${process.env.FRONTEND_URL || 'http://localhost:5173'}/events/${data.eventId || ''}`
    };

    // Replace all occurrences
    for (const [placeholder, value] of Object.entries(replacements)) {
      const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
      result = result.replace(regex, value);
    }

    return result;
  }

  async sendEmail(mailOptions) {
    if (this.transporter) {
      try {
        const result = await this.transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
      } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        return { success: false, error: error.message };
      }
    } else {
      // Log email to console when service is not configured
      console.log('📧 Email would be sent (service not configured):');
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('Content preview:', mailOptions.html ? mailOptions.html.substring(0, 100) + '...' : 'No content');
      return { success: true, messageId: 'logged-only' };
    }
  }

  async sendTicketConfirmation(ticketData) {
    try {
      console.log('📧 Sending ticket confirmation email to:', ticketData.attendeeEmail);
      
      const template = await this.loadTemplate('ticket-confirmation');
      const htmlContent = this.replaceTemplateVariables(template, ticketData);

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'TapIn Events'}" <${process.env.EMAIL_FROM || 'noreply@tapin-events.com'}>`,
        to: ticketData.attendeeEmail,
        subject: `🎫 Ticket Confirmation - ${ticketData.eventTitle}`,
        html: htmlContent,
      };

      return await this.sendEmail(mailOptions);

    } catch (error) {
      console.error('Error sending ticket confirmation email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendEventReminder(reminderData) {
    try {
      console.log('🔔 Sending event reminder email to:', reminderData.attendeeEmail);
      
      const template = await this.loadTemplate('event-reminder');
      const htmlContent = this.replaceTemplateVariables(template, reminderData);

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'TapIn Events'}" <${process.env.EMAIL_FROM || 'noreply@tapin-events.com'}>`,
        to: reminderData.attendeeEmail,
        subject: `🔔 Event Reminder - ${reminderData.eventTitle}`,
        html: htmlContent,
      };

      return await this.sendEmail(mailOptions);

    } catch (error) {
      console.error('Error sending event reminder email:', error);
      return { success: false, error: error.message };
    }
  }

  async sendBulkEmail(emails, subject, template, templateData) {
    const results = [];
    
    for (const email of emails) {
      try {
        const htmlContent = this.replaceTemplateVariables(template, { ...templateData, attendeeEmail: email });
        
        const mailOptions = {
          from: `"${process.env.EMAIL_FROM_NAME || 'TapIn Events'}" <${process.env.EMAIL_FROM || 'noreply@tapin-events.com'}>`,
          to: email,
          subject: subject,
          html: htmlContent,
        };

        const result = await this.sendEmail(mailOptions);
        results.push({ email, success: result.success, messageId: result.messageId });
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error sending bulk email to ${email}:`, error);
        results.push({ email, success: false, error: error.message });
      }
    }

    return results;
  }

  async sendPasswordReset(email, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
      
      const htmlContent = `
        <html>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #667eea;">🔐 Password Reset Request</h1>
            <p>Hello,</p>
            <p>You have requested a password reset for your TapIn Events account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background: #667eea; color: white; padding: 15px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
            </div>
            <p>If you didn't request this reset, please ignore this email.</p>
            <p>This link will expire in 1 hour.</p>
            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If the button doesn't work, copy and paste this link: ${resetUrl}
            </p>
          </body>
        </html>
      `;

      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'TapIn Events'}" <${process.env.EMAIL_FROM || 'noreply@tapin-events.com'}>`,
        to: email,
        subject: '🔐 Password Reset Request - TapIn Events',
        html: htmlContent,
      };

      return await this.sendEmail(mailOptions);

    } catch (error) {
      console.error('Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  // Test email functionality
  async sendTestEmail(recipientEmail) {
    try {
      const mailOptions = {
        from: `"${process.env.EMAIL_FROM_NAME || 'TapIn Events'}" <${process.env.EMAIL_FROM || 'noreply@tapin-events.com'}>`,
        to: recipientEmail,
        subject: '🧪 Test Email - TapIn Events',
        html: `
          <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1 style="color: #667eea;">✅ Email Service Test</h1>
              <p>Hello,</p>
              <p>This is a test email from TapIn Events platform.</p>
              <p>If you received this email, the email service is working correctly!</p>
              <p>Timestamp: ${new Date().toISOString()}</p>
              <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Email Service Configuration:</strong></p>
                <ul>
                  <li>Host: ${process.env.EMAIL_HOST || 'Not configured'}</li>
                  <li>Port: ${process.env.EMAIL_PORT || 'Not configured'}</li>
                  <li>From: ${process.env.EMAIL_FROM || 'Not configured'}</li>
                </ul>
              </div>
            </body>
          </html>
        `,
      };

      return await this.sendEmail(mailOptions);

    } catch (error) {
      console.error('Error sending test email:', error);
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance
module.exports = new EmailService();
