"use client";

import Link from "next/link";
import { Check, Mic, Zap, Send, FileText, Users, Star } from "lucide-react";

const BRAND = "#007a5e";

export function LandingPageClient() {
  return (
    <main className="flex flex-col min-h-screen bg-[#f9fafb] overflow-hidden">

      {/* ── NAV ── */}
      <nav className="w-full px-6 py-4 flex items-center justify-between bg-white border-b border-gray-100 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: BRAND }}>
            <span className="text-white text-sm font-black">B</span>
          </div>
          <span className="font-bold text-xl text-gray-900">Bid<span style={{ color: BRAND }}>.Fast</span></span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="#pricing" className="hidden sm:block text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors">Pricing</Link>
          <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-gray-900">Log in</Link>
          <Link href="/signup" className="px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95" style={{ background: BRAND }}>
            Start Free
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="w-full px-4 pt-20 pb-24 bg-white">
        <div className="container mx-auto max-w-5xl text-center">

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50 border border-green-200 mb-8">
            <span className="text-xs font-bold uppercase tracking-wide" style={{ color: BRAND }}>Built for trade contractors</span>
          </div>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.05] tracking-tight mb-6">
            Win more bids.<br />
            <span style={{ color: BRAND }}>Stop underpricing.</span><br />
            Save your evenings.
          </h1>

          <p className="text-xl md:text-2xl text-gray-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Record a job walkthrough on your phone. Get a complete labor + materials estimate in seconds — then send it to your client with one tap.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link href="/signup" className="px-8 py-4 rounded-xl text-lg font-bold text-white shadow-lg hover:opacity-90 active:scale-95 transition-all" style={{ background: BRAND }}>
              Get 5 Free Estimates →
            </Link>
            <Link href="#how-it-works" className="px-8 py-4 rounded-xl text-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all">
              See How It Works
            </Link>
          </div>

          <p className="text-sm text-gray-400 font-medium">No credit card required · 5 free estimates to start · Cancel anytime</p>
        </div>
      </section>

      {/* ── PAIN / ROI STRIP ── */}
      <section className="w-full bg-gray-900 py-14">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { stat: "2–3 hrs", label: "Average time contractors spend estimating a single job by hand" },
              { stat: "23%", label: "Jobs lost because a competitor sent a quote faster" },
              { stat: "$8,400/yr", label: "Revenue left on the table from underpriced bids" },
            ].map(({ stat, label }) => (
              <div key={stat}>
                <div className="text-4xl font-black text-white mb-2">{stat}</div>
                <p className="text-gray-400 text-sm leading-relaxed">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="w-full px-4 py-24 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: BRAND }}>How it works</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">From walkthrough to won bid<br />in under 2 minutes</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Mic,
                step: "01",
                title: "Record the job",
                body: "Walk the site and talk through it. Scope, materials, access issues — whatever comes to mind. Trade lingo works fine.",
              },
              {
                icon: Zap,
                step: "02",
                title: "AI builds the estimate",
                body: "Bid.Fast transcribes your voice and generates a complete labor + materials breakdown with line-item pricing.",
              },
              {
                icon: Send,
                step: "03",
                title: "Send it, win it",
                body: "Share a clean estimate link. Your client taps Accept or Decline. You get notified the moment they respond.",
              },
            ].map(({ icon: Icon, step, title, body }) => (
              <div key={step} className="flex flex-col">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 bg-green-50">
                  <Icon className="w-6 h-6" style={{ color: BRAND }} />
                </div>
                <p className="text-xs font-black text-gray-300 uppercase tracking-widest mb-2">{step}</p>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
                <p className="text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="w-full px-4 py-24 bg-gray-50">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: BRAND }}>What you get</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Everything a contractor needs.<br />Nothing they don't.</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: Mic, title: "Voice recording", body: "Works on iPhone, Android, any browser. No app download needed." },
              { icon: Zap, title: "AI estimate in seconds", body: "Labor hours, materials, and line-item costs — generated from your voice." },
              { icon: FileText, title: "PDF export", body: "Download a clean, branded estimate ready to hand to any client." },
              { icon: Send, title: "Client accept/decline", body: "Send a link. Client approves with one tap. You get notified instantly." },
              { icon: Users, title: "Team seats", body: "Add contractors to your account. Each seat is $15/mo, billed to your plan." },
              { icon: Star, title: "EN + ES support", body: "Full Spanish language support — record and receive estimates in Spanish." },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="p-6 rounded-xl bg-white border border-gray-200 hover:border-green-200 hover:shadow-sm transition-all">
                <Icon className="w-6 h-6 mb-4" style={{ color: BRAND }} />
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="w-full px-4 py-24 bg-white">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: BRAND }}>Pricing</p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">Pay for what you use.<br />Stop when you want.</h2>
            <p className="text-lg text-gray-500">One job won pays for a year of Pro. Guaranteed.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">

            {/* Free */}
            <div className="p-7 rounded-2xl border border-gray-200 bg-white flex flex-col">
              <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-1">Free</p>
              <div className="text-4xl font-black text-gray-900 mb-1">$0</div>
              <p className="text-gray-400 text-sm mb-6">Forever free</p>
              <ul className="space-y-3 mb-8 flex-1">
                {["5 estimates to start", "Voice recording", "AI estimate generation", "Client share link"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BRAND }} />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center px-4 py-3 rounded-lg border-2 border-gray-200 font-semibold text-gray-700 hover:border-gray-400 transition-all text-sm">
                Start Free
              </Link>
            </div>

            {/* Solo */}
            <div className="p-7 rounded-2xl border-2 bg-white flex flex-col relative" style={{ borderColor: BRAND }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: BRAND }}>
                Most Popular
              </div>
              <p className="text-sm font-bold uppercase tracking-wide mb-1" style={{ color: BRAND }}>Solo</p>
              <div className="text-4xl font-black text-gray-900 mb-1">$19<span className="text-xl font-semibold text-gray-400">/mo</span></div>
              <p className="text-gray-400 text-sm mb-6">Billed monthly</p>
              <ul className="space-y-3 mb-8 flex-1">
                {["Unlimited estimates", "PDF export", "Company branding", "Email delivery to clients", "Priority support"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: BRAND }} />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center px-4 py-3 rounded-lg font-bold text-white hover:opacity-90 active:scale-95 transition-all text-sm" style={{ background: BRAND }}>
                Start Solo →
              </Link>
            </div>

            {/* Pro */}
            <div className="p-7 rounded-2xl border border-gray-200 bg-gray-900 flex flex-col">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-wide mb-1">Pro</p>
              <div className="text-4xl font-black text-white mb-1">$39<span className="text-xl font-semibold text-gray-500">/mo</span></div>
              <p className="text-gray-500 text-sm mb-6">Billed monthly</p>
              <ul className="space-y-3 mb-8 flex-1">
                {["Everything in Solo", "Team seats (+$15/seat)", "Per-user pricing config", "Shared estimate dashboard", "Seat billing management"].map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 shrink-0 mt-0.5 text-green-400" />{f}
                  </li>
                ))}
              </ul>
              <Link href="/signup" className="block text-center px-4 py-3 rounded-lg font-bold text-gray-900 bg-white hover:bg-gray-100 transition-all text-sm">
                Start Pro →
              </Link>
            </div>

          </div>

          <p className="text-center text-sm text-gray-400 mt-8">All plans include a 5-estimate free trial · Cancel anytime · No setup fees</p>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="w-full px-4 py-24" style={{ background: BRAND }}>
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-5">
            Your next estimate takes 90 seconds.<br />Not 3 hours.
          </h2>
          <p className="text-green-100 text-lg mb-10 max-w-xl mx-auto">
            Join contractors who send faster estimates, win more jobs, and get their evenings back.
          </p>
          <Link href="/signup" className="inline-block px-10 py-4 rounded-xl text-lg font-bold bg-white hover:bg-gray-100 active:scale-95 transition-all" style={{ color: BRAND }}>
            Get 5 Free Estimates →
          </Link>
          <p className="text-green-200 text-sm mt-5">No credit card · Takes 30 seconds to sign up</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="w-full px-6 py-8 bg-gray-900 border-t border-gray-800">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: BRAND }}>
              <span className="text-white text-xs font-black">B</span>
            </div>
            <span className="text-white font-bold">Bid.Fast</span>
            <span className="text-gray-500 text-sm">by HelioStack Technologies LLC</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-500">
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">Terms</Link>
            <Link href="mailto:hello@bid-fast.com" className="hover:text-gray-300 transition-colors">Contact</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
