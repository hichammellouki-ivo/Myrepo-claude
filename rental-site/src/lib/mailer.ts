import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

type SendMailArgs = {
  bookingId: string;
  to: string;
  subject: string;
  body: string;
};

let cachedTransporter: import("nodemailer").Transporter | null | undefined;

function getTransporter() {
  if (cachedTransporter !== undefined) return cachedTransporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT) {
    cachedTransporter = null;
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER && SMTP_PASS ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  return cachedTransporter;
}

/**
 * Envoie un e-mail si un serveur SMTP est configuré (variables SMTP_*).
 * Sinon, simule l'envoi en journalisant le message (visible dans l'admin) —
 * utile en développement / tant qu'aucun fournisseur d'e-mail n'est branché.
 */
export async function sendMail({ bookingId, to, subject, body }: SendMailArgs) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[mailer] SMTP non configuré — message simulé pour ${to}: ${subject}`);
    await prisma.outgoingMessage.create({
      data: { bookingId, toEmail: to, subject, body, status: "SIMULATED" },
    });
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@location-courte-duree.local",
      to,
      subject,
      text: body,
    });
    await prisma.outgoingMessage.create({
      data: { bookingId, toEmail: to, subject, body, status: "SENT" },
    });
  } catch (error) {
    console.error("[mailer] Échec de l'envoi de l'e-mail", error);
    await prisma.outgoingMessage.create({
      data: { bookingId, toEmail: to, subject, body, status: "FAILED" },
    });
  }
}
