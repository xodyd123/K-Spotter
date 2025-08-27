import { useCallback } from "react";
import { CategoryCard } from "./categoryCard";
import type { ca } from "../../../type/type";

const categories = ["Drama", "Movie", "MusicVideo"] as const;

export default function CategoryRow({ userCategory, loading, onCategoryClick }:{
  userCategory: Record<ca, boolean>;
  loading: boolean;
  onCategoryClick: (c: ca) => void;
}) {
  const handleToggle = useCallback((c: ca) => onCategoryClick(c), [onCategoryClick]);

  return (
    <div className="flex gap-1.5">
      {categories.map((cat) => (
        <CategoryCard
          key={`categories-${cat}`}
          category={cat}
          selected={userCategory[cat]}
          loading={loading}
          onToggle={handleToggle}
        />
      ))}
    </div>
  );
}