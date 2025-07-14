const express = require('express');
const { Bot } = require('grammy');
const { createProxyMiddleware } = require('http-proxy-middleware');

";
const bot = new Bot(TOKEN);
const app = express();

// Middleware
app.use(express.json());

// Прокси для файлов Telegram
app.use(
  '/bot-api',
  createProxyMiddleware({
    target: 'https://api.telegram.org/file/bot' + TOKEN,
    changeOrigin: true,
  })
);

// API для получения аватарки
app.get('/api/avatar/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { total_count, photos } = await bot.api.getUserProfilePhotos(parseInt(id));
    
    if (!total_count) return res.json({ src: '' });

    const file_id = photos[0].slice(-1)[0].file_id;
    const file = await bot.api.getFile(file_id);
    res.json({ src: `${req.protocol}://${req.get('host')}/bot-api/${file.file_path}` });
  } catch (error) {
    console.error('Error getting avatar:', error);
    res.status(500).json({ error: 'Failed to get avatar' });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Telegram Avatar Viewer</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; text-align: center; }
        .search-box { display: flex; margin: 20px 0; }
        input { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px 0 0 4px; }
        button { padding: 10px 15px; background: #0088cc; color: white; border: none; border-radius: 0 4px 4px 0; cursor: pointer; }
        #avatar { max-width: 200px; max-height: 200px; border-radius: 50%; margin: 20px auto; display: block; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Telegram Avatar Viewer</h1>
        <div class="search-box">
          <input type="number" id="userId" placeholder="Enter Telegram User ID">
          <button id="getAvatar">Get Avatar</button>
        </div>
        <img id="avatar" src="" style="display: none;">
      </div>
      <script>
        document.getElementById('getAvatar').addEventListener('click', async () => {
          const userId = document.getElementById('userId').value;
          if (!userId) return;
          
          try {
            const response = await fetch('/api/avatar/' + userId);
            const data = await response.json();
            const avatar = document.getElementById('avatar');
            
            if (data.src) {
              avatar.src = data.src;
              avatar.style.display = 'block';
            } else {
              avatar.style.display = 'none';
              alert('No avatar found');
            }
          } catch (error) {
            console.error(error);
            alert('Error fetching avatar');
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Mini App для Telegram
app.get('/mini-app', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>My Telegram Avatar</title>
      <script src="https://telegram.org/js/telegram-web-app.js"></script>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        h1 { color: #333; }
        #avatar { max-width: 200px; max-height: 200px; border-radius: 50%; margin: 20px auto; }
        button { padding: 10px 15px; background: #0088cc; color: white; border: none; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>My Telegram Avatar</h1>
        <img id="avatar" src="">
        <button id="shareBtn">Share Avatar</button>
      </div>
      <script>
        const tg = window.Telegram.WebApp;
        tg.expand();
        
        // Получаем аватар текущего пользователя
        if (tg.initDataUnsafe?.user?.id) {
          fetch('/api/avatar/' + tg.initDataUnsafe.user.id)
            .then(r => r.json())
            .then(data => {
              if (data.src) document.getElementById('avatar').src = data.src;
            });
        }
        
        // Кнопка поделиться
        document.getElementById('shareBtn').addEventListener('click', () => {
          const avatar = document.getElementById('avatar').src;
          if (avatar) tg.share({ url: avatar });
        });
      </script>
    </body>
    </html>
  `);
});

// Запуск сервера
app.listen(3000, () => console.log('Server running on http://localhost:3000'));
