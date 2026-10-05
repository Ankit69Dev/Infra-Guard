"use client";

import { useState } from "react";
import { Bricolage_Grotesque } from "next/font/google";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import LoginModal from "@/components/auth/LoginModal";

// Bold display font for the logo text, tagline and footer brand
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const steps = [
  {
    number: "01",
    title: "Collect",
    description:
      "Bring together maintenance records, inspections, complaints and environmental data.",
  },
  {
    number: "02",
    title: "Predict",
    description:
      "Our prediction engine analyzes asset condition and estimates maintenance risk.",
  },
  {
    number: "03",
    title: "Prioritize",
    description:
      "Rank assets based on risk, urgency, impact and available maintenance resources.",
  },
];

// TODO: replace names, roles and photo paths (put images in /public/team/)
const team = [
  { name: "Ankit Pandey", role: "Full stack Developer", photo: "/team/member1.jpg" },
  { name: "Abhijeet Anand", role: "Backend Developer", photo: "/team/member2.jpg" },
  { name: "Sakshi Sharma", role: "UI/UX Designer", photo: "/sakshi.jpg" },
  { name: "Riya kumari", role: "UI/UX Designer", photo: "/riya.jpg" },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}

export default function Home() {
  const [current, setCurrent] = useState(0);
  const [photoFailed, setPhotoFailed] = useState<Record<number, boolean>>({});
  const [loginOpen, setLoginOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const n = team.length;
  const prev = () => setCurrent((c) => (c - 1 + n) % n);
  const next = () => setCurrent((c) => (c + 1) % n);

  // Position of card i relative to the active one: -1 left, 0 center, 1 right, others hidden
  const offsetOf = (i: number) => {
    let d = (i - current + n) % n; // 0..n-1
    if (d > n / 2) d -= n; // map to -n/2..n/2
    return d;
  };
  const openLogin = () => {
    setMobileMenuOpen(false);
    setLoginOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-slate-900">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f7f8f5]/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          {/* Logo image (public/logoo.png) + name */}
          <a href="/logo.jpeg" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.jpeg" alt="Infra Guard logo" className="h-12 w-auto object-contain" />
            <span className={`${display.className} text-2xl font-extrabold tracking-tight text-slate-950`}>
              Infra Guard
            </span>
          </a>

          <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <button onClick={() => scrollToId("home")} className="transition hover:text-slate-950">
              Home
            </button>
            <button onClick={() => scrollToId("how-it-works")} className="transition hover:text-slate-950">
              How it works
            </button>
            <button onClick={() => scrollToId("our-team")} className="transition hover:text-slate-950">
              Our team
            </button>
          </div>

          <a
            onClick={openLogin}
            className="rounded-full cursor-pointer bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Login
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section id="home" className="px-6 pb-24 pt-20 text-center lg:px-8 lg:pb-32 lg:pt-24">
        {/* "Infra" stacked directly above "Guard", both centered as one title */}
        <h1
          className={`${display.className} flex flex-col items-center text-center text-7xl font-extrabold leading-[0.9] tracking-[-0.03em] text-slate-950 sm:text-8xl lg:text-9xl`}
        >
          <span className="text-emerald-700">Infra</span>
          <span>Guard</span>
        </h1>

        <p
          className={`${display.className} mt-8 text-xl font-bold tracking-wide text-slate-600 sm:text-2xl`}
        >
          Predict, Prioritize, Prevent
        </p>
      </section>

      {/* CTA (moved above How it works) */}
      <section className="px-6 pb-24 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-3xl bg-slate-900 px-8 py-16 text-center text-white md:px-16">
          <ShieldCheck className="mx-auto h-10 w-10 text-emerald-400" />
          <h2 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            Don&apos;t wait for infrastructure to fail.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-slate-400">
            Use data and AI to decide what your city should fix first.
          </p>
          <a
            onClick={openLogin}
            className="mt-8 inline-flex items-center gap-2 cursor-pointer rounded-full bg-white px-6 py-3.5 font-semibold text-slate-900 transition hover:bg-slate-100"
          >
            Login to get started
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-16 px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xl font-bold uppercase tracking-[0.18em] text-emerald-700 sm:text-2xl lg:text-3xl">
              How it works
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className="rounded-3xl border border-slate-200 bg-white p-7">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-400">{step.number}</span>
                  <ChevronRight className="h-5 w-5 text-slate-300" />
                </div>
                <h3 className="mt-12 text-2xl font-bold">{step.title}</h3>
                <p className="mt-3 leading-7 text-slate-600">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our team: center-focus carousel */}
      <section id="our-team" className="scroll-mt-16 bg-white px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <p className="text-xl font-bold uppercase tracking-[0.18em] text-emerald-700 sm:text-2xl lg:text-3xl">
              OUR TEAM
            </p>

          <div className="relative mx-auto mt-14 h-[400px] overflow-hidden sm:h-[460px]">
            {team.map((m, i) => {
              const off = offsetOf(i);
              const isActive = off === 0;
              const isSide = Math.abs(off) === 1;
              return (
                <div
                  key={m.name}
                  onClick={() => isSide && setCurrent(i)}
                  aria-hidden={!isActive && !isSide}
                  className={`absolute left-1/2 top-0 w-56 transition-all duration-500 ease-in-out sm:w-72 ${
                    isSide ? "cursor-pointer" : ""
                  }`}
                  style={{
                    transform: `translateX(${-50 + off * 105}%) scale(${isActive ? 1 : 0.7})`,
                    opacity: isActive ? 1 : isSide ? 0.55 : 0,
                    zIndex: isActive ? 10 : isSide ? 5 : 0,
                    pointerEvents: isActive || isSide ? "auto" : "none",
                  }}
                >
                  <div
                    className={`aspect-square w-full overflow-hidden rounded-3xl bg-slate-100 transition-all duration-500 ${
                      isActive
                        ? "border-2 border-emerald-600 shadow-[0_25px_60px_-20px_rgba(15,23,42,0.35)]"
                        : "border border-slate-200"
                    }`}
                  >
                    {photoFailed[i] ? (
                      <div className="flex h-full w-full items-center justify-center text-6xl font-bold text-slate-300">
                        {m.name.charAt(0)}
                      </div>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.photo}
                        alt={m.name}
                        className="h-full w-full object-cover"
                        onError={() => setPhotoFailed((p) => ({ ...p, [i]: true }))}
                      />
                    )}
                  </div>
                  <h3
                    className={`mt-6 text-2xl font-bold transition-colors duration-500 ${
                      isActive ? "text-slate-950" : "text-slate-500"
                    }`}
                  >
                    {m.name}
                  </h3>
                  <p className="mt-1 text-slate-500">{m.role}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              onClick={prev}
              aria-label="Previous teammate"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>

            <div className="flex gap-2">
              {team.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => setCurrent(i)}
                  aria-label={`Show ${t.name}`}
                  className={`h-2.5 rounded-full transition-all ${
                    i === current ? "w-6 bg-slate-900" : "w-2.5 bg-slate-300"
                  }`}
                />
              ))}
            </div>

            <button
              onClick={next}
              aria-label="Next teammate"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-300 bg-white transition hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-600"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 px-6 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 text-sm text-slate-500 sm:flex-row">
          <div className={`${display.className} text-xl font-extrabold text-slate-700`}>
            Infra Guard
          </div>
          <p className={`${display.className} text-base font-bold`}>
            Predict. Prioritize. Prevent.
          </p>
        </div>
      </footer>
       <LoginModal
              open={loginOpen}
              onClose={() => setLoginOpen(false)}
            />

    </main>
  );
}