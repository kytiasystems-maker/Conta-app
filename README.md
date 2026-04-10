# NetuMeu — Voice Bridge pentru Contabili

Demo interactiv cu recunoaștere vocală reală (Web Speech API) pentru conceptul NetuMeu: transformă mesajele vocale ale clienților în date contabile structurate.

## Features demo

- **Recunoaștere vocală reală** — folosește Web Speech API (zero cost, funcționează nativ în Chrome/Edge)
- **Extracție inteligentă** — parsează text natural în română și extrage: tip operațiune, client/furnizor, sumă, TVA, categorie contabilă
- **Două perspective**: contabil (dashboard cu inbox, aprobare, export) și client (experiență WhatsApp)
- **Pricing page** cu planuri freemium
- **Dark mode** automat
- **Zero dependențe externe** — nu necesită API keys sau servicii plătite

## Deploy pe Vercel (3 minute)

### Varianta 1 — Direct din GitHub (recomandat)

1. Creează un repo nou pe GitHub
2. Push acest folder:
   ```bash
   cd netumeu-demo
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/USERNAME/netumeu-demo.git
   git push -u origin main
   ```
3. Mergi pe [vercel.com](https://vercel.com) → New Project → Import Git Repository
4. Selectează repo-ul → Deploy
5. În 60 de secunde ai un URL live: `netumeu-demo.vercel.app`

### Varianta 2 — Vercel CLI

```bash
npm i -g vercel
cd netumeu-demo
vercel
```
Urmează instrucțiunile → primești URL-ul live.

## Structura proiectului

```
netumeu-demo/
├── src/
│   ├── app/
│   │   ├── layout.js    # Meta tags, SEO
│   │   └── page.js      # Toată aplicația (single page)
│   └── globals.css       # Stiluri globale + dark mode
├── package.json
├── next.config.js
└── README.md
```

## Cum funcționează recunoașterea vocală

- Folosește `window.SpeechRecognition` (Web Speech API)
- Configurată pe `lang: 'ro-RO'` (română)
- Funcționează în Chrome, Edge, Safari (nu Firefox)
- Zero cost — procesarea se face local în browser
- Fallback: butoane cu scenarii pre-definite pentru browsere fără suport

## Limitări demo

- Extracția de entități este simulată (regex-based), nu AI real
- Nu se conectează la ANAF/SPV
- Export CSV/XML e simulat
- Recunoașterea vocală necesită Chrome/Edge

## Roadmap spre produs real

1. Înlocuire extracție regex → Claude API (extracție reală cu AI)
2. Integrare WhatsApp Business API (bot real)
3. Conectare API ANAF (verificare CUI, e-Factura)
4. Backend cu PostgreSQL (persistență date)
5. Auth reală (contabili: email/pass, clienți: nr. telefon)
