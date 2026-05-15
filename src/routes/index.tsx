import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { Countdown } from "@/components/site/Countdown";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { testimonials, faqs } from "@/lib/data/challenge";
import { ClipboardList, GraduationCap, Sparkles, Trophy, Flame, ShieldCheck, Star, Users } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "30 Days Learning Challenge — Seekho, Compete Karo, Jeeto!" },
      { name: "description", content: "India's biggest 30-day daily learning competition for Class 1–12. FREE registration. Win Laptop, Tablet & Smartphone + certificate." },
      { property: "og:title", content: "30 Days Learning Challenge" },
      { property: "og:description", content: "Seekho, Compete Karo, Jeeto! Daily learning challenge for Indian students." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Prizes />
      <Countdown2 />
      <Testimonials />
      <Faq />
      <CTA />
      <Footer />
      <StickyCta />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/60 via-background to-background" />
      <div className="absolute left-1/2 top-10 -z-10 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:py-24">
        <div className="animate-fade-up">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium shadow-card">
            <span className="h-2 w-2 animate-pulse rounded-full bg-secondary" />
            Registrations Open • Class 1–12
          </div>
          <h1 className="text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
            Seekho. <span className="text-gradient">Compete Karo.</span> <span className="text-secondary">Jeeto!</span>
          </h1>
          <p className="mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            India ka sabse exciting 30-day learning challenge. Roz ek topic, ek exam aur jeeto Laptop, Tablet ya Smartphone — registration FREE, exam fee sirf challenge complete karne ke baad.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link to="/register" className="inline-flex h-12 items-center rounded-full bg-gradient-hero px-7 text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.03]">
              Register FREE
            </Link>
            <Link to="/leaderboard" className="inline-flex h-12 items-center rounded-full border border-border bg-card px-7 text-sm font-semibold transition hover:bg-accent">
              View Leaderboard
            </Link>
          </div>
          <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-secondary"/> Secure Razorpay payment</div>
            <div className="flex items-center gap-1.5"><Star className="h-4 w-4 text-saffron"/> 4.8/5 from parents</div>
          </div>
          <div className="mt-6 h-1.5 w-48 rounded-full bg-gradient-india" />
        </div>

        <div className="relative animate-fade-up">
          <div className="relative mx-auto w-full max-w-md rounded-3xl bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Today's Streak</div>
                <div className="mt-1 flex items-center gap-1 text-2xl font-bold">🔥 12 days</div>
              </div>
              <div className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary">Live</div>
            </div>
            <div className="mt-6 grid grid-cols-6 gap-1.5">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded-md ${i < 12 ? "bg-secondary" : i === 12 ? "bg-primary animate-pulse-glow" : "bg-muted"}`} />
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-accent p-4">
              <div className="text-xs font-medium text-primary">Aaj ka task</div>
              <div className="mt-1 font-semibold">Day 13: Indian Constitution Basics</div>
              <div className="mt-1 text-xs text-muted-foreground">5 MCQs • ~10 mins</div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <Stat icon={<Trophy className="h-4 w-4"/>} v="#7" l="Rank" />
              <Stat icon={<Flame className="h-4 w-4"/>} v="40%" l="Done" />
              <Stat icon={<Users className="h-4 w-4"/>} v="2,184" l="Live" />
            </div>
          </div>
          <div className="absolute -right-4 top-6 hidden rounded-2xl bg-gradient-gold p-3 text-xs font-bold text-foreground shadow-soft md:block animate-float">
            🥇 Win a Laptop
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ icon, v, l }: { icon: React.ReactNode; v: string; l: string }) {
  return (
    <div className="rounded-xl bg-muted/60 p-3">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-card text-primary">{icon}</div>
      <div className="text-sm font-bold">{v}</div>
      <div className="text-[10px] uppercase text-muted-foreground">{l}</div>
    </div>
  );
}

function SocialProof() {
  return (
    <section className="border-y border-border bg-card/60">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-around gap-4 px-4 py-5 text-sm text-muted-foreground sm:px-6">
        <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary"/><span><b className="text-foreground">12,847</b> students already registered</span></div>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-primary"/><span>Across <b className="text-foreground">320+</b> cities in India</span></div>
        <div className="hidden h-6 w-px bg-border sm:block" />
        <div className="flex items-center gap-2"><Trophy className="h-4 w-4 text-primary"/><span>Top 3 win <b className="text-foreground">Laptop, Tablet & Smartphone</b></span></div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { i: <ClipboardList className="h-6 w-6"/>, t: "Register", d: "Account banao bilkul FREE — koi payment nahi." },
    { i: <Sparkles className="h-6 w-6"/>, t: "30 Days Learning", d: "Roz ek naya topic + 5 MCQs." },
    { i: <GraduationCap className="h-6 w-6"/>, t: "Final Exam", d: "30 questions, 45 minutes." },
    { i: <Trophy className="h-6 w-6"/>, t: "Win Prizes", d: "Laptop, Tablet, Phone + certificate." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">How it works</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">4 easy steps to <span className="text-gradient">jeet</span></h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-4">
        {steps.map((s, i) => (
          <div key={s.t} className="relative rounded-3xl border border-border bg-card p-6 shadow-card transition hover:-translate-y-1 hover:shadow-soft">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-hero text-primary-foreground">{s.i}</div>
            <div className="text-xs font-bold text-primary">STEP {i + 1}</div>
            <div className="mt-1 text-lg font-semibold">{s.t}</div>
            <p className="mt-1 text-sm text-muted-foreground">{s.d}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Prizes() {
  const items = [
    { prize: "Laptop",     place: "1st Place", grad: "bg-gradient-gold",   emoji: "💻", note: "Plus certificate + gift" },
    { prize: "Tablet",     place: "2nd Place", grad: "bg-gradient-silver", emoji: "📱", note: "Plus certificate + gift" },
    { prize: "Smartphone", place: "3rd Place", grad: "bg-gradient-bronze", emoji: "📲", note: "Plus certificate + gift" },
  ];
  return (
    <section className="bg-accent/40 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Prizes</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Top 3 winners ko <span className="text-gradient">Laptop, Tablet & Phone</span></h2>
          <p className="mt-3 text-muted-foreground">Aur har participant ko special gift + digital certificate guaranteed!</p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {items.map((it, idx) => (
            <div key={it.place} className={`rounded-3xl p-1 ${it.grad} shadow-soft ${idx === 0 ? "md:-translate-y-4" : ""}`}>
              <div className="rounded-[22px] bg-card p-7 text-center">
                <div className="text-5xl">{it.emoji}</div>
                <div className="mt-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">{it.place}</div>
                <div className="mt-2 text-4xl font-extrabold">{it.prize}</div>
                <div className="mt-2 text-xs text-muted-foreground">{it.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Countdown2() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="overflow-hidden rounded-3xl bg-gradient-hero p-8 text-primary-foreground shadow-soft md:p-12">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Hurry up!</p>
            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Registration closes in</h2>
            <p className="mt-2 max-w-md opacity-90">Next batch shuru hone wala hai. Apni seat aaj hi book kar lo.</p>
            <Link to="/register" className="mt-6 inline-flex h-12 items-center rounded-full bg-card px-7 text-sm font-semibold text-primary shadow-soft transition hover:scale-[1.03]">
              Register FREE
            </Link>
          </div>
          <div className="flex justify-center md:justify-end"><Countdown /></div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Real Stories</p>
        <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Students kya keh rahe hain</h2>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {testimonials.map(t => (
          <div key={t.name} className="rounded-3xl border border-border bg-card p-6 shadow-card">
            <div className="text-3xl">{t.emoji}</div>
            <p className="mt-3 text-sm leading-relaxed">"{t.text}"</p>
            <div className="mt-5 border-t border-border pt-4">
              <div className="font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.cls}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section className="bg-accent/40 py-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">FAQs</p>
          <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Aapke sawaal, hamare jawaab</h2>
        </div>
        <Accordion type="single" collapsible className="mt-10 space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`f-${i}`} className="rounded-2xl border border-border bg-card px-5">
              <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
      <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-card">
        <h2 className="text-3xl font-bold sm:text-4xl">Ready ho? <span className="text-gradient">Challenge accept karo!</span></h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">12,847+ students already in. Aap kab join karoge?</p>
        <Link to="/register" className="mt-7 inline-flex h-12 items-center rounded-full bg-gradient-hero px-8 text-sm font-semibold text-primary-foreground shadow-soft transition hover:scale-[1.03]">
          Register FREE
        </Link>
      </div>
    </section>
  );
}

function StickyCta() {
  return (
    <Link to="/register" className="fixed bottom-4 left-1/2 z-50 inline-flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-gradient-hero px-6 text-sm font-semibold text-primary-foreground shadow-soft md:hidden">
      <Trophy className="h-4 w-4" /> Register FREE
    </Link>
  );
}
