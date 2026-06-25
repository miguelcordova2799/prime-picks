import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { type, data } = req.body || {}

  // MP also sends 'merchant_order' and other types — only handle payments
  if (type !== 'payment') return res.status(200).end()

  const paymentId = data?.id
  if (!paymentId) return res.status(400).json({ error: 'Missing payment id' })

  try {
    // Verify payment status with MP API
    const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    })

    if (!mpRes.ok) return res.status(502).json({ error: 'MP API error' })

    const payment = await mpRes.json()

    // Only activate subscription on approved payments
    if (payment.status !== 'approved') {
      return res.status(200).json({ skipped: true, status: payment.status })
    }

    const email = payment.payer?.email
    if (!email) return res.status(400).json({ error: 'No payer email in payment' })

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    )

    const subEnd = new Date()
    subEnd.setDate(subEnd.getDate() + 30)

    const { error } = await supabase
      .from('profiles')
      .update({
        subscription_status: 'active',
        subscription_end: subEnd.toISOString(),
      })
      .eq('email', email)

    if (error) {
      console.error('Supabase update error:', error)
      return res.status(500).json({ error: 'DB update failed' })
    }

    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Webhook handler error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
