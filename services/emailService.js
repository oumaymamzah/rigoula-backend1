const nodemailer = require('nodemailer');

let transporter;

const isEmailEnabled = () => String(process.env.EMAIL_ENABLED || 'false').toLowerCase() === 'true';

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER;
  const pass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

  if (!user || !pass) {
    throw new Error('Configuration Gmail manquante: GMAIL_USER / GMAIL_APP_PASSWORD');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  if (!isEmailEnabled()) {
    return { skipped: true, reason: 'EMAIL_ENABLED=false' };
  }

  const from = process.env.EMAIL_FROM || process.env.GMAIL_USER;
  if (!from) {
    throw new Error('EMAIL_FROM ou GMAIL_USER requis');
  }

  const mailer = getTransporter();
  await mailer.sendMail({
    from,
    to,
    subject,
    text,
    html
  });

  return { sent: true };
};

const sendWelcomeEmail = async ({ email, nom, prenom }) => {
  const fullName = [prenom, nom].filter(Boolean).join(' ').trim() || 'Client';
  return sendEmail({
    to: email,
    subject: 'Confirmation d\'inscription - Rigoula',
    text: `Bonjour ${fullName}, votre inscription a bien ete confirmée. Vous pouvez maintenant vous connecter a votre compte Rigoula.`,
    html: `<p>Bonjour <strong>${fullName}</strong>,</p><p>Votre inscription sur <strong>Rigoula</strong> a bien été <strong>confirmée</strong>.</p><p>Vous pouvez maintenant vous connecter a votre compte.</p><p>Merci de votre confiance.</p>`
  });
};

const sendOrderStatusEmail = async ({ email, orderId, statut }) => {
  return sendEmail({
    to: email,
    subject: `Mise a jour commande #${orderId}`,
    text: `Le statut de votre commande #${orderId} est maintenant: ${statut}.`,
    html: `<p>Le statut de votre commande <strong>#${orderId}</strong> a été mis à jour.</p><p>Nouveau statut: <strong>${statut}</strong></p>`
  });
};

module.exports = {
  sendWelcomeEmail,
  sendOrderStatusEmail
};
