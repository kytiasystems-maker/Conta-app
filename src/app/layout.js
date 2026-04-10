import '../globals.css'

export const metadata = {
  title: 'NetuMeu — Clientul vorbește, contabilul primește date curate',
  description: 'Transformă mesajele vocale de pe WhatsApp în facturi și cheltuieli structurate. Voice-first bridge pentru contabili români.',
  openGraph: {
    title: 'NetuMeu — Voice bridge pentru contabili',
    description: 'Clientul vorbește 8 secunde. Contabilul primește date curate. Zero muncă manuală.',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="ro">
      <body>{children}</body>
    </html>
  )
}
