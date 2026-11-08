THIS VERSION DOES NOT USE porn.html OR gore.html.

The PORN and GORE buttons are ordinary top-bar links directly to 404.html.

EASIEST METHOD:
1. In your GitHub repo, open the public folder.
2. Replace public/common.js with common.js from this download.
3. Commit the change and wait for Cloudflare to redeploy.

MANUAL METHOD (if you do not want to use common.js):
1. Open index.html, photos.html, diary.html, videos.html, guestbook.html, and 404.html.
2. Find the whole <nav> ... </nav> part in each file.
3. Replace it with the one line inside afterhours-dead-link-navbar.html.
4. Commit your changes.

Both PORN and GORE use href="404.html", so they always show the existing fake 404 message.
