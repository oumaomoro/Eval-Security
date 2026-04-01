export const WELCOME_EMAIL_TEMPLATE = (fullName) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Welcome to Costloci, ${fullName || 'Optimizor'}! 🚀</h2>
    <p>We are thrilled to help you analyze, streamline, and protect your vendor contracts using intelligent automation.</p>
    <p><strong>Quick Start Guide:</strong></p>
    <ul>
      <li>Upload your first PDF contract to the "Analyze" tab.</li>
      <li>Review the risk score and compliance gaps in seconds.</li>
      <li>Export your findings as a Strategic Pack for your upcoming negotiation.</li>
    </ul>
    <a href="https://costloci.com/contracts/new" class="button">Upload Your First Contract</a>
    <p style="margin-top: 30px; font-size: 13px; color: #64748b;">If you need help, simply reply to this email.</p>
  </div>
</body>
</html>
`;

export const DAY_3_ONBOARDING_TEMPLATE = (fullName) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
    .button { background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 20px; }
    .video-box { border: 2px dashed #cbd5e1; padding: 20px; border-radius: 12px; background-color: #f8fafc; cursor: pointer; }
  </style>
</head>
<body>
  <div class="container">
    <h2>How to Analyze Your First Contract 🎥</h2>
    <p>Hi ${fullName || 'Optimizor'}, we want to make sure you get the most out of Costloci.</p>
    <div class="video-box">
      <p style="color: #64748b;">[Video Guide: Analyzing Vendor Agreements]</p>
      <a href="https://costloci.com/guides/upload" class="button">Watch 2-Minute Tutorial</a>
    </div>
    <p>Ready to try it yourself? Upload a vendor agreement today and instantly discover your compliance posture.</p>
    <a href="https://costloci.com/dashboard" class="button">Go to Dashboard</a>
  </div>
</body>
</html>
`;

export const DAY_7_DEMO_TEMPLATE = (fullName) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background-color: #10b981; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Join Our Exclusive Live Demo 🛠️</h2>
    <p>Hi ${fullName || 'Optimizor'}, you've been using Costloci for a week—how is it going?</p>
    <p>We're hosting a live "Strategic Mastery" webinar this week to show you how to leverage AI for complex contract negotiations and vendor cost optimization.</p>
    <ul>
      <li>Advanced risk score interpretation</li>
      <li>Custom clause library management</li>
      <li>Automated ROI reporting</li>
    </ul>
    <a href="https://costloci.com/webinars/demo" class="button">Save My Spot</a>
  </div>
</body>
</html>
`;

export const DAY_12_TRIAL_TEMPLATE = (fullName) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .warning { color: #dc2626; font-weight: bold; }
    .button { background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Final Call: Your Trial is Ending Soon ⏳</h2>
    <p>Hi ${fullName || 'Optimizor'}, your Costloci Professional trial will expire in <span class="warning">48 hours</span>.</p>
    <p>To avoid losing access to your AI analytics, cost optimization reports, and advanced clause tracking, please upgrade your account today.</p>
    <p><strong>Use code PRO20 for 20% off your first 3 months!</strong></p>
    <a href="https://costloci.com/billing" class="button">Upgrade My Account</a>
  </div>
</body>
</html>
`;

export const PASSWORD_RESET_TEMPLATE = (resetLink) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button { background-color: #2563eb; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Reset Your Costloci Password 🔐</h2>
    <p>We received a request to reset the password for your Costloci account. Click the button below to choose a new one:</p>
    <a href="${resetLink}" class="button">Reset Password</a>
    <p style="margin-top: 30px; font-size: 13px; color: #64748b;">If you didn't request this, you can safely ignore this email. This link will expire in 2 hours.</p>
  </div>
</body>
</html>
`;

