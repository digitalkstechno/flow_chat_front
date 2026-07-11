import React, { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import { createInquiry } from '../services/api';
import { useTheme } from '@/context/ThemeContext';
import ThemeToggle from '@/components/ThemeToggle';
import {
  MessageSquare,
  ArrowRight,
  ChevronDown,
  Menu,
  X,
  FileText,
  Send,
  CheckCircle,
  FileDown,
  RefreshCw,
  Edit3,
  Sliders,
  ChevronRight
} from 'lucide-react';

/* ─── FAQ data ─── */
const faqs = [
  {
    question: 'How do businesses set up files for WhatsApp retrieval?',
    answer:
      'Administrators log in to their private WA Flow administrator portal, navigate to the contact folder, and upload files under specific slots (INV, REC, etc.) or custom categories. Once uploaded, the bot is immediately active and ready to deliver them.',
  },
  {
    question: 'How does the customer request documents via WhatsApp?',
    answer:
      "Customers text your firm's registered WhatsApp business number (e.g. sending 'hi', 'invoice', or clicking options on the bot menu). The bot identifies them by their registered incoming phone number, retrieves the requested file from the database, and sends it instantly.",
  },
  {
    question: 'Is there any phone number verification?',
    answer:
      "Yes! The WhatsApp bot automatically verifies the customer's incoming phone number against the WA Flow CRM database records. It will only deliver documents associated with that verified phone number, maintaining strict confidentiality.",
  },
  {
    question: 'Can I customize the files and categories?',
    answer:
      "Absolutely. In the WA Flow administration panel, you can define custom document slots (e.g., 'invoice', 'receipt', 'catalog', 'brochure') that correspond to the search terms your customers will query.",
  },
  {
    question: 'How long does it take to activate the WhatsApp bot?',
    answer:
      'Once you connect your business WhatsApp number in the WA Flow admin panel, the bot goes live immediately. You can import your contact list and start uploading documents right away.',
  },
];

/* ─── Types ─── */
interface ChatMessage {
  sender: 'client' | 'bot';
  text?: string;
  file?: { name: string; size: string };
  time: string;
}

/* ─── Design Tokens (Apple + WhatsApp Hybrid) ─── */
const T = {
  primaryInk: '#1d1d1f',      // Primary text
  midGray: '#707070',         // Secondary text
  deepGray: '#474747',        // Medium text (nav)
  hairline: '#d6d6d6',        // Hairline divider
  canvasWhite: '#ffffff',     // Page body background
  canvasGray: '#f4fbf3',      // Alternating band background (WhatsApp green-gray wash)
  coolWash: '#e8e8ed',        // Hover button bg
  quietDot: '#777779',        // Inactive indicator dots
  electricGreen: '#00a884',   // Active brand green (filled buttons)
  linkTeal: '#075e54',        // Deep brand green/teal for links
  ember: '#b64400',           // Orange "Nuevo" badge
  white: '#ffffff',
  slateDark: '#111b21',       // Dark text base
};

const maxW = 1200;

export default function Home() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  /* Nav States */
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bannerClosed, setBannerClosed] = useState(false);

  /* Swatch state for product color selector */
  const [activeSwatch, setActiveSwatch] = useState<'teal' | 'mint' | 'obsidian'>('teal');

  /* Swatch details */
  const swatchConfig = {
    teal: {
      name: 'Classic Teal',
      primaryColor: '#075E54',
      accentColor: '#128C7E',
      bgColor: '#e7fce3',
      swatchHex: '#075E54'
    },
    mint: {
      name: 'Mint Fresh',
      primaryColor: '#00a884',
      accentColor: '#25D366',
      bgColor: '#f4fbf3',
      swatchHex: '#25D366'
    },
    obsidian: {
      name: 'Obsidian Dark',
      primaryColor: '#111b21',
      accentColor: '#2e3b33',
      bgColor: '#eaeef0',
      swatchHex: '#111b21'
    }
  };

  /* Chat Simulator States */
  const [chatList, setChatList] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: "👋 Hello! Welcome to WA Flow automated assistant. Please click one of the quick options below to request your document copy, or type what you need:",
      time: '10:00 AM',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState<Record<string, 'idle' | 'loading' | 'success'>>({});
  const [selectedBotOption, setSelectedBotOption] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const isFirstMount = useRef(true);

  /* Dashboard Settings Sandbox States */
  const [activeSlot, setActiveSlot] = useState<string>('INV');
  const [mappedFiles, setMappedFiles] = useState<Record<string, string>>({
    INV: 'invoice_1024_john.pdf',
    REC: 'payment_receipt_john.pdf',
    CAT: 'product_catalog_2026.pdf',
    BRO: 'business_brochure_2026.pdf',
  });
  const [isMappingSaved, setIsMappingSaved] = useState<string | null>(null);

  /* FAQ State */
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  /* Contact Form State */
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) return;
    setContactLoading(true);
    setContactError(null);
    try {
      await createInquiry(contactForm);
      setContactSuccess(true);
      setContactForm({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err: any) {
      console.error(err);
      setContactError(err.response?.data?.message || 'Failed to submit inquiry. Please try again.');
    } finally {
      setContactLoading(false);
    }
  };

  /* Scroll Listener for navbar sticky backdrop */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Auto-scroll Chat Container */
  useEffect(() => {
    if (isFirstMount.current) { isFirstMount.current = false; return; }
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatList, isTyping]);

  /* Intersection Observer for Scroll Reveal */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('revealed'); }),
      { threshold: 0.1, rootMargin: '0px 0px -30px 0px' }
    );
    document.querySelectorAll('.reveal,.reveal-left,.reveal-right').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  /* Bot Response Logic */
  const triggerBotResponse = (slotKey: 'INV' | 'REC' | 'CAT' | 'BRO' | 'greeting' | 'unknown', clientText: string) => {
    if (isTyping) return;
    if (slotKey !== 'greeting' && slotKey !== 'unknown') { setSelectedBotOption(slotKey); setActiveSlot(slotKey); }
    else setSelectedBotOption(null);
    const t = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatList(prev => [...prev, { sender: 'client', text: clientText, time: t }]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const bt = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (slotKey === 'greeting') {
        setChatList(prev => [...prev, { sender: 'bot', text: "👋 Hello! Welcome to WA Flow automated assistant. Please type 'INV', 'REC', 'CAT', or 'BRO' to fetch your files instantly.", time: bt }]);
      } else if (slotKey === 'unknown') {
        setChatList(prev => [...prev, { sender: 'bot', text: "⚠️ I couldn't find a matching document category. Please type 'INV', 'REC', 'CAT', or 'BRO'.", time: bt }]);
      } else {
        const sizes: Record<string, string> = { INV: '85 KB', REC: '45 KB', CAT: '2.4 MB', BRO: '1.2 MB' };
        const names: Record<string, string> = { INV: 'Invoice File', REC: 'Payment Receipt', CAT: 'Product Catalog', BRO: 'Business Brochure' };
        setChatList(prev => [...prev,
          { sender: 'bot', text: `🔍 Verifying phone number... Match found for John! Retrieving ${names[slotKey]} (${mappedFiles[slotKey]}). Sending now:`, time: bt },
          { sender: 'bot', file: { name: mappedFiles[slotKey], size: sizes[slotKey] }, time: bt },
        ]);
      }
    }, 1000);
  };

  const handleSendCustomMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isTyping) return;
    const c = inputMessage.trim().toLowerCase();
    let k: 'INV' | 'REC' | 'CAT' | 'BRO' | 'greeting' | 'unknown' = 'unknown';
    let d = inputMessage.trim();
    if (c.includes('invoice') || c.includes('inv'))        { k = 'INV'; d = 'Requesting Invoice'; }
    else if (c.includes('receipt') || c.includes('rec'))   { k = 'REC'; d = 'Requesting Receipt'; }
    else if (c.includes('catalog') || c.includes('cat'))   { k = 'CAT'; d = 'Requesting Catalog'; }
    else if (c.includes('brochure') || c.includes('bro'))  { k = 'BRO'; d = 'Requesting Brochure'; }
    else if (/hi|hello|hey|start|namaste/.test(c))         { k = 'greeting'; }
    triggerBotResponse(k, d);
    setInputMessage('');
  };

  const handleDownload = (filename: string) => {
    if (downloadingFile[filename] === 'loading' || downloadingFile[filename] === 'success') return;
    setDownloadingFile(prev => ({ ...prev, [filename]: 'loading' }));
    setTimeout(() => {
      setDownloadingFile(prev => ({ ...prev, [filename]: 'success' }));
      setTimeout(() => setDownloadingFile(prev => ({ ...prev, [filename]: 'idle' })), 3000);
    }, 1500);
  };

  const resetChat = () => {
    setChatList([{ sender: 'bot', text: "👋 Hello! Welcome to WA Flow automated assistant. Please click one of the quick options below to request your document copy, or type what you need:", time: '10:00 AM' }]);
    setIsTyping(false); setSelectedBotOption(null); setInputMessage('');
  };

  const changeMappedFile = (slot: string, v: string) => {
    setMappedFiles(prev => ({ ...prev, [slot]: v }));
    setIsMappingSaved(slot);
    setTimeout(() => setIsMappingSaved(null), 2000);
  };

  /* Alternating band colors (light themes) */
  const sectionBg = (isGray: boolean) => isGray ? T.canvasGray : T.canvasWhite;
  const textColor = T.primaryInk;
  const textMuted = T.midGray;

  /* Premium Apple Style Constants */
  const primaryInkFont = "'Inter', system-ui, sans-serif";

  return (
    <div style={{ minHeight: '100vh', background: T.canvasWhite, color: textColor, fontFamily: primaryInkFont }}>
      <Head>
        <title>WA Flow - Connect and Engage via WhatsApp Bot</title>
        <meta name="description" content="Powerful WhatsApp automation platform. Broadcast messages, set up auto-replies, build template campaigns, and chat with customers instantly on WhatsApp." />
      </Head>

      {/* ══ Promo Ribbon (Apple spec) ══ */}
      {!bannerClosed && (
        <div style={{
          background: T.slateDark,
          color: T.white,
          padding: '12px 24px',
          textAlign: 'center',
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: '-0.12px',
          position: 'relative',
          zIndex: 60,
        }}>
          🎉 WA Flow now supports <strong>template campaign broadcasting</strong> — set it up in minutes.{' '}
          <a href="#how-it-works" style={{ color: '#25D366', fontWeight: 650, marginLeft: 6, textDecoration: 'none' }}>Learn how ›</a>
          <button onClick={() => setBannerClosed(true)} aria-label="Close" style={{
            position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
            background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 20, lineHeight: 1,
          }}>×</button>
        </div>
      )}

      {/* ══ Frosted Sticky Navbar (Apple spec) ══ */}
      <header style={{
        position: 'sticky', top: 0, zIndex: 50, width: '100%', height: 48,
        display: 'flex', alignItems: 'center',
        background: scrolled ? 'rgba(250,250,252,0.85)' : 'rgba(255,255,255,0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: scrolled ? `1px solid ${T.hairline}` : '1px solid transparent',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', padding: '0 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>

          {/* Logo */}
          <a href="#" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
            <img src="/logo.png" alt="WA Flow Logo" style={{ height: 32, width: 'auto', objectFit: 'contain' }} />
          </a>

          {/* Desktop Nav links (centered) */}
          <nav className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {(['How it works', 'Dashboard Preview', 'FAQ', 'Contact Us', 'Guide'] as const).map((label) => {
              const href = label === 'How it works' ? '#how-it-works' : label === 'Dashboard Preview' ? '#mapping-preview' : label === 'FAQ' ? '#faq' : label === 'Guide' ? '/guide' : '#contact';
              return (
                <a key={label} href={href} style={{
                  fontSize: 12, fontWeight: 400, color: T.deepGray, textDecoration: 'none',
                  letterSpacing: '-0.1px',
                  transition: 'color 0.2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.electricGreen)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.deepGray)}
                >{label}</a>
              );
            })}
          </nav>

          {/* Desktop CTA (Pill styled) */}
          <div className="hidden-mobile" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ThemeToggle />
            <a href="https://wa.me/919974401999" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center',
                background: T.electricGreen, color: T.white,
                border: 'none', borderRadius: 980,
                padding: '7px 14px',
                fontSize: 12, fontWeight: 500, textDecoration: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              Connect Bot
            </a>
          </div>

          {/* Mobile drawer toggle */}
          <div className="show-mobile" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ThemeToggle />
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu"
              style={{ padding: 6, background: 'transparent', border: 'none', cursor: 'pointer', color: textColor, display: 'flex', alignItems: 'center' }}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0,
            background: 'rgba(250,250,252,0.98)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${T.hairline}`,
            padding: '24px 28px',
            display: 'flex', flexDirection: 'column', gap: 18,
          }}>
            {[['#how-it-works', 'How it works'], ['#mapping-preview', 'Dashboard Preview'], ['#faq', 'FAQ'], ['#contact', 'Contact Us'], ['/guide', 'Guide']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                style={{ display: 'block', fontWeight: 500, color: textColor, textDecoration: 'none', fontSize: 15, letterSpacing: '-0.374px' }}>
                {label}
              </a>
            ))}
            <a href="https://wa.me/919974401999" target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                background: T.electricGreen, color: T.white,
                borderRadius: 980, padding: '10px 16px', fontSize: 14, fontWeight: 500, textDecoration: 'none'
              }}>
              Get Started Free
            </a>
          </div>
        )}
      </header>

      {/* ══ HERO SECTION (Apple spec: Cathedral of white space) ══ */}
      <section style={{ paddingTop: 64, paddingBottom: 64, background: sectionBg(false), overflow: 'hidden' }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', padding: '0 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          
          {/* Eyebrow / badge block */}
          <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{
              background: 'rgba(182, 68, 0, 0.08)',
              color: T.ember,
              fontSize: 11,
              fontWeight: 650,
              padding: '4px 10px',
              borderRadius: 999,
              letterSpacing: '0.08em',
              textTransform: 'uppercase'
            }}>
              New
            </span>
            <span style={{
              fontSize: 14,
              fontWeight: 600,
              color: T.primaryInk,
              letterSpacing: '-0.1px'
            }}>
              WA Flow 2.0
            </span>
          </div>

          {/* Enormous Display Title */}
          <div className="animate-fade-up stagger-delay-1" style={{ maxWidth: 840, marginBottom: 28 }}>
            <h1 style={{
              fontFamily: primaryInkFont,
              fontWeight: 700,
              fontSize: 'clamp(44px, 7vw, 80px)',
              letterSpacing: '-1.2px',
              lineHeight: 1.05,
              color: textColor,
              margin: 0
            }}>
              WhatsApp automation,<br />made elegant.
            </h1>
          </div>

          {/* Supporting Copy */}
          <div className="animate-fade-up stagger-delay-2" style={{ maxWidth: 580, marginBottom: 36 }}>
            <p style={{ fontSize: 21, lineHeight: 1.38, color: textMuted, letterSpacing: '0.231px', margin: 0 }}>
              Deliver invoices, catalogs, and customer files automatically. Build template campaigns and key replies via an administrative dashboard that stays out of your way.
            </p>
          </div>

          {/* Pill Action CTAs */}
          <div className="animate-fade-up stagger-delay-3" style={{ display: 'flex', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: 28 }}>
            <a href="https://wa.me/919974401999" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-flex', alignItems: 'center',
              background: T.electricGreen, color: T.white,
              border: 'none', borderRadius: 980,
              padding: '12px 24px',
              fontFamily: primaryInkFont, fontSize: 17, fontWeight: 500,
              textDecoration: 'none', transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
              Get Free Demo on WhatsApp
            </a>
            <a href="/guide" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'transparent', color: T.linkTeal,
              border: 'none',
              padding: '12px 24px',
              fontFamily: primaryInkFont, fontSize: 17, fontWeight: 500,
              textDecoration: 'none', transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}>
              Read User Guide <ChevronRight size={16} />
            </a>
          </div>

          {/* Interactive Product Finish Swatch selector (Apple spec) */}
          <div className="animate-fade-up stagger-delay-4" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 32 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Choose a Finish: <strong style={{ color: textColor }}>{swatchConfig[activeSwatch].name}</strong>
            </span>
            <div style={{ display: 'flex', gap: 12 }}>
              {(Object.keys(swatchConfig) as Array<keyof typeof swatchConfig>).map((key) => {
                const config = swatchConfig[key];
                const active = activeSwatch === key;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveSwatch(key)}
                    aria-label={`Select ${config.name}`}
                    style={{
                      width: 28, height: 28,
                      borderRadius: '55%',
                      background: config.swatchHex,
                      border: active ? `2px solid ${T.electricGreen}` : '2px solid transparent',
                      outline: active ? `1px solid ${T.hairline}` : 'none',
                      padding: 0,
                      cursor: 'pointer',
                      boxShadow: active ? '0 0 10px rgba(0,168,132,0.2)' : 'none',
                      transition: 'transform 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.15)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = '')}
                  />
                );
              })}
            </div>
          </div>

          {/* Centered Phone Mockup Visual (Dynamic color based on Swatch Selection) with Floating Cards */}
          <div className="animate-fade-up stagger-delay-5" style={{ width: '100%', display: 'flex', justifyContent: 'center', position: 'relative' }}>
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', width: '100%', maxWidth: 320 }}>
              
              {/* Left Floating Card (Incoming client request) - hidden on mobile */}
              <div className="hidden-mobile animate-float" style={{
                position: 'absolute', left: -220, top: 80, width: 190,
                background: '#ffffff', border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: 20, padding: 14, textAlign: 'left',
                zIndex: 25, boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: 8
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#38bdf8' }} />
                  <span style={{ fontSize: 9, fontWeight: 700, color: T.primaryInk, textTransform: 'uppercase', letterSpacing: '0.04em' }}>INCOMING QUERY</span>
                </div>
                <p style={{ fontSize: 11, color: T.midGray, margin: 0, lineHeight: 1.4 }}>
                  "Hello, please send my invoice copy."
                </p>
                <span style={{ fontSize: 8, color: '#8e8e8e', display: 'block', marginTop: 6, fontWeight: 500 }}>From verified customer number</span>
              </div>

              {/* Phone Mockup frame */}
              <div style={{
                width: 320, height: 580, borderRadius: 28, background: '#0f0f14',
                border: '8px solid #1c1c24',
                position: 'relative', display: 'flex', flexDirection: 'column',
                overflow: 'hidden', userSelect: 'none', flexShrink: 0,
                boxShadow: 'none'
              }}>
              {/* Notch */}
              <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 100, height: 16, background: '#1c1c24', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, zIndex: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2a2a35' }} />
              </div>

              {/* Status bar */}
              <div style={{ background: swatchConfig[activeSwatch].primaryColor, color: 'rgba(255,255,255,0.9)', padding: '16px 20px 4px', fontSize: 9, fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 20 }}>
                <span>10:02 AM</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>5G</span>
                  <div style={{ width: 16, height: 8, border: '1px solid rgba(255,255,255,0.8)', borderRadius: 2, padding: 1, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.9)' }} />
                  </div>
                </div>
              </div>

              {/* Chat Header (Colored dynamically based on swatch selection) */}
              <div style={{
                background: swatchConfig[activeSwatch].primaryColor,
                color: T.white,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 20,
                transition: 'background-color 0.4s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <img src="/logo.png" alt="Mini Logo" style={{ width: 28, height: 28, objectFit: 'contain', background: 'white', borderRadius: '50%', padding: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 11, lineHeight: 1.1, display: 'flex', alignItems: 'center', gap: 3 }}>
                      WA Flow Bot
                      <span style={{ width: 11, height: 11, borderRadius: '50%', background: '#38bdf8', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 6, color: '#fff' }}>✓</span>
                    </div>
                    <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', display: 'block', marginTop: 1 }}>Verified Assistant</span>
                  </div>
                </div>
                <button onClick={resetChat} title="Clear chat" style={{ fontSize: 8, fontWeight: 650, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 4, padding: '3px 6px', color: '#fff', cursor: 'pointer' }}>Reset</button>
              </div>

              {/* Chat Window Container */}
              <div ref={chatContainerRef} style={{ flex: 1, background: '#efeae2', padding: '10px 10px 4px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'flex-end', fontSize: 11 }}>
                {chatList.map((msg, i) => {
                  const isBot = msg.sender === 'bot';
                  return (
                    <div key={i} className={isBot ? 'animate-fade-up' : 'animate-fade-left'}
                      style={{ display: 'flex', flexDirection: 'column', maxWidth: '85%', alignSelf: isBot ? 'flex-start' : 'flex-end', alignItems: isBot ? 'flex-start' : 'flex-end' }}>
                      {msg.text && (
                        <div style={{ padding: '8px 10px', borderRadius: isBot ? '12px 12px 12px 2px' : '12px 12px 2px 12px', background: isBot ? T.white : '#d9fdd3', color: '#1d1c1d', lineHeight: 1.45 }}>
                          {msg.text}
                        </div>
                      )}
                      {msg.file && (
                        <div style={{ background: T.white, padding: 8, borderRadius: '12px 12px 12px 2px', border: '1px solid rgba(0,0,0,0.06)', width: 190, display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(220,38,38,0.1)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><FileText size={14} /></div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: 9, color: '#1d1c1d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{msg.file.name}</div>
                              <div style={{ fontSize: 7, color: '#8e8e8e', fontWeight: 700, textTransform: 'uppercase' }}>{msg.file.size} • PDF</div>
                            </div>
                          </div>
                          <button onClick={() => handleDownload(msg.file!.name)} style={{
                            width: '100%', padding: '5px 8px', borderRadius: 6, fontSize: 8, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer',
                            border: 'none',
                            background: downloadingFile[msg.file.name] === 'success' ? '#25d366' : downloadingFile[msg.file.name] === 'loading' ? '#f5f5f5' : '#e7fce3',
                            color: downloadingFile[msg.file.name] === 'success' ? T.white : downloadingFile[msg.file.name] === 'loading' ? '#8e8e8e' : '#128C7E',
                          }}>
                            {downloadingFile[msg.file.name] === 'loading' ? <><RefreshCw size={8} className="animate-spin" />Downloading...</>
                              : downloadingFile[msg.file.name] === 'success' ? <><CheckCircle size={8} />Saved ✓</>
                              : <><FileDown size={8} />Get Document</>}
                          </button>
                        </div>
                      )}
                      <span style={{ fontSize: 7, color: '#8e8e8e', marginTop: 2, paddingLeft: 2 }}>{msg.time}</span>
                    </div>
                  );
                })}
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '8px 10px', borderRadius: '12px 12px 12px 2px', background: T.white, display: 'flex', alignItems: 'center', gap: 3 }}>
                      {[0, 200, 400].map(d => <div key={d} className="animate-bounce-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: '#8e8e8e', animationDelay: `${d}ms` }} />)}
                    </div>
                  </div>
                )}
              </div>

              {/* Bot Interaction Options */}
              <div style={{ background: '#efeae2', padding: '6px 10px 10px', borderTop: '1px solid rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {[
                    { key: 'INV' as const, text: 'I need my Invoice copy', label: '🧾 Invoice' },
                    { key: 'REC' as const, text: 'Please send my Receipt', label: '💳 Receipt' },
                    { key: 'CAT' as const, text: 'Requesting Product Catalog', label: '📂 Catalog' },
                    { key: 'BRO' as const, text: 'Send my brochure', label: '📜 Brochure' },
                  ].map(({ key, text, label }) => (
                    <button key={key} onClick={() => triggerBotResponse(key, text)} style={{
                      padding: '6px 4px', borderRadius: 6, fontSize: 8, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2,
                      cursor: 'pointer', border: 'none',
                      background: selectedBotOption === key ? swatchConfig[activeSwatch].accentColor : T.white,
                      color: selectedBotOption === key ? T.white : '#1d1c1d',
                    }}>{label}</button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <form onSubmit={handleSendCustomMessage} style={{ background: '#f5f5f5', padding: '6px 10px', display: 'flex', gap: 6, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <input type="text" value={inputMessage} onChange={e => setInputMessage(e.target.value)} placeholder="Type 'Invoice', 'hi'..." style={{ flex: 1, background: T.white, border: 'none', borderRadius: 999, padding: '4px 10px', fontSize: 9, color: '#1d1c1d', outline: 'none' }} />
                <button type="submit" disabled={!inputMessage.trim() || isTyping} style={{ width: 26, height: 26, borderRadius: '50%', background: swatchConfig[activeSwatch].primaryColor, color: T.white, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, opacity: !inputMessage.trim() || isTyping ? 0.4 : 1 }}>
                  <Send size={10} />
                </button>
              </form>
            </div>

            {/* Right Floating Card (Automated bot response) - hidden on mobile */}
            <div className="hidden-mobile animate-float" style={{
              position: 'absolute',
              right: -220,
              top: 220,
              width: 190,
              background: '#d9fdd3',
              border: '1px solid rgba(0,0,0,0.04)',
              borderRadius: 20,
              padding: 14,
              textAlign: 'left',
              zIndex: 25,
              boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
              animationDelay: '1.5s',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#25d366' }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: T.primaryInk, textTransform: 'uppercase', letterSpacing: '0.04em' }}>AUTO DISPATCH</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText size={12} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: T.primaryInk, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {mappedFiles[activeSlot]}
                  </p>
                  <span style={{ fontSize: 8, color: '#55665c' }}>PDF Document</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      </section>

      {/* ══ LOGO CLOUD BAND (Clean text, no lines) ══ */}
      <section style={{ padding: '44px 28px', background: sectionBg(true) }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', textAlign: 'center' }}>
          <p className="reveal" style={{ fontSize: 12, fontWeight: 500, color: textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
            Empowering client automation globally
          </p>
          <div className="reveal stagger-1" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 48, alignItems: 'center' }}>
            {['Apex Solutions', 'Global Ventures', 'ByteCorp', 'Horizon Logistical', 'Prime Retailers'].map(name => (
              <span key={name} style={{ fontFamily: primaryInkFont, fontWeight: 700, fontSize: 13, color: textMuted, letterSpacing: '-0.1px', whiteSpace: 'nowrap' }}>{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS (Apple bands alternation, no borders, 28px card corners) ══ */}
      <section id="how-it-works" style={{ padding: '120px 28px', background: sectionBg(false), overflow: 'hidden' }}>
        <div style={{ maxWidth: maxW, margin: '0 auto' }}>
          
          {/* Header left-aligned */}
          <div className="reveal" style={{ maxWidth: 640, marginBottom: 76 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.electricGreen, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              Core Setup Flow
            </span>
            <h2 style={{
              fontFamily: primaryInkFont,
              fontWeight: 600,
              fontSize: 36,
              letterSpacing: '0.007em',
              color: textColor,
              margin: '0 0 16px'
            }}>
              Simple 4-Step WhatsApp Automation
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.47, color: textMuted, letterSpacing: '-0.022em', margin: 0 }}>
              Connect your database to a verified business number and deliver documents securely based on verified client phone numbers.
            </p>
          </div>

          {/* Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 28 }}>
            {[
              { num: '01', title: 'Configure API Settings', desc: "Enter your CRM Gateway URL and access token in Settings to authenticate operations." },
              { num: '02', title: 'Link WhatsApp Channel', desc: "Register your business number and scan the connection QR code to activate the session." },
              { num: '03', title: 'Map Files & Keyword Rules', desc: "Upload PDF files under custom slots and define keyword triggers (e.g. INV, CAT)." },
              { num: '04', title: 'Automatic Delivery', desc: "The bot monitors queries, verifies client phone numbers, and delivers documents instantly." },
            ].map((step, i) => (
              <div key={step.num} className={`reveal stagger-${i + 1}`} style={{
                background: T.canvasGray,
                borderRadius: 28,
                padding: 28,
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = '')}>
                <span style={{
                  fontFamily: primaryInkFont,
                  fontSize: 44,
                  fontWeight: 700,
                  color: T.electricGreen,
                  display: 'block',
                  marginBottom: 12
                }}>{step.num}</span>
                <h3 style={{ fontFamily: primaryInkFont, fontWeight: 600, fontSize: 17, letterSpacing: '-0.28px', color: textColor, margin: '0 0 8px' }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: textMuted, lineHeight: 1.5, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ INTERACTIVE ADMIN MATRIX PREVIEW (Apple spec feature band, white surface) ══ */}
      <section id="mapping-preview" style={{ padding: '120px 28px', background: sectionBg(true), overflow: 'hidden' }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', display: 'grid', gridTemplateColumns: '5fr 7fr', gap: 76, alignItems: 'center' }}
          className="two-col-grid">

          {/* Left info column */}
          <div className="reveal-left" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.electricGreen, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Control &amp; Management
              </span>
              <h2 style={{
                fontFamily: primaryInkFont,
                fontWeight: 600,
                fontSize: 36,
                letterSpacing: '0.007em',
                color: textColor,
                margin: '0 0 16px'
              }}>
                Simple Configuration Dashboard
              </h2>
              <p style={{ fontSize: 17, lineHeight: 1.47, color: textMuted, letterSpacing: '-0.022em', margin: 0 }}>
                Define document triggers, monitor incoming bot queries, review automated PDF campaign dispatches, and verify client contacts in real time.
              </p>
            </div>

            {/* Sandbox hint */}
            <div style={{ padding: 20, background: T.canvasWhite, borderRadius: 28, border: 'none' }}>
              <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: T.electricGreen, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Sliders size={12} /> Interactive Sandbox
              </span>
              <p style={{ fontSize: 13, color: textMuted, lineHeight: 1.45, margin: 0 }}>
                Click the slot keys (INV, REC, etc.) in the console mockup. Type in a new file name to simulate dynamic document configuration instantly!
              </p>
            </div>
          </div>

          {/* Right mockup column (Apple borderless card) */}
          <div className="reveal-right">
            <div style={{ background: T.canvasWhite, borderRadius: 28, padding: 28, transition: 'all 0.3s ease' }}>
              
              {/* Card Title */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 14, borderBottom: `1px solid ${T.hairline}`, marginBottom: 18 }}>
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6, color: textColor, margin: 0 }}>
                    <Sliders size={14} style={{ color: T.electricGreen }} /> Document Mapping Matrix
                  </h4>
                  <p style={{ fontSize: 8, color: textMuted, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '3px 0 0' }}>Workspace Control Panel</p>
                </div>
                <div style={{ padding: '3px 8px', background: T.canvasGray, color: T.electricGreen, borderRadius: 999, fontSize: 9, fontWeight: 600, letterSpacing: '0.04em' }}>Active Slugs: 4</div>
              </div>

              {/* Dynamic editing inputs */}
              <div className="sandbox-grid" style={{ marginBottom: 16, background: T.canvasGray, padding: 16, borderRadius: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 9, fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase', color: textMuted }}>Select Active Slot</label>
                  <select value={activeSlot} onChange={e => setActiveSlot(e.target.value)} style={{ background: T.canvasWhite, border: `1px solid ${T.hairline}`, borderRadius: 999, padding: '6px 12px', fontSize: 12, fontWeight: 500, color: textColor, outline: 'none', cursor: 'pointer' }}>
                    <option value="INV">Invoice File (INV)</option>
                    <option value="REC">Payment Receipt (REC)</option>
                    <option value="CAT">Product Catalog (CAT)</option>
                    <option value="BRO">Business Brochure (BRO)</option>
                  </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 9, fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase', color: textMuted }}>Map File Name</label>
                  <div style={{ position: 'relative' }}>
                    <input type="text" value={mappedFiles[activeSlot]} onChange={e => changeMappedFile(activeSlot, e.target.value)} style={{ width: '100%', background: T.canvasWhite, border: `1px solid ${T.hairline}`, borderRadius: 999, padding: '6px 28px 6px 12px', fontSize: 11, fontFamily: 'monospace', color: textMuted, outline: 'none' }} />
                    <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: textMuted }}><Edit3 size={10} /></div>
                  </div>
                </div>
                {isMappingSaved === activeSlot && (
                  <span style={{ gridColumn: 'span 2', fontSize: 8, color: T.electricGreen, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 3 }}>
                    <CheckCircle size={9} /> File updated!
                  </span>
                )}
              </div>

              {/* Slot row listing */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(['INV', 'REC', 'CAT', 'BRO'] as const).map(slot => {
                  const labels: Record<string, string> = { INV: 'Invoice Slot', REC: 'Receipt Slot', CAT: 'Catalog Slot', BRO: 'Brochure Slot' };
                  const triggers: Record<string, string> = { INV: '"invoice", "inv"', REC: '"receipt", "rec"', CAT: '"catalog", "cat"', BRO: '"brochure", "bro"' };
                  const active = activeSlot === slot;
                  return (
                    <button key={slot} onClick={() => setActiveSlot(slot)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 14px', borderRadius: 28,
                      border: 'none',
                      background: active ? T.canvasGray : 'transparent',
                      cursor: 'pointer', transition: 'all 0.25s', textAlign: 'left',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 10, background: active ? T.electricGreen : T.canvasGray, color: active ? T.white : T.electricGreen, transition: 'all 0.25s' }}>{slot}</div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 600, color: textColor, fontSize: 12 }}>{labels[slot]}</span>
                            {selectedBotOption === slot && (
                              <span style={{ padding: '1px 5px', borderRadius: 999, background: 'rgba(0,168,132,0.12)', color: T.electricGreen, fontSize: 7, fontWeight: 750, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <span className="animate-ping" style={{ width: 3, height: 3, borderRadius: '50%', background: T.electricGreen, display: 'inline-block' }} />
                                Active
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 9, color: textMuted, display: 'block', marginTop: 1 }}>Keywords: {triggers[slot]}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <code style={{ background: T.canvasWhite, border: `1px solid ${T.hairline}`, padding: '2px 8px', borderRadius: 999, fontSize: 8, fontFamily: 'monospace', color: T.linkTeal, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', fontWeight: 600 }}>{mappedFiles[slot]}</code>
                      </div>
                    </button>
                  );
                })}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ══ FAQ SECTION (Apple light gray wash background) ══ */}
      <section id="faq" style={{ padding: '120px 28px', background: sectionBg(false), overflow: 'hidden' }}>
        <div style={{ maxWidth: 740, margin: '0 auto' }}>
          
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 56 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.electricGreen, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              FAQ
            </span>
            <h2 style={{
              fontFamily: primaryInkFont,
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: '0.007em',
              color: textColor,
              margin: 0
            }}>
              Configuration &amp; Security.
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="reveal" style={{ borderRadius: 28, background: T.canvasGray, overflow: 'hidden', transition: 'all 0.3s ease' }}>
                  <button onClick={() => setOpenFaq(isOpen ? null : index)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 24px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: primaryInkFont, fontSize: 15, fontWeight: 600, color: textColor, transition: 'color 0.2s' }}>
                    <span>{faq.question}</span>
                    <span style={{ transition: 'transform 0.3s', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', color: isOpen ? T.electricGreen : textMuted, flexShrink: 0, marginLeft: 14 }}>
                      <ChevronDown size={16} />
                    </span>
                  </button>
                  <div style={{ maxHeight: isOpen ? 300 : 0, overflow: 'hidden', transition: 'max-height 0.35s cubic-bezier(0.16,1,0.3,1)' }}>
                    <div style={{ padding: '0 24px 22px', fontSize: 14, color: textMuted, lineHeight: 1.5, borderTop: `1px solid ${T.hairline}`, paddingTop: 14 }}>{faq.answer}</div>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ══ CONTACT FORM SECTION (Apple styled cards, white background, pill inputs) ══ */}
      <section id="contact" style={{ padding: '120px 28px', background: sectionBg(true), overflow: 'hidden' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          
          <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.electricGreen, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              Help &amp; Support
            </span>
            <h2 style={{
              fontFamily: primaryInkFont,
              fontWeight: 600,
              fontSize: 32,
              letterSpacing: '0.007em',
              color: textColor,
              margin: '0 0 16px'
            }}>
              Contact Us
            </h2>
            <p style={{ fontSize: 17, lineHeight: 1.47, color: textMuted, letterSpacing: '-0.022em', margin: 0 }}>
              Have questions about setup, pricing, or custom integrations? Send us a message and our team will get back to you.
            </p>
          </div>

          <div className="reveal" style={{ background: T.canvasWhite, borderRadius: 28, padding: 36 }}>
            {contactSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }} className="animate-fade-up">
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(0,168,132,0.1)', color: T.electricGreen, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={24} />
                </div>
                <h3 style={{ fontFamily: primaryInkFont, fontWeight: 600, fontSize: 18, color: textColor, margin: '0 0 8px' }}>Inquiry Sent successfully</h3>
                <p style={{ fontSize: 14, color: textMuted }}>Thank you for reaching out. A representative will contact you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {contactError && (
                  <div style={{ padding: 12, background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 28, color: '#ef4444', fontSize: 13, fontWeight: 500 }}>
                    {contactError}
                  </div>
                )}
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }} className="two-col-grid">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 10, fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase', color: textMuted, paddingLeft: 6 }}>Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rajesh Kumar"
                      value={contactForm.name}
                      onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                      style={{
                        background: T.canvasGray,
                        border: 'none',
                        borderRadius: 999,
                        padding: '10px 16px',
                        fontSize: 14,
                        color: textColor,
                        outline: 'none',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <label style={{ fontSize: 10, fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase', color: textMuted, paddingLeft: 6 }}>Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. rajesh@company.com"
                      value={contactForm.email}
                      onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                      style={{
                        background: T.canvasGray,
                        border: 'none',
                        borderRadius: 999,
                        padding: '10px 16px',
                        fontSize: 14,
                        color: textColor,
                        outline: 'none',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase', color: textMuted, paddingLeft: 6 }}>WhatsApp Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={contactForm.phone}
                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    style={{
                      background: T.canvasGray,
                      border: 'none',
                      borderRadius: 999,
                      padding: '10px 16px',
                      fontSize: 14,
                      color: textColor,
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 10, fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase', color: textMuted, paddingLeft: 6 }}>Your Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="How can we help your firm today?"
                    value={contactForm.message}
                    onChange={e => setContactForm({ ...contactForm, message: e.target.value })}
                    style={{
                      background: T.canvasGray,
                      border: 'none',
                      borderRadius: 20,
                      padding: '12px 16px',
                      fontSize: 14,
                      color: textColor,
                      outline: 'none',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={contactLoading}
                  style={{
                    background: T.electricGreen,
                    color: T.white,
                    border: 'none',
                    borderRadius: 999,
                    padding: '12px',
                    fontFamily: primaryInkFont,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: contactLoading ? 'not-allowed' : 'pointer',
                    opacity: contactLoading ? 0.7 : 1,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  {contactLoading ? 'Submitting...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* ══ FOOTER (Apple spec: dense legal fine print, light gray wash background) ══ */}
      <footer style={{ padding: '64px 28px 36px', background: T.canvasGray, borderTop: `1px solid ${T.hairline}` }}>
        <div style={{ maxWidth: maxW, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 48, marginBottom: 44 }} className="footer-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <img src="/logo.png" alt="WA Flow Logo" style={{ height: 24, width: 'auto', objectFit: 'contain', filter: isDark ? 'brightness(0) invert(1)' : 'none' }} />
            </div>
            <p style={{ fontSize: 12, color: textMuted, maxWidth: 300, lineHeight: 1.5, margin: 0 }}>
              Automated document delivery system via secure WhatsApp bot integration. Custom-built for corporate clients and multi-tenant workflows.
            </p>
          </div>

          <div>
            <h5 style={{ fontSize: 10, fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase', color: textMuted, margin: '0 0 12px' }}>Quick Actions</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['#how-it-works', 'How It Works'], ['#mapping-preview', 'Configurator Sandbox'], ['#faq', 'Frequently Asked Questions'], ['/guide', 'User Guide']].map(([href, label]) => (
                <li key={href}>
                  <a href={href} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: textMuted, textDecoration: 'none', transition: 'color 0.2s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = T.electricGreen)}
                    onMouseLeave={e => (e.currentTarget.style.color = textMuted)}>
                    <ChevronRight size={10} /> {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 style={{ fontSize: 10, fontWeight: 650, letterSpacing: '0.05em', textTransform: 'uppercase', color: textMuted, margin: '0 0 12px' }}>Bot Triggers</h5>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {['Invoice Delivery', 'Payment Receipt Retrieval', 'Product Catalogs', 'Business Brochures'].map(item => (
                <li key={item} style={{ fontSize: 12, color: textMuted }}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ maxWidth: maxW, margin: '0 auto', paddingTop: 20, borderTop: `1px solid ${T.hairline}`, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, fontSize: 11, color: textMuted }}>
          <span>© {new Date().getFullYear()} WA Flow Technologies. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy Policy', 'Terms of Service', 'Security'].map(item => (
              <span key={item} style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = T.electricGreen)}
                onMouseLeave={e => (e.currentTarget.style.color = textMuted)}>{item}</span>
            ))}
          </div>
        </div>
      </footer>

      {/* ══ Global Styles ══ */}
      <style jsx global>{`
        @keyframes float {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-8px); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes fadeLeft {
          from { opacity:0; transform:translateX(-6px); }
          to   { opacity:1; transform:translateX(0); }
        }
        @keyframes bounceDot {
          0%,60%,100% { transform:translateY(0); }
          30%          { transform:translateY(-4px); }
        }

        .animate-float      { animation: float 5s ease-in-out infinite; }
        .animate-fade-up    { animation: fadeUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .animate-fade-left  { animation: fadeLeft 0.3s ease-out both; }
        .animate-bounce-dot { animation: bounceDot 0.8s ease-in-out infinite; }

        .stagger-delay-1    { animation-delay: 0.08s; }
        .stagger-delay-2    { animation-delay: 0.16s; }
        .stagger-delay-3    { animation-delay: 0.24s; }
        .stagger-delay-4    { animation-delay: 0.32s; }
        .stagger-delay-5    { animation-delay: 0.4s; }

        /* Scroll reveal */
        .reveal       { opacity:0; transform:translateY(20px);  transition:opacity 0.6s cubic-bezier(0.16,1,0.3,1),transform 0.6s cubic-bezier(0.16,1,0.3,1); }
        .reveal-left  { opacity:0; transform:translateX(-20px); transition:opacity 0.6s cubic-bezier(0.16,1,0.3,1),transform 0.6s cubic-bezier(0.16,1,0.3,1); }
        .reveal-right { opacity:0; transform:translateX(20px);  transition:opacity 0.6s cubic-bezier(0.16,1,0.3,1),transform 0.6s cubic-bezier(0.16,1,0.3,1); }
        .reveal.revealed, .reveal-left.revealed, .reveal-right.revealed { opacity:1; transform:none; }

        .stagger-1 { transition-delay:0.06s; }
        .stagger-2 { transition-delay:0.12s; }
        .stagger-3 { transition-delay:0.18s; }
        .stagger-4 { transition-delay:0.24s; }

        .sandbox-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        @media (max-width:540px) {
          .sandbox-grid {
            grid-template-columns: 1fr !important;
          }
        }

        /* Responsive */
        .show-mobile   { display:none  !important; }
        .hidden-mobile { display:flex  !important; }

        @media (max-width:768px) {
          .show-mobile   { display:flex  !important; }
          .hidden-mobile { display:none  !important; }
          .hero-grid, .two-col-grid, .footer-grid {
            grid-template-columns: 1fr !important;
            gap: 36px !important;
          }
        }
      `}</style>
    </div>
  );
}
