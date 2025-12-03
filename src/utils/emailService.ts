// src/utils/emailService.ts

// [ОЧЕНЬ ВАЖНО] dotenv НУЖЕН ТОЛЬКО ДЛЯ ЛОКАЛЬНОЙ РАЗРАБОТКИ
// НА RENDER (или других облачных платформах) ПЕРЕМЕННЫЕ ОКРУЖЕНИЯ
// ПРЕДОСТАВЛЯЮТСЯ СРЕДОЙ АВТОМАТИЧЕСКИ.
import nodemailer, { Transporter, SentMessageInfo } from 'nodemailer'; // Импортируем nodemailer и его типы
import type SMTPTransport from 'nodemailer/lib/smtp-transport'; // <--- ДОБАВЛЕНО! ИСПОЛЬЗУЕМ type ДЛЯ ЧИСТОТЫ

import dotenv from 'dotenv';
dotenv.config();

// ==========================================================
// !!! ПРОВЕРКА И ПАРСИНГ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ !!!
// ==========================================================

// Строгая функция для получения ОБЯЗАТЕЛЬНЫХ переменных окружения.
// Если переменная отсутствует, приложение КРИТИЧЕСКИ падает при старте,
// предотвращая дальнейшие ошибки с некорректной конфигурацией.
const getRequiredEnvVar = (name: string): string => {
    const value = process.env[name];
    if (!value) {
        const errorMessage = `❌ CRITICAL ERROR: Environment variable ${name} is missing!`; // <-- ИСПРАВЛЕНЫ КАВЫЧКИ
        console.error(errorMessage);
        throw new Error(errorMessage);
        }
    return value;
};

// Получаем все необходимые переменные окружения.
// Если какая-то из них отсутствует, getRequiredEnvVar выбросит ошибку,
// и приложение не запустится (или Render покажет ошибку билда/деплоя).
const SMTP_HOST: string = getRequiredEnvVar('SMTP_HOST');
const SMTP_PORT_STR: string = getRequiredEnvVar('SMTP_PORT');
const SMTP_USER: string = getRequiredEnvVar('SMTP_USER');
const SMTP_PASSWORD: string = getRequiredEnvVar('SMTP_PASSWORD');
const FRONTEND_URL: string = getRequiredEnvVar('FRONTEND_URL');
const EMAIL_FROM_ADDRESS: string = getRequiredEnvVar('EMAIL_FROM_ADDRESS'); // Теперь обязательная переменная!

// Парсинг порта и определение типа безопасности для Nodemailer
const SMTP_PORT: number = parseInt(SMTP_PORT_STR, 10);
// Если порт не число, это будет NaN. Проверяем и явно выбрасываем ошибку.
if (isNaN(SMTP_PORT)) {
    const errorMessage = `❌ CRITICAL ERROR: SMTP_PORT is not a valid number: ${SMTP_PORT_STR}`; // <-- ИСПРАВЛЕНЫ КАВЫЧКИ
    console.error(errorMessage);
    throw new Error(errorMessage);
}

const IS_SECURE_PORT: boolean = SMTP_PORT === 465;
const IS_STARTTLS_PORT: boolean = SMTP_PORT === 587 || SMTP_PORT === 2525; // <-- ИСПРАВЛЕН ОПЕРАТОР ||


// ==========================================================
// !!! ЛОГИРОВАНИЕ ПЕРЕМЕННЫХ ОКРУЖЕНИЯ (для дебага) !!!
// ==========================================================

// ВРЕМЕННО: Логирование переменных окружения (для дебага на Render и локально)
// В продакшене пароль НЕ ДОЛЖЕН ЛОГИРОВАТЬСЯ ПОЛНОСТЬЮ!
if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') { // <-- ИСПРАВЛЕН ОПЕРАТОР ||
    console.log('--- Nodemailer Environment Variables (Debug) ---');
    console.log(`SMTP_HOST: ${SMTP_HOST}`);
    console.log(`SMTP_PORT: ${SMTP_PORT}`);
    console.log(`SMTP_USER: ${SMTP_USER}`);
    console.log(`SMTP_PASSWORD (present): ${!!SMTP_PASSWORD}`);
    console.log(`FRONTEND_URL: ${FRONTEND_URL}`);
    console.log(`EMAIL_FROM_ADDRESS: ${EMAIL_FROM_ADDRESS}`); // Логируем, чтобы видеть, что там
    console.log(`IS_SECURE_PORT (port 465): ${IS_SECURE_PORT}`);
    console.log(`IS_STARTTLS_PORT (port 587/2525): ${IS_STARTTLS_PORT}`);
    console.log('------------------------------------');
}


// ==========================================================
// !!! СОЗДАНИЕ ТРАНСПОРТЕРА NODEMAILER !!!
// ==========================================================

// Явно указываем, что это SMTP-конфигурация
const transporterOptions: SMTPTransport.Options = {
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: IS_SECURE_PORT, // true для 465 (SMTPS), false для других (STARTTLS или без шифрования)
    requireTLS: IS_STARTTLS_PORT, // true для портов 587/2525 (STARTTLS)
    
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
    },
    // !!! ВРЕМЕННЫЙ FIX для проблем с SSL на Render (если они есть),
    //     НО ИСПОЛЬЗУЙТЕ С ОСТОРОЖНОСТЬЮ В ПРОДАКШЕНЕ, ТАК КАК СНИЖАЕТ БЕЗОПАСНОСТЬ!
    //     Если с этим заработает, значит, проблема в сертификатах.
    //     После дебага, ПОПРОБУЙТЕ УБРАТЬ rejectUnauthorized: false!
    tls: {
      rejectUnauthorized: false
    },
    // Дополнительный таймаут на случай подвисаний (по умолчанию Nodemailer 10 секунд)
    connectionTimeout: 15000 // 15 секунд
};

// Теперь передаем эти явно типизированные опции в createTransport
const transporter: Transporter<SentMessageInfo> = nodemailer.createTransport(transporterOptions);

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
    if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') { // <-- ИСПРАВЛЕН ОПЕРАТОР ||
        console.log(`--- Attempting to send email ---`); // <-- ИСПРАВЛЕНЫ КАВЫЧКИ
        console.log(`From: ${EMAIL_FROM_ADDRESS}`); // <-- ИСПРАВЛЕНЫ КАВЫЧКИ
        console.log(`To: ${options.to}`); // <-- ИСПРАВЛЕНЫ КАВЫЧКИ
        console.log(`Subject: ${options.subject}`); // <-- ИСПРАВЛЕНЫ КАВЫЧКИ
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
        if (process.env.NODE_ENV !== 'production' || process.env.LOG_LEVEL === 'debug') { // <-- ИСПРАВЛЕН ОПЕРАТОР ||
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
    console.log(`DEBUG: [emailService.ts] Calling sendEmail for password reset to: ${to}`); // <-- ДОБАВЛЕНО ЛОГИРОВАНИЕ
    // Здесь мы можем добавить дополнительную логику для формирования письма,
    // но саму отправку делегируем sendEmail
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