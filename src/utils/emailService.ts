import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport'; // <--- ДОБАВЛЕНО! ИСПОЛЬЗУЕМ type ДЛЯ ЧИСТОТЫ

import dotenv from 'dotenv';
dotenv.config();

const getRequiredEnvVar = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        const errorMessage = `❌ CRITICAL ERROR: Environment variable ${name} is missing!`;
        console.error(errorMessage);
        throw new Error(errorMessage);
        }
    return value;
};

const SMTP_HOST: string = getRequiredEnvVar('SMTP_HOST');
const SMTP_PORT_STR: string = getRequiredEnvVar('SMTP_PORT');
const SMTP_USER: string = getRequiredEnvVar('SMTP_USER');
const SMTP_PASSWORD: string = getRequiredEnvVar('SMTP_PASSWORD');
const FRONTEND_URL: string = getRequiredEnvVar('FRONTEND_URL');
const EMAIL_FROM_ADDRESS: string = getRequiredEnvVar('EMAIL_FROM_ADDRESS');

const SMTP_PORT: number = parseInt(SMTP_PORT_STR, 10);
if (isNaN(SMTP_PORT)) {
    const errorMessage = `❌ CRITICAL ERROR: SMTP_PORT is not a valid number: ${SMTP_PORT_STR}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
}

const IS_SECURE_PORT: boolean = SMTP_PORT === 465;
const IS_STARTTLS_PORT: boolean = SMTP_PORT === 587 || SMTP_PORT === 2525;


// Логирование...

// ==========================================================
// !!! СОЗДАНИЕ ТРАНСПОРТЕРА NODEMAILER !!!
// ==========================================================

// Явно указываем, что это SMTP-конфигурация
const transporterOptions: SMTPTransport.Options = { // <--- ИЗМЕНЕНО!
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: IS_SECURE_PORT,
    requireTLS: IS_STARTTLS_PORT,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    },
    connectionTimeout: 15000 
};

// Теперь передаем эти явно типизированные опции в createTransport
const transporter: Transporter<SentMessageInfo> = nodemailer.createTransport(transporterOptions); // <-- ИЗМЕНЕНО!

// Добавляем обработчик ошибок для самого transporter'а.
// Это ловит ошибки, которые могут произойти после создания transporter, но до sendMail.
transporter.on('error', (err: Error) => { // Указываем тип Error для параметра err
    console.error('❌ Nodemailer Transporter Runtime Error:', err);
});


// ==========================================================
// !!! ФУНКЦИЯ ДЛЯ ОТПРАВКИ EMAIL !!!
// ==========================================================

// Интерфейс для опций email
interface EmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string; // plain text версия письма - хорошая практика
}

/**
 * Отправляет email.
 * @param options - Объект с данными для письма (to, subject, html, text).
 */
export const sendEmail = async (options: EmailOptions): Promise<SentMessageInfo> => {
    // ВРЕМЕННО: Логируем опции письма перед отправкой для дебага
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
        console.log('--- Attempting to send email ---');
        console.log(`From: ${EMAIL_FROM_ADDRESS}`); // Логируем From адрес
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log('---------------------------------');
    }

    const mailOptions = {
        from: EMAIL_FROM_ADDRESS, // Теперь берется из новой, обязательной переменной
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
    };

    try {
        let info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent: %s', info.messageId);
        // ВРЕМЕННО: Выводим всю информацию об отправке для более глубокого дебага
        if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') {
             console.log('Nodemailer raw response (info):', info);
        }
        return info;
    } catch (error: unknown) { // Используем 'unknown' (как требуют современные правила TS)
        console.error('❌ Error sending email via Nodemailer:', error);
        
        // Корректная обработка ошибки типа 'unknown' для извлечения сообщения
        let errorMessage = 'Unknown error during email send.';
        if (error instanceof Error) {
            errorMessage = error.message;
        } else if (typeof error === 'string') {
            errorMessage = error;
        }
        
        // Перебрасываем ошибку дальше, чтобы вызвавшая функция могла ее обработать.
        throw new Error(`Failed to send email: ${errorMessage}`);
    }
};

// ==========================================================
// !!! ЭКСПОРТЫ ДЛЯ СБРОСА ПАРОЛЯ И ПРОЧИХ НУЖД !!!
// ==========================================================

/**
 * Отправляет письмо для сброса пароля с динамической ссылкой.
 * @param to - Email получателя.
 * @param resetToken - Токен для сброса пароля.
 */
export const sendPasswordResetEmail = async (to: string, resetToken: string): Promise<SentMessageInfo> => {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`; // Ссылка на твой фронтенд

    const subject = 'Password Reset Request for My Admin Panel';
    const htmlContent = `
        <p>Hello,</p>
        <p>You have requested a password reset for your account on My Admin Panel.</p>
        <p>Please click on the following link to reset your password:</p>
        <p><a href="${resetLink}">Reset your password here</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
        <br>
        <p>Regards,</p>
        <p>My Admin Panel Team</p>
    `;
    const textContent = `Hello,\nYou have requested a password reset for your account on My Admin Panel.\nPlease visit the following link to reset your password: ${resetLink}\nThis link will expire in 1 hour.\nIf you did not request a password reset, please ignore this email.\nRegards,\nMy Admin Panel Team`;

    return await sendEmail({
        to: to,
        subject: subject,
        html: htmlContent,
        text: textContent,
    });
};

// Также экспортируем FRONTEND_URL, если он нужен для формирования ссылок вне этого файла
export { FRONTEND_URL };