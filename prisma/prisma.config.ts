
// Определяем URL подключения
// Если env('DATABASE_URL') не определен, используем заглушку или кидаем ошибку
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable not set');
}

const config = {
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
};

export default config;