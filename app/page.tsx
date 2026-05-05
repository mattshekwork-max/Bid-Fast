import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen bg-[#faf9f7] overflow-hidden">
      {/* NAV */}
      <nav className="w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0C1F3D] flex items-center justify-center">
            <span className="text-white text-sm font-bold font-mono">CF</span>
          </div>
          <span className="font-bold text-xl text-[#0C1F3D]">CatchFlow</span>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
          <a href="#features" className="hover:text-[#0C1F3D]">Features</a>
          <a href="#how-it-works" className="hover:text-[#0C1F3D]">How It Works</a>
          <a href="#pricing" className="hover:text-[#0C1F3D]">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-medium text-gray-500 hover:text-[#0C1F3D]">
            Sign in
          </Link>
          <Link href="/signup">
            <button className="inline-flex items-center justify-center whitespace-nowrap text-sm font-medium h-9 px-5 bg-[#0C1F3D] hover:bg-[#071529] text-white rounded-xl transition-all shadow-sm">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="w-full px-4 pt-8 pb-20 md:pt-16 md:pb-28">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center space-y-6">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-[#0C1F3D]/5 border border-[#0C1F3D]/10">
              <span className="w-2 h-2 rounded-full bg-[#0D9488] mr-2 animate-pulse"></span>
              <span className="text-sm font-medium text-[#0C1F3D]">AI-powered follow-up intelligence</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#0C1F3D] max-w-4xl leading-[1.1]">
              Never lose a lead to<br />
              <span className="text-[#0D9488]">buried inbox</span> again
            </h1>

            <p className="text-lg md:text-xl text-gray-600 max-w-2xl leading-relaxed">
              CatchFlow turns missed calls, unseen emails, and forgotten texts into a calm, prioritized follow-up queue — so you always know what to do next.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link href="/signup">
                <button className="inline-flex items-center justify-center gap-2 px-8 h-12 text-base font-medium bg-[#0D9488] hover:bg-[#0d857c] text-white rounded-xl shadow-lg hover:shadow-xl transition-all">
                  Start for free
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </Link>
              <span className="text-sm text-gray-500">No credit card required</span>
            </div>
          </div>

          {/* Hero graphic — queue mock */}
          <div className="mt-16 flex justify-center">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden max-w-2xl w-full">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                <div className="w-3 h-3 rounded-full bg-green-400"></div>
                <span className="ml-3 text-xs text-gray-400 font-mono">catchflow.app/dashboard</span>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { urgent: true, name: "Sarah Mitchell", source: "missed_call", time: "2 min ago", summary: "Requested quote for 24-panel solar install — residential", priority: "high" },
                  { urgent: false, name: "James Ortega", source: "email", time: "14 min ago", summary: "Follow-up on proposal sent last week. No response yet.", priority: "medium" },
                  { urgent: false, name: "Lisa Tran", source: "text", time: "1 hr ago", summary: "Asking about availability for next Tuesday", priority: "low" },
                ].map((lead, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-xl border ${lead.urgent ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${lead.urgent ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                      {lead.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 text-sm">{lead.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lead.urgent ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-600'}`}>
                          {lead.source.replace('_', ' ')}
                        </span>
                        {lead.urgent && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-medium">URGENT</span>}
                      </div>
                      <p className="text-sm text-gray-600 truncate mt-0.5">{lead.summary}</p>
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">{lead.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="w-full px-4 py-24 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[#0D9488] uppercase tracking-wide mb-3">How it works</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0C1F3D] mb-4">Up and running in minutes</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">No complex setup. No monthly minimums. Just connect and go.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: "1", title: "Connect your channels", desc: "Forward calls, connect an inbox, or add leads manually. CatchFlow starts listening immediately." },
              { num: "2", title: "AI scores every lead", desc: "Every new opportunity is analyzed for urgency, intent, and sentiment — instantly." },
              { num: "3", title: "Act from one queue", desc: "A calm, sorted list of everyone who needs a follow-up. Pick the next one and go." },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-xl bg-[#0C1F3D] flex items-center justify-center mb-5">
                  <span className="font-bold text-xl text-white">{step.num}</span>
                </div>
                <h3 className="text-xl font-semibold text-[#0C1F3D] mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="w-full px-4 py-24 bg-[#faf9f7]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[#0D9488] uppercase tracking-wide mb-3">Features</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0C1F3D] mb-4">Everything you need to follow up right</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: "⚡", title: "AI Urgency Detection", desc: "Every lead is scored 1–10 based on buying intent, urgency signals, and sentiment." },
              { icon: "📧", title: "Email Ingest", desc: "Forward or BCC your inbox. CatchFlow reads every message and creates a follow-up." },
              { icon: "📞", title: "Missed Call Recap", desc: "Missed calls become instant leads with summaries. Never let a ring go unreturned." },
              { icon: "💬", title: "Text Follow-up", desc: "Incoming texts are captured, summarized, and queued alongside emails and calls." },
              { icon: "🤖", title: "Suggested Replies", desc: "AI generates a personalized first reply for every lead. Send it or edit it." },
              { icon: "📊", title: "Priority Queue", desc: "A calm, sorted list of every open lead — sorted by urgency, not recency." },
            ].map((f) => (
              <div key={f.title} className="group p-6 rounded-xl border border-gray-200 bg-white hover:border-[#0C1F3D]/20 hover:shadow-md transition-all">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold text-[#0C1F3D] mb-2">{f.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="w-full px-4 py-24 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-sm font-medium text-[#0D9488] uppercase tracking-wide mb-8">Trusted by service businesses</p>
          <blockquote className="text-2xl md:text-3xl font-medium text-[#0C1F3D] leading-relaxed mb-10 max-w-3xl mx-auto">
            "I was losing 3-4 jobs a month to missed callbacks. CatchFlow puts every missed call right in front of me with exactly what they wanted. Closed two deals in my first week."
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#0C1F3D] flex items-center justify-center text-white font-bold">D</div>
            <div className="text-left">
              <p className="font-semibold text-[#0C1F3D]">Derek Solis</p>
              <p className="text-sm text-gray-500">Solis HVAC, Phoenix AZ</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="w-full px-4 py-24 bg-[#faf9f7]">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <p className="text-sm font-medium text-[#0D9488] uppercase tracking-wide mb-3">Pricing</p>
            <h2 className="text-4xl md:text-5xl font-bold text-[#0C1F3D] mb-4">Simple, honest pricing</h2>
            <p className="text-lg text-gray-600">Start free. Upgrade when CatchFlow is paying for itself.</p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="p-8 rounded-2xl border-2 border-[#0C1F3D] bg-white relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#0C1F3D] text-white text-xs font-medium rounded-full">
                CatchFlow Pro
              </div>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold text-[#0C1F3D]">$39</div>
                <p className="text-gray-500 text-sm mt-1">per month</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  "Unlimited leads",
                  "AI urgency scoring",
                  "Email + call + text ingest",
                  "Suggested replies",
                  "Priority queue",
                  "7-day free trial",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-gray-700 text-sm">
                    <svg className="w-4 h-4 text-[#0D9488] shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/signup">
                <button className="w-full h-11 text-sm font-medium bg-[#0D9488] hover:bg-[#0d857c] text-white rounded-xl transition-all">
                  Start free trial
                </button>
              </Link>
              <p className="text-center text-xs text-gray-500 mt-4">No credit card required</p>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="w-full px-4 py-24 bg-[#0C1F3D]">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Stop losing leads to your inbox</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Join service businesses that catch every follow-up. Setup takes 5 minutes.</p>
          <Link href="/signup">
            <button className="inline-flex items-center justify-center gap-2 px-8 h-12 text-base font-medium bg-[#0D9488] hover:bg-[#0d857c] text-white rounded-xl shadow-lg transition-all">
              Try CatchFlow free
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="w-full px-4 py-8 bg-[#071529]">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-[#0C1F3D] flex items-center justify-center">
              <span className="text-white text-xs font-bold font-mono">CF</span>
            </div>
            <span className="text-white font-semibold text-sm">CatchFlow</span>
          </div>
          <p className="text-xs text-gray-500">© 2026 CatchFlow. Built on HelloKetch.</p>
        </div>
      </footer>
    </main>
  );
}
