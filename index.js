const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const TOKEN = '8902754011:AAHvlMwOkEAT0LfLCcfspBY64jdPkDD9YzE';
const CHAT_ID = '8002524743';

const bot = new TelegramBot(TOKEN, { polling: true });
const entregas = [];

bot.onText(/\/nueva (.+)/, (msg, match) => {
  const partes = match[1].split('|');
  if (partes.length < 3) {
    bot.sendMessage(CHAT_ID, 'Formato: /nueva Nombre del trabajo|DD/MM/YYYY|HH:MM');
    return;
  }
  const [nombre, fecha, hora] = partes.map(p => p.trim());
  entregas.push({ nombre, fecha, hora });
  bot.sendMessage(CHAT_ID, `✅ Guardado: ${nombre} — ${fecha} a las ${hora}`);
});

bot.onText(/\/lista/, () => {
  if (entregas.length === 0) {
    bot.sendMessage(CHAT_ID, 'No tienes entregas registradas.');
    return;
  }
  const lista = entregas.map((e, i) => `${i + 1}. ${e.nombre} — ${e.fecha} a las ${e.hora}`).join('\n');
  bot.sendMessage(CHAT_ID, `📋 Tus entregas:\n${lista}`);
});

bot.onText(/\/eliminar (\d+)/, (msg, match) => {
  const num = parseInt(match[1]) - 1;
  if (num < 0 || num >= entregas.length) {
    bot.sendMessage(CHAT_ID, 'Número inválido. Usa /lista para ver los números.');
    return;
  }
  const eliminada = entregas.splice(num, 1)[0];
  bot.sendMessage(CHAT_ID, `🗑️ Eliminada: ${eliminada.nombre}`);
});

cron.schedule('* * * * *', () => {
  const ahora = new Date();
  entregas.forEach(e => {
    const [dia, mes, anio] = e.fecha.split('/').map(Number);
    const [hh, mm] = e.hora.split(':').map(Number);
    const entrega = new Date(anio, mes - 1, dia, hh, mm);
    const diff = (entrega - ahora) / 60000;
    if (diff > 119 && diff < 121) {
      bot.sendMessage(CHAT_ID, `⚠️ RECORDATORIO: "${e.nombre}" vence en 2 horas (${e.hora})`);
    }
    if (diff > 29 && diff < 31) {
      bot.sendMessage(CHAT_ID, `🚨 URGENTE: "${e.nombre}" vence en 30 minutos (${e.hora})`);
    }
  });
});

bot.sendMessage(CHAT_ID, '🤖 Bot de entregas activo. Usa /nueva, /lista o /eliminar.');
console.log('Bot corriendo...');