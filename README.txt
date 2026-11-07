AFTERHOURS — FREE WEBSITE FILES

The pages can be hosted free on Cloudflare Pages using its free pages.dev address. This package includes a Cloudflare Pages Function plus a D1 schema for the shared guestbook. No paid custom domain or DreamHost plan is needed. The site is not published until you connect your own free accounts and deploy it.

WHAT IS IN HERE
- public/: the actual website files
- public/index.html: homepage
- public/diary.html: twelve dated diary entries
- public/photos.html and public/videos.html: slots for your own media
- public/guestbook.html: seeded comments plus a shared submission form
- public/404.html: custom missing page
- functions/api/guestbook.js: Cloudflare API for shared guestbook entries
- schema.sql: creates the guestbook table in D1
- server.js: optional local preview and local JSON-backed guestbook
- public/assets/: blinkie graphics and bunny/drip art

PUBLISH FOR FREE
1. Make a free GitHub account and a free Cloudflare account.
2. Create a GitHub repository. Upload the contents of this folder into the repository root. You should see the folders named public and functions, plus schema.sql, server.js, and this README.
3. In Cloudflare, open Workers & Pages, choose Create application, then Pages, then Connect to Git. Select the repository.
4. Use no framework preset. Leave Build command blank and set Build output directory to public. Deploy it. Cloudflare gives the project a free address ending in pages.dev.
5. In the Cloudflare dashboard, open D1 and create a database named afterhours-guestbook. Open its SQL console and run the contents of schema.sql.
6. Open the Pages project settings and add a D1 database binding. Set the variable name to DB and select afterhours-guestbook. Save, then redeploy the project.
7. Visit the pages.dev address. Test the HOME, DIARY, PHOTOS, VIDEOS and GUESTBOOK links. Submit a guestbook entry and reload the page to confirm it stayed.

Cloudflare Pages Functions call D1 to read and save guestbook entries. The free Workers tier has a daily request quota and D1 has daily read/write limits; this is suitable for a small ARG site, but requests can fail if those free limits are exceeded. Static asset requests are free. Do not switch to a paid plan if you need to keep the service free.

GOOGLE SEARCH
After the site is live, replace YOUR-DOMAIN.example in sitemap.xml with the pages.dev address. Add the HTTPS site as a URL-prefix property in Google Search Console, verify it, then submit /sitemap.xml and request indexing for the homepage. Google can take days or weeks to crawl a new site and does not guarantee indexing.

TIMELINE
The visible 2002, 2007 and 2026 dates are the site's in-story timeline. Actual domain, hosting, deployment and search-index dates will be the real upload dates.

VIDEO AUDIO
The homepage has no music. Add sound only inside the videos you place in videos.html.
