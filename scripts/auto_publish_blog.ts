import fs from "fs";
import path from "path";

/**
 * Automated Blog Generator & Publisher for Costloci
 *
 * Usage:
 *   npx tsx scripts/auto_publish_blog.ts --topic="ISO 27001 Vendor Audit"
 *   npm run blog:generate
 */

interface NewPostInput {
  slug: string;
  title: string;
  excerpt: string;
  category: "KDPA Compliance" | "Cyber Insurance" | "Cost Optimization" | "FinTech Governance";
  readTime: string;
  authorName: string;
  authorRole: string;
  tags: string[];
  keyTakeaways: string[];
  sections: Array<{
    heading: string;
    paragraphs: string[];
    callout?: string;
    bulletPoints?: string[];
    clauseExample?: {
      badClause: string;
      goodClause: string;
      explanation: string;
    };
  }>;
  externalSources: Array<{
    title: string;
    url: string;
    publisher: string;
    description?: string;
  }>;
  leadMagnet: {
    title: string;
    description: string;
    ctaText: string;
    ctaLink: string;
  };
}

const TEMPLATE_TOPICS: NewPostInput[] = [
  {
    slug: "iso27001-annex-a-supplier-contracts",
    title: "ISO 27001:2022 Annex A.5.19 to A.5.23: Mandating Information Security in Supplier Relationships",
    excerpt: "How to draft, verify, and monitor supplier agreements to satisfy ISO/IEC 27001:2022 supplier security control requirements.",
    category: "FinTech Governance",
    readTime: "7 min read",
    authorName: "Adv. Brian Omwamba",
    authorRole: "Lead Regulatory Counsel, Costloci Intelligence",
    tags: ["ISO 27001", "Annex A", "Supplier Security", "Third-Party Risk", "InfoSec Governance"],
    keyTakeaways: [
      "ISO 27001:2022 requires organizations to establish and document security requirements across the entire vendor lifecycle (A.5.19).",
      "Supplier contracts must explicitly specify data handling, access controls, incident response obligations, and audit rights (A.5.20).",
      "ICT supply chain agreements must include provisions for cascading security requirements to sub-processors (A.5.21).",
      "Costloci automates the continuous monitoring and clause verification required by ISO 27001 Annex A.5.22."
    ],
    sections: [
      {
        heading: "1. The 2022 Revision of ISO 27001 Supplier Controls",
        paragraphs: [
          "The 2022 update of ISO/IEC 27001 restructured the supplier relationship controls under Controls A.5.19 through A.5.23. Organizations can no longer rely on informal assurances or generic confidentiality agreements.",
          "Auditors now require formal evidence that information security requirements have been identified, communicated, and contractually agreed upon prior to granting suppliers access to organizational assets."
        ],
        callout: "Clause A.5.20 mandates that all relevant information security requirements shall be established and agreed with each supplier."
      },
      {
        heading: "2. Structuring Cascading Sub-Processor Terms (A.5.21)",
        paragraphs: [
          "Modern software suppliers rarely host infrastructure themselves. Most rely on tier-1 cloud providers and third-party API services.",
          "Under Control A.5.21, contracts must require suppliers to monitor their own technology supply chains and ensure equivalent safeguards are enforced downstream."
        ],
        clauseExample: {
          badClause: "Vendor may engage subcontractors at its discretion without prior notice to Customer.",
          goodClause: "Vendor shall not engage any third-party sub-processor without prior written authorization from Customer. Vendor guarantees that all sub-processors are bound by security and data protection obligations no less restrictive than those set forth in this Agreement, in accordance with ISO/IEC 27001:2022 Annex A.5.21.",
          explanation: "Protects against uncontrolled third-party supply chain exposure and satisfies ISO 27001 audit requirements."
        }
      }
    ],
    externalSources: [
      {
        title: "International Organization for Standardization (ISO/IEC 27001:2022)",
        url: "https://www.iso.org/standard/27001",
        publisher: "ISO Official",
        description: "The global standard for information security management systems (ISMS)."
      },
      {
        title: "ENISA Guidelines for Supply Chain Security",
        url: "https://www.enisa.europa.eu/publications/threat-landscape-for-supply-chain-attacks",
        publisher: "European Union Agency for Cybersecurity",
        description: "Comprehensive guidance on mitigating ICT third-party supply chain vulnerabilities."
      }
    ],
    leadMagnet: {
      title: "Align Your Supplier Contracts with ISO 27001",
      description: "Scan active vendor contracts against ISO 27001:2022 Annex A requirements in seconds with Costloci.",
      ctaText: "Run ISO Supplier Audit",
      ctaLink: "/compliance"
    }
  }
];

export async function publishPost(input?: Partial<NewPostInput>) {
  const blogContentPath = path.resolve(process.cwd(), "client", "src", "data", "blog-content.ts");
  const sitemapPath = path.resolve(process.cwd(), "client", "public", "sitemap.xml");

  const post: NewPostInput = {
    ...TEMPLATE_TOPICS[0],
    ...input,
  };

  const content = fs.readFileSync(blogContentPath, "utf-8");

  // Check if slug already exists
  if (content.includes(`slug: "${post.slug}"`)) {
    console.log(`[BLOG AUTO-PUBLISHER] Post with slug "${post.slug}" already published.`);
    return;
  }

  // Insert post before the closing of BLOG_POSTS array
  const lastIndex = content.lastIndexOf("];");
  if (lastIndex === -1) {
    throw new Error("Could not find end of BLOG_POSTS array in blog-content.ts");
  }

  // Ensure trailing comma on previous entry
  const beforeEnd = content.slice(0, lastIndex).trimEnd();
  const needsLeadingComma = !beforeEnd.endsWith(",");
  const prefix = needsLeadingComma ? ",\n" : "\n";

  const dateStr = new Date().toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });

  const postSnippet = `${prefix}  {\n` +
    `    slug: "${post.slug}",\n` +
    `    title: "${post.title.replace(/"/g, '\\"')}",\n` +
    `    excerpt: "${post.excerpt.replace(/"/g, '\\"')}",\n` +
    `    category: "${post.category}",\n` +
    `    date: "${dateStr}",\n` +
    `    readTime: "${post.readTime}",\n` +
    `    author: {\n` +
    `      name: "${post.authorName}",\n` +
    `      role: "${post.authorRole}"\n` +
    `    },\n` +
    `    featured: false,\n` +
    `    tags: ${JSON.stringify(post.tags)},\n` +
    `    keyTakeaways: ${JSON.stringify(post.keyTakeaways, null, 6).trim()},\n` +
    `    sections: ${JSON.stringify(post.sections, null, 6).trim()},\n` +
    `    externalSources: ${JSON.stringify(post.externalSources, null, 6).trim()},\n` +
    `    leadMagnet: ${JSON.stringify(post.leadMagnet, null, 6).trim()}\n` +
    `  },\n`;

  const updatedContent = content.slice(0, lastIndex) + postSnippet + content.slice(lastIndex);
  fs.writeFileSync(blogContentPath, updatedContent, "utf-8");
  console.log(`[BLOG AUTO-PUBLISHER] Successfully added article: "${post.title}" to blog registry.`);

  // Update Sitemap
  if (fs.existsSync(sitemapPath)) {
    let sitemap = fs.readFileSync(sitemapPath, "utf-8");
    if (!sitemap.includes(`/blog/${post.slug}`)) {
      const today = new Date().toISOString().split("T")[0];
      const urlNode = `  <url>\n    <loc>https://costloci.com/blog/${post.slug}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>`;
      sitemap = sitemap.replace("</urlset>", urlNode);
      fs.writeFileSync(sitemapPath, sitemap, "utf-8");
      console.log(`[BLOG AUTO-PUBLISHER] Updated sitemap.xml with /blog/${post.slug}`);
    }
  }
}

// Direct CLI invocation
publishPost().catch(err => {
  console.error("[BLOG AUTO-PUBLISHER ERROR]", err);
  process.exit(1);
});
