"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { RecapArticle, RecapCard } from "@/components/weekly/RecapCard";
import { BottomNav } from "@/components/layout/BottomNav";

import { backendMockArticles } from "@/lib/mockDataBackend";
import { mapBackendToUI } from "@/lib/mapBackendToUI";
import {
  getPreferences,
  filterArticlesByPreferences,
  type UserPreferences,
} from "@/lib/preferences";

export default function WeeklyPage() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);

  const [recapSections, setRecapSections] = useState<RecapSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const containerClass = "mx-auto w-full max-w-[808px] px-4";

  type RecapSection = {
    category: string;
    icon: "news" | "sport" | "business" | "nature" | "entertainment";
    articles: {
      articleId: string;
      regionName: string;
      title: string;
      teaser: string;
    }[];
  };

  const mapThemeToIcon = (theme: string): RecapSection["icon"] => {
    const t = theme.toLowerCase();

    if (t.includes("sport")) return "sport";
    if (t.includes("innovatie") || t.includes("bedrijven")) return "business";
    if (t.includes("natuur")) return "nature";
    if (t.includes("entertainment") || t.includes("cultuur")) return "entertainment";
    return "news";
  };

  // localStorage -> alleen client
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

    const fetchRecap = async () => {
      try {
        setLoading(true);

        const res = await fetch(`http://localhost:8000/personalisation/weekly/${prefs.userid}`);
        if (!res.ok) {
          throw new Error("Recap ophalen mislukt");
        }

        const data = await res.json();

        const sections: RecapSection[] = data.themes.map(
          (theme: any) => ({
            category: theme.theme,
            icon: mapThemeToIcon(theme.theme),
            articles: theme.articles,
          })
        );

        setRecapSections(sections);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchRecap();

  }, [router]);

  // labels: current + regions
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
      <div className="min-h-screen pb-20 bg-background">
        <header className="sticky top-0 z-40 border-b border-border bg-card">
          <div className={containerClass + " flex items-center py-3"}>
            <button onClick={() => router.back()} className="p-2 -ml-2">
              <ArrowLeft className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </header>

        <div className={containerClass + " py-4 text-sm text-muted-foreground"}>
          Laden…
        </div>

        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border bg-card">
        <div className={containerClass + " flex items-center py-3"}>
          <button onClick={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft className="h-5 w-5 text-foreground" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className={containerClass + " space-y-4 py-4"}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Jouw weekly recap
          </h1>
          <p className="text-muted-foreground mt-1">
            Het belangrijkste nieuws van jouw locaties en thema&apos;s.
          </p>

          <p className="text-sm text-muted-foreground mt-2">
            Gebaseerd op {locationLabel}
            {radiusLabel ? ` (${radiusLabel})` : ""}
          </p>
        </div>

        {loading ? "Bezig met artikelen laden..." : null}
        {error ? error : null}

        <div className="space-y-4">
          {recapSections.length > 0 ? (
            recapSections.map((section, idx) => (
              <RecapCard
                key={idx}
                category={section.category}
                icon={section.icon}
                articles={section.articles}
              />
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Geen artikelen gevonden voor deze week in je geselecteerde
              locaties.
              <div className="mt-3">
                <Link href="/location" className="text-primary hover:underline">
                  Pas je locatie-instellingen aan
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
