"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mic, FileText, Send, Wrench, Package, FileDown } from "lucide-react";

const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };
const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const scaleIn = { initial: { opacity: 0, scale: 0.96 }, animate: { opacity: 1, scale: 1 }, transition: { duration: 0.45 } };

export function LandingPageClient() {
  const steps = [
    {
      num: "01",
      title: "Describe the Job",
      desc: "Talk through the scope of work in plain language — trade lingo and all. Romex, PEX, 5/8 rock, whatever you say.",
      icon: Mic,
    },
    {
      num: "02",
      title: "Get Your Estimate",
      desc: "Bid.Fast generates a material list, labor cost breakdown, and line items in seconds. No typing.",
      icon: FileText,
    },
    {
      num: "03",
      title: "Send It to the Client",
      desc: "Share a clean, professional estimate from the app with a built-in Accept/Decline link.",
      icon: Send,
    },
  ];

  const features = [
    {
      title: "Voice-First Input",
      desc: "Talk through the job from the truck, the attic, or the crawl space — skip the keyboard entirely.",
      icon: Mic,
      size: "lg",
    },
    {
      title: "Trade-Aware AI",
      desc: "Knows Romex, PEX, 5/8 rock, subway tile, and regional labor rates. Built for tradespeople, not generic offices.",
      icon: Wrench,
      size: "lg",
    },
    {
      title: "Instant Material Lists",
      desc: "Every item from your voice walkthrough becomes a structured list with quantities and costs.",
      icon: Package,
      size: "sm",
    },
    {
      title: "One-Tap Client Send",
      desc: "Email a professional estimate with Accept/Decline built in. Close jobs faster.",
      icon: Send,
      size: "sm",
    },
    {
      title: "PDF Download",
      desc: "Branded, print-ready PDF in one click.",
      icon: FileDown,
      size: "sm",
    },
    {
      title: "Material Export",
      desc: "Share your list directly with your supplier — text, CSV, or native Share.",
      icon: FileText,
      size: "sm",
    },
  ];

  return (
    <main className="flex flex-col min-h-screen overflow-hidden" style={{ background: "oklch(0.985 0.004 68)" }}>

      {/* HERO — split layout per DESIGN.md */}
      <section className="w-full px-4 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: headline + CTA */}
            <motion.div className="space-y-6" initial="initial" animate="animate" variants={stagger}>
              <motion.div
                variants={fadeInUp}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[6px] border border-primary/20 bg-primary/5"
              >
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-medium text-primary">Voice-first estimating for trades</span>
              </motion.div>

              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-6xl font-bold text-foreground leading-[1.05]"
                style={{ fontFamily: "'Space Grotesk', sans-serif", letterSpacing: "-0.02em" }}
              >
                Your Jobs,<br />
                <span className="text-primary">Estimated in Seconds</span>
              </motion.h1>

              <motion.p variants={fadeInUp} className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Describe any job by voice. Bid.Fast gives you material lists, cost estimates, and a shareable PDF instantly. Built for tradespeople who&apos;d rather be on the jobsite than behind a desk.
              </motion.p>

              <motion.div variants={fadeInUp} className="flex items-center gap-4 pt-2">
                <Link href="/signup">
                  <Button size="lg" className="h-12 px-8 text-base font-semibold uppercase tracking-wide rounded-[6px]">
                    Try Bid.Fast Free
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground">No credit card required</span>
              </motion.div>
            </motion.div>

            {/* Right: product mock — takes ≥45% width */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-card rounded-[6px] border border-border shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono ml-2">bid.fast/dashboard</span>
                </div>
                <div className="p-4 space-y-3">
                  {[
                    { status: "accepted", title: "Panel upgrade — 200A service", client: "Rivera Residence", total: "$3,840" },
                    { status: "sent", title: "Full bathroom retile — subway + LVP", client: "Greenfield Builders", total: "$7,200" },
                    { status: "draft", title: "HVAC replacement + flex duct", client: "Office Park LLC", total: "$12,500" },
                  ].map((e, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-[6px] border border-border bg-muted/30">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground truncate">{e.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{e.client}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-sm text-foreground">{e.total}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded-[4px] font-medium ${
                          e.status === "accepted" ? "bg-green-100 text-green-700" :
                          e.status === "sent" ? "bg-blue-100 text-blue-700" :
                          "bg-muted text-muted-foreground"
                        }`}>{e.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full px-4 py-24 bg-secondary/5 border-y border-border">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">How it works</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">From Job Description to Full Estimate</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">Three steps. No typing required.</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {steps.map((step) => (
              <motion.div
                key={step.num}
                variants={fadeInUp}
                className="bg-card border border-border rounded-[6px] p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-4xl font-black text-primary/15" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{step.num}</span>
                  <div className="w-10 h-10 rounded-[6px] bg-primary flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-white" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURES — bento grid per DESIGN.md */}
      <section className="w-full px-4 py-24">
        <div className="container mx-auto max-w-6xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Built for the Field, Not the Office</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">Specific tools for electricians, plumbers, HVAC techs, tile setters, and general contractors.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 lg:grid-cols-3 gap-4"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            {/* Large hero cards */}
            {features.filter(f => f.size === "lg").map((f) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                className="col-span-2 lg:col-span-1 bg-secondary text-secondary-foreground rounded-[6px] p-8 shadow-sm"
              >
                <div className="w-12 h-12 rounded-[6px] bg-primary flex items-center justify-center mb-5">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                <p className="text-secondary-foreground/70 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
            {/* Small cards */}
            {features.filter(f => f.size === "sm").map((f) => (
              <motion.div
                key={f.title}
                variants={scaleIn}
                className="bg-card border border-border rounded-[6px] p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <f.icon className="w-6 h-6 text-primary mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="w-full px-4 py-24 bg-secondary/5 border-y border-border">
        <div className="container mx-auto max-w-4xl">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground">Start free. Upgrade when Bid.Fast is paying for itself.</p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-80px" }}
            variants={stagger}
          >
            <motion.div variants={scaleIn} className="bg-card border border-border rounded-[6px] p-8 shadow-sm">
              <h3 className="font-bold text-lg text-foreground mb-1">Free</h3>
              <div className="text-5xl font-black text-foreground my-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>$0</div>
              <p className="text-muted-foreground text-sm mb-6">forever</p>
              <ul className="space-y-3 mb-8 text-sm">
                {["3 estimates / month", "Voice transcription", "AI estimate generation", "PDF download"].map(i => (
                  <li key={i} className="flex items-center gap-2 text-foreground"><span className="text-primary font-bold">✓</span> {i}</li>
                ))}
              </ul>
              <Link href="/signup">
                <Button variant="outline" className="w-full h-11 rounded-[6px] font-semibold uppercase tracking-wide text-sm">Get Started Free</Button>
              </Link>
            </motion.div>

            <motion.div variants={scaleIn} className="bg-secondary text-secondary-foreground rounded-[6px] p-8 shadow-md relative">
              <div className="absolute -top-3 left-6 px-3 py-1 bg-primary text-white text-xs font-bold rounded-[4px] uppercase tracking-wide">
                Most Popular
              </div>
              <h3 className="font-bold text-lg mb-1">Pro</h3>
              <div className="text-5xl font-black my-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>$39</div>
              <p className="text-secondary-foreground/60 text-sm mb-6">per month</p>
              <ul className="space-y-3 mb-8 text-sm">
                {["Unlimited estimates", "Trade-aware AI (Romex, PEX, more)", "One-tap client send", "Material list export", "PDF download", "7-day free trial"].map(i => (
                  <li key={i} className="flex items-center gap-2 text-secondary-foreground/90"><span className="text-accent font-bold">✓</span> {i}</li>
                ))}
              </ul>
              <Link href="/signup">
                <Button className="w-full h-11 rounded-[6px] font-semibold uppercase tracking-wide text-sm">Start Free Trial</Button>
              </Link>
              <p className="text-center text-xs text-secondary-foreground/50 mt-4">No credit card required</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="w-full px-4 py-24 bg-secondary text-secondary-foreground">
        <motion.div
          className="container mx-auto max-w-3xl text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Spend Less Time Quoting, More Time Building</h2>
          <p className="text-xl text-secondary-foreground/70 mb-10 max-w-xl mx-auto">
            Free to start. No credit card needed. Create your first estimate in under a minute.
          </p>
          <Link href="/signup">
            <Button size="lg" className="h-12 px-10 text-base font-semibold uppercase tracking-wide rounded-[6px]">
              Try Bid.Fast Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </motion.div>
      </section>
    </main>
  );
}
