"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  image: string;
  tag: string;
  title: string;
  titleAccent: string;
  titleAfter?: string;
  subtitle: string;
  cta: { label: string; href: string };
  ctaSecondary?: { label: string; href: string };
}

interface HeroSliderProps {
  lang: string;
  slides: Slide[];
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((index: number) => {
    if (animating) return;
    setAnimating(true);
    setCurrent(index);
    setTimeout(() => setAnimating(false), 700);
  }, [animating]);

  const prev = useCallback(() => goTo((current - 1 + slides.length) % slides.length), [current, goTo, slides.length]);
  const next = useCallback(() => goTo((current + 1) % slides.length), [current, goTo, slides.length]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => goTo((current + 1) % slides.length), 6000);
    return () => clearTimeout(t);
  }, [current, paused, goTo, slides.length]);

  const slide = slides[current];

  return (
    <section
      className="relative overflow-hidden"
      style={{ height: "100vh", minHeight: "600px" }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides background */}
      {slides.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: i === current ? 1 : 0,
            backgroundImage: `url('${s.image}')`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: i === current ? 1 : 0,
          }}
        />
      ))}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background:
            "linear-gradient(to right, rgba(13,7,5,0.92) 0%, rgba(13,7,5,0.75) 50%, rgba(13,7,5,0.35) 100%)",
        }}
      />

      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 h-40"
        style={{ background: "linear-gradient(to top, #0d0705 0%, transparent 100%)" }}
      />

      {/* Content */}
      <div className="absolute inset-0 z-20 flex items-center">
        <div className="max-w-7xl mx-auto px-6 w-full">
          <div className="max-w-2xl">

            {/* Tag */}
            <div
              key={`tag-${current}`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm mb-6 animate-fade-in-up"
              style={{
                borderColor: "rgba(153,51,0,0.5)",
                background: "rgba(153,51,0,0.15)",
                color: "#df071b",
                animationDelay: "0ms",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "#df071b" }}
              />
              {slide.tag}
            </div>

            {/* Title */}
            <h1
              key={`title-${current}`}
              className="font-extrabold leading-tight mb-6 animate-fade-in-up text-white"
              style={{ fontSize: "clamp(2.2rem, 5vw, 4rem)", animationDelay: "100ms" }}
            >
              {slide.title}{" "}
              <span
                style={{
                  background: "var(--wine-gradient)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {slide.titleAccent}
              </span>
              {slide.titleAfter && ` ${slide.titleAfter}`}
            </h1>

            {/* Subtitle */}
            <p
              key={`sub-${current}`}
              className="text-lg mb-10 max-w-lg animate-fade-in-up"
              style={{ color: "rgba(255,255,255,0.75)", animationDelay: "200ms" }}
            >
              {slide.subtitle}
            </p>

            {/* CTAs */}
            <div
              key={`cta-${current}`}
              className="flex flex-wrap gap-4 animate-fade-in-up"
              style={{ animationDelay: "300ms" }}
            >
              <Link
                href={slide.cta.href}
                className="px-8 py-3.5 rounded-lg font-bold text-white transition-opacity hover:opacity-90 text-sm uppercase tracking-wider"
                style={{ background: "var(--wine-gradient)" }}
              >
                {slide.cta.label}
              </Link>
              {slide.ctaSecondary && (
                <Link
                  href={slide.ctaSecondary.href}
                  className="px-8 py-3.5 rounded-lg font-bold text-sm uppercase tracking-wider transition-colors"
                  style={{
                    border: "1px solid rgba(255,255,255,0.25)",
                    color: "white",
                  }}
                >
                  {slide.ctaSecondary.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5 text-white" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110"
        style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5 text-white" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? "32px" : "8px",
              height: "8px",
              background: i === current ? "var(--wine-red-2)" : "rgba(255,255,255,0.3)",
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div
        className="absolute bottom-10 right-6 z-30 text-sm font-bold tabular-nums"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        {String(current + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}
      </div>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 z-30 h-0.5"
        style={{ background: "var(--wine-gradient)", width: "100%" }}
      >
        <div
          key={`progress-${current}-${paused}`}
          className="h-full"
          style={{
            background: "rgba(255,255,255,0.3)",
            animation: paused ? "none" : "slideProgress 6s linear forwards",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes slideProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease forwards;
          opacity: 0;
        }
      `}</style>
    </section>
  );
}
