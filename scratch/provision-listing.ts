import "dotenv/config";
import { storage } from "../server/storage";
import { marketplaceListings } from "../shared/schema";
import { db } from "../server/db";
import { eq } from "drizzle-orm";

async function provisionListing() {
  const title = "Cyber Resilience Pack 2026";
  console.log(`Checking for listing: ${title}...`);

  try {
    const existing = await db.select().from(marketplaceListings).where(eq(marketplaceListings.title, title)).limit(1);
    
    if (existing.length > 0) {
      console.log("✅ Listing already exists.");
      return;
    }

    console.log("Provisioning new listing...");
    // Use an existing user or create a placeholder if needed.
    // We'll use the ID from the previous listing check as a fallback.
    const sellerId = "9dd97f9a-902e-4fc5-8ea4-d8f98c031eab"; 

    await storage.createMarketplaceListing({
      sellerId,
      workspaceId: 1, // System workspace
      title,
      description: "Comprehensive enterprise template bundle for 2026 cyber compliance.",
      category: "compliance_bundle",
      content: "This bundle contains 15+ pre-approved legal clauses and operational checklists.",
      price: 299.00,
      currency: "USD",
      rating: 5,
      salesCount: 12,
      isVerified: true
    });

    console.log("✅ Listing provisioned successfully.");
  } catch (err: any) {
    console.error("❌ Provisioning failed:", err.message);
  }
}

provisionListing();
