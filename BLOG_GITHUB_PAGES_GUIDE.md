# Free Blogging & Niche Marketing on GitHub Pages

Costloci now includes a built-in static blog engine and an automated GitHub Pages deployment workflow.

## 1. How It Works
- The frontend includes rich, SEO-optimized articles in `client/src/pages/Blog.tsx` and `client/src/pages/BlogPost.tsx` covering:
  1. **Kenya Data Protection Act (KDPA 2019)** vendor audit guide.
  2. **CBK Cybersecurity Guidelines (CBK/DFS/01/2017)** cloud compliance checklist.
  3. **Cyber Insurance Liability Cap Correlation** avoiding uninsurable vendor limits.
  4. **Software License Optimization** cutting SaaS sprawl by 30%.
  5. **Automated AI Redlining** slashing vendor review cycles from weeks to minutes.
- When built, the SPA bundle generates full static assets into `dist/public`.
- The GitHub Actions workflow `.github/workflows/deploy-gh-pages.yml` automatically publishes this to GitHub Pages on every push to `main`.

## 2. Enabling GitHub Pages in Your Repository
1. Navigate to your GitHub repository: `https://github.com/oumaomoro/Eval-Security`
2. Click **Settings** -> **Pages** (under Code and automation).
3. Under **Build and deployment**:
   - **Source**: Select **GitHub Actions**.
4. That's it! GitHub will run the `Deploy to GitHub Pages` workflow on every commit to `main`.
5. Your blog and marketing site will be live at:
   `https://oumaomoro.github.io/Eval-Security/blog` (or linked directly with your custom domain).

## 3. Adding New Marketing / Niche Blog Posts
To add new articles or market other niche products:
1. Open `client/src/pages/BlogPost.tsx`.
2. Add an entry to the `BLOG_POSTS` dictionary with:
   - Unique URL `slug`
   - Target keyword & SEO title
   - Executive summary
   - Markdown/JSX body with call-to-action cards leading to your paid plans or affiliate products.
3. Add the new post link to `client/public/sitemap.xml` for instant Google crawler indexing.
