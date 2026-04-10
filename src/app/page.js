'use client'
import { useState, useEffect, useRef, useCallback } from 'react'

// ─── AI extraction logic (simulated but realistic) ───
function extractFromText(text) {
  const t = text.toLowerCase().trim()
  
  // Invoice detection
  const invMatch = t.match(/factur|emite|trimite factura/)
  if (invMatch) {
    const amountMatch = t.match(/(\d[\d.,]*)\s*(euro|eur|lei|ron)/i)
    const amount = amountMatch ? amountMatch[1].replace(',', '.') : '0'
    const currency = amountMatch ? (amountMatch[2].match(/euro|eur/i) ? 'EUR' : 'RON') : 'RON'
    const amountNum = parseFloat(amount)
    const vat = (amountNum * 0.19).toFixed(2)
    const total = (amountNum * 1.19).toFixed(2)
    
    // Try to find client name
    const clientPatterns = [/(?:lui|la|pentru|catre|către)\s+([A-ZȘȚĂÎÂa-zșțăîâ][\w\s.-]{2,30}?)(?:\s+\d|\s*,|$)/i]
    let clientName = 'Client neidentificat'
    for (const p of clientPatterns) {
      const m = t.match(p)
      if (m) { clientName = m[1].trim().replace(/\b\w/g, c => c.toUpperCase()); break }
    }

    // Description
    const descPatterns = [/servicii\s+([\wăîâșț\s]+?)(?:\s+pe|\s+luna|\s*,|$)/i, /pentru\s+([\wăîâșță\s]+?)(?:\s+pe|\s+luna|\s*,|$)/i]
    let desc = 'Servicii profesionale'
    for (const p of descPatterns) {
      const m = t.match(p)
      if (m) { desc = m[1].trim().replace(/\b\w/g, c => c.toUpperCase()); break }
    }

    const monthMatch = t.match(/(ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie)/i)
    const month = monthMatch ? monthMatch[1] : ''
    if (month) desc += ` — ${month} 2026`

    const termMatch = t.match(/termen\s*(?:de\s*)?(?:plat[aă])?\s*(\d+)\s*zile/i)
    const term = termMatch ? `${termMatch[1]} zile` : '15 zile'

    return {
      type: 'invoice',
      confidence: 89 + Math.floor(Math.random() * 9),
      savings: 420 + Math.floor(Math.random() * 120),
      data: {
        'Tip operațiune': 'Emitere factură',
        'Client': clientName,
        'Sumă netă': `${amountNum.toLocaleString('ro-RO')} ${currency}`,
        'TVA 19%': `${parseFloat(vat).toLocaleString('ro-RO')} ${currency}`,
        'Total': `${parseFloat(total).toLocaleString('ro-RO')} ${currency}`,
        'Descriere': desc,
        'Termen plată': term,
      }
    }
  }

  // Expense detection
  const expMatch = t.match(/plat|platit|plătit|am dat|am cheltuit|alimentat|cumparat|cumpărat|bon|chitanț/)
  if (expMatch) {
    const amountMatch = t.match(/(\d[\d.,]*)\s*(lei|ron|euro|eur)?/i)
    const amount = amountMatch ? amountMatch[1].replace(',', '.') : '0'
    const currency = amountMatch && amountMatch[2]?.match(/euro|eur/i) ? 'EUR' : 'RON'
    const amountNum = parseFloat(amount)
    const vat = (amountNum - amountNum / 1.19).toFixed(2)
    const net = (amountNum / 1.19).toFixed(2)

    let supplier = 'Furnizor neidentificat'
    const supplierPatterns = [/la\s+([A-ZȘȚĂÎÂa-zșțăîâ][\w\s.-]{2,25}?)(?:\s*,|\s+\d|$)/i, /de la\s+([A-ZȘȚĂÎÂa-zșțăîâ][\w\s.-]{2,25}?)(?:\s*,|\s+\d|$)/i]
    for (const p of supplierPatterns) {
      const m = t.match(p)
      if (m) { supplier = m[1].trim().replace(/\b\w/g, c => c.toUpperCase()); break }
    }

    let category = '628 — Alte cheltuieli'
    if (t.match(/benzin|motorin|carburant|alimentat|omv|petrom|mol|lukoil|rompetrol/i)) category = '6022 — Combustibil'
    else if (t.match(/chiri|rent/i)) category = '612 — Chirii'
    else if (t.match(/telefon|mobil|orange|vodafone|digi/i)) category = '626 — Poștă și telecomunicații'
    else if (t.match(/curent|enel|energie|gaz|apa/i)) category = '605 — Energie și apă'
    else if (t.match(/birou|papetarie|toner|hârtie/i)) category = '6021 — Materiale consumabile'
    else if (t.match(/masa|restaurant|mancare|pranz/i)) category = '625 — Deplasări/protocol'
    else if (t.match(/parcare/i)) category = '628 — Alte cheltuieli (parcare)'

    return {
      type: 'expense',
      confidence: 85 + Math.floor(Math.random() * 10),
      savings: 240 + Math.floor(Math.random() * 120),
      data: {
        'Tip operațiune': 'Cheltuială',
        'Furnizor': supplier,
        'Sumă totală': `${amountNum.toLocaleString('ro-RO')} ${currency}`,
        'TVA estimat': `${parseFloat(vat).toLocaleString('ro-RO')} ${currency}`,
        'Net': `${parseFloat(net).toLocaleString('ro-RO')} ${currency}`,
        'Categorie contabilă': category,
        'Cont': '401 — Furnizori',
      }
    }
  }

  // Question detection
  const qMatch = t.match(/cat|cât|când|cand|ce trebuie|am de plat|termen|obligat|declar/)
  if (qMatch) {
    return {
      type: 'question',
      confidence: 82 + Math.floor(Math.random() * 10),
      savings: 300 + Math.floor(Math.random() * 360),
      data: {
        'Tip operațiune': 'Întrebare client',
        'Subiect': 'Obligații fiscale / informare',
      },
      suggestion: 'Întrebarea a fost înregistrată și trimisă contabilului. Va primi notificare și îți va răspunde în cel mai scurt timp.'
    }
  }

  // Fallback
  return {
    type: 'other',
    confidence: 70 + Math.floor(Math.random() * 15),
    savings: 120,
    data: {
      'Tip operațiune': 'Document / cerere',
      'Conținut detectat': text.slice(0, 100),
      'Status': 'Necesită verificare manuală',
    },
    note: 'AI-ul nu a putut clasifica automat. Documentul a fost trimis contabilului pentru procesare manuală.'
  }
}

// ─── Confidence Ring ───
function ConfRing({ v, sz = 50 }) {
  const r = (sz - 6) / 2, c = 2 * Math.PI * r, o = c - (v / 100) * c
  const col = v >= 90 ? 'var(--green)' : v >= 80 ? 'var(--amber)' : 'var(--red)'
  return (
    <svg width={sz} height={sz} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="var(--border1)" strokeWidth="3" />
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={col} strokeWidth="3" strokeDasharray={c} strokeDashoffset={o} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      <text x={sz/2} y={sz/2} textAnchor="middle" dominantBaseline="central" fill={col} style={{ fontSize: 12, fontWeight: 700, transform: 'rotate(90deg)', transformOrigin: 'center' }}>{v}%</text>
    </svg>
  )
}

// ─── Format time ───
function fmt(s) { return s < 60 ? `${s} sec` : `${Math.floor(s/60)} min ${s%60 > 0 ? s%60 + ' sec' : ''}` }

// ─── Waveform component ───
function Waveform({ active }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, height: 20 }}>
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} style={{
          width: 3, borderRadius: 2, background: active ? 'var(--red)' : 'var(--text3)',
          height: active ? undefined : 4,
          animation: active ? `waveform 0.4s ${i * 0.05}s ease-in-out infinite alternate` : 'none',
          transition: 'height 0.2s'
        }} />
      ))}
    </div>
  )
}

// ─── Plans ───
const PLANS = [
  { id: 'free', name: 'Starter', price: '0', period: '', desc: 'Testează gratuit', features: ['30 documente/lună', '3 clienți', 'Export CSV', 'Inbox structurat'], cta: 'Începe gratuit', hl: false },
  { id: 'pro', name: 'Pro', price: '89', period: '/lună', desc: 'Pentru contabili independenți', features: ['Documente nelimitate', 'Clienți nelimitați', 'Export CSV + XML', 'Verificare CUI ANAF', 'Calendar termene', 'Suport prioritar'], cta: '14 zile gratuit', hl: true },
  { id: 'team', name: 'Firmă', price: '199', period: '/lună', desc: 'Pentru firme de contabilitate', features: ['Tot din Pro +', '5 utilizatori', 'Dashboard manager', 'Alocare pe echipă', 'Rapoarte auto clienți'], cta: 'Contactează-ne', hl: false },
]

// ─── Quick scenarios for buttons ───
const QUICK = [
  { icon: '📄', label: 'Factură', text: 'Facturează-i lui TechCorp 5000 euro servicii consultanță IT pe luna martie termen plată 30 zile' },
  { icon: '🧾', label: 'Cheltuială', text: 'Am alimentat mașina firmei la OMV cu 387 lei' },
  { icon: '🏢', label: 'Chirie', text: 'Am plătit chiria pe birou 2000 lei la proprietarul Gheorghe Marin' },
  { icon: '❓', label: 'Întrebare', text: 'Cât am de plătit la stat luna asta și când e termenul' },
]

// ═══════ MAIN APP ═══════
export default function Home() {
  const [page, setPage] = useState('home')
  const [role, setRole] = useState(null)
  
  // Voice
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)
  const recognitionRef = useRef(null)
  
  // Processing
  const [processing, setProcessing] = useState(false)
  const [aiStep, setAiStep] = useState(-1)
  const AI_STEPS = ['Analizare text', 'Extragere entități', 'Verificare CUI ANAF', 'Clasificare contabilă', 'Structurare date']
  
  // Results
  const [result, setResult] = useState(null)
  const [approved, setApproved] = useState(false)
  const [exported, setExported] = useState(false)
  const [history, setHistory] = useState([])
  const [totalSaved, setTotalSaved] = useState(0)
  const [usedDocs, setUsedDocs] = useState(0)

  // Client chat
  const [chatMsgs, setChatMsgs] = useState([])
  const [chatTyping, setChatTyping] = useState(false)
  const chatEnd = useRef(null)

  // Check Speech API support
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition
      if (!SR) setSpeechSupported(false)
    }
  }, [])

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatMsgs, chatTyping])

  // ─── Voice Recognition ───
  const startListening = useCallback(() => {
    if (!speechSupported) return
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SR()
    recognition.lang = 'ro-RO'
    recognition.interimResults = true
    recognition.continuous = false
    recognition.maxAlternatives = 1
    
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (e) => {
      let interim = '', final = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      if (final) setTranscript(prev => prev + final)
      setInterimTranscript(interim)
    }
    recognition.onerror = () => { setIsListening(false) }
    recognition.onend = () => { setIsListening(false) }
    
    recognitionRef.current = recognition
    setTranscript('')
    setInterimTranscript('')
    recognition.start()
  }, [speechSupported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  // ─── Process text (voice or typed) ───
  const processText = useCallback((text) => {
    if (!text.trim()) return
    setProcessing(true)
    setResult(null)
    setApproved(false)
    setExported(false)
    setAiStep(0)

    let step = 0
    const interval = setInterval(() => {
      step++
      setAiStep(step)
      if (step >= AI_STEPS.length) {
        clearInterval(interval)
        setTimeout(() => {
          const extracted = extractFromText(text)
          setResult(extracted)
          setProcessing(false)
          setAiStep(-1)
        }, 300)
      }
    }, 500)
  }, [])

  // After voice stops, auto-process
  useEffect(() => {
    if (!isListening && transcript && !processing && !result) {
      const timer = setTimeout(() => processText(transcript), 500)
      return () => clearTimeout(timer)
    }
  }, [isListening, transcript, processing, result, processText])

  // ─── Client chat send ───
  const clientSend = (text) => {
    setChatMsgs(prev => [...prev, { from: 'me', text, ts: 'Acum' }])
    setChatTyping(true)
    setTimeout(() => {
      const extracted = extractFromText(text)
      let reply = `Am înțeles! Am detectat: ${extracted.data['Tip operațiune']}\n\n`
      Object.entries(extracted.data).forEach(([k, v]) => { reply += `${k}: ${v}\n` })
      reply += `\nConfidence AI: ${extracted.confidence}%\nTrimi la contabil pentru aprobare?`
      setChatTyping(false)
      setChatMsgs(prev => [...prev, { from: 'bot', text: reply, ts: 'Acum' }])
    }, 2000)
  }

  const handleApprove = () => {
    setApproved(true)
    setUsedDocs(u => u + 1)
    setTotalSaved(t => t + (result?.savings || 0))
    setHistory(h => [...h, { ...result, timestamp: new Date().toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }) }])
  }

  const resetResult = () => {
    setResult(null)
    setTranscript('')
    setInterimTranscript('')
    setApproved(false)
    setExported(false)
  }

  // ═══ RENDER ═══
  return (
    <div style={{ minHeight: '100vh' }}>
      {/* NAV */}
      <nav style={{ background: 'var(--bg1)', borderBottom: '0.5px solid var(--border1)', padding: '10px 16px', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 880, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => { setPage('home'); setRole(null); resetResult() }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, #065f46, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 14 }}>N</div>
            <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.02em' }}>NetuMeu</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[{ k: 'home', l: 'Acasă' }, { k: 'pricing', l: 'Prețuri' }, { k: 'demo', l: 'Demo live' }].map(p => (
              <button key={p.k} onClick={() => setPage(p.k)} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: page === p.k ? 600 : 400, background: page === p.k ? 'var(--bg2)' : 'transparent', color: 'var(--text1)' }}>{p.l}</button>
            ))}
          </div>
          {totalSaved > 0 && (
            <div style={{ background: 'var(--amber-bg)', border: '0.5px solid var(--amber-border)', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 600, color: 'var(--amber)' }}>
              Econom: {fmt(totalSaved)}
            </div>
          )}
        </div>
      </nav>

      <main style={{ maxWidth: 880, margin: '0 auto', padding: '0 16px' }}>
        
        {/* ══════ HOME ══════ */}
        {page === 'home' && (
          <div style={{ animation: 'fadeIn 0.4s' }}>
            <div style={{ textAlign: 'center', padding: '40px 0 28px' }}>
              <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.25, letterSpacing: '-0.03em' }}>
                Clientul vorbește.<br/>Contabilul primește date curate.
              </div>
              <p style={{ fontSize: 15, color: 'var(--text2)', maxWidth: 520, margin: '12px auto 0', lineHeight: 1.6 }}>
                NetuMeu transformă mesajele vocale în facturi, cheltuieli și rapoarte structurate — gata de aprobat cu un click.
              </p>
            </div>

            {/* Before / After */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 12, alignItems: 'center', marginBottom: 28 }}>
              <div style={{ background: 'var(--red-bg)', borderRadius: 14, padding: 16, border: `0.5px solid var(--red-border)` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Fără NetuMeu</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--red)' }}>~45 min</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7, marginTop: 6 }}>Client sună / trimite poze haotice<br/>Contabilul copiază manual<br/>Verifică CUI, calculează TVA<br/>Completează în soft<br/>Generează XML, trimite SPV</div>
              </div>
              <div style={{ fontSize: 28, color: 'var(--text3)' }}>→</div>
              <div style={{ background: 'var(--green-bg)', borderRadius: 14, padding: 16, border: `0.5px solid var(--green-border)` }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Cu NetuMeu</div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--green)' }}>~30 sec</div>
                <div style={{ fontSize: 11, color: 'var(--text2)', lineHeight: 1.7, marginTop: 6 }}>Client vorbește 8 secunde<br/>AI extrage tot automat<br/>CUI verificat instant<br/>Contabilul aprobă un card<br/>Export CSV/XML un click</div>
              </div>
            </div>

            {/* Role buttons */}
            <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'center', marginBottom: 12 }}>Alege cum vrei să testezi:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 32 }}>
              <button onClick={() => { setRole('contabil'); setPage('demo'); resetResult() }} style={{ padding: 20, borderRadius: 14, border: '2px solid var(--blue)', background: 'var(--bg1)', textAlign: 'left' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>💼</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Sunt Contabil</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>Dashboard cu inbox, aprobare, export. Vorbești cu microfonul real.</div>
                <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 8, fontWeight: 500 }}>Primești facturi curate fără muncă manuală →</div>
              </button>
              <button onClick={() => { setRole('client'); setPage('demo'); setChatMsgs([]) }} style={{ padding: 20, borderRadius: 14, border: '2px solid var(--wa-green)', background: 'var(--bg1)', textAlign: 'left' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📱</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>Sunt Client / Firmă</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 4, lineHeight: 1.5 }}>Experiența WhatsApp: vorbești, botul face restul.</div>
                <div style={{ fontSize: 11, color: 'var(--wa-green)', marginTop: 8, fontWeight: 500 }}>Scapi de hârtii — vorbești o dată →</div>
              </button>
            </div>

            {/* Early access */}
            <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: 16, marginBottom: 32, textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Early access — construim împreună</div>
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                Suntem în faza de early access. Dacă ești contabil sau ai o firmă, te invităm să testezi demo-ul cu voce reală și să ne dai feedback.
              </div>
            </div>
          </div>
        )}

        {/* ══════ PRICING ══════ */}
        {page === 'pricing' && (
          <div style={{ animation: 'slideUp 0.4s', padding: '32px 0' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Prețuri simple</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6 }}>Gratuit pentru început. Scalabil pentru firme.</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
              {PLANS.map(p => (
                <div key={p.id} style={{ background: 'var(--bg1)', borderRadius: 14, padding: 20, border: p.hl ? '2px solid var(--blue)' : '0.5px solid var(--border1)', position: 'relative' }}>
                  {p.hl && <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--blue-bg)', color: 'var(--blue)', fontSize: 10, fontWeight: 700, padding: '3px 12px', borderRadius: 20, textTransform: 'uppercase' }}>Popular</div>}
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>{p.desc}</div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 2, marginBottom: 14 }}>
                    <span style={{ fontSize: 32, fontWeight: 700 }}>{p.price}</span>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{p.price === '0' ? ' lei' : ` lei${p.period}`}</span>
                  </div>
                  {p.features.map((f, i) => (
                    <div key={i} style={{ fontSize: 12, padding: '3px 0', display: 'flex', gap: 6, color: 'var(--text2)' }}>
                      <span style={{ color: 'var(--green)' }}>✓</span>{f}
                    </div>
                  ))}
                  <button onClick={() => { setRole('contabil'); setPage('demo') }} style={{ width: '100%', padding: 10, borderRadius: 8, border: p.hl ? 'none' : '0.5px solid var(--border2)', background: p.hl ? 'var(--green)' : 'transparent', color: p.hl ? '#fff' : 'var(--text1)', fontSize: 13, fontWeight: 600, marginTop: 14 }}>{p.cta}</button>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border1)', borderRadius: 14, padding: 16, marginTop: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
              <span style={{ fontSize: 32 }}>🎁</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>Invită clienți, primești o lună gratuită</div>
                <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>Când 10 clienți devin activi prin linkul tău, primești automat o lună de Pro gratis.</div>
              </div>
            </div>
          </div>
        )}

        {/* ══════ DEMO CONTABIL ══════ */}
        {page === 'demo' && role === 'contabil' && (
          <div style={{ animation: 'slideUp 0.4s', padding: '20px 0 32px' }}>
            
            {/* Usage bar */}
            <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, marginBottom: 16 }}>
              <span style={{ color: 'var(--text2)' }}>Plan gratuit:</span>
              <div style={{ flex: 1, height: 6, background: 'var(--border1)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((usedDocs / 30) * 100, 100)}%`, height: '100%', background: usedDocs > 24 ? 'var(--red)' : 'var(--green)', borderRadius: 3, transition: 'width 0.5s' }} />
              </div>
              <span style={{ fontWeight: 600, color: usedDocs > 24 ? 'var(--red)' : 'var(--green)' }}>{usedDocs}/30</span>
            </div>

            <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>Inbox contabil</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 16 }}>
              {speechSupported
                ? 'Apasă microfonul și vorbește în română — sau alege un scenariu rapid de mai jos.'
                : 'Browserul tău nu suportă recunoaștere vocală. Folosește butoanele de scenariu de mai jos.'}
            </div>

            {/* Voice input area */}
            {!result && !processing && (
              <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border1)', borderRadius: 14, padding: 20, marginBottom: 16 }}>
                
                {/* Big mic button */}
                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                  {speechSupported && (
                    <button
                      onMouseDown={startListening}
                      onMouseUp={stopListening}
                      onTouchStart={startListening}
                      onTouchEnd={stopListening}
                      style={{
                        width: 72, height: 72, borderRadius: '50%', border: 'none',
                        background: isListening ? 'var(--red)' : 'var(--wa-green)',
                        color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        animation: isListening ? 'recording 1.5s infinite' : 'none',
                        boxShadow: isListening ? undefined : '0 4px 14px rgba(7,94,84,0.3)'
                      }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                        <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/>
                        <path d="M19 10v1a7 7 0 0 1-14 0v-1" fill="none" stroke="white" strokeWidth="2"/>
                        <line x1="12" y1="19" x2="12" y2="22" stroke="white" strokeWidth="2"/>
                        <line x1="8" y1="22" x2="16" y2="22" stroke="white" strokeWidth="2"/>
                      </svg>
                    </button>
                  )}
                  <div style={{ fontSize: 12, color: isListening ? 'var(--red)' : 'var(--text3)', marginTop: 8, fontWeight: isListening ? 600 : 400 }}>
                    {isListening ? 'Ascult... vorbește acum' : (speechSupported ? 'Ține apăsat și vorbește' : 'Alege un scenariu de mai jos')}
                  </div>
                </div>

                {/* Waveform */}
                {isListening && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                    <Waveform active={isListening} />
                  </div>
                )}

                {/* Live transcript */}
                {(transcript || interimTranscript) && (
                  <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, lineHeight: 1.6, marginBottom: 12 }}>
                    <span>{transcript}</span>
                    <span style={{ color: 'var(--text3)' }}>{interimTranscript}</span>
                  </div>
                )}

                {/* Quick scenario buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
                  {QUICK.map((q, i) => (
                    <button key={i} onClick={() => { setTranscript(q.text); processText(q.text) }}
                      style={{ padding: '10px 6px', borderRadius: 10, border: '0.5px solid var(--border1)', background: 'var(--bg2)', textAlign: 'center', fontSize: 11 }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{q.icon}</div>
                      <div style={{ fontWeight: 600 }}>{q.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Processing */}
            {processing && (
              <div style={{ background: 'var(--bg1)', border: '0.5px solid var(--border1)', borderRadius: 14, padding: 16, marginBottom: 16, animation: 'fadeIn 0.3s' }}>
                {transcript && (
                  <div style={{ background: 'var(--bg2)', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 12 }}>
                    „{transcript}"
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 18, height: 18, border: '2.5px solid var(--border1)', borderTopColor: 'var(--green)', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  AI procesează...
                </div>
                {AI_STEPS.map((s, i) => (
                  <div key={i} style={{
                    fontSize: 12, padding: '4px 0', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.3s',
                    color: i < aiStep ? 'var(--green)' : i === aiStep ? 'var(--text1)' : 'var(--text3)',
                    fontWeight: i === aiStep ? 600 : 400
                  }}>
                    <span style={{ width: 16, textAlign: 'center' }}>{i < aiStep ? '✓' : i === aiStep ? '▸' : '○'}</span>
                    {s}
                    {i === aiStep && <span style={{ animation: 'pulse 1s infinite', fontSize: 10 }}>●</span>}
                  </div>
                ))}
              </div>
            )}

            {/* Result Card */}
            {result && (
              <div style={{ animation: 'slideUp 0.5s' }}>
                {transcript && (
                  <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '8px 14px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/></svg>
                    <span style={{ color: 'var(--text2)', fontStyle: 'italic' }}>„{transcript}"</span>
                  </div>
                )}
                <div style={{ background: 'var(--bg1)', border: approved ? '1.5px solid var(--green)' : '0.5px solid var(--border1)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '16px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{result.data['Tip operațiune']}</div>
                        <div style={{ fontSize: 16, fontWeight: 600, marginTop: 2 }}>
                          {result.data['Client'] || result.data['Furnizor'] || result.data['Subiect'] || 'Document procesat'}
                        </div>
                      </div>
                      <ConfRing v={result.confidence} />
                    </div>

                    <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: 12, marginBottom: 12 }}>
                      {Object.entries(result.data).map(([k, v]) => (
                        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13, borderBottom: '0.5px solid var(--border1)' }}>
                          <span style={{ color: 'var(--text2)' }}>{k}</span>
                          <span style={{ fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{v}</span>
                        </div>
                      ))}
                      {result.suggestion && (
                        <div style={{ marginTop: 8, padding: 10, background: 'var(--blue-bg)', borderRadius: 8, fontSize: 12, lineHeight: 1.6 }}>
                          {result.suggestion}
                        </div>
                      )}
                      {result.note && (
                        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--amber)' }}>⚠ {result.note}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--amber-bg)', borderRadius: 8, border: '0.5px solid var(--amber-border)', marginBottom: 12 }}>
                      <span style={{ fontSize: 12, color: 'var(--amber)' }}>Timp economisit:</span>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--amber)' }}>{fmt(result.savings)}</span>
                    </div>

                    {!approved ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={handleApprove} style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', background: 'var(--green)', color: '#fff', fontSize: 13, fontWeight: 600 }}>Aprobă</button>
                        <button style={{ padding: '11px 16px', borderRadius: 8, border: '0.5px solid var(--border2)', background: 'transparent', fontSize: 13, color: 'var(--text1)' }}>Editează</button>
                        <button style={{ padding: '11px 16px', borderRadius: 8, border: '0.5px solid var(--border2)', background: 'transparent', fontSize: 13, color: 'var(--red)' }}>Respinge</button>
                      </div>
                    ) : !exported ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setExported(true)} style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', background: 'var(--blue)', color: '#fff', fontSize: 13, fontWeight: 600 }}>Export CSV (SAGA)</button>
                        <button onClick={() => setExported(true)} style={{ flex: 1, padding: 11, borderRadius: 8, border: 'none', background: 'var(--purple)', color: '#fff', fontSize: 13, fontWeight: 600 }}>Export XML (SmartBill)</button>
                      </div>
                    ) : (
                      <div style={{ padding: 11, background: 'var(--green-bg)', borderRadius: 8, textAlign: 'center', fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
                        ✓ Exportat — gata pentru import
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: 14 }}>
                  <button onClick={resetResult} style={{ padding: '9px 22px', borderRadius: 8, border: '0.5px solid var(--border2)', background: 'transparent', fontSize: 12, color: 'var(--text1)' }}>
                    ← Comandă nouă
                  </button>
                </div>
              </div>
            )}

            {/* History & Stats */}
            {history.length > 0 && !processing && (
              <div style={{ marginTop: 20 }}>
                <div style={{ background: 'var(--bg2)', borderRadius: 12, padding: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 8, textAlign: 'center', marginBottom: 12 }}>
                  <div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{usedDocs}</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>Procesate</div></div>
                  <div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>{fmt(totalSaved)}</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>Economisite</div></div>
                  <div><div style={{ fontSize: 22, fontWeight: 700, color: 'var(--blue)' }}>{usedDocs > 0 ? Math.round(totalSaved / usedDocs * 20 * 22 / 3600) : 0}h</div><div style={{ fontSize: 11, color: 'var(--text2)' }}>Estimat/lună</div></div>
                </div>

                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Istoric sesiune</div>
                {history.map((h, i) => (
                  <div key={i} style={{ background: 'var(--bg1)', border: '0.5px solid var(--border1)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                    <div>
                      <span style={{ fontWeight: 500 }}>{h.data['Tip operațiune']}</span>
                      <span style={{ color: 'var(--text3)', marginLeft: 8 }}>{h.data['Client'] || h.data['Furnizor'] || h.data['Subiect'] || ''}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ color: 'var(--green)', fontWeight: 600, fontSize: 11 }}>✓ aprobat</span>
                      <span style={{ color: 'var(--text3)', fontSize: 11 }}>{h.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════ DEMO CLIENT ══════ */}
        {page === 'demo' && role === 'client' && (
          <div style={{ animation: 'slideUp 0.4s', padding: '20px 0 32px', maxWidth: 440, margin: '0 auto' }}>
            <div style={{ borderRadius: 14, overflow: 'hidden', border: '0.5px solid var(--border1)' }}>
              <div style={{ background: 'var(--wa-green)', color: '#fff', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700 }}>N</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>NetuMeu Bot</div>
                  <div style={{ fontSize: 11, opacity: 0.7 }}>{chatTyping ? 'scrie...' : 'online'}</div>
                </div>
              </div>
              <div style={{ background: 'var(--wa-bg)', padding: '12px 10px', minHeight: 300, maxHeight: 440, overflowY: 'auto' }}>
                {chatMsgs.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: '#667781', fontSize: 12, lineHeight: 1.6 }}>
                    Apasă un buton de mai jos sau folosește microfonul pentru a trimite o comandă vocală.
                  </div>
                )}
                {chatMsgs.map((m, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: m.from === 'me' ? 'flex-end' : 'flex-start', marginBottom: 6 }}>
                    <div style={{ maxWidth: '82%', padding: '8px 12px', borderRadius: m.from === 'me' ? '10px 10px 0 10px' : '10px 10px 10px 0', background: m.from === 'me' ? 'var(--wa-light)' : 'var(--bg1)', fontSize: 13, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatTyping && (
                  <div style={{ display: 'flex' }}>
                    <div style={{ background: 'var(--bg1)', padding: '10px 16px', borderRadius: '10px 10px 10px 0' }}>
                      <div style={{ display: 'flex', gap: 3 }}>{[0,1,2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#90949c', animation: `bounce 1.2s ${i*0.2}s infinite` }} />)}</div>
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
              <div style={{ background: '#f0f0f0', padding: '8px 10px', borderTop: '0.5px solid #d0d0d0' }}>
                <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 }}>
                  {QUICK.map((q, i) => (
                    <button key={i} onClick={() => clientSend(q.text)} style={{ padding: '6px 12px', borderRadius: 20, border: '0.5px solid var(--wa-green)', background: '#fff', fontSize: 11, fontWeight: 500, whiteSpace: 'nowrap', color: 'var(--wa-green)' }}>
                      {q.icon} {q.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 10 }}>
              Apasă butoanele pentru a simula comenzi vocale WhatsApp
            </div>
          </div>
        )}

      </main>

      <footer style={{ textAlign: 'center', padding: '16px', fontSize: 11, color: 'var(--text3)', borderTop: '0.5px solid var(--border1)', marginTop: 20 }}>
        NetuMeu — Voice bridge pentru contabili din România — Early Access 2026
      </footer>
    </div>
  )
}
