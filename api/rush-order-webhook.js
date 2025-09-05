export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    const {
      event_date,
      delivery_date,
      products,
      name,
      email,
      phone,
      billing_address_1,
      billing_address_2,
      billing_city,
      billing_state,
      billing_zip,
      billing_country,
      shipping_address_1,
      shipping_address_2,
      shipping_city,
      shipping_state,
      shipping_zip,
      shipping_country
    } = req.body;

    // Create email content
    const subject = `RUSH ORDER REQUEST - Event: ${event_date}`;
    
    let message = "RUSH ORDER REQUEST\n\n";
    message += `Event Date: ${event_date}\n`;
    message += `Delivery Date: ${delivery_date}\n`;
    message += `Customer: ${name}\n`;
    message += `Email: ${email}\n`;
    message += `Phone: ${phone}\n`;
    message += `Products: ${products}\n\n`;
    
    message += "BILLING ADDRESS:\n";
    message += `${billing_address_1}\n`;
    if (billing_address_2) message += `${billing_address_2}\n`;
    message += `${billing_city}, ${billing_state} ${billing_zip}\n`;
    message += `${billing_country}\n\n`;
    
    message += "SHIPPING ADDRESS:\n";
    message += `${shipping_address_1}\n`;
    if (shipping_address_2) message += `${shipping_address_2}\n`;
    message += `${shipping_city}, ${shipping_state} ${shipping_zip}\n`;
    message += `${shipping_country}\n`;

    // SendGrid API call
    const data = {
      personalizations: [{
        to: [{ email: 'cservice@fiftyflowers.com' }],
        subject: subject
      }],
      from: {
        email: 'baylorharrison@fiftyflowers.com',
        name: 'Rush Order System'
      },
      reply_to: {
        email: email,
        name: name
      },
      content: [{
        type: 'text/plain',
        value: message
      }]
    };

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ success: false, message: 'API key not configured' });
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        return res.status(200).json({ success: true, message: 'Email sent successfully' });
      } else {
        const errorText = await response.text();
        return res.status(500).json({ success: false, message: 'Failed to send email', details: errorText });
      }
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
  } else {
    return res.status(405).json({ success: false, message: 'Only POST method allowed' });
  }
}
