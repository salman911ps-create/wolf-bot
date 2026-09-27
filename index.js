const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// بيانات بوت تليجرام
const TELEGRAM_TOKEN = '8925657719:AAF58zGxPyoDYH10xRR-ucVrvLuI4RoJeoI';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: { interval: 3000 } });

// قراءة توكن ديسكورد من متغيرات البيئة بآمان
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = '1225981886493360240';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.on('ready', () => {
  console.log(`[Discord] Connected successfully as Bot: ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  // طباعة أي رسالة تصل للتأكد من الاستقبال ورصد الروم
  console.log(`[Message Received] Channel ID: ${message.channel.id} | Content: ${message.content}`);

  if (message.channel.id !== CHANNEL_ID) return;

  let contentText = message.content || '';

  if (message.embeds && message.embeds.length > 0) {
    message.embeds.forEach((embed) => {
      contentText += ' ' + (embed.title || '') + ' ' + (embed.description || '');
      if (embed.fields) {
        embed.fields.forEach((f) => {
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
});

if (DISCORD_BOT_TOKEN) {
  client.login(DISCORD_BOT_TOKEN).catch((err) => {
    console.error('[Discord Error]', err.message);
  });
} else {
  console.error('[Discord Error] DISCORD_BOT_TOKEN is missing in Environment Variables!');
}

app.get('/', (req, res) => {
  res.send('Wolf Bot Service is Live!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
