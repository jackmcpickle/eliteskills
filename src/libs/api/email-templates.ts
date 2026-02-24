export interface EmailContext {
    session: {
        id: string;
        metadata: Record<string, string>;
    };
    customerName: string;
    email: string;
    source: string;
    continent: string;
    amountPaid: string;
    productName: string;
    productCode: string;
    accountUrl: string;
}

export function buildAdminEmailText(ctx: EmailContext): string {
    return [
        'Payment completed',
        '',
        `Session: ${ctx.session.id}`,
        `Product: ${ctx.productName} (${ctx.productCode})`,
        `Amount: ${ctx.amountPaid}`,
        `Customer: ${ctx.customerName}`,
        `Email: ${ctx.email}`,
        `Source: ${ctx.source}`,
        `Continent: ${ctx.continent}`,
        `Account: ${ctx.accountUrl}`,
        '',
        `Purchase type: ${ctx.session.metadata?.purchaseKind ?? 'personal'}`,
        ctx.session.metadata?.companyName
            ? `Company: ${ctx.session.metadata.companyName}`
            : '',
    ]
        .filter(Boolean)
        .join('\n');
}

function buildCustomerEmailText(ctx: EmailContext): string {
    return [
        `Hi ${ctx.customerName},`,
        '',
        `Your payment of ${ctx.amountPaid} has been received.`,
        '',
        'Access your account and download your skills here:',
        ctx.accountUrl,
        '',
        'Thanks,',
        'Elite Skills',
    ].join('\n');
}

function wrapEmailHtml(body: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
</style>
</head>
<body style="margin:0;padding:0;background-color:#06080c;font-family:'Outfit',Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#06080c;">
<tr><td align="center" style="padding:40px 16px;">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

<!-- Top gradient border -->
<tr><td style="height:3px;background:linear-gradient(90deg,#2de2c4,#0f1420);border-radius:8px 8px 0 0;"></td></tr>

<!-- Card -->
<tr><td style="background-color:#0f1420;border-radius:0 0 8px 8px;padding:40px 32px;">

<!-- Header -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr><td style="font-size:24px;font-weight:700;color:#2de2c4;padding-bottom:24px;">Elite Skills</td></tr>
</table>

${body}

</td></tr>

<!-- Footer -->
<tr><td style="padding:24px 32px 0;text-align:center;">
<p style="margin:0;font-size:13px;color:#cbd5e1;">Elite Skills &mdash; AI-powered skill development</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function buildCustomerEmailHtml(ctx: EmailContext): string {
    return wrapEmailHtml(`<!-- Greeting -->
<p style="margin:0 0 16px;font-size:16px;color:#e2e8f0;">Hi ${ctx.customerName},</p>

<!-- Confirmation -->
<p style="margin:0 0 24px;font-size:16px;color:#e2e8f0;">Your payment has been confirmed. Thank you for your purchase!</p>

<!-- Amount box -->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
<tr><td style="background-color:#06080c;border-radius:6px;padding:16px 20px;">
<p style="margin:0 0 4px;font-size:12px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;">Amount paid</p>
<p style="margin:0;font-size:22px;font-weight:600;color:#2de2c4;">${ctx.amountPaid}</p>
</td></tr>
</table>

<!-- CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
<tr><td align="center" style="background-color:#2de2c4;border-radius:6px;">
<a href="${ctx.accountUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#06080c;text-decoration:none;font-family:'Outfit',Arial,sans-serif;">Access Your Account</a>
</td></tr>
</table>

<p style="margin:0;font-size:14px;color:#94a3b8;">Or copy this link: <a href="${ctx.accountUrl}" style="color:#2de2c4;text-decoration:underline;">${ctx.accountUrl}</a></p>`);
}

export function buildCustomerEmail(ctx: EmailContext): {
    text: string;
    html: string;
} {
    return {
        text: buildCustomerEmailText(ctx),
        html: buildCustomerEmailHtml(ctx),
    };
}

// ── Login email ─────────────────────────────────────────────────────

function buildLoginEmailText(loginUrl: string): string {
    return [
        'Hi,',
        '',
        'Click the link below to access your Elite Skills account:',
        loginUrl,
        '',
        'This link expires in 15 minutes.',
        '',
        'If you did not request this, ignore this email.',
        '',
        'Thanks,',
        'Elite Skills',
    ].join('\n');
}

function buildLoginEmailHtml(loginUrl: string): string {
    return wrapEmailHtml(`<!-- Greeting -->
<p style="margin:0 0 16px;font-size:16px;color:#e2e8f0;">Hi,</p>

<!-- Body -->
<p style="margin:0 0 24px;font-size:16px;color:#e2e8f0;">Click the button below to access your account. This link expires in 15 minutes.</p>

<!-- CTA -->
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
<tr><td align="center" style="background-color:#2de2c4;border-radius:6px;">
<a href="${loginUrl}" target="_blank" style="display:inline-block;padding:14px 32px;font-size:16px;font-weight:600;color:#06080c;text-decoration:none;font-family:'Outfit',Arial,sans-serif;">Log In</a>
</td></tr>
</table>

<p style="margin:0 0 16px;font-size:14px;color:#94a3b8;">Or copy this link: <a href="${loginUrl}" style="color:#2de2c4;text-decoration:underline;">${loginUrl}</a></p>

<p style="margin:0;font-size:13px;color:#64748b;">If you did not request this, ignore this email.</p>`);
}

export function buildLoginEmail(loginUrl: string): {
    text: string;
    html: string;
} {
    return {
        text: buildLoginEmailText(loginUrl),
        html: buildLoginEmailHtml(loginUrl),
    };
}
