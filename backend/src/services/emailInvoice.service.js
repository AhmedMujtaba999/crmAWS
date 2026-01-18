import nodemailer from 'nodemailer';
import axios from 'axios';

const transporter = nodemailer.createTransport({
    host: 'email-smtp.us-east-1.amazonaws.com', // AWS SES
    port: 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

export async function sendTaskCompletionEmail({
    to,
    invoice,
    images = []
}) {
    const attachments = [];

    // 📄 Invoice PDF attachment
    if (invoice?.pdf_url) {
        const pdf = await axios.get(invoice.pdf_url, {
            responseType: 'arraybuffer'
        });

        attachments.push({
            filename: `${invoice.invoice_number}.pdf`,
            content: pdf.data,
            contentType: 'application/pdf'
        });
    }

    // 🖼️ Image attachments
    for (const img of images) {
        const image = await axios.get(img.image_url, {
            responseType: 'arraybuffer'
        });

        attachments.push({
            filename: `${img.image_type}-${Date.now()}.jpg`,
            content: image.data,
            contentType: 'image/jpeg'
        });
    }

    await transporter.sendMail({
        from: '"CRM" <no-reply@yourdomain.com>',
        to,
        subject: 'Task Completed – Invoice & Images',
        text: 'Please find attached the invoice and work images.',
        attachments
    });
}