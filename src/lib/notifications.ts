import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { generateId, mutateDb } from "@/lib/db";
import type {
  Appointment,
  Doctor,
  NotificationChannel,
  NotificationChannelConfig,
  NotificationEvent,
  NotificationLog,
  Service,
  WebsiteSettings
} from "@/types/hospital";
import {
  formatSessionLabel,
  formatTime12h,
  inferSessionFromAppointment
} from "@/lib/slots";

interface DispatchResult {
  channel: NotificationChannel;
  status: "sent" | "failed" | "simulated";
  providerMessageId?: string;
  errorMessage?: string;
}

function resolveEmailConfig(cfg: NotificationChannelConfig) {
  const user = cfg.smtpUser || process.env.SMTP_USER || "";
  const cfgSender =
    cfg.senderEmail && !cfg.senderEmail.endsWith(".example")
      ? cfg.senderEmail
      : "";
  return {
    host: cfg.smtpHost || process.env.SMTP_HOST || "",
    port: Number(cfg.smtpPort || process.env.SMTP_PORT || 587),
    user,
    pass: cfg.smtpPass || process.env.SMTP_PASS || "",
    senderName:
      cfg.senderName || process.env.SMTP_FROM_NAME || "BookMyDoc India",
    senderEmail:
      cfgSender ||
      process.env.SMTP_FROM_EMAIL ||
      user ||
      "info@bookmydocindia.com"
  };
}

export async function sendEmailNotification(params: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  config: NotificationChannelConfig;
}): Promise<DispatchResult> {
  if (!params.config.emailEnabled) {
    return {
      channel: "email",
      status: "failed",
      errorMessage: "Email notifications are disabled in settings."
    };
  }

  const smtp = resolveEmailConfig(params.config);
  if (!smtp.host || !smtp.user || !smtp.pass) {
    return {
      channel: "email",
      status: "simulated",
      providerMessageId: `sim-email-${crypto.randomBytes(4).toString("hex")}`
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: { user: smtp.user, pass: smtp.pass }
    });
    const info = await transporter.sendMail({
      from: `"${smtp.senderName}" <${smtp.senderEmail}>`,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html
    });
    return {
      channel: "email",
      status: "sent",
      providerMessageId: info.messageId
    };
  } catch (err) {
    return {
      channel: "email",
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "SMTP dispatch failed"
    };
  }
}

export async function sendMsg91Sms(params: {
  mobile: string;
  variables: Record<string, string>;
  config: NotificationChannelConfig;
}): Promise<DispatchResult> {
  if (!params.config.smsEnabled) {
    return {
      channel: "sms",
      status: "failed",
      errorMessage: "SMS notifications are disabled in settings."
    };
  }

  const authKey = params.config.msg91AuthKey || process.env.MSG91_AUTH_KEY || "";
  const templateId =
    params.config.msg91SmsTemplateId || process.env.MSG91_SMS_TEMPLATE_ID || "";
  const sender = params.config.msg91SenderId || process.env.MSG91_SENDER_ID || "AURACR";

  if (!authKey || !templateId) {
    return {
      channel: "sms",
      status: "simulated",
      providerMessageId: `sim-sms-${crypto.randomBytes(4).toString("hex")}`
    };
  }

  try {
    const normalizedMobile = params.mobile.replace(/[^0-9]/g, "");
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        template_id: templateId,
        sender,
        short_url: "0",
        recipients: [{ mobiles: normalizedMobile, ...params.variables }]
      })
    });
    const json = (await res.json()) as { type?: string; request_id?: string; message?: string };
    if (!res.ok || json.type === "error") {
      return {
        channel: "sms",
        status: "failed",
        errorMessage: json.message || `MSG91 HTTP ${res.status}`
      };
    }
    return {
      channel: "sms",
      status: "sent",
      providerMessageId: json.request_id || `msg91-sms-${Date.now()}`
    };
  } catch (err) {
    return {
      channel: "sms",
      status: "failed",
      errorMessage: err instanceof Error ? err.message : "MSG91 SMS failed"
    };
  }
}

export async function sendWhatsAppMessage(params: {
  mobile: string;
  templateName: string;
  variables: string[];
  config: NotificationChannelConfig;
}): Promise<DispatchResult> {
  if (!params.config.whatsappEnabled) {
    return {
      channel: "whatsapp",
      status: "failed",
      errorMessage: "WhatsApp notifications are disabled in settings."
    };
  }

  const apiKey =
    params.config.whatsappApiKey || process.env.MSG91_AUTH_KEY || "";
  const integratedNumber =
    params.config.whatsappIntegratedNumber ||
    process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER ||
    "";

  if (!apiKey || !integratedNumber) {
    return {
      channel: "whatsapp",
      status: "simulated",
      providerMessageId: `sim-wa-${crypto.randomBytes(4).toString("hex")}`
    };
  }

  try {
    const normalizedMobile = params.mobile.replace(/[^0-9]/g, "");
    const res = await fetch(
      "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/bulk/",
      {
        method: "POST",
        headers: {
          authkey: apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          integrated_number: integratedNumber,
          content_type: "template",
          payload: {
            messaging_product: "whatsapp",
            type: "template",
            template: {
              name: params.templateName,
              language: { code: "en", policy: "deterministic" },
              to_and_components: [
                {
                  to: [normalizedMobile],
                  components: params.variables.reduce<
                    Record<string, { type: "text"; value: string }>
                  >((acc, val, idx) => {
                    acc[`body_${idx + 1}`] = { type: "text", value: val };
                    return acc;
                  }, {})
                }
              ]
            }
          }
        })
      }
    );
    const json = (await res.json()) as { status?: string; request_id?: string; message?: string };
    if (!res.ok || json.status === "fail") {
      return {
        channel: "whatsapp",
        status: "failed",
        errorMessage: json.message || `WhatsApp HTTP ${res.status}`
      };
    }
    return {
      channel: "whatsapp",
      status: "sent",
      providerMessageId: json.request_id || `wa-${Date.now()}`
    };
  } catch (err) {
    return {
      channel: "whatsapp",
      status: "failed",
      errorMessage:
        err instanceof Error ? err.message : "WhatsApp dispatch failed"
    };
  }
}

export async function dispatchBookingNotifications(params: {
  event: Exclude<NotificationEvent, "admin_alert" | "test_dispatch" | "appointment_status_updated">;
  appointment: Appointment;
  doctor: Doctor;
  service: Service;
  settings: WebsiteSettings;
}): Promise<NotificationLog[]> {
  const { event, appointment, doctor, service, settings } = params;
  const cfg = settings.notificationSettings;

  // Enforce Section 5 rule: do not send confirmation until appointment is actually confirmed
  if (event === "appointment_confirmed" && appointment.status !== "confirmed") {
    return [];
  }

  const eventPolicyMap = {
    booking_received: cfg.events.bookingReceived,
    payment_successful: cfg.events.paymentSuccessful,
    appointment_confirmed: cfg.events.appointmentConfirmed,
    appointment_cancelled: cfg.events.appointmentCancelled,
    appointment_reminder: cfg.events.appointmentReminder
  };

  const policy = eventPolicyMap[event];
  const session = inferSessionFromAppointment(appointment);
  const sessionTitle = formatSessionLabel(session);
  const windowHours = `${formatTime12h(appointment.slotStart)}${
    appointment.slotEnd ? ` – ${formatTime12h(appointment.slotEnd)}` : ""
  }`;
  const formattedTime = `${sessionTitle} (${windowHours})`;
  const queueLine =
    typeof appointment.queueNumber === "number"
      ? `Token #${appointment.queueNumber}`
      : "Assigned after payment";
  const subjectMap: Record<typeof event, string> = {
    booking_received: `Booking Received (${appointment.bookingRef}) - ${settings.hospitalName}`,
    payment_successful: `Payment Receipt (${appointment.bookingRef}) - ${settings.hospitalName}`,
    appointment_confirmed: `Appointment Confirmed (${appointment.bookingRef}) - ${settings.hospitalName}`,
    appointment_cancelled: `Appointment Cancelled (${appointment.bookingRef}) - ${settings.hospitalName}`,
    appointment_reminder: `Appointment Reminder (${appointment.bookingRef}) - ${settings.hospitalName}`
  };

  const textBody = [
    `Dear ${appointment.patientName},`,
    "",
    `Booking Reference: ${appointment.bookingRef}`,
    `Queue Token Number: ${queueLine}`,
    `Doctor: ${doctor.fullName}`,
    `Service: ${service.name}`,
    `Date: ${appointment.appointmentDate}`,
    `Booking Window: ${formattedTime}`,
    `Consultation Fee: Rs. ${appointment.consultationFee}${
      appointment.couponCode && (appointment.discountAmount || 0) > 0
        ? ` (Coupon ${appointment.couponCode} applied: -Rs. ${appointment.discountAmount})`
        : ""
    }`,
    `Appointment Status: ${appointment.status.replace("_", " ").toUpperCase()}`,
    `Payment Status: ${appointment.paymentStatus.toUpperCase()}`,
    "",
    `${settings.hospitalName}`,
    `Phone: ${settings.phone} | Email: ${resolveEmailConfig(cfg).senderEmail}`
  ].join("\n");

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; color: #0f172a;">
      <div style="background: #06213e; color: #ffffff; padding: 20px 24px;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; opacity: 0.85;">${settings.hospitalName}</p>
        <h2 style="margin: 6px 0 0; font-size: 20px;">${subjectMap[event]}</h2>
      </div>
      <div style="padding: 24px; background: #ffffff;">
        <p style="margin-top: 0; font-size: 15px;">Dear <strong>${appointment.patientName}</strong>,</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Booking Reference</td><td style="padding: 8px 0; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9;">${appointment.bookingRef}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Queue Token</td><td style="padding: 8px 0; font-weight: 800; font-size: 16px; text-align: right; border-bottom: 1px solid #f1f5f9; color: #0b71c7;">${queueLine}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Doctor</td><td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${doctor.fullName}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Department / Service</td><td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${service.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Date &amp; Window</td><td style="padding: 8px 0; font-weight: 600; text-align: right; border-bottom: 1px solid #f1f5f9;">${appointment.appointmentDate}<br/><span style="font-size:12px;color:#0b71c7;">${formattedTime}</span></td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Fee</td><td style="padding: 8px 0; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9;">₹${appointment.consultationFee}${
            appointment.couponCode && (appointment.discountAmount || 0) > 0
              ? ` <span style="color:#059669; font-weight:600;">(${appointment.couponCode}: -₹${appointment.discountAmount})</span>`
              : ""
          }</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b; border-bottom: 1px solid #f1f5f9;">Appointment Status</td><td style="padding: 8px 0; font-weight: 700; text-align: right; border-bottom: 1px solid #f1f5f9; color: #0b71c7;">${appointment.status.replace("_", " ").toUpperCase()}</td></tr>
          <tr><td style="padding: 8px 0; color: #64748b;">Payment Status</td><td style="padding: 8px 0; font-weight: 700; text-align: right;">${appointment.paymentStatus.toUpperCase()}</td></tr>
        </table>
        <p style="margin: 16px 0 0; font-size: 12px; color: #64748b;">Track live queue serving progress in your Patient Portal. Need help? Contact ${settings.phone} or reply to ${resolveEmailConfig(cfg).senderEmail}.</p>
      </div>
    </div>
  `;

  const logsToSave: NotificationLog[] = [];
  const now = new Date().toISOString();

  if (policy.email && cfg.emailEnabled) {
    const res = await sendEmailNotification({
      to: appointment.patientEmail,
      subject: subjectMap[event],
      text: textBody,
      html: htmlBody,
      config: cfg
    });
    logsToSave.push({
      id: generateId(),
      appointmentId: appointment.id,
      channel: "email",
      event,
      recipientRef: appointment.patientEmail,
      providerMessageId: res.providerMessageId,
      status: res.status,
      errorMessage: res.errorMessage,
      sentAt: now
    });
  }

  if (policy.sms && cfg.smsEnabled) {
    const res = await sendMsg91Sms({
      mobile: appointment.patientPhone,
      variables: {
        patientName: appointment.patientName,
        bookingRef: appointment.bookingRef,
        doctorName: doctor.fullName,
        date: appointment.appointmentDate,
        time: formattedTime
      },
      config: cfg
    });
    logsToSave.push({
      id: generateId(),
      appointmentId: appointment.id,
      channel: "sms",
      event,
      recipientRef: appointment.patientPhone,
      providerMessageId: res.providerMessageId,
      status: res.status,
      errorMessage: res.errorMessage,
      sentAt: now
    });
  }

  if (policy.whatsapp && cfg.whatsappEnabled) {
    const templateName =
      event === "appointment_cancelled"
        ? cfg.whatsappTemplateCancelled
        : cfg.whatsappTemplateConfirmed;
    const res = await sendWhatsAppMessage({
      mobile: appointment.patientPhone,
      templateName,
      variables: [
        appointment.patientName,
        appointment.bookingRef,
        doctor.fullName,
        appointment.appointmentDate,
        formattedTime
      ],
      config: cfg
    });
    logsToSave.push({
      id: generateId(),
      appointmentId: appointment.id,
      channel: "whatsapp",
      event,
      recipientRef: appointment.patientPhone,
      providerMessageId: res.providerMessageId,
      status: res.status,
      errorMessage: res.errorMessage,
      sentAt: now
    });
  }

  if (policy.adminAlert && cfg.emailEnabled) {
    const adminRecipient =
      settings.email && !settings.email.endsWith(".example")
        ? settings.email
        : resolveEmailConfig(cfg).senderEmail;
    const res = await sendEmailNotification({
      to: adminRecipient,
      subject: `[Hospital Alert] ${subjectMap[event]}`,
      text: `Admin Alert for ${appointment.bookingRef}\nPatient: ${appointment.patientName} (${appointment.patientPhone})\nDoctor: ${doctor.fullName}\nDate: ${appointment.appointmentDate} ${formattedTime}\nStatus: ${appointment.status}`,
      config: cfg
    });
    logsToSave.push({
      id: generateId(),
      appointmentId: appointment.id,
      channel: "email",
      event: "admin_alert",
      recipientRef: adminRecipient,
      providerMessageId: res.providerMessageId,
      status: res.status,
      errorMessage: res.errorMessage,
      sentAt: now
    });
  }

  if (logsToSave.length > 0) {
    await mutateDb((db) => {
      db.notificationLogs.unshift(...logsToSave);
    });
  }

  return logsToSave;
}
