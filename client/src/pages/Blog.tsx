import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  ArrowRight, Calendar, Clock, BookOpen, ShieldCheck, 
  Sparkles, Tag, Search, CheckCircle2, TrendingUp, Mail 
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";
import { BLOG_POSTS, BlogPostData } from "@/data/blog-content";

export default function Blog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const categories = ["All", "KDPA Compliance", "Cyber Insurance", "Cost Optimization", "FinTech Governance"];

  const filteredArticles = BLOG_POSTS.filter((post) => {
    const matchesSearch = 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = BLOG_POSTS.find((p) => p.featured) || BLOG_POSTS[0];

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      toast({ title: "Valid Email Required", description: "Please enter your enterprise work email.", variant: "destructive" });
      return;
    }
    setIsSubscribed(true);
    toast({ title: "Subscribed Successfully", description: "You will receive our monthly regulatory briefings and contract teardowns." });
    setNewsletterEmail("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500/30">
      <SEO 
        title="Costloci Contract Intelligence & Regulatory Blog" 
        description="Authoritative legal and cybersecurity contract guides on KDPA 2019 compliance, CBK banking directives, cyber insurance liability caps, and software cost reduction." 
      />

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-xl font-black text-white uppercase italic tracking-wider">Costloci</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-semibold text-slate-400 hover:text-white transition-colors">
              Platform Overview
            </Link>
            <Link href="/auth">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-9 px-4 rounded-lg">
                Start Free Audit
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-32 pb-24">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase tracking-wider px-3 py-1">
            Enterprise Contract Intelligence & Compliance Bureau
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white">
            Practical Guides for CISOs, DPOs, & Procurement Leaders
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed">
            Statutory analysis of the Kenya Data Protection Act 2019, CBK guidelines, uninsurable vendor liability traps, and proven frameworks for cutting software renewals by 20%+.
          </p>

          {/* Search Bar */}
          <div className="pt-6 max-w-xl mx-auto relative">
            <Search className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <Input 
              type="text" 
              placeholder="Search by topic, regulation, or keyword (e.g. KDPA, CBK, Liability)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-900/80 border-slate-800 pl-12 h-13 rounded-2xl text-slate-100 placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs font-bold px-4 py-2 rounded-xl transition-all ${
                  selectedCategory === cat 
                    ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20" 
                    : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Banner Article (when no active search) */}
        {!searchQuery && selectedCategory === "All" && featuredPost && (
          <div className="mb-16">
            <Link href={`/blog/${featuredPost.slug}`}>
              <Card className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 rounded-3xl overflow-hidden hover:border-emerald-500/60 transition-all duration-300 group shadow-2xl">
                <CardContent className="p-8 md:p-12">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge className="bg-emerald-500 text-slate-950 font-black text-xs uppercase">
                      Featured Guide
                    </Badge>
                    <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 text-xs font-semibold">
                      {featuredPost.category}
                    </Badge>
                    <span className="text-xs text-slate-400 flex items-center gap-1 ml-auto">
                      <Clock className="w-3.5 h-3.5" /> {featuredPost.readTime}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-4xl font-extrabold text-white group-hover:text-emerald-400 transition-colors mb-4">
                    {featuredPost.title}
                  </h2>
                  <p className="text-slate-300 text-base md:text-lg mb-6 leading-relaxed max-w-4xl">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-slate-800/80">
                    <div className="text-xs text-slate-400">
                      <span>By <strong className="text-slate-200">{featuredPost.author.name}</strong> • {featuredPost.date}</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-400 flex items-center gap-2 group-hover:translate-x-1 transition-transform">
                      Read Full Analysis <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredArticles.map((article) => (
            <Link key={article.slug} href={`/blog/${article.slug}`}>
              <Card className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-all duration-300 rounded-3xl overflow-hidden group h-full flex flex-col hover:-translate-y-1">
                <CardContent className="p-7 flex flex-col justify-between h-full">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-emerald-400 border-emerald-500/20 bg-emerald-500/5 text-xs font-bold">
                        {article.category}
                      </Badge>
                      <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3" /> {article.readTime}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-6 mt-6 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span>{article.date}</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      Read Guide <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-20 bg-slate-900/20 rounded-3xl border border-slate-800">
            <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-300">No matching articles found</h3>
            <p className="text-xs text-slate-500 mt-1">Try searching for other keywords like "KDPA", "CBK", or "Liability".</p>
          </div>
        )}

        {/* Lead Capture Newsletter Box */}
        <div className="mt-24 bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-8 md:p-12 text-center max-w-4xl mx-auto shadow-2xl">
          <Mail className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-2xl md:text-3xl font-extrabold text-white mb-2">
            Join 1,400+ Enterprise Security & Legal Leaders
          </h3>
          <p className="text-slate-400 text-sm max-w-xl mx-auto mb-6">
            Get our monthly executive regulatory briefing on ODPC enforcement actions, emerging vendor liability cases, and market price benchmarks.
          </p>

          {isSubscribed ? (
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 text-emerald-400 font-bold text-sm max-w-md mx-auto">
              ✓ You are subscribed! Check your inbox for our latest KDPA contract audit checklist.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Enter your enterprise work email..." 
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 h-12 rounded-xl focus:border-emerald-500"
              />
              <Button type="submit" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold h-12 px-6 rounded-xl shrink-0">
                Subscribe Free
              </Button>
            </form>
          )}
        </div>
      </main>

      <footer className="py-12 border-t border-slate-800/80 text-center text-xs text-slate-500">
        <p>© 2026 Costloci Intelligence Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
