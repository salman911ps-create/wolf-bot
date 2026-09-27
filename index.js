const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const WebSocket = require('ws');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// بيانات بوت تليجرام
const TELEGRAM_TOKEN = '8925657719:AAF58zGxPyoDYH10xRR-ucVrvLuI4RoJeoI';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });

// بيانات ديسكورد
const USER_TOKEN = 'NjE5ODkzMzc2NDUxNjA4NjIy.GzenQU.CRfhSZNP3KmSB4-NVCPjYsxz_ZYgsSACiFosSo';
const CHANNEL_ID = '1225981886493360240';

function connectDiscord() {
  const ws = new WebSocket('wss://gateway.discord.gg/?v=9&encoding=json');

  ws.on('open', () => {
    console.log('[Discord] Connecting to Gateway...');
  });

  ws.on('message', (data) => {
    const payload = JSON.parse(data);
    const { op, t, d } = payload;

    if (op === 10) {
      const heartbeatInterval = d.heartbeat_interval;
      setInterval(() => {
        ws.send(JSON.stringify({ op: 1, d: null }));
      }, heartbeatInterval);

      ws.send(JSON.stringify({
        op: 2,
        d: {
          token: USER_TOKEN,
          capabilities: 509,
          properties: {
            $os: 'linux',
            $browser: 'chrome',$device: 'desktop'
          }
        }
      }));
    }

    if (t === 'READY') {
      console.log(`[Discord] Connected successfully as ${d.user.username}`);
    }

    if (t === 'MESSAGE_CREATE') {
      if (d.channel_id !== CHANNEL_ID) return;

      let contentText = d.content || '';

      if (d.embeds && d.embeds.length > 0) {
        d.embeds.forEach(embed => {
          contentText += ' ' + (embed.title || '') + ' ' + (embed.description || '');
          if (embed.fields) {
            embed.fields.forEach(f => {
              contentText += ` ${f.name} ${f.value}`;
            });
          }
        });
      }

      if (contentText.includes('أشتراك نيتفلكس') || contentText.includes('اشتراك نيتفلكس')) {
        console.log('[Match Found] Netflix order detected!');
        
        const orderMatch = contentText.match(/#(\d+)/) || contentText.match(/رقم الطلب\s*:?\s*(\d+)/);
        const orderId = orderMatch ? orderMatch[1] : 'Unknown';

        console.log(`[Discord] Processing Order ID: ${orderId}`);
      }
    }
  });

  ws.on('close', () => {
    console.log('[Discord] Connection closed. Reconnecting in 5s...');
    setTimeout(connectDiscord, 5000);
  });

  ws.on('error', (err) => {
    console.error('[Discord Error]', err.message);
  });
}

connectDiscord();

app.get('/', (req, res) => {
  res.send('Wolf Bot Service is Live!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
