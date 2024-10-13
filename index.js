const bedrock = require('bedrock-protocol');
const fetch = require('node-fetch');

// Настройки подключения к Minecraft серверу и Telegram
const botToken = '7835938411:AAHKUOIqDibukHEodIX-bRrVUw7CakgdzEc';
const chatId = '-4500941462'; // ID твоего Telegram чата

// Подключение к серверу Minecraft
const client = bedrock.createClient({
  host: 'Its_adill_1.aternos.me',  // IP адрес сервера
  port: 24611,        // Порт сервера
  username: 'bot_by_d1xus', // Имя пользователя Minecraft
});

client.on('join', () => {
  console.log('Успешно подключен к серверу!');
});

client.on('text', (packet) => {
  const { message, source_name, type } = packet;
  
  // Фильтрация только нужных событий
  if (type === 'chat') {
    sendToTelegram(`💬 *${source_name}*: ${message}`);
  } else if (type === 'death') {
    sendToTelegram(`☠️ *${source_name} погиб(ла)*: ${message}`);
  }
});

// Функция для отправки сообщений в Telegram
function sendToTelegram(text) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

  const params = {
    chat_id: chatId,
    text: text,
    parse_mode: 'Markdown',
  };

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  .then(response => response.json())
  .then(data => {
    if (data.ok) {
      console.log('Сообщение успешно отправлено в Telegram');
    } else {
      console.error('Ошибка отправки в Telegram:', data.description);
    }
  })
  .catch(err => console.error('Ошибка:', err));
}
