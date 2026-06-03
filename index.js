const TelegramBot = require('node-telegram-bot-api');
const cron = require('node-cron');

const TOKEN = '8902754011:AAHvlMwOkEAT0LfLCcfspBY64jdPkDD9YzE';
const CHAT_ID = '8002524743';

const bot = new TelegramBot(TOKEN, { polling: true });
const entregas = [];
const estados = {};

bot.onText(/\/nueva/, (msg) => {
  estados[CHAT_ID] = { paso: 1 };
  bot.sendMessage(CHAT_ID, '¿Cuál es el nombre del trabajo o entrega?');
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

bot.on('message', (msg) => {
  const texto = msg.text.trim();
  if (texto.startsWith('/')) return;
  const estado = estados[CHAT_ID];
  if (!estado) return;

  if (estado.paso === 1) {
    estado.nombre = texto;
    estado.paso = 2;
    bot.sendMessage(CHAT_ID, '¿Cuál es la fecha de entrega? (DD/MM/YY)');
  } else if (estado.paso === 2) {
    const partes = texto.split('/');
    if (partes.length !== 3 || partes[0].length !== 2 || partes[1].length !== 2 || partes[2].length !== 2) {
      bot.sendMessage(CHAT_ID, 'Formato inválido. Escríbela así: DD/MM/YY — por ejemplo 15/06/26');
      return;
    }
    estado.fecha = `${partes[0]}/${partes[1]}/20${partes[2]}`;
    estado.paso = 3;
    bot.sendMessage(CHAT_ID, '¿A qué hora vence? (HH:MM)');
  } else if (estado.paso === 3) {
    if (!/^\d{2}:\d{2}$/.test(texto)) {
      bot.sendMessage(CHAT_ID, 'Formato inválido. Escríbela así: HH:MM — por ejemplo 23:59');
      return;
    }
    estado.hora = texto;
    entregas.push({ nombre: estado.nombre, fecha: estado.fecha, hora: estado.hora });
    delete estados[CHAT_ID];
    bot.sendMessage(CHAT_ID, `✅ Guardado: ${estado.nombre} — ${estado.fecha} a las ${estado.hora}`);
  }
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