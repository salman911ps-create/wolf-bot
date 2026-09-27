const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

const TELEGRAM_TOKEN = '8925657719:AAF58zGxPyoDYH10xRR-ucVrvLuI4RoJeoI';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: { interval: 3000 } });

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
  if (message.channel.id !== CHANNEL_ID) return;

  let fullText = message.content || '';

  // تجميع كافة النصوص والعناوين والحقول من داخل الـ Embeds الخاصة بالويب هوك
  if (message.embeds && message.embeds.length > 0) {
    message.embeds.forEach((embed) => {
      if (embed.title) fullText += ' ' + embed.title;
      if (embed.description) fullText += ' ' + embed.description;
      if (embed.fields) {
        embed.fields.forEach((field) => {
          fullText += ` ${field.name} ${field.value}`;
        });
      }
    });
  }

  console.log(`[Parsed Text]: ${fullText}`);

  // البحث عن منتج نيتفلكس بغض النظر عن طريقة كتابته
  if (fullText.includes('نيتفلكس') || fullText.includes('Netflix')) {
    console.log('[Match Found] Netflix order detected from Webhook!');

    // استخراج رقم الطلب (سواء كان #1023767 أو رقم مجرد)
    const orderMatch = fullText.match(/#(\d+)/) || fullText.match(/رقم الطلب\s*:?\s*(\d+)/);
    const orderId = orderMatch ? orderMatch[1] : 'Unknown';

    console.log(`[Discord] Processing Order ID: ${orderId}`);

    // هنا سيتم لاحقاً إرسال كود النيتفلكس عبر تليجرام تلقائياً
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
