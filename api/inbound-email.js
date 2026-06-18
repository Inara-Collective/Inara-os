import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  )

  const { From, FromFull, To, ToFull, Subject, TextBody, Date: sentAt } = req.body

  // Collect all recipient emails from the parsed To field
  const toEmails = (ToFull || []).map(t => t.Email?.toLowerCase()).filter(Boolean)
  if (!toEmails.length && To) toEmails.push(To.toLowerCase())

  // Find matching client by contact email
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .in('contact_email', toEmails)
    .maybeSingle()

  if (!client) return res.status(200).json({ ok: true, message: 'No client match' })

  await supabase.from('client_emails').insert({
    client_id: client.id,
    subject: Subject,
    body: TextBody,
    to_email: To,
    from_email: From,
    logged_by: FromFull?.Name || From,
    sent_at: sentAt || new Date().toISOString()
  })

  res.status(200).json({ ok: true })
}
