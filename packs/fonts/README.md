# fonts: self-host the brief's font pairing

The starter loads its fonts from Google Fonts in `index.html`, which is
right while the design is still moving. Before launch, self-host them:

```bash
npm run fonts:self-host -- "Inter:400,500,600" "Space Grotesk:500,700"
# --italic to include italics, --latin-only if the site takes no free-text names
```

It installs `@fontsource/<family>`, writes `src/styles/fonts.ts` importing
only the latin + latin-ext files of the weights you asked for, imports that
from `src/main.tsx`, and deletes the Google Fonts tags from `index.html`.
`tailwind.config.ts` needs no change: the family names are the same.

Why bother:

- **No third-party request on first paint**: one less DNS + TLS handshake.
- **Privacy**: a German court fined a site for sending visitor IPs to Google
  Fonts. Same-origin fonts send nothing anywhere.
- **Smaller render-blocking CSS**: the every-subset entry point ships rules
  for cyrillic, greek and vietnamese. Never downloaded, but always parsed.
- **Simpler CSP**: remove the two Google origins from `security-headers`.

Check the weight list against what the design actually uses
(`grep -rhoE "font-(light|normal|medium|semibold|bold|extrabold)" src | sort | uniq -c`).
Every unused weight is a file a visitor might fetch.
