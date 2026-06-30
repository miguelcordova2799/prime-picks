const PLANS = {
  prime: { title: 'Prime Picks - Acceso Completo', unit_price: 399, currency_id: 'MXN' },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://primepicks.mx')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { planId, userEmail } = req.body || {}
  const plan = PLANS[planId]
  if (!plan) return res.status(400).json({ error: 'Invalid planId' })
  if (!userEmail) return res.status(400).json({ error: 'Missing userEmail' })

  try {
    const mpRes = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [{
          title: plan.title,
          unit_price: plan.unit_price,
          quantity: 1,
          currency_id: plan.currency_id,
        }],
        payer: { email: userEmail },
        back_urls: {
          success: 'https://primepicks.mx/dashboard',
          failure: 'https://primepicks.mx/login',
          pending: 'https://primepicks.mx/dashboard',
        },
        auto_return: 'approved',
      }),
    })

    const data = await mpRes.json()
    if (!mpRes.ok) {
      console.error('MP API error:', data)
      return res.status(502).json({ error: 'MercadoPago error' })
    }

    return res.status(200).json({ init_point: data.init_point })
  } catch (err) {
    console.error('create-preference error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
