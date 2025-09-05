<?php
// Enable CORS for your Shopify domain
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    
    // Get form data
    $eventDate = $_POST['event_date'] ?? '';
    $deliveryDate = $_POST['delivery_date'] ?? '';
    $products = $_POST['products'] ?? '';
    $name = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $phone = $_POST['phone'] ?? '';
    $billingAddress1 = $_POST['billing_address_1'] ?? '';
    $billingAddress2 = $_POST['billing_address_2'] ?? '';
    $billingCity = $_POST['billing_city'] ?? '';
    $billingState = $_POST['billing_state'] ?? '';
    $billingZip = $_POST['billing_zip'] ?? '';
    $billingCountry = $_POST['billing_country'] ?? '';
    $shippingAddress1 = $_POST['shipping_address_1'] ?? '';
    $shippingAddress2 = $_POST['shipping_address_2'] ?? '';
    $shippingCity = $_POST['shipping_city'] ?? '';
    $shippingState = $_POST['shipping_state'] ?? '';
    $shippingZip = $_POST['shipping_zip'] ?? '';
    $shippingCountry = $_POST['shipping_country'] ?? '';
    
    // Create email content
    $subject = "RUSH ORDER REQUEST - Event: " . $eventDate;
    
    $message = "RUSH ORDER REQUEST\n\n";
    $message .= "Event Date: " . $eventDate . "\n";
    $message .= "Delivery Date: " . $deliveryDate . "\n";
    $message .= "Customer: " . $name . "\n";
    $message .= "Email: " . $email . "\n";
    $message .= "Phone: " . $phone . "\n";
    $message .= "Products: " . $products . "\n\n";
    
    $message .= "BILLING ADDRESS:\n";
    $message .= $billingAddress1 . "\n";
    if ($billingAddress2) $message .= $billingAddress2 . "\n";
    $message .= $billingCity . ", " . $billingState . " " . $billingZip . "\n";
    $message .= $billingCountry . "\n\n";
    
    $message .= "SHIPPING ADDRESS:\n";
    $message .= $shippingAddress1 . "\n";
    if ($shippingAddress2) $message .= $shippingAddress2 . "\n";
    $message .= $shippingCity . ", " . $shippingState . " " . $shippingZip . "\n";
    $message .= $shippingCountry . "\n";
    
    // SendGrid API call
    $data = array(
        'personalizations' => array(
            array(
                'to' => array(
                    array('email' => 'cservice@fiftyflowers.com')
                ),
                'subject' => $subject
            )
        ),
        'from' => array(
            'email' => 'baylorharrison@fiftyflowers.com',
            'name' => 'Rush Order System'
        ),
        'reply_to' => array(
            'email' => $email,
            'name' => $name
        ),
        'content' => array(
            array(
                'type' => 'text/plain',
                'value' => $message
            )
        )
    );
    
    // Store your API key as environment variable for security
    $apiKey = getenv('SENDGRID_API_KEY');

    if (!$apiKey) {
        echo json_encode(['success' => false, 'message' => 'API key not configured']);
        exit();
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.sendgrid.com/v3/mail/send');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        'Authorization: Bearer ' . $apiKey,
        'Content-Type: application/json'
    ));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode >= 200 && $httpCode < 300) {
        echo json_encode(['success' => true, 'message' => 'Email sent successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to send email', 'details' => $response]);
    }
    
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
}
?>
