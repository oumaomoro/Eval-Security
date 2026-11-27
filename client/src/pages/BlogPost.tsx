import { useRoute, Link } from "wouter";
import { ARTICLES, Article } from "./Blog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, Clock, Share2, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";
import { SEO } from "@/components/SEO";
import { useToast } from "@/hooks/use-toast";

const ARTICLE_CONTENT: Record<string, { body: string[]; keyTakeaways: string[] }> = {
  "kdpa-compliance-guide": {
    keyTakeaways: [
      "Section 25 mandates that data controllers only engage processors with sufficient technical and organizational safeguards.",
      "Section 50 requires proof of adequate data protection laws or binding corporate rules before data leaves Kenya.",
      "72-hour breach notification clauses must be explicitly included with specified penalty indemnities.",
      "Failure to include mandatory KDPA clauses exposes corporate officers to direct statutory fines up to KES 5,000,000."
    ],
    body: [
      "The Kenya Data Protection Act 2019 (KDPA) has shifted from initial advisory enforcement into aggressive audit penalties by the Office of the Data Protection Commissioner (ODPC). For Chief Information Security Officers (CISOs) and Data Protection Officers (DPOs), third-party vendor agreements represent the single largest liability vulnerability.",
      "When engaging cloud providers, Managed Service Providers (MSPs), and software vendors, generic international MSAs often fail to comply with Kenyan statutory mandates. Under Section 25, a data controller remains vicariously liable for the actions, breaches, and negligence of its data processors unless a compliant Data Processing Agreement (DPA) is executed.",
      "A compliant KDPA agreement must explicitly define the scope and nature of processing, mandate sub-processor authorization protocols, guarantee audit rights for the controller, and establish strict breach notification windows under Section 43.",
      "Costloci automates this audit process by cross-referencing your contracts against our pre-compiled KDPA 2019 statutory ruleset, instantly identifying missing statutory warranties and generating enforceable addenda."
    ]
  },
  "cyber-insurance-liability-caps": {
    keyTakeaways: [
      "Standard cloud provider limitation-of-liability clauses typically cap damages at '12 months fees paid', leaving a massive uninsured gap.",
      "If vendor negligence causes a data breach exceeding their contract cap, enterprise cyber insurance subrogation claims frequently fail.",
      "Negotiate a 'Super Cap' or complete carve-out for data breaches, confidentiality violations, and gross negligence.",
      "Correlate policy aggregate limits with vendor contractual indemnities to prevent solvency risks."
    ],
    body: [
      "Most enterprise security leaders mistakenly assume their cyber insurance policy will absorb the financial fallout of a third-party vendor security breach. In reality, insurance carriers scrutinize vendor contracts during claim investigations.",
      "If your vendor agreement contains an aggressive limitation of liability—such as capping vendor responsibility to 12 months of software subscription fees—the insurer's right of subrogation is severely impaired, often resulting in claim denials or significant out-of-pocket deductibles.",
      "To safeguard your organization, enterprise procurement teams must establish a direct correlation between their cyber insurance policy limits and the indemnity terms negotiated with vendors. Critical vendors handling sensitive customer data or cloud infrastructure must agree to uncapped liability or an expanded super-cap for data privacy breaches.",
      "Costloci's Cyber Insurance Correlation engine automatically scans uploaded insurance policies and vendor contracts side-by-side, flagging contracts where vendor liability is below your insurance threshold."
    ]
  },
  "cbk-cybersecurity-guidelines": {
    keyTakeaways: [
      "Central Bank of Kenya (CBK) requires commercial banks and payment service providers to audit critical third-party vendors annually.",
      "Vendor contracts must stipulate explicit right-to-audit clauses accessible by both internal auditors and CBK regulators.",
      "Cloud agreements must include defined disaster recovery (RTO/RPO) objectives and exit strategy migration support.",
      "Service Level Agreements (SLAs) must specify financial penalties for downtime affecting core payment rails."
    ],
    body: [
      "The Central Bank of Kenya (CBK) Cybersecurity Guidelines establish rigorous risk management standards for commercial banks, microfinance institutions, and licensed Payment Service Providers (PSPs). Vendor risk management is a centerpiece of these directives.",
      "Under CBK guidelines, financial institutions cannot outsource accountability. Every third-party IT vendor, core banking software provider, and cloud infrastructure host must be governed by contracts that allow regulatory inspection and forensic audit rights.",
      "Key contractual terms must address business continuity, real-time cyber incident escalation within 2 hours of discovery, and guaranteed data portability in the event of vendor insolvency.",
      "Costloci provides banking compliance teams with a dedicated CBK audit module that benchmarks contracts against central bank expectations and generates regulator-ready audit trail packages."
    ]
  },
  "dpa-negotiation-best-practices": {
    keyTakeaways: [
      "Never accept standard click-wrap vendor DPAs without checking for jurisdiction-specific transfer clauses.",
      "Ensure the definition of 'Personal Data' aligns with local statutory broadness, including biometric and location data.",
      "Demand indemnification for regulatory fines levied against your firm due to vendor non-compliance.",
      "Establish strict 48-hour sub-processor notification windows with clear opt-out termination rights."
    ],
    body: [
      "When negotiating software contracts with international enterprise vendors, legal teams are frequently pressured to sign pre-packaged US or generic EU DPAs that ignore African statutory jurisdictions.",
      "The most common mistake is accepting a unilateral indemnity clause that only protects the vendor. If an international cloud vendor experiences an internal credential breach exposing your customer data, your firm faces local regulatory enforcement while remaining powerless under foreign dispute resolution clauses.",
      "Best practice requires demanding reciprocal indemnification, explicit local law governing jurisdiction (e.g. High Court of Kenya), and mandatory cooperation during regulatory inquiries.",
      "With Costloci's Autonomous Redline Studio, procurement officers can inject balanced, battle-tested DPA clauses with a single click, cutting negotiation cycles from weeks to minutes."
    ]
  },
  "how-ai-redlining-saves-22-percent": {
    keyTakeaways: [
      "Enterprises overpay by an average of 18–25% due to unmonitored auto-renewals, unused seat tiers, and lack of regional benchmarking.",
      "Proactive 90-day renewal alerts give procurement teams leverage before vendors trigger automatic price escalations.",
      "Consolidating overlapping cybersecurity tools (e.g., SIEM, EDR, Vulnerability Management) generates immediate six-figure savings.",
      "Autonomous benchmarking provides real-time pricing intelligence on prevailing market rates across East African enterprises."
    ],
    body: [
      "Cybersecurity and IT software spending is often the fastest-growing operational expenditure in mid-to-large enterprises. Yet, more than 40% of vendor contracts renew automatically without competitive price reviews.",
      "Vendors routinely include annual price escalation clauses of 5% to 10% tucked into standard renewal terms. Without automated tracking, procurement teams only discover the price hike after the cancellation notice window has expired.",
      "By centralizing contract repository intelligence, Costloci monitors renewal deadlines, highlights redundant tools, and benchmarks contract rates against peer organizations in your industry.",
      "Our users report an average of 22% annual cost reduction within their first 60 days of deploying Costloci's automated contract intelligence."
    ]
  }
};

export default function BlogPost() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug || "";
  const article = ARTICLES.find((a) => a.slug === slug);
  const content = ARTICLE_CONTENT[slug] || {
    keyTakeaways: [
      "Maintain active inventory of all third-party vendor agreements.",
      "Audit contracts regularly against evolving regional statutory frameworks.",
      "Ensure indemnity caps adequately cover potential enterprise breach liabilities."
    ],
    body: [
      "Enterprise contract management requires continuous oversight of both regulatory compliance and cost efficiency. As regulatory bodies step up enforcement, organizations must adopt automated intelligence to protect their assets and bottom line."
    ]
  };

  const { toast } = useToast();

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title || "Costloci Intelligence",
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link Copied", description: "Article link copied to clipboard." });
    }
  };

  if (!article) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Article Not Found</h2>
          <Link href="/blog">
            <Button variant="outline">Back to Blog</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <SEO 
        title={`${article.title}`}
        description={article.excerpt}
        article={{
          publishedTime: "2026-11-24",
          author: article.author,
          section: article.category,
        }}
      />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/blog" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Blog
          </Link>

          <Link href="/auth">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs h-9 px-4 rounded-lg">
              Start Free Audit
            </Button>
          </Link>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-36 pb-24">
        {/* Article Header */}
        <header className="space-y-6 mb-12">
          <div className="flex items-center gap-3">
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-xs font-bold uppercase">
              {article.category}
            </Badge>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {article.date}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {article.readTime}
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
            {article.title}
          </h1>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span>By <strong className="text-slate-200">{article.author}</strong></span>
            <Button variant="ghost" size="sm" onClick={handleShare} className="text-slate-400 hover:text-white">
              <Share2 className="w-4 h-4 mr-1.5" /> Share
            </Button>
          </div>
        </header>

        {/* Key Takeaways Box */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 mb-12 space-y-4 shadow-xl">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm uppercase tracking-wide">
            <Sparkles className="w-4 h-4" /> Executive Summary & Key Takeaways
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            {content.keyTakeaways.map((takeaway, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{takeaway}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Article Body */}
        <div className="space-y-6 text-base text-slate-300 leading-relaxed font-normal">
          {content.body.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {/* Embedded Monetization / Lead Magnet CTA */}
        <div className="mt-16 bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-4">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-2xl font-bold text-white">
            Audit Your Vendor Contracts for KDPA & Liability Gaps
          </h3>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Upload your master service agreements into Costloci's AI engine to discover compliance risks, indemnity shortfalls, and cost savings in under 3 minutes.
          </p>
          <div className="pt-2">
            <Link href="/auth">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8 h-12 rounded-xl">
                Start Free Contract Analysis
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
