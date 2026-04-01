/**
 * Costloci Branding Configuration - PRODUCTION
 * 
 * Edit this file to change the Application Name, Logo, Colors, and Metadata
 * across the entire platform without modifying individual components.
 */

export const BrandingConfig = {
  // Appearance & Identity
  appName: 'Costloci',
  tagline: 'AI-Powered Cybersecurity Contract Intelligence',
  logoUrl: '/logo.png', 
  primaryColor: '#06B6D4', // Cyan/Teal focus as requested
  secondaryColor: '#f8fafc', // Slate-50
  
  // Contact & Support
  supportEmail: 'support@costloci.com',
  salesEmail: 'sales@costloci.com',
  
  // Legal & Meta
  companyName: 'Costloci Inc.',
  copyrightYear: new Date().getFullYear(),
  
  // Social & Domain
  domain: 'app.costloci.com',
  version: '1.0.0-PROD',
  
  // Theme Overrides
  enableDarkMode: true,
  defaultTheme: 'light',
};

export default BrandingConfig;
