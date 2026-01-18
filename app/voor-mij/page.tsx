"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MapPin, Search } from "lucide-react";
import Image from "next/image";

import { PersonalisedNewsCard } from "@/components/news/PersonalisedNewsCard";
import { BottomNav } from "@/components/layout/BottomNav";

import { ApiLocationGroup } from "@/lib/mapBackendToUI";
import {
  getPreferences,
  type UserPreferences,
} from "@/lib/preferences";

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function VoorMijPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const containerClass = "mx-auto w-full max-w-[808px] px-4";

  const [articleGroups, setArticleGroups] = useState<ApiLocationGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1) localStorage => alleen client
  useEffect(() => {
    const prefs = getPreferences();
    setPreferences(prefs);

    if (!prefs.hasSeenIntro) {
      router.replace("/voor-mij/setup");
      return;
    }

    if (!prefs.hasCompletedSetup) {
      router.replace("/location");
      return;
    }

    // Alleen fetchen als user setup klaar is
    const fetchArticles = async () => {
      try {
        setLoading(true);

        const res = await fetch(`http://localhost:8000/personalisation/${prefs.userid}`, {
          method: "GET",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch articles");
        }

        const backendArticles = await res.json();
        console.log(backendArticles.articles);

        setArticleGroups(backendArticles.articles);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();



  }, [router]);

  // 4) header labels
  // ✅ actieve locaties = regions + current (alleen als live aan staat)
  const activeLocations = useMemo(() => {
    if (!preferences) return [];
    const saved = preferences.savedLocations ?? [];
    return saved.filter(
      (l) =>
        l.source === "region" ||
        (l.source === "current" && preferences.useCurrentLocation)
    );
  }, [preferences]);

  const locationLabel =
    activeLocations.length > 0
      ? activeLocations.map((l) => l.name).join(", ")
      : "Alle locaties";

  // radius: alleen tonen als er exact 1 actieve locatie is
  const radiusLabel =
    activeLocations.length === 1 ? `${activeLocations[0].radius} km` : "";

  if (!preferences) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b border-border">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-foreground">Voor jou</h1>
            <div className="text-sm text-muted-foreground mt-1">Laden…</div>
          </div>
        </header>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div
          className={containerClass + " flex items-center justify-between py-3"}
        >
          <div className="flex items-center gap-2">
            <Image
              src="/img/logo-ob.png"
              alt="Omroep Brabant"
              width={45}
              height={45}
              className="h-8 w-auto"
              priority
            />
          </div>

          <div className="relative flex items-center">
            {/* Search icon */}
            <button
              type="button"
              className="
                relative
                z-10
                w-10
                h-10
                flex
                items-center
                justify-center
                text-white
                hover:opacity-90
                transition
              "
              aria-label="Zoeken"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Weekly recap CTA */}
      <div className="mx-auto w-full max-w-[808px] px-4 pt-3">
        <Link
          href="/location"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mt-1 py-4 space-y-3"
        >
          <MapPin className="w-4 h-4" />
          {locationLabel}
          {radiusLabel ? ` • ${radiusLabel}` : ""}
        </Link>

        <Link
          href="/weekly"
          className="block rounded-xl border border-white/20 bg-card p-4 hover:bg-white/5 transition"
        >
          <h3 className="font-semibold text-white">Jouw weekly recap</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Het belangrijkste nieuws van jouw regio’s, in één overzicht.
          </p>
          <span className="inline-block mt-2 text-sm text-primary font-medium">
            Bekijk overzicht →
          </span>
        </Link>
      </div>

      {/* Artikelen */}
      {loading ? "Bezig met artikelen laden..." : null}
      {error ? error : null}
      
      <main className="py-4 space-y-6">
        {articleGroups.map((group) => (
          <section key={group.locationName} className="mx-auto w-full max-w-[808px] px-4">
            <h2 className="text-lg font-semibold">
              {group.locationName}
            </h2>

            {group.articles.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Geen artikelen beschikbaar
              </p>
            ) : (
              group.articles.map((article) => (
                <PersonalisedNewsCard
                  key={article.id}
                  article={article}
                  variant="compact"
                  showLocation={false}
                  showSummary={false}
                  showDate={false}
                />
              ))
            )}
          </section>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
