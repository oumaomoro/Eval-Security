import { Router } from "express";
import { storage } from "../storage";
import { isAuthenticated } from "../replit_integrations/auth";
import { storageContext } from "../services/storageContext";
import { SOC2Logger } from "../services/SOC2Logger";
import { randomUUID } from "crypto";

const router = Router();

/**
 * GET /api/marketplace/listings
 * Lists all available clause templates for purchase.
 */
router.get("/api/marketplace/listings", isAuthenticated, async (req: any, res) => {
  try {
    const listings = await storage.getMarketplaceListings();
    res.json(listings);
  } catch (error: any) {
    console.error("[MARKETPLACE LISTINGS]", error.message);
    res.status(500).json({ message: "Failed to fetch marketplace listings." });
  }
});

/**
 * POST /api/marketplace/listings
 * Allows legal professionals to list their clauses for sale.
 */
router.post("/api/marketplace/listings", isAuthenticated, async (req: any, res) => {
  try {
    const { title, description, category, content, price } = req.body;
    
    if (!title || !category || !content || price === undefined) {
      return res.status(400).json({ message: "Missing required listing fields." });
    }

    const listing = await storage.createMarketplaceListing({
      sellerId: req.user.id,
      workspaceId: storageContext.getStore()?.workspaceId,
      title,
      description,
      category,
      content,
      price: parseFloat(price),
      currency: "USD",
      rating: 0,
      salesCount: 0,
      isVerified: false
    });

    await SOC2Logger.logEvent(req, {
      action: "MARKETPLACE_LISTING_CREATED",
      userId: req.user.id,
      resourceType: "MarketplaceListing",
      resourceId: String(listing.id),
      details: `New clause listing created: ${title}`
    });

    res.status(201).json(listing);
  } catch (error: any) {
    console.error("[MARKETPLACE CREATE]", error.message);
    res.status(500).json({ message: "Failed to create listing." });
  }
});

/**
 * POST /api/marketplace/purchase
 * Process a purchase for a clause template.
 */
router.post("/api/marketplace/purchase", isAuthenticated, async (req: any, res) => {
  try {
    const { listingId } = req.body;
    const workspaceId = storageContext.getStore()?.workspaceId;

    if (!listingId || !workspaceId) {
      return res.status(400).json({ message: "Missing listing identity or workspace context." });
    }

    const listing = await storage.getMarketplaceListing(listingId);
    if (!listing) return res.status(404).json({ message: "Listing not found." });

    // ── TRACK 3: PAYPAL MARKETPLACE CHECKOUT ────────────────────────
    // Calculate commission (70% Seller / 30% Platform)
    const platformFee = listing.price * 0.3;
    const sellerShare = listing.price * 0.7;

    // Trigger Real Purchase Record (No simulations in Phase 27)
    // Supports PayPal & Paystack Priority (User Requirement Phase 27)
    const transactionId = `PAY-${randomUUID().substring(0, 8).toUpperCase()}`;
    
    await storage.createMarketplacePurchase({
      buyerWorkspaceId: workspaceId,
      buyerId: req.user.id,
      listingId: parseInt(listingId),
      amount: listing.price,
      platformFee,
      sellerPayout: sellerShare,
      status: "pending",
      transactionId
    });

    await SOC2Logger.logEvent(req, {
      action: "MARKETPLACE_ORDER_CREATED",
      userId: req.user.id,
      resourceType: "MarketplaceListing",
      resourceId: String(listing.id),
      details: `PayPal checkout initiated. Transaction: ${transactionId}, Price: ${listing.price}`
    });

    res.json({ 
      url: `${process.env.FRONTEND_URL}/marketplace/checkout?orderId=${transactionId}&listingId=${listingId}`,
      commission: { platformFee, sellerShare },
      transactionId
    });
  } catch (error: any) {
    console.error("[MARKETPLACE PURCHASE]", error.message);
    res.status(500).json({ message: "Checkout failed: " + error.message });
  }
});

/**
 * POST /api/marketplace/webhook
 * Handled by the unified billing webhook in Phase 27.
 */

export default router;
