import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
  animate,
  useInView,
} from 'framer-motion';
import { Database, Lock, Zap, Moon, Sun, UploadCloud, MessageSquare, Cpu, ShieldCheck, ArrowUp, User, FileText, Search, Globe, Terminal, Layers, GitBranch } from 'lucide-react';
import Button from '../components/ui/Button';
import Kbd from '../components/ui/Kbd';
import { InteractiveHoverButton } from '../components/ui/InteractiveHoverButton';
import AmbientBackground from '../components/ui/AmbientBackground';
import ScrollProgress from '../components/ui/ScrollProgress';
import { useTheme } from '../context/theme';
import { cn } from '../lib/utils';

const ThreeHero = lazy(() => import('../components/ThreeHero'));

const EASE = [0.22, 1, 0.36, 1];
const viewportOnce = { once: true, amount: 0.4 };

const heroContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

const heroItem = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.8, ease: EASE } },
};

const revealContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const revealItem = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE } },
};

function BrandMark() {
  return (
    <div className="flex items-center gap-2.5">
      <motion.div
        whileHover={{ rotate: 12, scale: 1.05 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="w-9 h-9 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center shadow-glow"
      >
        <Zap className="w-4 h-4 text-accent-primary" />
      </motion.div>
      <span className="font-display font-bold text-lg text-text-primary tracking-tight max-[380px]:hidden">RAG Agent</span>
    </div>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);

  useMotionValueEvent(scrollY, 'change', (latest) => setScrolled(latest > 12));

  return (
    <motion.nav
      initial={{ y: -32, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: EASE }}
      className={cn(
        'sticky top-0 z-30 w-full border-b backdrop-blur-2xl transition-all duration-300',
        scrolled
          ? 'border-border-default bg-surface-0/95 shadow-card'
          : 'border-transparent bg-surface-0/40',
      )}
    >
      <div className="landing-nav flex items-center justify-between py-3">
        {/* Left: Brand */}
        <BrandMark />

        {/* Center: Navigation Pill */}
        <div className="hidden md:flex items-center gap-1 rounded-full py-1 px-1.5" style={{ background: 'color-mix(in srgb, var(--surface-1) 50%, transparent)', border: '1px solid color-mix(in srgb, var(--border-default) 60%, transparent)' }}>
          <button
            onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-1.5 rounded-full text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2/80 transition-all duration-200"
          >
            How it works
          </button>
          <button
            onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-1.5 rounded-full text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2/80 transition-all duration-200"
          >
            Features
          </button>
          <button
            onClick={() => document.getElementById('use-cases')?.scrollIntoView({ behavior: 'smooth' })}
            className="px-4 py-1.5 rounded-full text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2/80 transition-all duration-200"
          >
            Use Cases
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-full cursor-pointer group hover:bg-surface-1/60 transition-all duration-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent-primary to-accent-glow flex items-center justify-center shadow-sm">
              <User className="w-3.5 h-3.5 text-surface-0" />
            </div>
            <span className="text-sm font-medium text-text-primary">Local User</span>
          </div>

          <div className="hidden sm:block w-px h-5 bg-border-default/50" />

          <button
            onClick={toggleTheme}
            title="Toggle theme"
            aria-label="Toggle theme"
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-2/80 transition-all duration-200"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <InteractiveHoverButton
            text="Launch App"
            size="sm"
            onClick={() => navigate('/app')}
          />
        </div>
      </div>
    </motion.nav>
  );
}

function CountUp({ to, decimals = 0, suffix = '', prefix = '', duration = 1.6 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, to, duration]);

  return (
    <span ref={ref} className="font-mono text-3xl md:text-4xl font-bold text-text-primary tabular-nums tracking-tight">
      {prefix}
      {value.toFixed(decimals)}
      {suffix}
    </span>
  );
}

function GlassCard({ children, className, spotlight = true, ...props }) {
  const ref = useRef(null);

  const handleMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${e.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={spotlight ? handleMove : undefined}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className={cn(
        'glass-panel group relative flex h-full flex-col rounded-2xl p-8 transition-all duration-300 hover:border-accent-primary/35 hover:shadow-lift',
        className,
      )}
      {...props}
    >
      {spotlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background:
              'radial-gradient(480px circle at var(--spot-x, 50%) var(--spot-y, 50%), rgba(242, 184, 75, 0.09), transparent 65%)',
          }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

function IconTile({ children, className }) {
  return (
    <div
      className={cn(
        'relative flex h-12 w-12 items-center justify-center rounded-2xl border border-border-default bg-surface-1 text-accent-primary shadow-card transition-all duration-300 group-hover:scale-105 group-hover:border-accent-primary/30 group-hover:shadow-glow',
        className,
      )}
    >
      {children}
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 140]);

  const scrollToFeatures = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="landing-page min-h-screen bg-surface-0 relative overflow-x-clip flex flex-col">
      <ScrollProgress />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-accent-primary/60 to-transparent" />

      <AmbientBackground intensify />
      <Suspense fallback={null}>
        <ThreeHero />
      </Suspense>

      <Navbar />

      {/* ── Hero ── */}
      <main ref={heroRef} className="landing-hero relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center pt-8">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          style={{ opacity: heroOpacity, y: heroY }}
          className="landing-hero-content w-full"
        >
          <motion.div variants={heroItem} className="flex flex-wrap items-center justify-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-1 border border-border-default text-xs font-medium text-text-primary shadow-sm">
              <span className="w-2 h-2 rounded-full bg-status-success animate-pulse-status" />
              Llama 3.2
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-1 border border-border-default text-xs font-medium text-text-primary shadow-sm">
              <Cpu className="w-3.5 h-3.5 text-accent-primary" />
              Fully Local
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-1 border border-border-default text-xs font-medium text-text-primary shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-accent-primary" />
              Offline
            </span>
          </motion.div>

          <motion.h1 variants={heroItem} className="landing-title font-display text-text-primary mb-6 text-balance">
            Chat with your{' '}
            <span className="gradient-text gradient-text-anim">
              knowledge base.
            </span>
          </motion.h1>

          <motion.p variants={heroItem} className="landing-intro mx-auto mb-12 text-pretty">
            A high-performance Retrieval-Augmented Generation pipeline on your machine — fast answers, cited sources, and zero data leaving your desk.
          </motion.p>

          <motion.div variants={heroItem} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto mb-12">
            <InteractiveHoverButton
              text="Start Chatting"
              size="lg"
              fullWidth
              arrow={false}
              className="sm:w-auto sm:min-w-[200px]"
              onClick={() => navigate('/app')}
            />
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToFeatures}
              className="rounded-full sm:min-w-[200px] group"
            >
              See how it works
              <ArrowUp className="w-4 h-4 rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </motion.div>

          <motion.div variants={heroItem} className="mx-auto w-full max-w-5xl grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
            {[
              { value: 0.1, decimals: 1, suffix: 's', label: 'Avg. response time' },
              { value: 100, suffix: '%', label: 'Local & private' },
              { value: 2, suffix: '', label: 'Models: 1B / 3B' },
              { value: 5000, suffix: '+', label: 'Chunks searchable' },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="glass-panel stat-panel text-center transition-all duration-300 hover:border-accent-primary/35 hover:-translate-y-0.5 py-6 px-4 rounded-2xl"
              >
                <CountUp to={stat.value} decimals={stat.decimals ?? 0} suffix={stat.suffix} />
                <p className="mt-2 text-xs font-mono uppercase tracking-label text-text-dim">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* ── Stats strip moved to Hero ── */}

      {/* ── Tech stack marquee ── */}
      <section className="landing-section relative z-10 w-full overflow-hidden py-2" aria-label="Built with">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-surface-0 to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-surface-0 to-transparent z-10" />
        <div className="flex w-max animate-marquee gap-3 px-4">
          {[...TECH_STACK, ...TECH_STACK].map((item, i) => (
            <span
              key={`${item.label}-${i}`}
              className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-1/60 px-4 py-2 text-[11px] font-mono uppercase tracking-label text-text-muted backdrop-blur-sm"
            >
              <item.icon className="w-3.5 h-3.5 text-accent-primary shrink-0" />
              {item.label}
            </span>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how-it-works" className="landing-section landing-section-band landing-steps relative z-10 w-full scroll-mt-24">
        <motion.div
          variants={revealItem}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="landing-section-heading text-center px-4 mb-12"
        >
          <h2 className="landing-section-title font-display font-semibold text-text-primary text-balance">
            Pipeline: From PDF to answer in <span className="gradient-text">three</span> steps
          </h2>
          <p className="mt-3 text-sm text-text-muted text-pretty">
            A deliberate pipeline built for speed, privacy, and grounded answers.
          </p>
        </motion.div>

        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4 max-w-5xl mx-auto relative"
        >
          {STEPS.map((step, i) => (
            <GlassCard key={step.title} variants={revealItem} className="relative z-10">
              <div className="flex items-center gap-3 mb-5">
                <span className="px-2.5 py-1 rounded-md bg-accent-primary/10 border border-accent-primary/20 text-accent-primary text-xs font-mono font-bold tracking-tight shadow-sm">
                  0{i + 1}
                </span>
                <IconTile className="w-10 h-10 group-hover:scale-105 transition-transform">
                  <step.icon className="w-4 h-4" />
                </IconTile>
              </div>
              <h3 className="text-lg font-display font-semibold text-text-primary mb-2">{step.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
              
              {/* Connector line for desktop */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-1/2 -right-6 w-6 border-t-2 border-dashed border-border-default z-[-1]" />
              )}
            </GlassCard>
          ))}
        </motion.div>
      </section>

      {/* ── Feature Grid (Bento) ── */}
      <section id="features" className="landing-section landing-features relative z-10 w-full scroll-mt-24 px-4">
        <motion.div
          variants={revealItem}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="landing-section-heading text-center mb-12"
        >
          <h2 className="landing-section-title font-display font-semibold text-text-primary text-balance">
            Capabilities: Built for <span className="gradient-text">privacy</span> and performance
          </h2>
          <p className="mt-3 text-sm text-text-muted text-pretty max-w-xl mx-auto">
            Every layer runs on your machine — from embedding to generation — with no external API calls.
          </p>
        </motion.div>

        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto auto-rows-[minmax(200px,auto)]"
        >
          {FEATURES.map((feature, i) => (
            <GlassCard 
              key={feature.title} 
              variants={revealItem}
              className={cn(
                "relative overflow-hidden",
                // First two cards are large, taking 2 columns or spanning more rows if desired. Let's make the first one span 2 cols, the next 1 col, etc.
                i === 0 ? "md:col-span-2 md:row-span-2 p-10 flex flex-col justify-end min-h-[320px]" : 
                i === 1 ? "md:col-span-1 md:row-span-2 p-8" :
                "md:col-span-1 p-6"
              )}
            >
              {i === 0 && (
                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                  <feature.icon className="w-32 h-32 text-accent-primary" />
                </div>
              )}
              <IconTile className={cn("mb-4", i === 0 && "mb-6")}>
                <feature.icon className={cn("w-5 h-5", i === 0 && "w-6 h-6")} />
              </IconTile>
              <h3 className={cn("font-display font-semibold text-text-primary mb-2", i === 0 ? "text-2xl" : "text-lg")}>{feature.title}</h3>
              <p className={cn("text-text-muted leading-relaxed", i === 0 ? "text-base max-w-md" : "text-sm")}>{feature.desc}</p>
            </GlassCard>
          ))}
        </motion.div>
      </section>

      {/* ── Use Cases ── */}
      <section id="use-cases" className="landing-section relative z-10 w-full scroll-mt-24 px-4">
        <motion.div
          variants={revealItem}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="landing-section-heading text-center mb-12"
        >
          <h2 className="landing-section-title font-display font-semibold text-text-primary text-balance">
            Use Cases: Who is this <span className="gradient-text">built for</span>?
          </h2>
          <p className="mt-3 text-sm text-text-muted text-pretty max-w-xl mx-auto">
            From students to engineers, anyone with documents and questions.
          </p>
        </motion.div>

        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="landing-card-grid grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-4xl mx-auto"
        >
          {USE_CASES.map((uc) => (
            <motion.div key={uc.title} variants={revealItem} className="glass-panel rounded-2xl p-6 flex flex-col gap-4 items-start transition-all duration-300 hover:border-accent-primary/35 hover:shadow-lift hover:-translate-y-0.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 shrink-0 rounded-xl bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                  <uc.icon className="w-5 h-5 text-accent-primary" />
                </div>
                <h3 className="text-base font-display font-semibold text-text-primary">{uc.title}</h3>
              </div>
              <p className="text-sm text-text-muted leading-relaxed">{uc.desc}</p>
              <div className="mt-auto pt-4 w-full border-t border-border-subtle">
                <p className="text-[10px] font-mono text-text-dim mb-2 uppercase tracking-label">Example Query</p>
                <div className="bg-surface-1 rounded-lg px-3 py-2 border border-border-default shadow-sm">
                  <p className="text-sm text-text-secondary italic">"{uc.query}"</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── FAQ ── */}
      <section className="landing-section relative z-10 w-full px-4">
        <motion.div
          variants={revealItem}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="landing-section-heading text-center mb-12"
        >
          <h2 className="landing-section-title font-display font-semibold text-text-primary text-balance">
            FAQ: Common <span className="gradient-text">questions</span>
          </h2>
        </motion.div>

        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="max-w-3xl mx-auto flex flex-col gap-3"
        >
          {FAQ_ITEMS.map((faq) => (
            <motion.details
              key={faq.q}
              variants={revealItem}
              className="glass-panel group rounded-xl overflow-hidden transition-all duration-300 hover:border-accent-primary/25"
            >
              <summary className="flex items-center justify-between cursor-pointer px-6 py-4 text-sm font-medium text-text-primary select-none list-none">
                {faq.q}
                <span className="text-text-dim group-open:rotate-45 transition-transform duration-300 text-lg leading-none ml-3">+</span>
              </summary>
              <div className="px-6 pb-4 text-sm text-text-muted leading-relaxed border-t border-border-subtle pt-3">
                {faq.a}
              </div>
            </motion.details>
          ))}
        </motion.div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section relative z-10 w-full pb-4">
        <motion.div
          variants={revealItem}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="glass-panel relative overflow-hidden rounded-3xl border-accent-primary/25 p-10 md:p-14 text-center mx-4"
        >
          <div className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-accent-primary/15 animate-border-glow" />
          <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-96 -translate-x-1/2 rounded-full bg-accent-primary/10 blur-3xl" />
          <h2 className="relative font-display text-2xl md:text-3xl font-bold text-text-primary tracking-tight text-balance">
            Ready to query your documents?
          </h2>
          <p className="relative mt-3 text-sm text-text-muted max-w-md mx-auto text-pretty">
            Drop a PDF, ask in plain language, and get grounded answers with cited sources — all offline.
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <InteractiveHoverButton text="Open RAG Agent" size="lg" arrow={false} onClick={() => navigate('/app')} />
            <Button variant="outline" size="lg" className="rounded-full group" onClick={scrollToFeatures}>
              Review the pipeline
              <ArrowUp className="w-4 h-4 rotate-45 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer relative z-10 border-t border-border-subtle">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-hover to-transparent" />
        <div className="landing-footer-inner w-full px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-label text-text-dim">
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-status-success" /> Local-first</span>
            <span className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-accent-primary" /> Open-source friendly</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-accent-glow" /> No tracking</span>
          </div>

          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="inline-flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-label text-text-dim transition-colors hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 rounded-md px-2 py-1"
            aria-label="Back to top"
          >
            Back to top
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>
      </footer>
    </div>
  );
}

const STEPS = [
  {
    icon: UploadCloud,
    title: 'Upload',
    desc: 'Drop a PDF into your private workspace. It is chunked and embedded into your local ChromaDB.',
  },
  {
    icon: MessageSquare,
    title: 'Ask',
    desc: 'Type any question in plain language. The retriever pulls the most relevant passages instantly.',
  },
  {
    icon: Cpu,
    title: 'Get answers',
    desc: 'Llama 3.2 answers from your documents only, with sources cited, all on your machine.',
  },
];

const TECH_STACK = [
  { icon: Cpu, label: 'Ollama · Llama 3.2' },
  { icon: Database, label: 'ChromaDB Vectors' },
  { icon: Zap, label: 'FastAPI Backend' },
  { icon: ShieldCheck, label: 'Localhost Only' },
  { icon: MessageSquare, label: 'Streaming Answers' },
  { icon: UploadCloud, label: 'PDF Ingestion' },
];

const FEATURES = [
  {
    icon: Lock,
    title: '100% Private',
    desc: 'Runs entirely on localhost. No data ever leaves your machine. Your documents remain securely on your drive.',
  },
  {
    icon: Zap,
    title: 'Llama 3.2 Speed',
    desc: 'Powered by optimized 1B and 3B models for near-instant inference and high-quality reasoning.',
  },
  {
    icon: Database,
    title: 'Vector Memory',
    desc: 'Semantic search over thousands of documents using local ChromaDB vector embeddings.',
  },
  {
    icon: Layers,
    title: 'Chunked Retrieval',
    desc: 'Smart document splitting ensures the most relevant passages are always surfaced for your question.',
  },
  {
    icon: Terminal,
    title: 'Streaming Answers',
    desc: 'Watch responses generate token-by-token in real time with server-sent events for a fluid experience.',
  },
  {
    icon: GitBranch,
    title: 'Open Architecture',
    desc: 'Built on LangChain, FastAPI, and ChromaDB — swap models, tweak prompts, or extend the pipeline freely.',
  },
];

const USE_CASES = [
  {
    icon: FileText,
    title: 'Students & Researchers',
    desc: 'Upload lecture notes, research papers, or textbooks and ask questions to study smarter without cloud dependencies.',
  },
  {
    icon: Search,
    title: 'Legal & Compliance',
    desc: 'Query contracts, policies, and regulatory documents privately — no sensitive data leaves your network.',
  },
  {
    icon: Globe,
    title: 'Product & Engineering Teams',
    desc: 'Index internal docs, RFCs, and runbooks to get instant answers during incident response or onboarding.',
  },
  {
    icon: MessageSquare,
    title: 'Content Creators & Writers',
    desc: 'Chat with your own drafts, outlines, and reference material to brainstorm and fact-check locally.',
  },
];

const FAQ_ITEMS = [
  {
    q: 'Do I need an internet connection?',
    a: 'Only to download the Ollama models initially. After that, everything runs 100% offline on your machine.',
  },
  {
    q: 'What file formats are supported?',
    a: 'Currently PDF and Markdown (.md) files. The pipeline extracts text, chunks it, and embeds it into ChromaDB for retrieval.',
  },
  {
    q: 'How much RAM/VRAM do I need?',
    a: 'The 1B model runs comfortably on 4GB RAM. The 3B model benefits from 8GB+. GPU is optional — CPU inference works out of the box.',
  },
  {
    q: 'Can I swap out the LLM model?',
    a: 'Yes! Change the LLM_MODEL environment variable to any Ollama-compatible model. Mistral, Phi-3, Gemma — they all work.',
  },
  {
    q: 'Is my data stored anywhere?',
    a: 'All vectors are stored locally in ChromaDB on your disk. Chat history is saved in your browser\'s localStorage. Nothing is sent to any server.',
  },
];