// dotenv не нужен на Render, и его лучше не использовать в продакшн-коде,
// если переменные уже предоставлены средой (например, Docker/Render).
// Если ты используешь его локально, убедись, что он не конфликтует.
// Удалим его, если он мешает на проде.
// import dotenv from 'dotenv';
// dotenv.config();

// ==========================================================
// !!! ПРОВЕРКА И ПАРСИНГ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ !!!
// ==========================================================

const getEnvVar = (name: string, isOptional: boolean = false): string => {
    const value = process.env[name];
    if (!isOptional && !value) {
        // На Render это должно привести к ошибке при запуске, если переменной нет
        const errorMessage = `❌ CRITICAL ERROR: Environment variable ${name} is missing!`;
        console.error(errorMessage);
        if (process.env.NODE_ENV === 'production') {
            throw new Error(errorMessage);
        }
        // В dev-режиме, если нет, вернем заглушку, но это приведет к ошибке Nodemailer
        return ''; 
    }
    return value || '';
};

const SMTP_HOST = getEnvVar('SMTP_HOST');
const SMTP_PORT_STR = getEnvVar('SMTP_PORT');
const SMTP_USER = getEnvVar('SMTP_USER');
const SMTP_PASSWORD = getEnvVar('SMTP_PASSWORD');
const FRONTEND_URL = getEnvVar('FRONTEND_URL');
const EMAIL_FROM_ADDRESS = getEnvVar('EMAIL_FROM', true) || '"My Admin Panel" <no-reply@yourdomain.com>'; // С дефолтным значением

const SMTP_PORT = SMTP_PORT_STR ? parseInt(SMTP_PORT_STR, 10) : undefined;
const IS_SECURE_PORT = SMTP_PORT === 465; // Если порт 465, то secure: true
const nodemailer = require('nodemailer');

// ==========================================================
// !!! СОЗДАНИЕ ТРАНСПОРТЕРА NODEMAILER !!!
// ==========================================================

// Этот объект транспорта создается только если все необходимые переменные есть
const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: IS_SECURE_PORT, // true для 465 порта (SSL), false для других (TLS)
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASSWORD,
  },
  // !!! РЕКОМЕНДУЕТСЯ для Gmail в облаке, чтобы обойти проблемы с SSL-сертификатами
  // Но может снизить безопасность, используй с осторожностью!
  tls: {
    rejectUnauthorized: false
  }
});


/**
 * Отправляет email со ссылкой для сброса пароля.
 * @param to - Email получателя.
 * @param token - Токен для сброса пароля.
 */
export const sendPasswordResetEmail = async (to: string, token: string) => {
    // Внутренняя проверка, если вдруг transporter не создался из-за отсутствия ENV
    if (!transporter || Object.values(transporter.options).some(val => !val)) {
        console.error("Skipping email send: Nodemailer transporter is not fully configured due to missing environment variables.");
        throw new Error("Email service not configured correctly."); // Выбросить ошибку, т.к. почта критична
    }

    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`; // Корректная HTTP-ссылка!

    try {
        console.log(`Sending email to ${to} with reset link: ${resetLink}`); // DEBUG-лог
        await transporter.sendMail({
            from: EMAIL_FROM_ADDRESS, // Используем переменную, или дефолт
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
            `, // <<<--- ЭТОТ БЭКТИК ЗАКРЫВАЕТ HTML !!!
            text: `Hello,\nYou have requested a password reset for your account on My Admin Panel.\nPlease visit the following link to reset your password: ${resetLink}\nThis link will expire in 1 hour.\nIf you did not request a password reset, please ignore this email.\nRegards,\nMy Admin Panel Team.`,
        });
        console.log(`✅ Email sent to ${to} with reset link.`);
    } catch (error: any) { // Явно указываем тип 'any' для ошибок
        console.error(`❌ Error sending password reset email to ${to}:`, error);
        throw new Error(`Failed to send email: ${error.message || 'unknown error'}`);
    }
};