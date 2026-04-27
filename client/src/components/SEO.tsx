import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
}

export function SEO({ title, description, url, image }: SEOProps) {
  useEffect(() => {
    const baseTitle = "Costloci | Enterprise Contract Intelligence";
    const fullTitle = title ? `${title} | ${baseTitle}` : baseTitle;
    const desc = description || "Streamline cybersecurity contract management, compliance risk mapping, and automated regulatory auditing (KDPA, GDPR, ISO 27001) for MSPs and global enterprises.";
    const currentUrl = url || window.location.href;
    const ogImage = image || "https://costloci.com/og-image.jpg";

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
    setMetaTag("og:type", "website", true);
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

  }, [title, description, url, image]);

  return null;
}
