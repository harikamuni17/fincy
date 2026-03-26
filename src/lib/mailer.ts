import nodemailer from 'nodemailer'
import type { ActionLog, Finding } from '@prisma/client'

function createTransport() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT ?? '587', 10)
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    console.warn('[Mailer] SMTP not configured — emails will be skipped')
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendApprovalRequest(
  action: ActionLog,
  finding: Finding,
  approverEmail: string,
  approverName: string,
): Promise<void> {
  const transport = createTransport()
  if (!transport) return

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const approveUrl = `${baseUrl}/actions?id=${action.id}&action=approve`
  const rejectUrl  = `${baseUrl}/actions?id=${action.id}&action=reject`

  await transport.sendMail({
    from: `"Finci AI CFO" <${process.env.SMTP_USER}>`,
    to: approverEmail,
    subject: `[${action.approvalTier} REQUIRED] ${action.title}`,
    html: `
<!DOCTYPE html>
<html>
<body style="background:#0A0B0E;color:#F0F2F5;font-family:'DM Sans',sans-serif;padding:40px;">
  <div style="max-width:560px;margin:0 auto;">
    <h1 style="color:#00D4AA;font-size:22px;margin-bottom:8px;">Finci AI CFO</h1>
    <p style="color:#8B92A5;font-size:13px;margin-bottom:32px;">Approval Required — ${action.approvalTier} Tier</p>

    <div style="background:#111318;border:1px solid #1E2535;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="font-size:11px;color:#4A5065;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Action Required</p>
      <h2 style="font-size:16px;font-weight:600;margin-bottom:16px;">${action.title}</h2>
      <p style="color:#8B92A5;font-size:14px;margin-bottom:20px;">${action.description}</p>

      <div style="display:flex;gap:16px;">
        <div style="flex:1;background:#1A1D24;border-radius:8px;padding:16px;text-align:center;">
          <p style="font-size:10px;color:#4A5065;text-transform:uppercase;margin-bottom:4px;">Monthly Saving</p>
          <p style="font-family:'DM Mono',monospace;font-size:20px;color:#00D4AA;">₹${action.estimatedSavingMonthly.toLocaleString('en-IN')}</p>
        </div>
        <div style="flex:1;background:#1A1D24;border-radius:8px;padding:16px;text-align:center;">
          <p style="font-size:10px;color:#4A5065;text-transform:uppercase;margin-bottom:4px;">Annual Saving</p>
          <p style="font-family:'DM Mono',monospace;font-size:20px;color:#00D4AA;">₹${action.estimatedSavingAnnual.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>

    <div style="background:#111318;border:1px solid #1E2535;border-radius:12px;padding:24px;margin-bottom:24px;">
      <p style="font-size:11px;color:#4A5065;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:8px;">Related Finding</p>
      <p style="font-size:14px;font-weight:500;margin-bottom:4px;">${finding.title}</p>
      <p style="color:#8B92A5;font-size:13px;">Delta: ₹${finding.deltaAmount.toLocaleString('en-IN')} | Annual risk: ₹${finding.projectedAnnualWaste.toLocaleString('en-IN')}</p>
    </div>

    <div style="display:flex;gap:12px;">
      <a href="${approveUrl}" style="flex:1;background:#00D4AA;color:#0A0B0E;padding:12px 24px;border-radius:8px;text-decoration:none;text-align:center;font-weight:600;font-size:14px;">
        ✓ Approve
      </a>
      <a href="${rejectUrl}" style="flex:1;background:#1A1D24;color:#FF4D6A;border:1px solid rgba(255,77,106,0.3);padding:12px 24px;border-radius:8px;text-decoration:none;text-align:center;font-weight:600;font-size:14px;">
        ✗ Reject
      </a>
    </div>

    <p style="color:#4A5065;font-size:11px;margin-top:24px;text-align:center;">
      Hi ${approverName}, you have been identified as the approver for this action. Please review and respond within 24 hours.
    </p>
  </div>
</body>
</html>
    `,
  })
}
