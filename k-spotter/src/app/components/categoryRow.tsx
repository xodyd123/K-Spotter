import { useCallback } from "react";
import { CategoryCard } from "./categoryCard";
import type { ca } from "../../../type/type";

const categories = ["아이유", "방탄소년단", "오징어게임"] as const;

export default function CategoryRow({ userCategory, loading, onCategoryClick }:{
  userCategory: Record<ca, boolean>;
  loading: boolean;
  onCategoryClick: (c: ca) => void;
}) {
  const handleToggle = useCallback((c: ca) => onCategoryClick(c), [onCategoryClick]);

  return (
    <div className="flex gap-8">
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