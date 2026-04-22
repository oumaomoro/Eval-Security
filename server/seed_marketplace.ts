import { storage } from "./storage";
import { storageContext } from "./services/storageContext";

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
