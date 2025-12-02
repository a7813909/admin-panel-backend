import nodemailer from 'nodemailer';
import dotenv from 'dotenv'; // Для загрузки переменных из .env локально

dotenv.config(); // Загрузка переменных окружения для локальной работы

// [ВАЖНО] Переменные окружения для SMTP
// Эти переменные должны быть добавлены в Environment Variables на Render!
// SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FRONTEND_URL
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASSWORD = process.env.SMTP_PASSWORD;
const FRONTEND_URL = process.env.FRONTEND_URL;

// [КРИТИЧНО] Проверка на наличие переменных окружения
if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !FRONTEND_URL) {
    console.error("❌ CRITICAL ERROR: Email service environment variables are missing!");
    // В production это должно быть Error, в dev можно просто console.warn
    if (process.env.NODE_ENV === 'production') {
        throw new Error("Missing SMTP configuration in environment variables.");
    } else {
        console.warn("⚠️ WARNING: SMTP configuration is missing. Emails will not be sent locally.");
    }
}

// Создаем транспортный объект для Nodemailer
// Если переменные не заданы, transporter может быть undefined или будет использоваться нерабочий.
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,       
  // @ts-ignore - Secure обычно bool, но для некоторых портов может быть undefined
  port: SMTP_PORT,
  secure: SMTP_PORT === 465, // true для 465, false для других портов (например, 587)
  auth: {
    user: SMTP_USER,         
    pass: SMTP_PASSWORD,  
  },
});

/**
 * Отправляет email со ссылкой для сброса пароля.
 * @param to - Email получателя.
 * @param resetToken - Токен для сброса пароля.
 */
export const sendPasswordResetEmail = async (to: string, resetToken: string) => {
    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASSWORD || !FRONTEND_URL) {
        console.error("Skipping email send: SMTP configuration is incomplete.");
        return; // Пропустить отправку, если конфиг неполный
    }

    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`; // Ссылка на твой фронтенд

    try {
        await transporter.sendMail({
            from: '"My Admin Panel" <no-reply@yourdomain.com>', // [ВАЖНО] Укажи реальный email отправителя!
            to: to,
            subject: 'Password Reset Request for My Admin Panel',
            html: `
                <p>Hello,</p>
                <p>You have requested a password reset for your account on My Admin Panel.</p>
                <p>Please click on the following link to reset your password:</p>
                <p><a href="${resetLink}">Reset your password here</a></p>
                <p>This link will expire in 1 hour.</p>
                <p>If you did not request a password reset, please ignore this email.</p>
                <br>
                <p>Regards,</p>
                <p>My Admin Panel Team</p>
            `,text: `Hello,\nYou have requested a password reset for your account on My Admin Panel.\nPlease visit the following link to reset your password: ${resetLink}\nThis link will expire in 1 hour.\nIf you did not request a password reset, please ignore this email.\nRegards,\nMy Admin Panel Team`,
        });
        console.log(`✅ Email sent to ${to} with reset link.`);
    } catch (error) {
        console.error(`❌ Error sending password reset email to ${to}:`, error);
        throw new Error(`Failed to send email: ${(error as Error).message}`);
    }
};