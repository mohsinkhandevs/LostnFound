import nodemailer from 'nodemailer';
import EmailLog from '../models/EmailLog.js';

// Transporter will be created lazily
let transporter = null;

// Function to get or create the transporter
const getTransporter = () => {
    if (!transporter) {
        const emailUser = process.env.EMAIL_USER;
        const emailPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.replace(/\s+/g, '') : '';

        // Validate email credentials
        console.log('📧 Email Configuration Debug:');
        console.log('  EMAIL_USER (raw):', process.env.EMAIL_USER);
        console.log('  EMAIL_PASS (raw):', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NOT SET');
        console.log('  EMAIL_USER (processed):', emailUser);
        console.log('  EMAIL_PASS (processed, length):', emailPass ? emailPass.length : 0);

        if (!emailUser || !emailPass) {
            console.error('⚠️ WARNING: Email credentials not properly configured!');
            console.error('  EMAIL_USER:', emailUser ? 'Set' : 'NOT SET');
            console.error('  EMAIL_PASS:', emailPass ? `Set (length: ${emailPass.length})` : 'NOT SET');
        } else {
            console.log('✅ Email credentials configured successfully');
        }

        transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: emailUser,
                pass: emailPass
            }
        });
    }
    return transporter;
};

export const sendMatchNotification = async (lostItem, foundItem, lostUser, foundUser) => {
    try {
        // Email to the person who lost the item
        const lostMailOptions = {
            from: process.env.EMAIL_USER,
            to: lostUser.email,
            subject: 'Potential Match Found for Your Lost Item! 🔍',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">Good News! We found a potential match.</h2>
                    <p>Hello ${lostUser.full_name},</p>
                    <p>Someone has reported a found item that matches the description of your lost <strong>${lostItem.item_name}</strong>.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Matched Item Details:</h3>
                        <p><strong>Item:</strong> ${foundItem.item_name}</p>
                        <p><strong>Category:</strong> ${foundItem.category}</p>
                        <p><strong>Location Found:</strong> ${foundItem.location_found}</p>
                        <p><strong>Description:</strong> ${foundItem.description}</p>
                    </div>

                    <p>You can contact the finder directly:</p>
                    <p><strong>Finder Name:</strong> ${foundUser.full_name}</p>
                    <p><strong>Email:</strong> ${foundUser.email}</p>
                    ${foundUser.phone_number ? `<p><strong>Phone:</strong> ${foundUser.phone_number}</p>` : ''}
                    
                    <p style="margin-top: 30px;">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/item/found/${foundItem._id}" 
                           style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            View Item Details
                        </a>
                    </p>
                </div>
            `
        };

        // Email to the person who found the item
        const foundMailOptions = {
            from: process.env.EMAIL_USER,
            to: foundUser.email,
            subject: 'Potential Match for Item You Found! 🤝',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4f46e5;">Potential Owner Found!</h2>
                    <p>Hello ${foundUser.full_name},</p>
                    <p>The item you found (<strong>${foundItem.item_name}</strong>) matches a lost item report.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Lost Item Details:</h3>
                        <p><strong>Item:</strong> ${lostItem.item_name}</p>
                        <p><strong>Category:</strong> ${lostItem.category}</p>
                        <p><strong>Location Lost:</strong> ${lostItem.last_known_location}</p>
                    </div>

                    <p>You can contact the potential owner:</p>
                    <p><strong>Owner Name:</strong> ${lostUser.full_name}</p>
                    <p><strong>Email:</strong> ${lostUser.email}</p>
                    ${lostUser.phone_number ? `<p><strong>Phone:</strong> ${lostUser.phone_number}</p>` : ''}
                    
                    <p style="margin-top: 30px;">
                        <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/item/lost/${lostItem._id}" 
                           style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                            View Item Details
                        </a>
                    </p>
                </div>
            `
        };

        await getTransporter().sendMail(lostMailOptions);

        // Log email to lost user
        await EmailLog.create({
            recipient_email: lostUser.email,
            recipient_name: lostUser.full_name,
            subject: lostMailOptions.subject,
            content: lostMailOptions.html,
            email_type: 'match_notification',
            is_sensitive: false,
            status: 'sent'
        });

        await getTransporter().sendMail(foundMailOptions);

        // Log email to found user
        await EmailLog.create({
            recipient_email: foundUser.email,
            recipient_name: foundUser.full_name,
            subject: foundMailOptions.subject,
            content: foundMailOptions.html,
            email_type: 'match_notification',
            is_sensitive: false,
            status: 'sent'
        });

        console.log('Match notification emails sent successfully');
        return true;
    } catch (error) {
        console.error('Error sending match emails:', error);

        // Log failure if possible
        try {
            await EmailLog.create({
                recipient_email: 'system',
                recipient_name: 'system',
                subject: 'Match Notification Failed',
                content: 'Failed to send match emails',
                status: 'failed',
                error_message: error.message
            });
        } catch (logError) {
            console.error('Failed to log email error:', logError);
        }

        return false;
    }
};

// Send OTP for account verification
export const sendOTPEmail = async (email, fullName, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Verify Your Email - Lost & Found Portal 🔐',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">📦 Lost & Found Portal</h1>
                    </div>
                    
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <h2 style="color: #1f2937; margin-top: 0;">Email Verification</h2>
                        <p style="color: #4b5563; font-size: 16px;">Hello ${fullName || 'there'},</p>
                        <p style="color: #4b5563; font-size: 16px;">Thank you for registering with the Lost & Found Portal. To complete your registration, please use the following One-Time Password (OTP):</p>
                        
                        <div style="background-color: #f3f4f6; padding: 25px 15px; border-radius: 8px; text-align: center; margin: 30px 0;">
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 36px; font-weight: bold; color: #1e3a8a; letter-spacing: 6px; white-space: nowrap; display: inline-block; padding-left: 6px;">${otp}</div>
                        </div>
                        
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                ⚠️ <strong>Important:</strong> This OTP is valid for only <strong>5 minutes</strong>. Do not share this code with anyone.
                            </p>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you didn't request this verification, please ignore this email.</p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                            Lost & Found Portal - FAST-NUCES<br>
                            This is an automated email, please do not reply.
                        </p>
                    </div>
                </div>
            `
        };

        await getTransporter().sendMail(mailOptions);

        // Log email (SENSITIVE - contains OTP)
        await EmailLog.create({
            recipient_email: email,
            recipient_name: fullName || 'New User',
            subject: mailOptions.subject,
            content: mailOptions.html,
            email_type: 'registration_otp',
            is_sensitive: true, // OTP emails must be marked sensitive
            status: 'sent'
        });

        console.log(`OTP email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP email:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });

        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ EMAIL_USER or EMAIL_PASS not configured in .env file');
        }

        // Log failure
        try {
            await EmailLog.create({
                recipient_email: email,
                recipient_name: fullName || 'New User',
                subject: 'OTP Verification Email',
                content: 'Failed to send OTP',
                status: 'failed',
                error_message: error.message
            });
        } catch (logError) {
            console.error('Failed to log email error:', logError);
        }

        return false;
    }
};

// Send OTP for password reset
export const sendPasswordResetOTP = async (email, fullName, otp) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Password Reset Request - Lost & Found Portal 🔒',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; border-radius: 10px;">
                    <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">📦 Lost & Found Portal</h1>
                    </div>
                    
                    <div style="background-color: white; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
                        <h2 style="color: #1f2937; margin-top: 0;">Password Reset Request</h2>
                        <p style="color: #4b5563; font-size: 16px;">Hello ${fullName || 'there'},</p>
                        <p style="color: #4b5563; font-size: 16px;">We received a request to reset your password. To proceed with the password reset, please use the following One-Time Password (OTP):</p>
                        
                        <div style="background-color: #f3f4f6; padding: 25px 15px; border-radius: 8px; text-align: center; margin: 30px 0;">
                            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 36px; font-weight: bold; color: #1e3a8a; letter-spacing: 6px; white-space: nowrap; display: inline-block; padding-left: 6px;">${otp}</div>
                        </div>
                        
                        <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #92400e; font-size: 14px;">
                                ⚠️ <strong>Important:</strong> This OTP is valid for only <strong>10 minutes</strong>. Do not share this code with anyone.
                            </p>
                        </div>
                        
                        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px;">
                            <p style="margin: 0; color: #991b1b; font-size: 14px;">
                                🔐 <strong>Security Note:</strong> Your old password will remain active until you complete the reset process. You can still login with your current password if you remember it.
                            </p>
                        </div>
                        
                        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                        
                        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                            Lost & Found Portal - FAST-NUCES<br>
                            This is an automated email, please do not reply.
                        </p>
                    </div>
                </div>
            `
        };

        await getTransporter().sendMail(mailOptions);

        // Log email (SENSITIVE - contains OTP)
        await EmailLog.create({
            recipient_email: email,
            recipient_name: fullName || 'User',
            subject: mailOptions.subject,
            content: mailOptions.html,
            email_type: 'password_reset_otp',
            is_sensitive: true, // OTP emails must be marked sensitive
            status: 'sent'
        });

        console.log(`Password reset OTP email sent successfully to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            command: error.command,
            response: error.response
        });

        // Log failure
        try {
            await EmailLog.create({
                recipient_email: email,
                recipient_name: fullName || 'User',
                subject: 'Password Reset Email',
                content: 'Failed to send password reset OTP',
                status: 'failed',
                error_message: error.message
            });
        } catch (logError) {
            console.error('Failed to log email error:', logError);
        }

        return false;
    }
};

// Send notification when a lost item is marked as recovered (notify founders)
export const sendItemRecoveredNotification = async (lostItem, foundItem, founderUser, lostUser) => {
    try {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: founderUser.email,
            subject: 'Good News! Item Owner Recovered Their Item ✅',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10b981;">Great News! 🎉</h2>
                    <p>Hello ${founderUser.full_name},</p>
                    <p>The person who lost the <strong>${lostItem.item_name}</strong> has marked it as recovered!</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Recovered Item Details:</h3>
                        <p><strong>Item:</strong> ${lostItem.item_name}</p>
                        <p><strong>Category:</strong> ${lostItem.category}</p>
                        <p><strong>Owner:</strong> ${lostUser.full_name}</p>
                    </div>

                    <div style="background-color: #dcfce7; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #166534; font-size: 14px;">
                            💡 <strong>Did you return this item to the owner?</strong><br>
                            If your found item post (<strong>${foundItem.item_name}</strong>) is no longer active, you can close it to keep the database clean.
                        </p>
                    </div>

                    <p style="margin-top: 30px;">
                        <a href="${clientUrl}/my-items" 
                           style="background-color: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin-right: 10px;">
                            View My Items
                        </a>
                    </p>

                    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                        Thank you for being an awesome community member! 🌟
                    </p>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                        Lost & Found Portal - FAST-NUCES<br>
                        This is an automated email, please do not reply.
                    </p>
                </div>
            `
        };

        await getTransporter().sendMail(mailOptions);

        // Log email
        await EmailLog.create({
            recipient_email: founderUser.email,
            recipient_name: founderUser.full_name,
            subject: mailOptions.subject,
            content: mailOptions.html,
            email_type: 'item_recovered_notification',
            is_sensitive: false,
            status: 'sent'
        });

        console.log(`Item recovered notification sent to ${founderUser.email}`);
        return true;
    } catch (error) {
        console.error('Error sending item recovered notification:', error);

        try {
            await EmailLog.create({
                recipient_email: founderUser.email,
                recipient_name: founderUser.full_name,
                subject: 'Item Recovered Notification',
                content: 'Failed to send notification',
                status: 'failed',
                error_message: error.message
            });
        } catch (logError) {
            console.error('Failed to log email error:', logError);
        }

        return false;
    }
};

// Send notification when a found item is closed (notify lost item owners)
export const sendFoundItemClosedNotification = async (lostItem, foundItem, lostUser, founderUser) => {
    try {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: lostUser.email,
            subject: 'Matched Found Item Has Been Closed 🔔',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #f59e0b;">Update on Your Lost Item</h2>
                    <p>Hello ${lostUser.full_name},</p>
                    <p>The person who found an item matching your <strong>${lostItem.item_name}</strong> has marked their post as closed.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0;">Closed Found Item:</h3>
                        <p><strong>Item:</strong> ${foundItem.item_name}</p>
                        <p><strong>Category:</strong> ${foundItem.category}</p>
                        <p><strong>Finder:</strong> ${founderUser.full_name}</p>
                    </div>

                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0; color: #92400e; font-size: 14px;">
                            ℹ️ <strong>What does this mean?</strong><br>
                            The finder has marked their post as closed, which might mean they returned the item to someone. If you recovered your item, please mark your lost item report as recovered too!
                        </p>
                    </div>

                    <p style="margin-top: 30px;">
                        <a href="${clientUrl}/my-items" 
                           style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Manage My Reports
                        </a>
                    </p>

                    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
                    
                    <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                        Lost & Found Portal - FAST-NUCES<br>
                        This is an automated email, please do not reply.
                    </p>
                </div>
            `
        };

        await getTransporter().sendMail(mailOptions);

        // Log email
        await EmailLog.create({
            recipient_email: lostUser.email,
            recipient_name: lostUser.full_name,
            subject: mailOptions.subject,
            content: mailOptions.html,
            email_type: 'found_item_closed_notification',
            is_sensitive: false,
            status: 'sent'
        });

        console.log(`Found item closed notification sent to ${lostUser.email}`);
        return true;
    } catch (error) {
        console.error('Error sending found item closed notification:', error);

        try {
            await EmailLog.create({
                recipient_email: lostUser.email,
                recipient_name: lostUser.full_name,
                subject: 'Found Item Closed Notification',
                content: 'Failed to send notification',
                status: 'failed',
                error_message: error.message
            });
        } catch (logError) {
            console.error('Failed to log email error:', logError);
        }

        return false;
    }
};

