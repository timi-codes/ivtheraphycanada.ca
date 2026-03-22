import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getResend } from '@/lib/resend'
import { render } from '@react-email/render'
import { NewLeadEmail } from '@/emails/new-lead'
import { LeadConfirmationEmail } from '@/emails/lead-confirmation'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, service, message, city, province, vendorId } = body

    if (!name || !email || !city) {
      return NextResponse.json({ error: 'Name, email, and city are required.' }, { status: 400 })
    }

    // Save lead to DB
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone: phone || null,
        serviceType: service || null,
        message: message || null,
        city,
        province: province || null,
        vendorId: vendorId || null,
        status: 'new',
      },
      include: { vendor: true },
    })

    const fromEmail = process.env.RESEND_FROM_EMAIL ?? 'noreply@ivtherapycanada.ca'

    // Only send emails if Resend API key is configured
    if (process.env.RESEND_API_KEY) {
      // Email to vendor (if specific vendor)
      if (lead.vendor?.email) {
        const vendorHtml = await render(
          NewLeadEmail({
            vendorName: lead.vendor.name,
            leadName: name,
            leadEmail: email,
            leadPhone: phone,
            serviceType: service,
            city,
            province,
            message,
          })
        )
        await getResend().emails.send({
          from: fromEmail,
          to: lead.vendor.email,
          subject: `New Lead from IV Therapy Canada — ${name} in ${city}`,
          html: vendorHtml,
        })
      }

      // Confirmation email to consumer
      const confirmHtml = await render(
        LeadConfirmationEmail({ name, city, serviceType: service })
      )
      await getResend().emails.send({
        from: fromEmail,
        to: email,
        subject: 'We received your IV therapy request',
        html: confirmHtml,
      })

      // Admin notification
      const adminEmail = process.env.ADMIN_EMAIL
      if (adminEmail) {
        await getResend().emails.send({
          from: fromEmail,
          to: adminEmail,
          subject: `New Lead: ${name} in ${city} — ${service || 'General'}`,
          html: `
            <h2>New lead submitted</h2>
            <table style="border-collapse:collapse;font-size:14px">
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Name</td><td><strong>${name}</strong></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Phone</td><td>${phone || '—'}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Service</td><td>${service || '—'}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">City</td><td>${city}${province ? `, ${province}` : ''}</td></tr>
              <tr><td style="padding:4px 12px 4px 0;color:#6b7280">Message</td><td>${message || '—'}</td></tr>
            </table>
            <p style="margin-top:16px"><a href="${process.env.NEXT_PUBLIC_SITE_URL}/admin/leads">View all leads →</a></p>
          `,
        })
      }
    }

    return NextResponse.json({ success: true, id: lead.id })
  } catch (err) {
    console.error('Lead creation error:', err)
    return NextResponse.json({ error: 'Failed to submit request.' }, { status: 500 })
  }
}
