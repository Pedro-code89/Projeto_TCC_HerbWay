const nodemailer = require('nodemailer');

function configurado() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function transporte() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: String(process.env.SMTP_PORT) === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
}

async function enviar({ para, assunto, html, texto }) {
  if (!configurado()) {
    console.warn('[E-mail] SMTP não configurado (.env). E-mail para %s não enviado.', para);
    throw new Error('Serviço de e-mail não configurado no servidor.');
  }
  try {
    await transporte().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: para,
      subject: assunto,
      html,
      text: texto
    });
  } catch (erro) {
    console.error('[E-mail] Falha ao enviar para %s: %s', para, erro.message);
    throw new Error('Não foi possível enviar o e-mail. Tente novamente mais tarde.');
  }
  return { simulado: false };
}

module.exports = { enviar, configurado };
