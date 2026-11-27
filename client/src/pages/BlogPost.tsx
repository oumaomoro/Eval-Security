import { useRoute, Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, Calendar, Clock, Share2, ShieldCheck, 
  Sparkles, CheckCircle2, AlertTriangle, ArrowRight, 
  Copy, MessageCircle, Linkedin, Twitter, ExternalLink, BookmarkCheck 
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { BLOG_POSTS, getArticleBySlug } from "@/data/blog-content";

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  const article = getArticleBySlug(slug);
  const { toast } = useToast();

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-4 max-w-md p-8 bg-slate-900 border border-slate-800 rounded-3xl">
          <h2 className="text-2xl font-bold text-white">Article Not Found</h2>
          <p className="text-slate-400 text-sm">The requested guide may have moved or been updated.</p>
          <Link href="/blog">
            <Button variant="outline" className="border-slate-700 hover:bg-slate-800">
              Back to Blog Overview
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentUrl = typeof window !== "undefined" ? window.location.href : `https://costloci.com/blog/${article.slug}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      toast({ title: "Link Copied", description: "Article URL copied to clipboard." });
    }
  };

  const handleShareLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareTwitter = () => {
    const text = `${article.title} - Essential reading via @Costloci`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(currentUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleShareWhatsApp = () => {
    const text = `${article.title}: ${currentUrl}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Related articles (excluding current)
  const relatedArticles = BLOG_POSTS.filter((p) => p.slug !== article.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <SEO 
        title={`${article.title}`}
        description={article.excerpt}
        article={{
          publishedTime: article.date,
          author: article.author.name,
          section: article.category,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to All Guides
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/auth">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-9 px-4 rounded-lg">
                Start Free Contract Audit
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-36 pb-24">
        {/* Article Header */}
        <header className="space-y-6 mb-12">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
              {article.category}
            </Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {article.date}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {article.readTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black text-white leading-tight tracking-tight">
            {article.title}
          </h1>

          <p className="text-lg md:text-xl text-slate-300 leading-relaxed font-normal">
            {article.excerpt}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-800 text-xs text-slate-400">
            <div>
              <span className="text-slate-500">Authored by </span>
              <strong className="text-slate-200">{article.author.name}</strong>
              <span className="text-slate-500 block sm:inline sm:ml-2">({article.author.role})</span>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-2">
              <span className="text-slate-500 text-[11px] font-semibold mr-1">Share:</span>
              <Button size="sm" variant="outline" onClick={handleShareLinkedIn} className="h-8 px-2.5 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300">
                <Linkedin className="w-3.5 h-3.5 text-blue-400" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleShareTwitter} className="h-8 px-2.5 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300">
                <Twitter className="w-3.5 h-3.5 text-sky-400" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleShareWhatsApp} className="h-8 px-2.5 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleCopyLink} className="h-8 px-2.5 bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300">
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Executive Summary & Key Takeaways Card */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 md:p-8 mb-14 shadow-2xl space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold text-sm uppercase tracking-wider">
            <Sparkles className="w-4 h-4" /> Executive Summary & Statutory Takeaways
          </div>
          <ul className="space-y-3 text-sm text-slate-200">
            {article.keyTakeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Structured Sections */}
        <div className="space-y-12 text-slate-300 leading-relaxed font-normal text-base">
          {article.sections.map((section, idx) => (
            <section key={idx} className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight pt-2">
                {section.heading}
              </h2>

              {section.paragraphs.map((p, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {p}
                </p>
              ))}

              {/* Callout Quote */}
              {section.callout && (
                <div className="p-5 my-6 rounded-2xl bg-emerald-950/20 border-l-4 border-emerald-500 text-emerald-200 text-sm font-semibold italic">
                  "{section.callout}"
                </div>
              )}

              {/* Bullet Points */}
              {section.bulletPoints && section.bulletPoints.length > 0 && (
                <ul className="space-y-2.5 pl-2 my-4">
                  {section.bulletPoints.map((bp, bpIdx) => (
                    <li key={bpIdx} className="flex items-start gap-2.5 text-sm text-slate-200">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                      <span>{bp}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* Good vs Bad Clause Box */}
              {section.clauseExample && (
                <div className="my-8 rounded-2xl border border-slate-800 overflow-hidden bg-slate-900/60 shadow-xl">
                  <div className="p-4 bg-rose-950/30 border-b border-rose-900/40 text-xs">
                    <div className="flex items-center gap-2 font-black text-rose-400 uppercase tracking-wider mb-2">
                      <AlertTriangle className="w-4 h-4" /> Risky Vendor Language (To Avoid)
                    </div>
                    <code className="block bg-slate-950/80 p-3 rounded-lg text-rose-200 font-mono text-xs leading-relaxed border border-rose-900/30">
                      "{section.clauseExample.badClause}"
                    </code>
                  </div>

                  <div className="p-4 bg-emerald-950/30 border-b border-emerald-900/40 text-xs">
                    <div className="flex items-center gap-2 font-black text-emerald-400 uppercase tracking-wider mb-2">
                      <CheckCircle2 className="w-4 h-4" /> Costloci Enforceable Standard Language
                    </div>
                    <code className="block bg-slate-950/80 p-3 rounded-lg text-emerald-200 font-mono text-xs leading-relaxed border border-emerald-900/30">
                      "{section.clauseExample.goodClause}"
                    </code>
                  </div>

                  <div className="p-4 bg-slate-950/60 text-xs text-slate-400">
                    <strong className="text-slate-200">Why this matters: </strong>
                    {section.clauseExample.explanation}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Authoritative Citations & Legal Sources (SEO Backlinks) */}
        {article.externalSources && article.externalSources.length > 0 && (
          <div className="mt-14 p-6 md:p-8 rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-400">
              <BookmarkCheck className="w-5 h-5 text-emerald-400" /> Authoritative Sources & Statutory References
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              This guide references official statutes, regulatory directives, and published industry benchmarks:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {article.externalSources.map((source, sIdx) => (
                <a
                  key={sIdx}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/80 transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-emerald-400 transition-colors">
                      <span className="line-clamp-1">{source.title}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1 text-slate-500 group-hover:text-emerald-400" />
                    </div>
                    {source.description && (
                      <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                        {source.description}
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-500/80 font-mono mt-3 uppercase tracking-wider">
                    {source.publisher}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Embedded Monetization Lead Magnet CTA */}
        <div className="mt-16 bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/40 rounded-3xl p-8 md:p-12 text-center space-y-4 shadow-2xl">
          <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
          <h3 className="text-2xl md:text-3xl font-extrabold text-white">
            {article.leadMagnet.title}
          </h3>
          <p className="text-slate-300 text-sm md:text-base max-w-xl mx-auto leading-relaxed">
            {article.leadMagnet.description}
          </p>
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={article.leadMagnet.ctaLink}>
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-8 h-12 rounded-xl text-sm shadow-lg shadow-emerald-500/20">
                {article.leadMagnet.ctaText} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/billing">
              <Button variant="outline" className="border-slate-700 hover:bg-slate-800 text-slate-300 h-12 px-6 rounded-xl text-sm">
                View Pricing & Plans
              </Button>
            </Link>
          </div>
        </div>

        {/* Related Articles Section */}
        <div className="mt-20 pt-12 border-t border-slate-800/80">
          <h3 className="text-xl font-bold text-white mb-6">
            Recommended Contract Governance Guides
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <Link key={rel.slug} href={`/blog/${rel.slug}`}>
                <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all group h-full flex flex-col justify-between">
                  <div>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 text-[10px] font-bold mb-2">
                      {rel.category}
                    </Badge>
                    <h4 className="font-bold text-white group-hover:text-emerald-400 transition-colors text-sm line-clamp-2 mb-2">
                      {rel.title}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1 mt-4">
                    <Clock className="w-3 h-3" /> {rel.readTime}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-12 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>© 2026 Costloci Intelligence Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
