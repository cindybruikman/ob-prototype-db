// lib/preferences.ts

export type LocationLabel = "Woonplaats" | "Werk" | "Anders";

export interface SavedLocation {
  id: string; // "current" of bijv. "tilburg"
  name: string; // "Huidige locatie" / "Tilburg"
  radius: number;
  label: LocationLabel;
  source: "current" | "region";
}

export type ThemeKey =
  | "Nieuws & maatschappij"
  | "Sport"
  | "Brabantse cultuur"
  | "Natuur & milieu"
  | "Bedrijven & innovatie"
  | "Vrije tijd & entertainment"
  | "Verkeer"
  | "112";

export type LatLng = { lat: number; lng: number };

export interface UserPreferences {
  userid: string;
  savedLocations: SavedLocation[];
  useCurrentLocation: boolean;

  // ✅ nieuw: voor live GPS
  currentCoords?: LatLng;

  // flow flags
  hasSeenIntro: boolean;
  hasCompletedSetup: boolean;

  // optioneel
  useReadingBehavior: boolean;
  selectedThemes: ThemeKey[];
}

function mapUserPreferencesToApi(prefs: UserPreferences) {
  return {
    id: prefs.userid,
    useLiveLocation: prefs.useCurrentLocation,

    locations:
      prefs.savedLocations.length > 0
        ? prefs.savedLocations.map((loc) => ({
            locationName: loc.label,
            regionName: loc.name,
            // lat: loc.label.lat,
            // lng: loc.label.lng,
            radiusKm: loc.radius,
          }))
        : [],

    themes:
      prefs.selectedThemes.length > 0
        ? prefs.selectedThemes
        : [],
  };
}

const STORAGE_KEY = "news-app-preferences";

const defaultPreferences: UserPreferences = {
  userid: "", //TODO empty string
  savedLocations: [],
  useCurrentLocation: false,
  currentCoords: undefined,

  hasSeenIntro: false,
  hasCompletedSetup: false,

  useReadingBehavior: false,
  selectedThemes: [],
};

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getPreferences(): UserPreferences {
  if (!isBrowser()) return defaultPreferences;

  try {
    //TODO technically: api call to get preferences server-side
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<UserPreferences>;

      // ✅ sanitize savedLocations: label altijd aanwezig
      const sanitizedSavedLocations: SavedLocation[] = (
        parsed.savedLocations ?? []
      ).map((l: any) => ({
        id: String(l.id),
        name: String(l.name),
        radius: Number(l.radius ?? 15),
        source: l.source === "current" ? "current" : "region",
        lat: Number(l.lat ?? 0),
        lng: Number(l.lng ?? 0),
        label:
          l.label === "Woonplaats" || l.label === "Werk" || l.label === "Anders"
            ? l.label
            : "Anders",
      }));

      return {
        ...defaultPreferences,
        ...parsed,
        savedLocations: sanitizedSavedLocations,
      };
    }
  } catch (e) {
    console.error("Error reading preferences:", e);
  }

  return defaultPreferences;
}

export async function savePreferences(prefs: UserPreferences): Promise<UserPreferences | void> {
  if (!isBrowser()) return;

  try {
    let updatedPrefs = { ...prefs };

    if (prefs.userid === "" || prefs.userid === undefined) {
      const res = await fetch("http://localhost:8000/users/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("Kan geen nieuwe gebruiker aanmaken");
      }

      const data = await res.json();
      console.log(data);
      updatedPrefs = defaultPreferences;
      updatedPrefs.userid = data;
      updatedPrefs.hasSeenIntro = true;
    }
    else {
      console.log("Updating prefs: ", prefs);
      console.log("api call omdat locaties en themas zijn gekozen")
      //map user prefs to server User structuur
      const payload = mapUserPreferencesToApi(updatedPrefs);
      console.log(payload)

      const res = await fetch(`http://localhost:8000/users/${prefs.userid}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Kan voorkeuren niet opslaan");
      }
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPrefs));

    return updatedPrefs;
  } catch (e) {
    console.error("Error saving preferences:", e);
  }
}

export function resetPreferences() {
  if (!isBrowser()) return;

  //TODO: api call to delete preferences server-side
  window.localStorage.removeItem(STORAGE_KEY);
}

/**
 * Filter op basis van gekozen locaties (region).
 * - Als er geen savedLocations zijn: alles tonen.
 */
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

// export function filterArticlesByPreferences<T extends { location: string }>(
//   articles: T[],
//   prefs: UserPreferences
// ): T[] {
//   const saved = prefs.savedLocations ?? [];

//   // ✅ active = alle regio's + current (alleen als live aan staat)
//   const active = saved.filter(
//     (l) =>
//       l.source === "region" ||
//       (l.source === "current" && prefs.useCurrentLocation)
//   );

//   // niets gekozen => alles tonen (prototype)
//   if (active.length === 0) return articles;

//   const needles = active.map((l) => normalize(l.name));

//   return articles.filter((article) => {
//     const hay = normalize(article.location);
//     return needles.some((n) => hay.includes(n));
//   });
// }
