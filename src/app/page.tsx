"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, ShieldCheck, Zap, CheckCircle, Heart, Sun } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const fadeUp: any = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-[#FFFBF9] selection:bg-orange-100 selection:text-orange-900">
      <Navbar />


      <div className="fixed inset-0 pointer-events-none -z-50 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[1200px] h-[1200px] bg-gradient-to-br from-orange-200/40 via-rose-200/30 to-transparent rounded-full blur-[120px] mix-blend-multiply opacity-80" />
        <div className="absolute bottom-[-10%] left-[-20%] w-[1000px] h-[1000px] bg-gradient-to-tr from-rose-200/40 via-pink-200/30 to-transparent rounded-full blur-[100px] mix-blend-multiply opacity-80" />
        <div className="absolute top-[40%] left-[20%] w-[600px] h-[600px] bg-orange-300/20 rounded-full blur-[140px] mix-blend-screen" />
      </div>


      <section className="pt-40 pb-20 px-6 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">

          {/* Left — Copy */}
          <div className="relative z-10">
            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={0}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-orange-100 shadow-sm mb-10"
            >
              <Sun className="h-4 w-4 text-orange-500 animate-spin-slow" />
              <span className="text-xs font-bold text-orange-600 tracking-wide uppercase">The Golden Hour for Finance</span>
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-6xl md:text-8xl font-black tracking-tight text-rose-950 mb-8 leading-[0.95] font-outfit"
            >
              Money that<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-rose-500 to-pink-600 animate-gradient-x">
                Feels Alive.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-xl md:text-2xl text-slate-600 mb-12 max-w-lg leading-relaxed font-medium"
            >
              Connect with real people, grow your wealth in the sunshine, and leave the cold banking world behind.
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-col sm:flex-row gap-5 mb-16"
            >
              <Link href="/dashboard?tab=market">
                <Button size="lg" className="sunset-button h-16 px-10 rounded-full text-lg font-bold shadow-xl shadow-orange-500/25 group">
                  Start Earning Today <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/dashboard?tab=loans">
                <Button size="lg" variant="outline" className="h-16 px-10 rounded-full text-lg font-bold border-2 border-orange-100 bg-white/50 backdrop-blur-sm hover:bg-white hover:border-orange-200 text-rose-900 transition-all">
                  Get Funded
                </Button>
              </Link>
            </motion.div>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={4}
              className="flex items-center gap-8 text-rose-900/80 font-medium"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white bg-orange-${i * 100 + 200} shadow-sm`} />
                ))}
              </div>
              <p>Join <span className="font-bold text-rose-950">10,000+</span> happy members</p>
            </motion.div>
          </div>

          {/* Right — Lifestyle Visual (NEW HERO IMAGE) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative h-[600px] w-full hidden lg:block"
          >
            {/* Main Image Mask */}
            <div className="absolute inset-0 rounded-[3rem] overflow-hidden shadow-2xl shadow-rose-900/20 rotate-3 transition-transform hover:rotate-2 duration-700">
              <img
                src="https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=1200&auto=format&fit=crop"
                alt="Financial growth and sustainability"
                className="w-full h-full object-cover transform scale-105 hover:scale-110 transition-transform duration-[2s]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rose-900/40 to-transparent mix-blend-multiply" />
            </div>

            {/* Floating Stats Card - Glass */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="absolute bottom-10 -left-10 bg-white/90 backdrop-blur-xl border border-white/50 p-6 rounded-3xl shadow-xl max-w-xs"
            >
              <div className="flex items-center gap-4 mb-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-white shadow-lg">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-500 uppercase tracking-wider">Average Returns</p>
                  <p className="text-3xl font-black text-slate-900">12.5%</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                "Better than my bank, and it feels good to help real people." — <span className="text-rose-600 font-bold">Sarah J.</span>
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>


      <section className="py-12 border-y border-orange-100/50 bg-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-bold text-rose-400 uppercase tracking-[0.3em] mb-8">Trusted by visionaries at</p>
          <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Simple text placeholders for logos to avoid external SVG deps */}
            {['TechFlow', 'GlobalBank', 'FutureFund', 'EcoInvest'].map((logo) => (
              <span key={logo} className="text-xl font-black text-rose-900/40 hover:text-rose-600 transition-colors cursor-default">{logo}</span>
            ))}
          </div>
        </div>
      </section>


      <section className="py-32 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24 max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500 mb-6 block">Why PeerLend</span>
            <h2 className="text-5xl md:text-6xl font-black text-rose-950 mb-8 font-outfit leading-tight">
              Banking was cold.<br />We made it <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-rose-600">Golden. ☀️</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Safety First, Always",
                desc: "Bank-grade encryption meets human trust. Every penny is protected, every user verified.",
                accent: "rose",
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                desc: "Don't wait for business days. Funds move as fast as you do — usually in minutes.",
                accent: "orange",
              },
              {
                icon: Heart,
                title: "Community Driven",
                desc: "When you earn, someone else gets funded. It's a cycle of growth that benefits everyone.",
                accent: "pink",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="group relative bg-white rounded-[2.5rem] border border-orange-50 p-10 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-500 overflow-hidden"
              >
                <div className={`absolute top-0 right-0 p-8 opacity-[0.03] text-${item.accent}-600 transform group-hover:scale-110 transition-transform duration-700`}>
                  <item.icon className="w-48 h-48" />
                </div>

                <div className={`h-16 w-16 rounded-2xl bg-${item.accent}-50 text-${item.accent}-500 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-300 shadow-sm`}>
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-black text-rose-950 mb-4 font-outfit">{item.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium text-lg">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>


      <section className="py-24 px-6 relative overflow-hidden">
        {/* Warm Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-50/80 to-white -z-20" />

        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <span className="text-xs font-bold uppercase tracking-[0.25em] text-orange-500 mb-6 block">Simple & Easy</span>
              <h2 className="text-5xl font-black text-rose-950 mb-10 font-outfit leading-tight">
                Start your journey<br />in three sunsets.
              </h2>

              <div className="space-y-12">
                {[
                  { title: "Create Profile", text: "Sign up in 60 seconds with just your basics." },
                  { title: "Connect & Match", text: "Our warm algorithm finds the perfect peer for you." },
                  { title: "Grow Together", text: "Watch your money bloom with daily interest or easy EMI." }
                ].map((step, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full border-2 border-orange-200 flex items-center justify-center font-bold text-orange-500 bg-white">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-rose-950 mb-2">{step.title}</h4>
                      <p className="text-slate-600 font-medium">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics/Process Visual - USING OLD HERO IMAGE */}
            <div className="order-1 lg:order-2 relative h-[500px] w-full bg-orange-100 rounded-[3rem] overflow-hidden group">
              <img
                src="https://images.unsplash.com/photo-1543269865-cbf427effbad?q=80&w=1200&auto=format&fit=crop"
                alt="Friends laughing at sunset"
                className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-[1.5s]"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-rose-500/20 to-orange-400/20 mix-blend-overlay" />

              {/* Optional: Add a small overlaid chart to emphasize 'Analytics' if needed, but keeping it simple as per 'Sunset Theme' */}
            </div>
          </div>
        </div>
      </section>


      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 rounded-[3rem] p-12 md:p-20 overflow-hidden shadow-2xl shadow-rose-300/40 grid lg:grid-cols-2 gap-12 items-center">

            {/* Background Decor */}
            <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0)_40%)]" />
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -mr-32 -mt-32 mix-blend-overlay" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-orange-400/20 rounded-full blur-3xl -ml-20 -mb-20 mix-blend-overlay" />

            {/* Left: Content */}
            <div className="relative z-10 text-center lg:text-left">
              <span className="inline-block px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-white font-bold text-xs uppercase tracking-widest mb-6 backdrop-blur-md">
                Limited Time Offer
              </span>
              <h2 className="text-5xl md:text-6xl font-black text-white mb-6 font-outfit leading-tight drop-shadow-sm">
                Ready to glow?
              </h2>
              <p className="text-xl text-white/90 mb-10 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                Join <span className="font-bold text-white border-b-2 border-white/50">50,000+ members</span> growing their wealth in the sunshine.
                Sign up today and get your first month fee-free.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href="/signup">
                  <Button size="lg" className="bg-white text-rose-600 hover:bg-rose-50 h-16 px-10 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all duration-300 border-0 w-full sm:w-auto">
                    Start for Free
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="h-16 px-10 rounded-full text-lg font-bold border-2 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:border-white backdrop-blur-sm w-full sm:w-auto">
                    Talk to Sales
                  </Button>
                </Link>
              </div>
              <p className="mt-6 text-xs font-bold text-white/60 uppercase tracking-wider">
                No credit check required • Cancel anytime
              </p>
            </div>

            {/* Right: Premium Visual elements */}
            <div className="relative z-10 hidden lg:block h-[400px]">
              {/* Card 1: Back */}
              <div className="absolute top-10 right-10 w-72 h-80 bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl -rotate-6 transform scale-95 opacity-60" />

              {/* Card 2: Functional */}
              <div className="absolute top-0 right-20 w-80 bg-white/20 backdrop-blur-xl border border-white/40 rounded-[2rem] p-6 shadow-2xl shadow-rose-900/20 text-white transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between items-center mb-8">
                  <div className="h-10 w-10 bg-white/30 rounded-full flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider bg-green-500/20 px-3 py-1 rounded-full border border-green-400/30 text-green-100">Active</span>
                </div>

                <p className="text-sm font-medium text-white/80 mb-1">Total Earnings</p>
                <p className="text-4xl font-black mb-6">$12,450.00</p>

                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/10 border border-white/10">
                      <div className="h-2 w-2 rounded-full bg-green-400" />
                      <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full bg-white/80 w-[70%]" />
                      </div>
                      <span className="text-xs font-bold">+$480</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute bottom-10 right-0 bg-white text-rose-600 px-6 py-3 rounded-2xl font-black shadow-xl animate-bounce">
                🚀 12.5% APY
              </div>
            </div>

          </div>
        </div>
      </section>


      <footer className="py-20 px-6 border-t border-rose-100 bg-orange-50/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto grid md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                <span className="font-bold text-xl uppercase italic">P</span>
              </div>
              <span className="text-2xl font-black tracking-tight text-rose-950 font-outfit">PeerLend</span>
            </div>
            <p className="text-rose-900/60 leading-relaxed font-medium max-w-xs text-sm">
              We believe in people, transparency, and good vibes.
            </p>
          </div>

          {[
            {
              header: "Platform", links: [
                { label: "Earn & Invest", href: "/dashboard?tab=market" },
                { label: "Get a Loan", href: "/dashboard?tab=loans" },
                { label: "How it Works", href: "/how-it-works" }
              ]
            },
            {
              header: "Company", links: [
                { label: "Our Story", href: "/about" },
                { label: "Careers", href: "/careers" },
                { label: "Press", href: "/press" }
              ]
            },
            {
              header: "Support", links: [
                { label: "Help Center", href: "/support" },
                { label: "Safe & Secure", href: "/support" },
                { label: "Contact Us", href: "/contact" }
              ]
            },
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-black text-rose-900 mb-6 text-xs uppercase tracking-[0.2em]">{col.header}</h4>
              <ul className="space-y-4 text-sm text-rose-900/60 font-medium">
                {col.links.map((link, j) => (
                  <li key={j}><Link href={link.href} className="hover:text-rose-600 transition-colors">{link.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-rose-300 text-xs font-bold uppercase tracking-widest border-t border-rose-100 pt-10">
          <span className="text-rose-400/60">© 2026 PeerLend — Built for people.</span>
          <div className="flex gap-8 mt-6 md:mt-0">
            <Link href="/privacy-policy" className="hover:text-rose-600 transition-colors">Privacy</Link>
            <Link href="/terms-of-service" className="hover:text-rose-600 transition-colors">Terms</Link>
            <Link href="/cookies" className="hover:text-rose-600 transition-colors">Cookies</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
