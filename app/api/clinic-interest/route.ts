import { NextRequest, NextResponse } from 'next/server'
import { getResend } from '@/lib/resend'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { clinicName, contactName, email, phone, city, province, website, services, message } = body

  if (!clinicName || !email || !city || !province || !contactName) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const resend = getResend()
    const servicesList = Array.isArray(services) && services.length > 0
      ? services.join(', ')
      : 'None specified'

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@ivtherapycanada.ca',
      to: 'tejumoladavid@gmail.com',
      subject: `New Clinic Listing Interest: ${clinicName} (${city}, ${province})`,
      html: `
        <h2>New Clinic Listing Interest</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;font-weight:bold;width:160px">Clinic Name</td><td style="padding:8px">${clinicName}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Location</td><td style="padding:8px">${city}, ${province}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Website</td><td style="padding:8px">${website || '—'}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Services</td><td style="padding:8px">${servicesList}</td></tr>
          <tr><td style="padding:8px;font-weight:bold">Contact Name</td><td style="padding:8px">${contactName}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Email</td><td style="padding:8px"><a href="mailto:${email}">${email}</a></td></tr>
          <tr><td style="padding:8px;font-weight:bold">Phone</td><td style="padding:8px">${phone || '—'}</td></tr>
          <tr style="background:#f9f9f9"><td style="padding:8px;font-weight:bold">Message</td><td style="padding:8px">${message || '—'}</td></tr>
        </table>
      `,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('clinic-interest email error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}
