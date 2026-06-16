const nodemailer = require('nodemailer');

let transporter;

const isEmailEnabled = () => String(process.env.EMAIL_ENABLED || 'true').toLowerCase() === 'true';

const getTransporter = () => {
  if (transporter) return transporter;

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = (process.env.GMAIL_APP_PASSWORD || '').replace(/\s+/g, '');

  if (!gmailUser || !gmailPass) {
    throw new Error('Configuration Gmail manquante : GMAIL_USER / GMAIL_APP_PASSWORD');
  }

  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: gmailUser, pass: gmailPass }
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
    subject: 'Bienvenue sur Rigoula !',
    text: `Bonjour ${fullName}, bienvenue sur Rigoula ! Votre compte a été créé avec succès. Connectez-vous maintenant et commencez à explorer nos produits.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">Bienvenue sur Rigoula !</h2>
        <p style="font-size: 16px; color: #333;">Bonjour <strong>${fullName}</strong>,</p>
        <p style="font-size: 16px; color: #333;">Votre inscription a été confirmée avec succès !</p>
        <p style="font-size: 16px; color: #333;">Vous pouvez maintenant vous connecter à votre compte et découvrir tous nos produits et services.</p>
        <p style="font-size: 14px; color: #666;">Merci de votre confiance !</p>
      </div>
    `
  });
};

const sendOrderStatusEmail = async ({ email, orderId, statut }) => {
  return sendEmail({
    to: email,
    subject: `Statut de votre commande #${orderId}`,
    text: `Le statut de votre commande #${orderId} a été mis à jour : ${statut}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #000;">Mise à jour de votre commande</h2>
        <p style="font-size: 16px; color: #333;">Bonjour,</p>
        <p style="font-size: 16px; color: #333;">Le statut de votre commande a changé !</p>
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #666;">Commande #${orderId}</p>
          <p style="margin: 10px 0; font-size: 20px; color: #000; font-weight: bold;">${statut}</p>
        </div>
        <p style="font-size: 14px; color: #333;">Vous pouvez consulter les détails de votre commande à tout moment dans votre compte.</p>
        <p style="font-size: 14px; color: #666;">Merci d'avoir choisi Rigoula !</p>
      </div>
    `
  });
};

module.exports = {
  sendWelcomeEmail,
  sendOrderStatusEmail
};
