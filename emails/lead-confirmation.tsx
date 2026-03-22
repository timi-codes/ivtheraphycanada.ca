import {
  Html, Head, Body, Container, Heading, Text, Hr, Section,
} from '@react-email/components'

interface LeadConfirmationEmailProps {
  name: string
  city: string
  serviceType?: string
}

export function LeadConfirmationEmail({ name, city, serviceType }: LeadConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' }}>
          <Section style={{ backgroundColor: '#1E1E2C', padding: '24px 32px' }}>
            <Heading style={{ color: '#ffffff', margin: 0, fontSize: '20px' }}>
              We received your request!
            </Heading>
          </Section>
          <Section style={{ padding: '32px' }}>
            <Text style={{ color: '#374151', fontSize: '16px' }}>
              Hi <strong>{name}</strong>,
            </Text>
            <Text style={{ color: '#374151' }}>
              Thanks for submitting your request on IV Therapy Canada. We&apos;ve received your inquiry
              {serviceType ? ` for ${serviceType.replace(/_/g, ' ')}` : ''} in <strong>{city}</strong>.
            </Text>
            <Text style={{ color: '#374151' }}>
              Local providers will be in touch shortly. In the meantime, you can browse more providers on our directory.
            </Text>
            <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
            <Text style={{ color: '#6b7280', fontSize: '13px' }}>
              <em>
                Reminder: IV therapy, NAD+ therapy, chelation, and related services should only be
                pursued under the guidance of a licensed medical professional.
              </em>
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#f9fafb', padding: '16px 32px' }}>
            <Text style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>
              IV Therapy Canada · ivtherapycanada.ca · You&apos;re receiving this because you submitted a quote request.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default LeadConfirmationEmail
