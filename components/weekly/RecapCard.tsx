import Link from "next/link";
import { Newspaper, Trophy, Lightbulb, LucideIcon, Leaf, Drama } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RecapArticle = {
  articleId: string;
  regionName: string;
  title: string;
  teaser: string;
  isNew?: boolean;
  isTrending?: boolean;
};

type RecapCardProps = {
  category: string;
  icon: "news" | "sport" | "business" | "nature" | "entertainment";
  articles: RecapArticle[];
};

const iconMap: Record<RecapCardProps["icon"], LucideIcon> = {
  news: Newspaper,
  sport: Trophy,
  business: Lightbulb,
  nature: Leaf,
  entertainment: Drama,
};

export function RecapCard({ category, icon, articles }: RecapCardProps) {
  const Icon = iconMap[icon] ?? Newspaper;

  return (
    <section className="bg-card rounded-xl p-4 space-y-4 border border-border">
      <div className="flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h3 className="font-bold text-foreground">{category}</h3>
      </div>

      {articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Geen artikelen in dit thema.
        </p>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => (
            <div key={article.articleId} className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground">
                  {article.regionName}
                </span>
                <span className="text-muted-foreground">–</span>
                <span className="text-foreground">{article.title}</span>

                {article.isNew && (
                  <span className="border border-border text-foreground text-xs px-2 py-0.5 rounded-full">
                    Nieuw
                  </span>
                )}

                {article.isTrending && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    Trending
                  </span>
                )}
              </div>

              <p className="text-sm text-muted-foreground italic line-clamp-2">
                {article.teaser}
              </p>

              <Link href={`/article/${article.articleId}`}>
                <Button variant="outline" size="sm" className="mt-2">
                  Lees verder
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
