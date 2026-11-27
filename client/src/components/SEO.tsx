import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
    tags?: string[];
  };
  structuredData?: Record<string, any>;
}

export function SEO({ title, description, url, image, article, structuredData }: SEOProps) {
  useEffect(() => {
    const baseTitle = "Costloci | Enterprise Contract Intelligence";
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    const desc = description || "AI-powered cybersecurity contract management, compliance risk detection (KDPA, CBK, GDPR, ISO 27001), and autonomous cost optimization.";
    const currentUrl = url || window.location.href;
    const ogImage = image || "https://costloci.com/og-preview.png";

    document.title = fullTitle;

    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
      let tag = document.querySelector(selector);
      if (!tag) {
        tag = document.createElement("meta");
        if (isProperty) {
          tag.setAttribute("property", name);
        } else {
          tag.setAttribute("name", name);
        }
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", content);
    };

    setMetaTag("description", desc);
    setMetaTag("og:title", fullTitle, true);
    setMetaTag("og:description", desc, true);
    setMetaTag("og:type", article ? "article" : "website", true);
    setMetaTag("og:url", currentUrl, true);
    setMetaTag("og:image", ogImage, true);
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:title", fullTitle);
    setMetaTag("twitter:description", desc);
    setMetaTag("twitter:image", ogImage);

    // Canonical link
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', currentUrl);

    // JSON-LD Structured Data
    const defaultSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": "Costloci",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web Browser, Cloud",
      "description": desc,
      "url": "https://costloci.com",
      "offers": {
        "@type": "Offer",
        "price": "99.00",
        "priceCurrency": "USD"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "ratingCount": "184"
      }
    };

    const schemaToInject = structuredData || defaultSchema;
    let scriptTag = document.querySelector('script[type="application/ld+json"]');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.setAttribute('type', 'application/ld+json');
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(schemaToInject);

  }, [title, description, url, image, article, structuredData]);

  return null;
}
