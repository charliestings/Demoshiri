"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, ShieldCheck, Zap, PieChart, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen relative overflow-hidden bg-white selection:bg-rose-100 selection:text-rose-900">
      <Navbar />

      {/* Floating Sunset Blobs - Modified for uniqueness */}
      <div className="absolute top-[-10%] right-[-5%] w-[700px] h-[700px] bg-orange-200/40 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-rose-200/30 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] bg-pink-100/50 rounded-full blur-[80px] -z-10" />

      {/* Hero Section */}
      <section className="pt-36 pb-20 px-6 relative">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-rose-100 shadow-sm mb-8">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
              </span>
              <span className="text-xs font-semibold text-rose-900/70 tracking-wide uppercase">Trusted by 10,000+ Users</span>
            </div>

            <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              Lending, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-rose-600 to-pink-500">
                Reimagined.
              </span>
            </h1>

            <p className="text-xl text-slate-600 mb-10 max-w-lg leading-relaxed">
              Cut out the middleman. Connect directly with people and get better rates for both borrowing and investing in a transparent ecosystem.
            </p>

            <div className="flex flex-col sm:flex-row gap-5">
              <Link href="/dashboard">
                <Button size="lg" className="bg-gradient-to-r from-orange-600 to-rose-600 text-white hover:opacity-90 h-14 px-8 rounded-full text-lg shadow-xl shadow-rose-500/20 transition-all hover:scale-105">
                  Start Investing <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/dashboard">
                <Button size="lg" variant="outline" className="h-14 px-8 rounded-full text-lg border-2 border-rose-100 hover:bg-rose-50 text-rose-900/80 bg-white/50 backdrop-blur-sm">
                  Borrow Funds
                </Button>
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-slate-500 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> No hidden fees
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> Bank-grade security
              </div>
            </div>
          </motion.div>

          {/* Hero Visual - Abstract Composition */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative z-10 w-full max-w-[500px] mx-auto">
              {/* Floating Card 1: Returns */}
              <Card className="absolute top-0 right-0 glass-card w-64 z-20 animate-[bounce_4s_infinite]">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Avg. Return</div>
                    <div className="text-2xl font-bold text-slate-900">12.8%</div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Card: Portfolio */}
              <Card className="glass-card w-full shadow-[0_40px_80px_rgba(244,63,94,0.15)] border-0 overflow-hidden bg-white">
                <div className="h-64 bg-gradient-to-br from-orange-500 via-rose-500 to-pink-600 p-8 flex flex-col justify-end text-white relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                  <div className="w-16 h-16 bg-white/20 rounded-2xl backdrop-blur-md mb-4 flex items-center justify-center border border-white/20">
                    <PieChart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">Your Portfolio</h3>
                  <p className="opacity-90 font-medium">Diversified & Growing</p>
                </div>
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-orange-50 border border-orange-100" />
                      <div>
                        <div className="font-semibold text-slate-900">Education Loan</div>
                        <div className="text-xs text-slate-500">Via John D.</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">+$124.50</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-100" />
                      <div>
                        <div className="font-semibold text-slate-900">Home Reno</div>
                        <div className="text-xs text-slate-500">Via Sarah M.</div>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-600">+$342.00</span>
                  </div>
                </CardContent>
              </Card>

              {/* Floating Card 2: Funded */}
              <Card className="absolute -bottom-8 -left-8 glass-card w-72 z-20">
                <CardContent className="p-5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-500">Total Funded</span>
                    <Zap className="h-4 w-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-slate-900">$2,450,000</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-400 to-rose-500 h-full w-[85%]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 px-6 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-rose-600 font-bold tracking-wide uppercase text-sm bg-rose-50 px-3 py-1 rounded-full">Why Choose PeerLend</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mt-6 mb-4">A Better Way to Money</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">Traditional banking is outdated. We use technology to lower costs and pass the savings on to you.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {[
              { icon: ShieldCheck, color: "text-rose-600", bg: "bg-rose-50", title: "Secure & Verified", desc: "We rigorously vet every borrower. Your money is protected by bank-level encryption." },
              { icon: Zap, color: "text-orange-500", bg: "bg-orange-50", title: "Fast Funding", desc: "Get approved in minutes. Investors get their money to work immediately." },
              { icon: TrendingUp, color: "text-pink-500", bg: "bg-pink-50", title: "Unbeatable Returns", desc: "Historic returns of 8-12% APY. Much higher than your average savings account." }
            ].map((item, i) => (
              <div key={i} className="group p-8 rounded-[2rem] border border-slate-100 bg-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)] hover:-translate-y-2 transition-all duration-300">
                <div className={`h-16 w-16 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-6 text-3xl`}>
                  <item.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-orange-50/50" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">How Simplicity Works</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              {[
                { step: "01", title: "Create your account", desc: "Sign up in seconds. Verify your identity securely." },
                { step: "02", title: "Browse or Request", desc: "Investors browse loans. Borrowers post requests." },
                { step: "03", title: "Get Funded / Earn", desc: "Watch your portfolio grow or receive funds instantly." }
              ].map((step, i) => (
                <div key={i} className="flex gap-6 group">
                  <div className="text-5xl font-black text-rose-100 group-hover:text-rose-200 transition-colors">{step.step}</div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-rose-600 transition-colors">{step.title}</h3>
                    <p className="text-slate-500 font-medium">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative h-[450px] w-full rounded-[2.5rem] overflow-hidden shadow-2xl bg-white border-4 border-white">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-rose-600 opacity-90" />
              <img src="/placeholder-app-ui.png" alt="App UI" className="absolute inset-0 object-cover opacity-20 mix-blend-overlay" /> {/* Placeholder texture */}

              <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center">
                <h3 className="text-3xl font-bold mb-4">Start your journey</h3>
                <p className="mb-8 opacity-90 max-w-sm">Join the fastest growing P2P community today.</p>
                <Button className="rounded-full h-14 px-8 bg-white text-rose-600 hover:bg-rose-50 shadow-xl font-bold text-lg hover:scale-105 transition-all">
                  Join Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto bg-slate-900 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl">
          {/* Dark Sunset Glows */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] translate-y-1/2 -translate-x-1/2" />

          <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-8 relative z-10 tracking-tight">
            Ready to take control?
          </h2>
          <p className="text-xl text-slate-300 mb-12 max-w-2xl mx-auto relative z-10">
            Join thousands of others who are already earning better returns and borrowing smarter.
          </p>

          <Link href="/dashboard" className="relative z-10">
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-rose-600 text-white hover:opacity-90 h-16 px-12 rounded-full text-xl font-bold shadow-[0_20px_50px_rgba(225,29,72,0.3)] hover:scale-105 transition-all">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <div className="font-bold text-2xl tracking-tighter text-slate-900 mb-6">PeerLend</div>
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">The modern way to borrow and invest. Secure, transparent, and fair financial ecosystem for everyone.</p>
          </div>

          {[
            { header: "Platform", links: ["Invest", "Borrow", "How it Works"] },
            { header: "Company", links: ["About Us", "Careers", "Press"] },
            { header: "Support", links: ["Help Center", "Safety", "Contact"] }
          ].map((col, i) => (
            <div key={i}>
              <h4 className="font-bold text-slate-900 mb-6 text-lg">{col.header}</h4>
              <ul className="space-y-4 text-sm text-slate-500 font-medium">
                {col.links.map((link, j) => (
                  <li key={j}><a href="#" className="hover:text-rose-600 transition-colors">{link}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="max-w-7xl mx-auto text-center text-slate-400 text-sm border-t border-slate-100 pt-8">
          © 2024 PeerLend Inc. All rights reserved.
        </div>
      </footer>
    </main>
  );
}
