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
      // Read raw body since req.body is undefined
      const getRawBody = () => {
        return new Promise((resolve) => {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk.toString();
          });
          req.on('end', () => {
            resolve(body);
          });
        });
      };

      const rawBody = await getRawBody();
      console.log('=== RAW BODY DEBUG ===');
      console.log('Raw body length:', rawBody.length);
      console.log('Raw body preview:', rawBody.substring(0, 200));
      console.log('=== END RAW BODY DEBUG ===');

      let formData = {};

      if (rawBody && rawBody.includes('WebKitFormBoundary')) {
        console.log('Parsing multipart form data from raw body...');
        
        // Extract boundary
        const boundaryMatch = rawBody.match(/------WebKitFormBoundary\w+/);
        if (boundaryMatch) {
          const boundary = boundaryMatch[0];
          console.log('Found boundary:', boundary);
          
          const parts = rawBody.split(boundary);
          console.log('Split into', parts.length, 'parts');
          
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const nameMatch = part.match(/name="([^"]+)"/);
            if (nameMatch) {
              const fieldName = nameMatch[1];
              const valueStart = part.indexOf('\r\n\r\n');
              if (valueStart !== -1) {
                const valueSection = part.substring(valueStart + 4);
                const valueEnd = valueSection.indexOf('\r\n');
                const value = valueEnd !== -1 ? valueSection.substring(0, valueEnd) : valueSection;
                formData[fieldName] = value;
                console.log(`Extracted ${fieldName}: "${value}"`);
              }
            }
          }
        }
      }

      console.log('Final parsed formData:', formData);

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

      console.log('=== EXTRACTED VALUES ===');
      console.log('name:', `"${name}"`);
      console.log('email:', `"${email}"`);
      console.log('eventDate:', `"${eventDate}"`);
      console.log('=== END EXTRACTED VALUES ===');

      // Check required fields
      if (!name || !email) {
        console.log('VALIDATION FAILED - Missing required fields');
        return res.status(400).json({ 
          success: false, 
          message: `Missing required fields. Name: "${name}", Email: "${email}"`,
          debug: {
            formData,
            rawBodyLength: rawBody.length,
            hasData: rawBody.includes('WebKitFormBoundary')
          }
        });
      }

      // If we get here, validation passed
      console.log('VALIDATION PASSED - proceeding with email');

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
      
      console.log('=== SENDGRID DEBUG ===');
      console.log('SendGrid response status:', response.status);
      console.log('SendGrid response ok:', response.ok);
      console.log('API Key exists:', !!apiKey);
      console.log('API Key length:', apiKey ? apiKey.length : 0);
      console.log('Email data:', JSON.stringify(data, null, 2));
      console.log('=== END SENDGRID DEBUG ===');
      
      if (response.ok) {
        console.log('SUCCESS: Email sent via SendGrid');
        return res.status(200).json({ 
          success: true, 
          message: 'Email sent successfully' 
        });
      } else {
        const errorText = await response.text();
        console.log('SENDGRID ERROR:', errorText);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to send email', 
          details: errorText,
          status: response.status
        });
      }

    } catch (error) {
      console.error('=== ERROR ===');
      console.error('Error details:', error);
      console.error('Stack:', error.stack);
      console.error('=== END ERROR ===');
      
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
