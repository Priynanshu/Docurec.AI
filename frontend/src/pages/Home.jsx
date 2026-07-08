
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Zap, FileText, Shield, Languages, GitCompare, MessageSquare,
  Upload, CheckCircle, ArrowRight, Star, ChevronRight, ScanLine,
  Brain, Lock, Globe, BarChart3
} from 'lucide-react';
import { useSelector } from 'react-redux';


function FadeIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


function FeatureCard({ icon: Icon, title, desc, color, delay }) {
  return (
    <FadeIn delay={delay}>
      <div className="card p-5 h-full hover:border-border-hover transition-colors group">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h3 className="text-sm font-semibold text-text-primary mb-2 group-hover:text-sky transition-colors">
          {title}
        </h3>
        <p className="text-text-tertiary text-xs leading-relaxed">{desc}</p>
      </div>
    </FadeIn>
  );
}


function Stat({ value, label }) {
  return (
    <div className="text-center">
      <motion.p
        className="text-3xl sm:text-4xl font-bold text-sky mb-1"
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, type: 'spring' }}
      >
        {value}
      </motion.p>
      <p className="text-text-tertiary text-sm">{label}</p>
    </div>
  );
}


function Step({ number, title, desc, delay }) {
  return (
    <FadeIn delay={delay} className="flex gap-4">
      <div className="flex-shrink-0 w-9 h-9 rounded-full bg-sky-muted border border-sky/30 flex items-center justify-center">
        <span className="text-sky font-bold text-sm">{number}</span>
      </div>
      <div className="pt-1">
        <p className="text-text-primary font-semibold text-sm mb-1">{title}</p>
        <p className="text-text-tertiary text-xs leading-relaxed">{desc}</p>
      </div>
    </FadeIn>
  );
}


function Testimonial({ name, role, text, delay }) {
  return (
    <FadeIn delay={delay}>
      <div className="card p-5 h-full">
        <div className="flex gap-0.5 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 text-warning fill-warning" />
          ))}
        </div>
        <p className="text-text-secondary text-xs leading-relaxed mb-4">"{text}"</p>
        <div>
          <p className="text-text-primary text-xs font-semibold">{name}</p>
          <p className="text-text-tertiary text-[10px]">{role}</p>
        </div>
      </div>
    </FadeIn>
  );
}


export default function Home() {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const features = [
    {
      icon: ScanLine, color: '#38BDF8', delay: 0,
      title: 'Agentic OCR Pipeline',
      desc: 'Tesseract reads the text, Gemini AI cleans it, detects language, and identifies the document type — all automatically.',
    },
    {
      icon: Brain, color: '#22D3EE', delay: 0.05,
      title: 'Gemini AI Intelligence',
      desc: 'Google Gemini understands Hindi, English, Tamil, Telugu, Bengali and 8 more Indian languages with human-level accuracy.',
    },
    {
      icon: Shield, color: '#F59E0B', delay: 0.1,
      title: 'PII Anonymizer',
      desc: 'Auto-detects and masks Aadhaar numbers, PAN, phone numbers, and addresses. One click to create a Safe Share version.',
    },
    {
      icon: MessageSquare, color: '#0EA5E9', delay: 0.15,
      title: 'AI Chat on Docs',
      desc: 'Ask "What is the DOB in my Aadhaar?" or "Show all court notices from 2024" — AI searches your library and answers.',
    },
    {
      icon: GitCompare, color: '#A78BFA', delay: 0.2,
      title: 'Document Comparison',
      desc: 'Upload two versions of a land record or court order and instantly see field-level differences highlighted.',
    },
    {
      icon: Globe, color: '#34D399', delay: 0.25,
      title: 'Multilingual Translation',
      desc: 'Translate extracted text from any Indian language to English or any other Indian language with one click.',
    },
    {
      icon: BarChart3, color: '#FB923C', delay: 0.3,
      title: 'Analytics Dashboard',
      desc: 'Track documents processed, confidence scores, language distribution, and processing trends over time.',
    },
    {
      icon: Lock, color: '#F87171', delay: 0.35,
      title: 'Production Security',
      desc: 'Helmet, JWT auth, rate limiting, bcrypt passwords, Redis caching, and MongoDB sanitization built in.',
    },
  ];

  return (
    <div className="min-h-screen bg-bg-primary overflow-x-hidden">

      {}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-bg-primary/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-muted border border-sky/30 flex items-center justify-center">
              <Zap className="w-4 h-4 text-sky" />
            </div>
            <span className="font-bold text-text-primary">
              DocuRec<span className="text-sky"> AI</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6 text-sm text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-text-primary transition-colors">How it works</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn-primary flex items-center gap-2 text-sm">
                Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link to="/auth/login" className="btn-secondary text-sm px-3 py-1.5">Sign in</Link>
                <Link to="/auth/register" className="btn-primary text-sm px-3 py-1.5">Get started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {}
      <section className="pt-32 pb-20 px-4 sm:px-6 relative overflow-hidden">
        {}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'radial-gradient(#38BDF8 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

        {}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full opacity-[0.06]"
          style={{ background: '#38BDF8', filter: 'blur(80px)' }} />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-pill border border-sky/30 bg-sky-muted mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky animate-pulse" />
            <span className="text-sky text-xs font-medium">Powered by Google Gemini AI</span>
          </motion.div>

          {}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-tight mb-6"
          >
            Turn any Indian document
            <br />
            <span className="text-sky">into structured intelligence</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-text-secondary text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Upload Aadhaar, PAN, land records, court notices — in any Indian language.
            AI extracts, structures, and makes them searchable in seconds.
          </motion.p>

          {}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
          >
            <Link to={isAuthenticated ? '/upload' : '/auth/register'}
              className="btn-primary flex items-center gap-2 text-base px-6 py-3 w-full sm:w-auto justify-center">
              <Upload className="w-5 h-5" />
              {isAuthenticated ? 'Upload Document' : 'Start for free'}
            </Link>
            <Link to={isAuthenticated ? '/dashboard' : '/auth/login'}
              className="btn-secondary flex items-center gap-2 text-base px-6 py-3 w-full sm:w-auto justify-center">
              {isAuthenticated ? 'Go to Dashboard' : 'Sign in'}
              <ChevronRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4 mt-10 text-text-tertiary text-xs"
          >
            {['12+ Indian Languages', 'PII Masking', 'AI-Powered OCR', 'Open Source Ready'].map((t) => (
              <div key={t} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-success" />
                {t}
              </div>
            ))}
          </motion.div>
        </div>

        {}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="max-w-3xl mx-auto mt-16 relative"
        >
          <div className="card p-1 overflow-hidden">
            {}
            <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-border">
              <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              <div className="flex-1 mx-3 bg-bg-elevated rounded px-3 py-1 text-[10px] text-text-tertiary">
                docurec.ai/documents/aadhaar-scan
              </div>
            </div>

            {}
            <div className="grid grid-cols-2 gap-0 min-h-48">
              {}
              <div className="bg-bg-elevated border-r border-border p-4 flex flex-col items-center justify-center gap-3">
                <div className="w-full h-28 bg-bg-primary rounded-lg border border-border flex items-center justify-center relative overflow-hidden">
                  <FileText className="w-10 h-10 text-text-tertiary/40" />
                  {}
                  <motion.div
                    className="absolute left-0 right-0 h-0.5 bg-sky/60"
                    style={{ boxShadow: '0 0 8px #38BDF8' }}
                    animate={{ top: ['0%', '100%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  />
                </div>
                <p className="text-text-tertiary text-[10px]">Aadhaar_scan.jpg</p>
              </div>

              {}
              <div className="p-4 space-y-1">
                <p className="text-[10px] font-semibold text-sky mb-3 uppercase tracking-wide">Extracted Fields</p>
                {[
                  { key: 'Name', val: 'Rajesh Kumar', conf: 97 },
                  { key: 'DOB', val: '15/08/1985', conf: 95 },
                  { key: 'Aadhaar', val: '•••• •••• 9012', conf: 99 },
                  { key: 'Address', val: '123 Gandhi Nagar…', conf: 88 },
                ].map((f) => (
                  <div key={f.key} className="flex items-center justify-between">
                    <span className="text-[10px] text-text-tertiary w-14 flex-shrink-0">{f.key}</span>
                    <span className="text-[10px] text-text-primary flex-1 truncate font-mono">{f.val}</span>
                    <span className="text-[9px] text-success ml-1">{f.conf}%</span>
                  </div>
                ))}
                <div className="flex items-center gap-1.5 mt-3 pt-2 border-t border-border">
                  <div className="w-1.5 h-1.5 rounded-full bg-success" />
                  <span className="text-[10px] text-success">Completed · 94% confidence</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="badge-sky text-xs mb-3 inline-block">Features</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              Everything you need to process<br />Indian documents at scale
            </h2>
            <p className="text-text-secondary max-w-xl mx-auto">
              From OCR to AI chat to PII masking — the complete pipeline for Indian document intelligence.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f) => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-14">
            <span className="badge-sky text-xs mb-3 inline-block">How it works</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
              From blurry scan to structured data
              <br />in 4 simple steps
            </h2>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            <div className="space-y-8">
              <Step number="1" delay={0}
                title="Upload your document"
                desc="Drag and drop any Indian document — Aadhaar, PAN, land record, court notice, certificate. Supports JPEG, PNG, TIFF, and PDF up to 10MB." />
              <Step number="2" delay={0.1}
                title="Tesseract extracts text"
                desc="Local OCR engine instantly reads text from the image — even blurry scans, rotated pages, and handwritten content in multiple Indian scripts." />
              <Step number="3" delay={0.2}
                title="Gemini AI analyses & structures"
                desc="Google Gemini corrects OCR errors, detects languages, identifies document type, extracts key fields with confidence scores, and flags PII." />
              <Step number="4" delay={0.3}
                title="Search, chat, export, share"
                desc="Your document is now structured intelligence — searchable, translatable, comparable, and ready for AI chat or export as JSON/CSV." />
            </div>

            {}
            <FadeIn delay={0.2} className="hidden md:block">
              <div className="card p-6 space-y-3 sticky top-24">
                <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border border-border">
                  <Upload className="w-5 h-5 text-sky flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary">aadhaar_scan.jpg</p>
                    <div className="w-full h-1 bg-sky rounded-full mt-1" />
                  </div>
                  <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                </div>
                <div className="flex items-center gap-3 p-3 bg-bg-elevated rounded-lg border border-border">
                  <ScanLine className="w-5 h-5 text-warning flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-text-primary">OCR extracting…</p>
                    <div className="w-3/4 h-1 bg-warning/50 rounded-full mt-1">
                      <motion.div className="h-full bg-warning rounded-full"
                        animate={{ width: ['0%', '75%'] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-sky-muted rounded-lg border border-sky/20">
                  <Brain className="w-5 h-5 text-sky flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-sky">Gemini AI processing</p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">Detecting language · Extracting fields</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ k: 'Type', v: 'Aadhaar' }, { k: 'Language', v: 'Hindi' }, { k: 'Confidence', v: '94%' }, { k: 'PII', v: 'Detected' }].map(({ k, v }) => (
                    <div key={k} className="bg-bg-elevated p-2.5 rounded-lg border border-border">
                      <p className="text-[10px] text-text-tertiary">{k}</p>
                      <p className="text-xs font-semibold text-text-primary">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section className="py-16 px-4 border-y border-border bg-bg-secondary">
        <div className="max-w-5xl mx-auto">
          <FadeIn className="text-center mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-2">Works with all Indian document types</h2>
            <p className="text-text-tertiary text-sm">Auto-classifies and extracts fields from 15+ document categories</p>
          </FadeIn>
          <FadeIn>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                'Aadhaar Card', 'PAN Card', 'Voter ID', 'Passport', 'Driving License',
                'Land Record', 'Court Notice', 'Ration Card', 'Birth Certificate',
                'School Certificate', 'Income Certificate', 'Caste Certificate',
                'Medical Record', 'Bank Statement', 'Legal Notice',
              ].map((t) => (
                <span key={t} className="badge-sky text-xs px-3 py-1.5">{t}</span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {}
      <section className="py-24 px-4 sm:px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-[0.05]"
          style={{ background: '#38BDF8', filter: 'blur(60px)' }} />

        <FadeIn className="max-w-2xl mx-auto text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
            Ready to digitize India's documents?
          </h2>
          <p className="text-text-secondary mb-8 text-lg">
            Join DocuRec AI and turn any scan into structured, searchable, actionable intelligence.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={isAuthenticated ? '/upload' : '/auth/register'}
              className="btn-primary flex items-center justify-center gap-2 text-base px-8 py-3">
              <Zap className="w-5 h-5" />
              {isAuthenticated ? 'Upload a Document' : 'Get started free'}
            </Link>
          </div>
        </FadeIn>
      </section>

      {}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-muted border border-sky/30 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-sky" />
            </div>
            <span className="font-bold text-text-primary text-sm">
              DocuRec<span className="text-sky"> AI</span>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-text-tertiary">
            <Link to="/auth/login" className="hover:text-sky transition-colors">Sign in</Link>
            <Link to="/auth/register" className="hover:text-sky transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
