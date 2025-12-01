import axios from 'axios';

    //const API_BASE_URL = import.meta.env.VITE_BASE_API_URL;
const API_BASE_URL = process.env.API_BASE_URL
    // После наших мучений, эта проверка стала очень важной!
    if (!API_BASE_URL) {
      console.error("❌ Ошибка: Переменная окружения VITE_BASE_API_URL не определена. Проверьте .env файл и перезапустите сервер Vite.");
      throw new Error("API base URL is not defined.");
    }

    const apiClient = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      // Здесь можно добавить интерцепторы для токенов аутентификации если потребуется
    });

    export default apiClient;