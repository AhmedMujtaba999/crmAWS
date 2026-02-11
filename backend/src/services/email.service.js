// src/services/email.service.js
import nodemailer from "nodemailer";
import { pool } from "../config/db.js";
import * as organizationRepo from "../repositories/organization.repo.js";
import { createPresignedDownload } from "./s3Download.service.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";


const transporter = nodemailer.createTransport({
    host: process.env.SES_SMTP_HOST,
    port: Number(process.env.SES_SMTP_PORT), // usually 587
    secure: false,
    auth: {
        user: process.env.SES_SMTP_USER,
        pass: process.env.SES_SMTP_PASS,
    },
});

export async function sendTestEmail() {
    // Optional but very useful during testing
    await transporter.verify();

    await transporter.sendMail({
        from: `"CRM Test" <${process.env.SES_FROM_EMAIL}>`,
        replyTo: "ahmed@formula7tech.com",
        to,
        subject: 'SES Test Email',
        text: 'This is a test email sent via AWS SES SMTP.',
    });
}


// ==========================
// Send Task Completion Email
// ==========================
const s3 = new S3Client({
    region: process.env.AWS_REGION,
});

const BUCKET = process.env.S3_BUCKET_NAME;

// helper to convert stream → buffer
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export async function sendTaskCompletionInvoiceEmail(
    emailPayload,
    organization_id
) {
    const client = await pool.connect();

    try {
        const { to, invoice } = emailPayload;

        if (!to) throw new Error("Recipient email missing");
        if (!invoice?.pdf_url)
            throw new Error("Invoice missing for transactional email");

        // ==========================
        // Load organization
        // ==========================
        const org = await organizationRepo.getOrganizationByIdClient(
            client,
            organization_id
        );

        if (!org) throw new Error("Organization not found");

        const contactEmails = org.contact_emails || {};

        const fromEmail =
            contactEmails.noreply ||
            contactEmails.billing ||
            process.env.SES_FROM_EMAIL;

        const replyToEmail =
            contactEmails.billing ||
            contactEmails.support ||
            fromEmail;

        // ==========================
        // Download PDF from S3
        // ==========================
        const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: invoice.pdf_url, // must be object key only
        });

        const s3Response = await s3.send(command);

        const pdfBuffer = await streamToBuffer(s3Response.Body);

        // ==========================
        // Email content
        // ==========================
        const textBody = `
Hello,

Your service has been successfully completed.

Please find your invoice attached to this email.

Thank you,
${org.name}
`;

        const htmlBody = `
<p>Hello,</p>

<p>Your service has been <strong>successfully completed</strong>.</p>

<p>Your invoice is attached to this email.</p>

<p>Thank you,<br/>
<strong>${org.name}</strong></p>
`;

        // ==========================
        // Send Email with REAL Attachment
        // ==========================
        await transporter.sendMail({
            from: `"${org.name}" <${fromEmail}>`,
            to,
            replyTo: replyToEmail,
            subject: `Invoice ${invoice.invoice_number} – ${org.name}`,
            text: textBody,
            html: htmlBody,
            attachments: [
                {
                    filename: `Invoice-${invoice.invoice_number}.pdf`,
                    content: pdfBuffer,
                    contentType: "application/pdf",
                },
            ],
        });

    } finally {
        client.release();
    }
}

//add unsubscribe later on
export async function sendMarketingEmail(
    emailPayload,
    organization_id
) {
    const client = await pool.connect();

    try {
        const { to, images = [] } = emailPayload;

        if (!to) throw new Error("Recipient email missing");
        if (!images.length)
            throw new Error("Marketing email requires images");

        const org = await organizationRepo.getOrganizationByIdClient(
            client,
            organization_id
        );

        if (!org) throw new Error("Organization not found");

        const contactEmails = org.contact_emails || {};

        const fromEmail =
            contactEmails.support ||
            process.env.SES_FROM_EMAIL;

        const replyToEmail =
            contactEmails.support ||
            fromEmail;

        // ==========================
        // Generate image links
        // ==========================
        const imageLinks = [];

        for (const img of images) {
            const link = await createPresignedDownload({
                key: img.image_url,
            });

            imageLinks.push(link.url);
        }

        // ==========================
        // Email content
        // ==========================
        const htmlBody = `
<p>Hello,</p>

<p>We recently completed your service — and the results looked fantastic!</p>

${imageLinks
                .map(
                    url => `
    <p>
      <img src="${url}" style="max-width:100%;border-radius:8px;" />
    </p>
`
                )
                .join("")}

<p>
  If you'd like to schedule another service or seasonal refresh,
  we'd be happy to assist.
</p>

<p>Best regards,<br/>
<strong>${org.name}</strong></p>
`;

        const textBody = `
Hello,

We recently completed your service.

View your service images here:
${imageLinks.join("\n")}

Contact us anytime for your next service.

${org.name}
`;

        await transporter.sendMail({
            from: `"${org.name}" <${fromEmail}>`,
            to,
            replyTo: replyToEmail,
            subject: "Your Service Results – Thank You!",
            text: textBody,
            html: htmlBody,
        });
    } finally {
        client.release();
    }
}