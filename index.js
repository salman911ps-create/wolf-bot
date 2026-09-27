const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const imaps = require('imap-simple');

const BOT_TOKEN = '8925657719:AAF58zGxPyoDYH10xRR-ucVrvLuI4RoJeoI';
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();
app.use(express.json());

const ordersDatabase = {};

app.post('/webhook-orders', (req, res) => {
  const { order_id, account_email } = req.body;

  if (order_id && account_email) {
    ordersDatabase[order_id.toString().trim()] = {
      email: account_email.trim(),
      isUsed: false,
      usedAt: null
    };
    console.log(`[+] تم تسجيل الطلب #${order_id} للإيميل: ${account_email}`);
  }
  res.status(200).send('OK');
});

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text ? msg.text.trim() : '';

  if (text === '/start') {
    const warningMessage = 
`⚠️ *تنبيه هام جداً قبل البدء:*

• كود الدخول يُطلب **مرة واحدة فقط** لكل رقم طلب.
• بعد إرسال رقم الطلب واستلام الكود، **لن تتمكن من استخدام نفس رقم الطلب مجدداً**.
• يرجى التأكد من أنك في **صفحة إدخال الكود داخل تطبيق/موقع نتفلكس** وجاهز تماماً قبل إرسال الرقم.

📥 *أدخل رقم الطلب الخاص بك الآن:*`;

    return bot.sendMessage(chatId, warningMessage, { parse_mode: 'Markdown' });
  }

  const orderId = text;
  const order = ordersDatabase[orderId];

  if (!order) {
    return bot.sendMessage(chatId, '❌ *رقم الطلب غير صحيح أو لم يتم تسجيله بعد.*\nيرجى التأكد من كتابة رقم الطلب كما هو في الفاتورة.', { parse_mode: 'Markdown' });
  }

  if (order.isUsed) {
    return bot.sendMessage(chatId, `❌ *عذراً، رقم الطلب #${orderId} تم استخدامه واستلام الكود الخاص به سابقاً!*\nلا يمكن استخدام رقم الطلب أكثر من مرة واحدة.`, { parse_mode: 'Markdown' });
  }

  const loadingMsg = await bot.sendMessage(chatId, '🔄 جاري التحقق وجلب كود نتفلكس الخاص بك...');

  try {
    const code = await fetchNetflixCode(order.email);

    if (code) {
      order.isUsed = true;
      order.usedAt = new Date();

      const successMessage = 
`✅ *تم التحقق من طلبك بنجاح!*

📧 *الحساب:* \`${order.email}\`
🔑 *كود الدخول:* \`${code}\`

🔴 *ملاحظة:* تم إغلاق الطلب #${orderId} ولن يمكنك طلب كود آخر بنفس هذا الرقم.`;

      bot.deleteMessage(chatId, loadingMsg.message_id);
      bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
    } else {
      bot.deleteMessage(chatId, loadingMsg.message_id);
      bot.sendMessage(chatId, '⚠️ لم نتمكن من العثور على كود واصل حديثاً لهذا الحساب. تأكد أنك ضغطت "إرسال الكود" في نتفلكس ثم أعد المحاولة.');
    }
  } catch (error) {
    console.error(error);
    bot.deleteMessage(chatId, loadingMsg.message_id);
    bot.sendMessage(chatId, '❌ حدث خطأ أثناء جلب الكود. يرجى التواصل مع الدعم الفني.');
  }
});

async function fetchNetflixCode(email) {
  const config = {
    imap: {
      user: email,
      password: 'PASSWORD_HERE',
      host: 'mail.yourdomain.com',
      port: 993,
      tls: true,
      authTimeout: 3000
    }
  };

  try {
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');

    const searchCriteria = ['UNSEEN', ['FROM', 'info@account.netflix.com']];
    const fetchOptions = { bodies: ['HEADER', 'TEXT'], struct: true };

    const messages = await connection.search(searchCriteria, fetchOptions);
    connection.end();

    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      const body = lastMessage.parts.find(part => part.which === 'TEXT').body;
      const codeMatch = body.match(/\b\d{4,6}\b/);
      return codeMatch ? codeMatch[0] : null;
    }
    return null;
  } catch (err) {
    console.error('IMAP Error:', err);
    return null;
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
