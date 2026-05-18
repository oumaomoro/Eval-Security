import { storage } from "./storage.js";
import { adminClient } from "./services/supabase.js";
import { randomUUID } from "crypto";

/**
 * SEED MARKETPLACE DATA
 * 
 * Populates the marketplace with premium cybersecurity insurance and DPA clauses.
 */
export async function seedMarketplace() {
  console.log("[SEED] Checking marketplace listings...");
  
  const existing = await storage.getMarketplaceListings();
  if (existing.length > 0) {
    console.log("[SEED] Marketplace already seeded.");
    return;
  }

  // Ensure System User exists for Marketplace attribution (Phase 34 Resilience)
  const systemUserId = "00000000-0000-0000-0000-000000000000";
  const systemUser = await storage.getUser(systemUserId);
  
  if (!systemUser) {
    console.log("[SEED] Creating System Identity for Marketplace...");
    
    // Phase 35: Create user in Supabase Auth first to satisfy FK constraints in Profiles
    try {
      const { data: authUser, error: authError } = await adminClient.auth.admin.createUser({
        id: systemUserId,
        email: "system@costloci.com",
        password: randomUUID(), // Random password for system user
        email_confirm: true,
        user_metadata: { firstName: "Costloci", lastName: "System" }
      });

      if (authError && !authError.message.includes("already exists")) {
        console.warn("[SEED] Auth User creation failed:", authError.message);
      }
    } catch (e: any) {
      console.warn("[SEED] Auth creation error:", e.message);
    }

    await storage.createUser({
      id: systemUserId,
      email: "system@costloci.com",
      firstName: "Costloci",
      lastName: "System",
      role: "admin",
      subscriptionTier: "enterprise"
    }).catch(e => console.warn("[SEED] Profile creation error (might already exist):", e.message));
  }

  const seedListings = [
    {
      title: "Enterprise Cybersecurity Liability Addendum (2024 Edition)",
      description: "A battle-hardened cyber liability addendum covering data breach notification, forensic investigation costs, and ransomware indemnification. vetted for EU and US jurisdictions.",
      category: "Liability",
      content: "LIMITATION OF LIABILITY. In no event shall either party's aggregate liability arising out of or related to this Addendum, whether in contract, tort, or under any other theory of liability, exceed $5,000,000. NOTIFICATION: Vendor shall notify Client of any Security Incident within 24 hours of discovery...",
      price: 249.00,
      isVerified: true
    },
    {
      title: "KDPA Compliant Data Processing Agreement (DPA)",
      description: "A comprehensive DPA specifically tailored for the Kenya Data Protection Act (KDPA). Includes mandatory processor obligations and sub-processor constraints.",
      category: "Privacy",
      content: "DATA PROTECTION OBLIGATIONS. Processor shall process Personal Data only for the purposes outlined in Annex A and in accordance with the Data Protection Act 2019. Processor shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk...",
      price: 199.00,
      isVerified: true
    },
    {
      title: "SaaS Business Continuity & Escrow Clause",
      description: "Premium clause requiring the vendor to maintain an active source code escrow and providing continuity of service in the event of insolvency.",
      category: "Continuity",
      content: "BUSINESS CONTINUITY. Vendor represents that it has established a comprehensive business continuity and disaster recovery plan. In the event Vendor ceases operations, Vendor shall provide Client with a 180-day bridge license and access to all customer data in a machine-readable format...",
      price: 129.00,
      isVerified: false
    },
    {
       title: "AI & LLM Data Usage Opt-Out Amendment",
       description: "Restricts SaaS vendors from using customer data to train large language models or other AI systems without explicit consent.",
       category: "AI Governance",
       content: "AI MODEL TRAINING. Vendor explicitly agrees that Customer Data shall not be used for the purpose of training, fine-tuning, or otherwise improving any AI models, machine learning algorithms, or large language models (LLMs) used by the Vendor or its sub-processors...",
       price: 149.00,
       isVerified: true
    },
    {
       title: "ISO 27001:2022 Statement of Applicability (SoA) Builder",
       description: "A dynamic framework for mapping your organizational security controls against the ISO 27001:2022 Annex A requirements. Includes automated gap analysis logic.",
       category: "ISO 27001",
       content: "STATEMENT OF APPLICABILITY. This document identifies the controls from Annex A of ISO/IEC 27001:2022 that are applicable to the organization's ISMS scope. For each control, the justification for inclusion or exclusion is documented, along with the current implementation status...",
       price: 299.00,
       isVerified: true
    },
    {
       title: "Business Impact Analysis (BIA) Framework - Financial Tier",
       description: "Executive-grade BIA template tailored for financial institutions under CBK (Kenya) and SARB (South Africa) operational resilience guidelines.",
       category: "Resilience",
       content: "OPERATIONAL RESILIENCE. This framework establishes the RTO (Recovery Time Objective) and RPO (Recovery Point Objective) for all critical business functions. It prioritizes recovery based on systemic importance and potential impact on financial stability...",
       price: 349.00,
       isVerified: true
    },
    {
       title: "Managed Security Provider (MSSP) Vetting Questionnaire",
       description: "Comprehensive 150-point security assessment for outsourcing security operations. Vetted for shared responsibility clarity and audit rights.",
       category: "TPRM",
       content: "THIRD-PARTY RISK ASSESSMENT. Service Provider shall respond to all inquiries regarding its security posture, including but not limited to: encryption standards, identity management, physical security of data centers, and employee background vetting protocols...",
       price: 89.00,
       isVerified: false
    }
  ];

  for (const item of seedListings) {
    await storage.createMarketplaceListing({
      workspaceId: 1, // Default system workspace
      sellerId: "00000000-0000-0000-0000-000000000000",
      title: item.title,
      description: item.description,
      category: item.category,
      content: item.content,
      price: item.price,
      currency: "USD",
      rating: 5,
      salesCount: Math.floor(Math.random() * 50),
      isVerified: item.isVerified
    });
    console.log(`[SEED] Created listing: ${item.title}`);
  }
  
  console.log("[SEED] Marketplace seeding complete.");
}
