"use client";

// Phones show the busiest categories first; this reveals the rest by flagging the surrounding section.
export function ShowAllCategories({ total }: { total: number }) {
  return (
    <button
      type="button"
      className="btn-outline mt-3 w-full sm:hidden group-data-[all=true]:hidden"
      onClick={(e) => {
        const section = e.currentTarget.closest("section");
        if (section) section.dataset.all = "true";
      }}
    >
      See all {total} categories
    </button>
  );
}
