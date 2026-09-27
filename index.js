const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 10000;

// بيانات تليجرام
const TELEGRAM_TOKEN = '8925657719:AAF58zGxPyoDYH10xRR-ucVrvLuI4RoJeoI';
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: { interval: 3000 } });

// بيانات ديسكورد
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = '1225981886493360240';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// قاعدة بيانات مؤقتة للطلبات
const ordersDatabase = new Map();
const deliveredOrders = new Set();

client.on('ready', () => {
  console.log(`[Discord] Connected successfully as Bot: ${client.user.tag}`);
});

// استقبال رسائل ديسكورد وحفظ الطلبات وأكوادها تلقائياً
client.on('messageCreate', async (message) => {
  if (message.channel.id !== CHANNEL_ID) return;

  let fullText = message.content || '';

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

  // استخراج رقم الطلب
  const orderMatch = fullText.match(/#(\d+)/) || fullText.match(/رقم الطلب\s*:?\s*(\d+)/);
  if (orderMatch) {
    const orderId = orderMatch[1];
    
    // استخراج اسم العميل
    const customerMatch = fullText.match(/العميل\s*([^\nأ-ي]*[\u0600-\u06FF\s]+)/);
    const customerName = customerMatch ? customerMatch[1].trim() : 'عزيزنا العميل';
    
    let productType = 'اشتراك رقمي';
    if (fullText.includes('نيتفلكس') || fullText.includes('Netflix')) productType = 'اشتراك نيتفلكس (Netflix)';
    if (fullText.includes('دزني') || fullText.includes('Disney')) productType = 'اشتراك ديزني بلس (Disney+)';

    // كود الاشتراك التجريبي (يمكنك تعديله لاحقاً)
    const digitalCode = 'EMAIL: account@theeb.com | PASS: Theeb2026'; 

    ordersDatabase.set(orderId, {
      customerName,
      productType,
      digitalCode
    });

    console.log(`[Saved Order] ID: ${orderId} | Customer: ${customerName} | Product: ${productType}`);
  }
});

// تفاعل بوت تليجرام (نص صافي بدون أقواس مزعجة أو اشتراك إجباري)
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.trim() : '';

  // تجاهل أوامر البوت القديمة أو رسائل القناة إن وجدت
  if (text.startsWith('/start')) {
    bot.sendMessage(chatId, 
      `أهلاً بك في متجر الذيب للاشتراكات الرقمية!\n\n` +
      `الرجاء إرسال رقم طلبك فقط (مثال: 1161565) لاستلام تفاصيل اشتراكك.\n\n` +
      `تنبيه هام: كود الاشتراك يُرسل مرة واحدة فقط، لذا احفظه في مكان آمن ولاتشاركه مع أحد.`
    );
    return;
  }

  // إذا أدخل العميل رقم الطلب
  if (/^\d+$/.test(text)) {
    const orderId = text;

    if (deliveredOrders.has(orderId)) {
      bot.sendMessage(chatId, `عذراً، هذا الطلب (#${orderId}) تم تسليم كوده مسبقاً ولا يمكن إعادته حفاظاً على أمان حسابك.`);
      return;
    }

    const orderData = ordersDatabase.get(orderId);
    if (orderData) {
      deliveredOrders.add(orderId);

      bot.sendMessage(chatId, 
        `تم التحقق من طلبك بنجاح يا ${orderData.customerName}!\n\n` +
        `المنتج: ${orderData.productType}\n` +
        `بيانات حسابك / الكود:\n${orderData.digitalCode}\n\n` +
        `شكراً لثقتك بمتجر الذيب، نتمنى لك مشاهدة ممتعة!`
      );
      console.log(`[Telegram Delivered] Order #${orderId} sent to chat ${chatId}`);
    } else {
      bot.sendMessage(chatId, `عذراً، لم يتم العثور على طلب برقم #${orderId} في النظام، تأكد من الرقم أو انتظر حتى يكتمل الطلب في ديسكورد.`);
    }
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
  res.send('Wolf Bot System is Live!');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
