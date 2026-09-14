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
import { Database, Lock, Zap, Moon, Sun, UploadCloud, MessageSquare, Cpu, ShieldCheck, ArrowUp } from 'lucide-react';
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
          ? 'border-border-default bg-surface-0/90 shadow-card'
          : 'border-border-subtle bg-surface-0/70',
      )}
    >
      <div className="landing-nav flex items-center justify-between gap-4 py-4">
        <BrandMark />

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-0.5">
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
              How it works
            </Button>
            <Button variant="ghost" size="sm" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Features
            </Button>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
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
      <main ref={heroRef} className="landing-hero relative z-10 flex-1 flex flex-col items-center justify-center px-4 text-center pt-12">
        <motion.div
          variants={heroContainer}
          initial="hidden"
          animate="show"
          style={{ opacity: heroOpacity, y: heroY }}
          className="landing-hero-content w-full"
        >
          <motion.div variants={heroItem} className="landing-eyebrow mb-8">
            <span className="w-2 h-2 rounded-full bg-status-success animate-pulse-status" />
            Llama 3.2 · Fully Local · Zero Telemetry
          </motion.div>

          <motion.h1 variants={heroItem} className="landing-title font-display text-text-primary mb-7 text-balance">
            Chat with your{' '}
            <span className="gradient-text gradient-text-anim">
              knowledge base.
            </span>
          </motion.h1>

          <motion.p variants={heroItem} className="landing-intro mx-auto mb-11 text-pretty">
            A high-performance Retrieval-Augmented Generation pipeline on your machine — fast answers, cited sources, and zero data leaving your desk.
          </motion.p>

          <motion.div variants={heroItem} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 w-full max-w-md sm:max-w-none mx-auto">
            <InteractiveHoverButton
              text="Start Chatting"
              size="lg"
              fullWidth
              className="sm:w-auto sm:min-w-[200px]"
              onClick={() => navigate('/app')}
            />
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToFeatures}
              className="rounded-full sm:min-w-[200px]"
            >
              See how it works
            </Button>
          </motion.div>

          <motion.div variants={heroItem} className="flex flex-wrap items-center justify-center gap-3 mt-14">
            {[
              { icon: ShieldCheck, label: 'No cloud, ever', cls: 'text-status-success' },
              { icon: Cpu, label: 'Runs on your hardware', cls: 'text-accent-primary' },
              { icon: Database, label: 'ChromaDB vector search', cls: 'text-accent-glow' },
            ].map(({ icon: Icon, label, cls }) => (
              <span key={label} className="trust-pill">
                <Icon className={cn('w-3.5 h-3.5', cls)} /> {label}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </main>

      {/* ── Stats strip ── */}
      <section className="landing-section landing-stats relative z-10 w-full px-4">
        <motion.div
          variants={revealContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="mx-auto w-full max-w-4xl grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          {[
            { value: 0.1, decimals: 1, suffix: 's', label: 'Avg. response time' },
            { value: 100, suffix: '%', label: 'Local & private' },
            { value: 2, suffix: '', label: 'Models · 1B / 3B' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={revealItem}
              className="glass-panel stat-panel text-center transition-all duration-300 hover:border-accent-primary/35 hover:-translate-y-0.5"
            >
              {i > 0 && <div className="pointer-events-none absolute left-0 top-6 hidden h-12 w-px bg-border-subtle sm:block" />}
              <CountUp to={stat.value} decimals={stat.decimals ?? 0} suffix={stat.suffix} />
              <p className="mt-1 text-[10px] font-mono uppercase tracking-label text-text-dim">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

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
          className="landing-section-heading text-center px-4"
        >
          <p className="landing-eyebrow mb-4">Pipeline</p>
          <h2 className="landing-section-title font-display font-semibold text-text-primary text-balance">
            From PDF to answer in <span className="gradient-text">three</span> steps
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
          className="landing-card-grid grid grid-cols-1 md:grid-cols-3 px-4"
        >
          {STEPS.map((step, i) => (
            <GlassCard key={step.title} variants={revealItem}>
              <span className="absolute -top-3 left-6 px-2 py-0.5 rounded-md bg-accent-primary text-surface-0 text-[10px] font-mono font-semibold tracking-label shadow-glow">
                0{i + 1}
              </span>
              <IconTile className="mb-4">
                <step.icon className="w-5 h-5" />
              </IconTile>
              <h3 className="text-lg font-display font-semibold text-text-primary mb-1.5">{step.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{step.desc}</p>
            </GlassCard>
          ))}
        </motion.div>
      </section>

      {/* ── Feature Grid ── */}
      <section id="features" className="landing-section landing-features relative z-10 w-full scroll-mt-24 px-4">
        <motion.div
          variants={revealItem}
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          className="landing-section-heading text-center"
        >
          <p className="landing-eyebrow mb-4">Capabilities</p>
          <h2 className="landing-section-title font-display font-semibold text-text-primary text-balance">
            Built for <span className="gradient-text">privacy</span> and performance
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
          className="landing-card-grid grid grid-cols-1 md:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <GlassCard key={feature.title} variants={revealItem}>
              <IconTile className="mb-4">
                <feature.icon className="w-6 h-6" />
              </IconTile>
              <h3 className="text-xl font-display font-semibold text-text-primary mb-2">{feature.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">{feature.desc}</p>
            </GlassCard>
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
            <InteractiveHoverButton text="Open RAG Agent" size="lg" onClick={() => navigate('/app')} />
            <Button variant="outline" size="lg" className="rounded-full" onClick={scrollToFeatures}>
              Review the pipeline
            </Button>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="landing-footer relative z-10 border-t border-border-subtle">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-hover to-transparent" />
        <div className="landing-footer-inner w-full px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-label text-text-dim">
            <ShieldCheck className="w-3.5 h-3.5 text-status-success" />
            Local-first · Open-source friendly · No tracking
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-mono uppercase tracking-label text-text-dim">Shortcuts</span>
            <Kbd>/</Kbd>
            <span className="text-[10px] font-mono text-text-dim">focus</span>
            <span className="text-text-dim/40">·</span>
            <Kbd>Esc</Kbd>
            <span className="text-[10px] font-mono text-text-dim">stop</span>
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
];