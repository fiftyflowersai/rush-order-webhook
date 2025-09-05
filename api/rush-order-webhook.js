export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      // Parse multipart form data manually
      const body = req.body;
      let formData = {};

      if (typeof body === 'string' && body.includes('WebKitFormBoundary')) {
        // Parse multipart form data
        const boundary = body.match(/------WebKitFormBoundary\w+/)[0];
        const parts = body.split(boundary);
        
        for (const part of parts) {
          const nameMatch = part.match(/name="([^"]+)"/);
          if (nameMatch) {
            const fieldName = nameMatch[1];
            const valueMatch = part.split('\r\n\r\n')[1];
            if (valueMatch) {
              const value = valueMatch.split('\r\n')[0];
              formData[fieldName] = value;
            }
          }
        }
      } else if (typeof body === 'object') {
        formData = body;
      }

      console.log('Parsed form data:', formData);

      // Extract data
      const eventDate = formData.event_date || '';
      const deliveryDate = formData.delivery_date || '';
      const products = formData.products || '';
      const name = formData.name || '';
      const email = formData.email || '';
      const phone = formData.phone || '';
      const billingAddress1 = formData.billing_address_1 || '';
      const billingAddress2 = formData.billing_address_2 || '';
      const billingCity = formData.billing_city || '';
      const billingState = formData.billing_state || '';
      const billingZip = formData.billing_zip || '';
      const billingCountry = formData.billing_country || '';
      const shippingAddress1 = formData.shipping_address_1 || '';
      const shippingAddress2 = formData.shipping_address_2 || '';
      const shippingCity = formData.shipping_city || '';
      const shippingState = formData.shipping_state || '';
      const shippingZip = formData.shipping_zip || '';
      const shippingCountry = formData.shipping_country || '';

      console.log('Extracted name:', name, 'email:', email);

      // Check required fields
      if (!name || !email) {
        return res.status(400).json({ 
          success: false, 
          message: `Missing required fields. Name: "${name}", Email: "${email}"`,
          debug: formData
        });
      }

      // Create email content
      const subject = `RUSH ORDER REQUEST - Event: ${eventDate}`;
      
      let message = "RUSH ORDER REQUEST\n\n";
      message += `Event Date: ${eventDate}\n`;
      message += `Delivery Date: ${deliveryDate}\n`;
      message += `Customer: ${name}\n`;
      message += `Email: ${email}\n`;
      message += `Phone: ${phone}\n`;
      message += `Products: ${products}\n\n`;
      
      message += "BILLING ADDRESS:\n";
      message += `${billingAddress1}\n`;
      if (billingAddress2) message += `${billingAddress2}\n`;
      message += `${billingCity}, ${billingState} ${billingZip}\n`;
      message += `${billingCountry}\n\n`;
      
      message += "SHIPPING ADDRESS:\n";
      message += `${shippingAddress1}\n`;
      if (shippingAddress2) message += `${shippingAddress2}\n`;
      message += `${shippingCity}, ${shippingState} ${shippingZip}\n`;
      message += `${shippingCountry}\n`;

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
        return res.status(500).json({ 
          success: false, 
          message: 'SendGrid API key not configured' 
        });
      }

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        return res.status(200).json({ 
          success: true, 
          message: 'Email sent successfully' 
        });
      } else {
        const errorText = await response.text();
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send email', 
          details: errorText 
        });
      }
    } catch (error) {
      console.error('Error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: error.message 
      });
    }
  } else {
    return res.status(405).json({ 
      success: false, 
      message: 'Only POST method allowed' 
    });
  }
}
