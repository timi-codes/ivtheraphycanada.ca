import {
  Html, Head, Body, Container, Heading, Text, Hr, Section, Row, Column,
} from '@react-email/components'

interface NewLeadEmailProps {
  vendorName: string
  leadName: string
  leadEmail: string
  leadPhone?: string
  serviceType?: string
  city: string
  province?: string
  message?: string
}

export function NewLeadEmail({
  vendorName,
  leadName,
  leadEmail,
  leadPhone,
  serviceType,
  city,
  province,
  message,
}: NewLeadEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#f9fafb', fontFamily: 'Arial, sans-serif' }}>
        <Container style={{ maxWidth: '560px', margin: '40px auto', backgroundColor: '#ffffff', borderRadius: '12px', overflow: 'hidden' }}>
          <Section style={{ backgroundColor: '#1E1E2C', padding: '24px 32px' }}>
            <Heading style={{ color: '#ffffff', margin: 0, fontSize: '20px' }}>
              New Lead — IV Therapy Canada
            </Heading>
          </Section>
          <Section style={{ padding: '32px' }}>
            <Text style={{ color: '#374151', marginBottom: '16px' }}>
              Hi <strong>{vendorName}</strong>, you have a new lead from IV Therapy Canada!
            </Text>
            <Hr style={{ borderColor: '#e5e7eb', marginBottom: '24px' }} />
            <Row>
              <Column>
                <Text style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>NAME</Text>
                <Text style={{ color: '#111827', fontWeight: 'bold', marginTop: 0 }}>{leadName}</Text>
              </Column>
              <Column>
                <Text style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>EMAIL</Text>
                <Text style={{ color: '#1E1E2C', marginTop: 0 }}>{leadEmail}</Text>
              </Column>
            </Row>
            {leadPhone && (
              <Row>
                <Column>
                  <Text style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>PHONE</Text>
                  <Text style={{ color: '#111827', marginTop: 0 }}>{leadPhone}</Text>
                </Column>
              </Row>
            )}
            <Row>
              <Column>
                <Text style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>LOCATION</Text>
                <Text style={{ color: '#111827', marginTop: 0 }}>{city}{province ? `, ${province}` : ''}</Text>
              </Column>
              {serviceType && (
                <Column>
                  <Text style={{ color: '#6b7280', fontSize: '12px', marginBottom: '2px' }}>SERVICE</Text>
                  <Text style={{ color: '#111827', marginTop: 0 }}>{serviceType.replace(/_/g, ' ')}</Text>
                </Column>
              )}
            </Row>
            {message && (
              <>
                <Hr style={{ borderColor: '#e5e7eb', margin: '16px 0' }} />
                <Text style={{ color: '#6b7280', fontSize: '12px', marginBottom: '4px' }}>MESSAGE</Text>
                <Text style={{ color: '#374151', backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', marginTop: 0 }}>
                  {message}
                </Text>
              </>
            )}
            <Hr style={{ borderColor: '#e5e7eb', margin: '24px 0' }} />
            <Text style={{ color: '#6b7280', fontSize: '12px' }}>
              Respond promptly — leads that get a reply within 1 hour are 7x more likely to convert.
            </Text>
          </Section>
          <Section style={{ backgroundColor: '#f9fafb', padding: '16px 32px' }}>
            <Text style={{ color: '#9ca3af', fontSize: '11px', margin: 0 }}>
              IV Therapy Canada · ivtherapycanada.ca
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default NewLeadEmail
