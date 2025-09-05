export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log('=== VERCEL DEBUG START ===');
  console.log('Method:', req.method);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Body type:', typeof req.body);
  console.log('Body content:', req.body);
  console.log('Raw body keys:', req.body ? Object.keys(req.body) : 'no body');
  console.log('=== VERCEL DEBUG END ===');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      // Parse multipart form data manually
      const body = req.body;
      let formData = {};

      console.log('=== PARSING DEBUG ===');
      console.log('Body is string?', typeof body === 'string');
      console.log('Contains WebKit?', typeof body === 'string' && body.includes('WebKitFormBoundary'));

      if (typeof body === 'string' && body.includes('WebKitFormBoundary')) {
        console.log('Parsing as multipart form data...');
        // Parse multipart form data
        const boundary = body.match(/------WebKitFormBoundary\w+/)[0];
        console.log('Found boundary:', boundary);
        
        const parts = body.split(boundary);
        console.log('Split into', parts.length, 'parts');
        
        for (let i = 0; i < parts.length; i++) {
          const part = parts[i];
          const nameMatch = part.match(/name="([^"]+)"/);
          if (nameMatch) {
            const fieldName = nameMatch[1];
            const valueMatch = part.split('\r\n\r\n')[1];
            if (valueMatch) {
              const value = valueMatch.split('\r\n')[0];
              formData[fieldName] = value;
              console.log(`Extracted ${fieldName}: "${value}"`);
            }
          }
        }
      } else if (typeof body === 'object') {
        console.log('Using body as object directly');
        formData = body;
      }

      console.log('Final parsed formData:', formData);
      console.log('=== END PARSING DEBUG ===');

      // Extract data
      const eventDate = formData.event_date || '';
      const deliveryDate = formData.delivery_date || '';
      const products = formData.products || '';
      const name = formData.name || '';
      const email = formData.email || '';
      const phone = formData.phone || '';

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
            bodyType: typeof body,
            bodyKeys: body ? Object.keys(body) : 'no body'
          }
        });
      }

      // If we get here, validation passed
      console.log('VALIDATION PASSED - proceeding with email');

      // Rest of your SendGrid code...
      return res.status(200).json({ 
        success: true, 
        message: 'Would send email (debugging mode)' 
      });

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
