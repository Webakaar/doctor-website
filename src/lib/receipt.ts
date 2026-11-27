import type { Appointment } from "@/types/hospital";
import {
  formatSessionLabel,
  formatTime12h,
  inferSessionFromAppointment
} from "@/lib/slots";

export interface AppointmentReceiptData {
  hospitalName: string;
  hospitalPhone?: string;
  hospitalEmail?: string;
  hospitalAddress?: string;
  appointment: Appointment;
  doctorName: string;
  serviceName: string;
  paymentId?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatStatusLabel(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}

export function buildReceiptHtml(data: AppointmentReceiptData): string {
  const {
    hospitalName,
    hospitalPhone = "+91 22 4890 9911",
    hospitalEmail = "info@bookmydocindia.com",
    hospitalAddress = "OPD Registration Desk & Digital Care Wing",
    appointment,
    doctorName,
    serviceName,
    paymentId
  } = data;

  const issuedOn = new Date(
    appointment.updatedAt || appointment.createdAt || Date.now()
  ).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  const baseFee =
    appointment.originalFee ??
    appointment.consultationFee + (appointment.discountAmount || 0);
  const discount = appointment.discountAmount || 0;
  const hasCoupon = Boolean(appointment.couponCode && discount > 0);
  const sessionLabel = formatSessionLabel(
    inferSessionFromAppointment(appointment)
  );
  const slotWindow = `${sessionLabel} (${formatTime12h(appointment.slotStart)}${
    appointment.slotEnd ? ` – ${formatTime12h(appointment.slotEnd)}` : ""
  })`;
  const queueBadge =
    typeof appointment.queueNumber === "number"
      ? `#${appointment.queueNumber}`
      : "Pending";

  const apptBadgeBg =
    appointment.status === "confirmed" || appointment.status === "completed"
      ? "#dcfce7"
      : appointment.status === "cancelled"
      ? "#ffe4e6"
      : "#fef3c7";
  const apptBadgeText =
    appointment.status === "confirmed" || appointment.status === "completed"
      ? "#166534"
      : appointment.status === "cancelled"
      ? "#9f1239"
      : "#92400e";

  const payBadgeBg =
    appointment.paymentStatus === "paid"
      ? "#dcfce7"
      : appointment.paymentStatus === "failed"
      ? "#ffe4e6"
      : "#e0f2fe";
  const payBadgeText =
    appointment.paymentStatus === "paid"
      ? "#166534"
      : appointment.paymentStatus === "failed"
      ? "#9f1239"
      : "#075985";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Appointment Receipt - ${escapeHtml(appointment.bookingRef)}</title>
  <style>
    @page {
      size: A4;
      margin: 12mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
    }
    .sheet {
      max-width: 760px;
      margin: 0 auto;
      border: 1px solid #cbd5e1;
      border-radius: 16px;
      overflow: hidden;
      background: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #06213e 0%, #0b4b8a 100%);
      color: #ffffff;
      padding: 26px 28px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-box {
      width: 46px;
      height: 46px;
      border-radius: 12px;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .hospital-name {
      margin: 0;
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.02em;
    }
    .hospital-sub {
      margin: 4px 0 0;
      font-size: 11px;
      color: #bae6fd;
      line-height: 1.5;
    }
    .receipt-tag {
      text-align: right;
    }
    .receipt-pill {
      display: inline-block;
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.28);
      border-radius: 999px;
      padding: 5px 12px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #ffffff;
    }
    .issued {
      margin-top: 8px;
      font-size: 11px;
      color: #e0f2fe;
    }
    .ref-bar {
      background: #f4f9ff;
      border-bottom: 1px solid #e2e8f0;
      padding: 16px 28px;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }
    .ref-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
    }
    .ref-code {
      margin-top: 2px;
      font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
      font-size: 17px;
      font-weight: 800;
      color: #0b71c7;
    }
    .badges {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
    }
    .badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
    }
    .content {
      padding: 24px 28px;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    .card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      background: #ffffff;
    }
    .card-title {
      margin: 0 0 10px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #0b71c7;
    }
    .field {
      margin-bottom: 8px;
    }
    .field:last-child {
      margin-bottom: 0;
    }
    .label {
      font-size: 11px;
      color: #64748b;
    }
    .value {
      font-size: 13px;
      font-weight: 700;
      color: #0f172a;
      margin-top: 1px;
    }
    .table-wrap {
      margin-top: 20px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      text-align: left;
      padding: 11px 16px;
      border-bottom: 1px solid #e2e8f0;
    }
    th.right, td.right {
      text-align: right;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #1e293b;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .discount-row td {
      color: #047857;
      font-weight: 600;
      background: #f0fdf4;
    }
    .total-row td {
      background: #f4f9ff;
      font-size: 15px;
      font-weight: 800;
      color: #06213e;
      border-top: 1px solid #cbd5e1;
    }
    .notes {
      margin-top: 20px;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
      background: #f8fafc;
      padding: 14px 16px;
      font-size: 11.5px;
      color: #475569;
      line-height: 1.55;
    }
    .notes strong {
      color: #0f172a;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding: 14px 28px;
      background: #ffffff;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <div class="brand">
        <div class="logo-box">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
        </div>
        <div>
          <h1 class="hospital-name">${escapeHtml(hospitalName)}</h1>
          <p class="hospital-sub">
            ${escapeHtml(hospitalAddress)}<br/>
            Phone: ${escapeHtml(hospitalPhone)} &nbsp;|&nbsp; Email: ${escapeHtml(hospitalEmail)}
          </p>
        </div>
      </div>
      <div class="receipt-tag">
        <span class="receipt-pill">Official OPD Receipt</span>
        <div class="issued">Issued: ${escapeHtml(issuedOn)}</div>
      </div>
    </div>

    <div class="ref-bar">
      <div>
        <div class="ref-label">Booking Reference</div>
        <div class="ref-code">${escapeHtml(appointment.bookingRef)}</div>
      </div>
      <div class="badges">
        <span class="badge" style="background:${apptBadgeBg};color:${apptBadgeText};">
          Appointment: ${escapeHtml(formatStatusLabel(appointment.status))}
        </span>
        <span class="badge" style="background:${payBadgeBg};color:${payBadgeText};">
          Payment: ${escapeHtml(formatStatusLabel(appointment.paymentStatus))}
        </span>
      </div>
    </div>

    <div class="content">
      <div class="grid">
        <div class="card">
          <p class="card-title">Patient Details</p>
          <div class="field">
            <div class="label">Patient Name</div>
            <div class="value">${escapeHtml(appointment.patientName)}</div>
          </div>
          <div class="field">
            <div class="label">Contact Number</div>
            <div class="value">${escapeHtml(appointment.patientPhone)}</div>
          </div>
          <div class="field">
            <div class="label">Email Address</div>
            <div class="value">${escapeHtml(appointment.patientEmail)}</div>
          </div>
          ${
            appointment.reasonForVisit
              ? `<div class="field">
                  <div class="label">Reason / Notes</div>
                  <div class="value" style="font-weight:500;">${escapeHtml(appointment.reasonForVisit)}</div>
                </div>`
              : ""
          }
        </div>

        <div class="card">
          <p class="card-title">Consultation Schedule</p>
          <div class="field">
            <div class="label">Consulting Doctor</div>
            <div class="value">${escapeHtml(doctorName)}</div>
          </div>
          <div class="field">
            <div class="label">Department / Service</div>
            <div class="value">${escapeHtml(serviceName)}</div>
          </div>
          <div class="field">
            <div class="label">Appointment Date</div>
            <div class="value">${escapeHtml(appointment.appointmentDate)}</div>
          </div>
          <div class="field">
            <div class="label">Booking Window</div>
            <div class="value" style="color:#0b71c7;">${escapeHtml(slotWindow)}</div>
          </div>
          <div class="field">
            <div class="label">Assigned Queue Token</div>
            <div class="value" style="font-size:16px;color:#06213e;">${escapeHtml(queueBadge)}</div>
          </div>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>OPD Specialist Consultation</strong> — ${escapeHtml(doctorName)} (${escapeHtml(serviceName)})
                ${
                  paymentId
                    ? `<div style="margin-top:3px;font-size:11px;color:#64748b;">Payment Ref: <span style="font-family:monospace;">${escapeHtml(paymentId)}</span></div>`
                    : ""
                }
              </td>
              <td class="right"><strong>₹${baseFee}</strong></td>
            </tr>
            ${
              hasCoupon
                ? `<tr class="discount-row">
                    <td>Promo Coupon Discount (<span style="font-family:monospace;">${escapeHtml(appointment.couponCode || "")}</span>)</td>
                    <td class="right">- ₹${discount}</td>
                  </tr>`
                : ""
            }
            <tr class="total-row">
              <td>Total Amount ${appointment.paymentStatus === "paid" ? "Paid" : "Payable"}</td>
              <td class="right">₹${appointment.consultationFee}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="notes">
        <strong>Check-In Instructions:</strong> Please arrive at the OPD reception desk at least 15 minutes before your scheduled slot with a valid photo ID and any previous medical records or diagnostic reports. Present Booking Reference <strong>${escapeHtml(appointment.bookingRef)}</strong> at the counter.
      </div>
    </div>

    <div class="footer">
      <span>Computer-generated receipt — valid without signature</span>
      <span>${escapeHtml(hospitalName)}</span>
    </div>
  </div>
</body>
</html>`;
}

export function printAppointmentReceipt(data: AppointmentReceiptData): void {
  const html = buildReceiptHtml(data);
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.setAttribute("aria-hidden", "true");
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc || !iframe.contentWindow) {
    document.body.removeChild(iframe);
    window.print();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 1500);
    }
  };

  setTimeout(triggerPrint, 200);
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function downloadAppointmentReceiptImage(
  data: AppointmentReceiptData
): void {
  const {
    hospitalName,
    hospitalPhone = "+91 22 4890 9911",
    hospitalEmail = "info@bookmydocindia.com",
    appointment,
    doctorName,
    serviceName,
    paymentId
  } = data;

  const width = 1200;
  const height = 1480;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // Outer canvas background
  ctx.fillStyle = "#f1f5f9";
  ctx.fillRect(0, 0, width, height);

  // Main Receipt Sheet Card
  const pad = 48;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2;
  drawRoundedRect(ctx, pad, pad, cardW, cardH, 28);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#cbd5e1";
  ctx.stroke();

  // Header Banner
  ctx.save();
  drawRoundedRect(ctx, pad, pad, cardW, 210, 28);
  ctx.clip();
  const grad = ctx.createLinearGradient(pad, pad, pad + cardW, pad + 210);
  grad.addColorStop(0, "#06213e");
  grad.addColorStop(1, "#0b4b8a");
  ctx.fillStyle = grad;
  ctx.fillRect(pad, pad, cardW, 210);
  ctx.restore();

  // Logo Plus Emblem
  drawRoundedRect(ctx, pad + 44, pad + 52, 74, 74, 18);
  ctx.fillStyle = "rgba(255,255,255,0.16)";
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(pad + 77, pad + 69, 8, 40);
  ctx.fillRect(pad + 61, pad + 85, 40, 8);

  // Hospital Title & Subtitle
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 32px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(hospitalName, pad + 140, pad + 86);
  ctx.fillStyle = "#bae6fd";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(
    `Phone: ${hospitalPhone}   |   ${hospitalEmail}`,
    pad + 140,
    pad + 124
  );
  ctx.fillStyle = "#e0f2fe";
  ctx.font = "700 18px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("OFFICIAL APPOINTMENT & PAYMENT RECEIPT", pad + 140, pad + 162);

  // Reference & Status Band
  const bandY = pad + 210;
  ctx.fillStyle = "#f4f9ff";
  ctx.fillRect(pad + 2, bandY, cardW - 4, 118);
  ctx.fillStyle = "#64748b";
  ctx.font = "700 17px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("BOOKING REFERENCE", pad + 44, bandY + 42);
  const refText =
    typeof appointment.queueNumber === "number"
      ? `${appointment.bookingRef}  (Queue #${appointment.queueNumber})`
      : appointment.bookingRef;
  ctx.fillStyle = "#0b71c7";
  ctx.font = "800 30px ui-monospace, SFMono-Regular, Menlo, monospace";
  ctx.fillText(refText, pad + 44, bandY + 86);

  // Status Pills on Right
  const apptLabel = `Status: ${formatStatusLabel(appointment.status)}`;
  const payLabel = `Payment: ${formatStatusLabel(appointment.paymentStatus)}`;
  drawRoundedRect(ctx, width - pad - 490, bandY + 34, 220, 48, 24);
  ctx.fillStyle = appointment.status === "confirmed" ? "#dcfce7" : "#fef3c7";
  ctx.fill();
  ctx.fillStyle = appointment.status === "confirmed" ? "#166534" : "#92400e";
  ctx.font = "700 18px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(apptLabel, width - pad - 466, bandY + 64);

  drawRoundedRect(ctx, width - pad - 252, bandY + 34, 210, 48, 24);
  ctx.fillStyle = appointment.paymentStatus === "paid" ? "#dcfce7" : "#e0f2fe";
  ctx.fill();
  ctx.fillStyle = appointment.paymentStatus === "paid" ? "#166534" : "#075985";
  ctx.fillText(payLabel, width - pad - 226, bandY + 64);

  // Two Info Cards
  const cardsY = bandY + 154;
  const colW = (cardW - 88 - 28) / 2;
  const colLeftX = pad + 44;
  const colRightX = colLeftX + colW + 28;

  for (const x of [colLeftX, colRightX]) {
    drawRoundedRect(ctx, x, cardsY, colW, 330, 20);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#e2e8f0";
    ctx.stroke();
  }

  const drawField = (
    x: number,
    y: number,
    label: string,
    val: string,
    valColor = "#0f172a"
  ) => {
    ctx.fillStyle = "#64748b";
    ctx.font = "600 17px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(label, x, y);
    ctx.fillStyle = valColor;
    ctx.font = "700 23px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(val.slice(0, 34), x, y + 30);
  };

  ctx.fillStyle = "#0b71c7";
  ctx.font = "800 17px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("PATIENT DETAILS", colLeftX + 28, cardsY + 42);
  drawField(colLeftX + 28, cardsY + 88, "Patient Name", appointment.patientName);
  drawField(colLeftX + 28, cardsY + 168, "Phone Number", appointment.patientPhone);
  drawField(colLeftX + 28, cardsY + 248, "Email Address", appointment.patientEmail);

  ctx.fillStyle = "#0b71c7";
  ctx.font = "800 17px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("CONSULTATION SCHEDULE", colRightX + 28, cardsY + 42);
  drawField(colRightX + 28, cardsY + 88, "Consulting Doctor", doctorName);
  drawField(colRightX + 28, cardsY + 168, "Department / Service", serviceName);
  drawField(
    colRightX + 28,
    cardsY + 248,
    "Date & Booking Window",
    `${appointment.appointmentDate} • ${
      inferSessionFromAppointment(appointment) === "evening"
        ? "Evening"
        : "Morning"
    } (${formatTime12h(appointment.slotStart)})`,
    "#0b71c7"
  );

  // Fee Breakdown Card
  const feeY = cardsY + 370;
  const baseFee =
    appointment.originalFee ??
    appointment.consultationFee + (appointment.discountAmount || 0);
  const discount = appointment.discountAmount || 0;
  const hasCoupon = Boolean(appointment.couponCode && discount > 0);
  const feeCardH = hasCoupon ? 290 : 225;

  drawRoundedRect(ctx, colLeftX, feeY, cardW - 88, feeCardH, 20);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#e2e8f0";
  ctx.stroke();

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(colLeftX + 2, feeY + 2, cardW - 92, 56);
  ctx.fillStyle = "#475569";
  ctx.font = "800 17px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("FEE SUMMARY", colLeftX + 28, feeY + 38);

  ctx.fillStyle = "#1e293b";
  ctx.font = "600 22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText("Consultation Fee", colLeftX + 28, feeY + 104);
  ctx.textAlign = "right";
  ctx.fillText(`₹${baseFee}`, width - pad - 72, feeY + 104);
  ctx.textAlign = "left";

  let rowY = feeY + 158;
  if (hasCoupon) {
    ctx.fillStyle = "#047857";
    ctx.font = "700 22px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
    ctx.fillText(
      `Promo Coupon (${appointment.couponCode})`,
      colLeftX + 28,
      rowY
    );
    ctx.textAlign = "right";
    ctx.fillText(`- ₹${discount}`, width - pad - 72, rowY);
    ctx.textAlign = "left";
    rowY += 56;
  }

  ctx.fillStyle = "#f4f9ff";
  ctx.fillRect(colLeftX + 2, rowY - 34, cardW - 92, 74);
  ctx.fillStyle = "#06213e";
  ctx.font = "800 26px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(
    appointment.paymentStatus === "paid" ? "Total Paid" : "Total Payable",
    colLeftX + 28,
    rowY + 14
  );
  ctx.textAlign = "right";
  ctx.fillText(`₹${appointment.consultationFee}`, width - pad - 72, rowY + 14);
  ctx.textAlign = "left";

  // Check-in Note & Footer
  const noteY = feeY + feeCardH + 38;
  drawRoundedRect(ctx, colLeftX, noteY, cardW - 88, 128, 18);
  ctx.fillStyle = "#f8fafc";
  ctx.fill();
  ctx.fillStyle = "#334155";
  ctx.font = "600 19px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(
    "Check-In Note: Please arrive 15 minutes before your appointment slot",
    colLeftX + 28,
    noteY + 46
  );
  ctx.fillText(
    `with Booking Ref ${appointment.bookingRef}${
      paymentId ? ` (Payment ID: ${paymentId})` : ""
    }.`,
    colLeftX + 28,
    noteY + 82
  );

  ctx.fillStyle = "#94a3b8";
  ctx.font = "600 17px -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
  ctx.fillText(
    `Verified Digital Receipt • ${hospitalName}`,
    colLeftX,
    height - pad - 36
  );

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Receipt-${appointment.bookingRef}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
