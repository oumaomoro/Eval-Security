import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock, BookOpen, ShieldCheck, Sparkles, Tag } from "lucide-react";
import { SEO } from "@/components/SEO";

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: "KDPA Compliance" | "Cyber Insurance" | "Cost Optimization" | "FinTech Governance";
  date: string;
  readTime: string;
  author: string;
  featured?: boolean;
}

export const ARTICLES: Article[] = [
  {
    slug: "kdpa-compliance-guide",
    title: "The Definitive KDPA 2019 Contract Compliance Guide for CISOs & DPOs",
    excerpt: "Learn how the Office of the Data Protection Commissioner (ODPC) evaluates vendor agreements, mandatory Section 25 clauses, and cross-border data transfer safeguards.",
    category: "KDPA Compliance",
    date: "November 24, 2026",
    readTime: "7 min read",
    author: "Legal & Security Research Team",
    featured: true,
  },
  {
    slug: "cyber-insurance-liability-caps",
    title: "Cyber Insurance Liability Caps: How to Stop Cloud Vendors Limiting Indemnity",
    excerpt: "Why standard vendor limitation-of-liability clauses invalidate enterprise cyber insurance payouts, and how to negotiate balanced indemnity caps.",
    category: "Cyber Insurance",
    date: "November 18, 2026",
    readTime: "6 min read",
    author: "Risk Intelligence Bureau",
    featured: true,
  },
  {
    slug: "cbk-cybersecurity-guidelines",
    title: "CBK Cybersecurity Guidelines 2026: Mandatory Contract Provisions for Banks & FinTechs",
    excerpt: "A clause-by-clause breakdown of Central Bank of Kenya requirements for third-party IT service providers, cloud resilience, and continuous testing.",
    category: "FinTech Governance",
    date: "November 12, 2026",
    readTime: "8 min read",
    author: "FinTech Compliance Unit",
  },
  {
    slug: "dpa-negotiation-best-practices",
    title: "5 Critical Data Processing Agreement (DPA) Traps That Trigger Fines",
    excerpt: "Avoid common negotiation mistakes with international software vendors. Protect your enterprise from vicarious liability in high-stakes breaches.",
    category: "KDPA Compliance",
    date: "October 29, 2026",
    readTime: "5 min read",
    author: "DPO Advisory Practice",
  },
  {
    slug: "how-ai-redlining-saves-22-percent",
    title: "How Automated Contract Benchmarking Slashes 22% Off Software Renewals",
    excerpt: "Case study on how proactive feature consolidation, license rightsizing, and regional rate benchmarking turn procurement teams into profit centers.",
    category: "Cost Optimization",
    date: "October 15, 2026",
    readTime: "6 min read",
    author: "Enterprise Procurement Team",
  }
];

export default function Blog() {
  const featuredArticle = ARTICLES.find((a) => a.featured) || ARTICLES[0];
  const regularArticles = ARTICLES.filter((a) => a.slug !== featuredArticle.slug);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <SEO 
        title="Enterprise Contract Intelligence & Compliance Blog" 
        description="Expert insights on KDPA 2019 compliance, cyber insurance indemnity caps, CBK guidelines, and enterprise software cost optimization." 
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-black text-white uppercase italic">Costloci</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              Platform
            </Link>
            <Link href="/auth">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-9 px-4 rounded-lg">
                Start Free Audit
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-36 pb-24">
        {/* Header */}
        <div className="mb-14 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-4">
            <BookOpen className="w-3.5 h-3.5" /> Niche Intelligence & Market Insights
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
            Cybersecurity Contract Intelligence & Regulatory Governance
          </h1>
          <p className="text-slate-400 text-base mt-4 leading-relaxed">
            In-depth guides, legal analysis, and cost reduction strategies for CISOs, DPOs, and procurement leaders navigating East African and global cybersecurity mandates.
          </p>
        </div>

        {/* Featured Article Card */}
        {featuredArticle && (
          <div className="mb-16">
            <Link href={`/blog/${featuredArticle.slug}`}>
              <Card className="bg-slate-900/80 border-slate-800 hover:border-emerald-500/40 transition-all rounded-3xl overflow-hidden p-8 cursor-pointer shadow-2xl group">
                <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                  <div className="space-y-4 max-w-3xl">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-bold uppercase">
                        {featuredArticle.category}
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5" /> {featuredArticle.date}
                      </span>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5" /> {featuredArticle.readTime}
                      </span>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold text-white group-hover:text-emerald-400 transition-colors">
                      {featuredArticle.title}
                    </h2>

                    <p className="text-slate-400 text-sm leading-relaxed">
                      {featuredArticle.excerpt}
                    </p>

                    <div className="pt-2 flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      Read Full Analysis <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        )}

        {/* Regular Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {regularArticles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`}>
              <Card className="bg-slate-900/60 border-slate-800 hover:border-emerald-500/30 transition-all rounded-2xl p-6 cursor-pointer group h-full flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[11px] font-bold text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                      {article.category}
                    </Badge>
                    <span className="text-xs text-slate-500">{article.readTime}</span>
                  </div>

                  <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                    {article.title}
                  </h3>

                  <p className="text-slate-400 text-xs leading-relaxed line-clamp-3">
                    {article.excerpt}
                  </p>
                </div>

                <div className="pt-6 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
                  <span>{article.date}</span>
                  <span className="text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                    Read article <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Lead Magnet / CTA Box */}
        <div className="mt-20 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-cyan-950/40 border border-emerald-500/30 rounded-3xl p-10 text-center space-y-4 shadow-2xl">
          <Sparkles className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-2xl md:text-3xl font-extrabold text-white">
            Evaluate Your Vendor Agreements Against 2026 Standards
          </h3>
          <p className="text-slate-300 text-sm max-w-xl mx-auto">
            Upload your contracts into Costloci's private AI auditor to detect KDPA non-compliance, insurance liability shortfalls, and vendor overpricing in under 3 minutes.
          </p>
          <div className="pt-2">
            <Link href="/auth">
              <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8">
                Scan Your First Contract Free <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>© 2026 Costloci Intelligence Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
