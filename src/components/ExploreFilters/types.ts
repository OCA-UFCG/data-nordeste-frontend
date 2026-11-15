import type { MacroTheme } from "@/utils/interfaces";

export interface ThemeFilterCardProps {
  iconId: string;
  color: string;
  name: string;
  href?: string;
  checked?: boolean;
  disabled?: boolean;
  className?: string;

  /** Why the theme cannot be chosen; shows as a "!" with this text on hover. */
  notice?: string;
  onCheckedChange?: (checked: boolean) => void;
}

export interface ExploreFiltersProps {
  className?: string;
  themes: Pick<MacroTheme, "id" | "name" | "color" | "sys">[];
  categoryValues?: Record<string, string>;
  clientSideNavigation?: boolean;
  mobileCatalogLayout?: boolean;
  sortingOptions?: { [label: string]: string };
}

export interface SeeThemesModalProps {
  themes: Pick<MacroTheme, "id" | "name" | "color" | "sys">[];
  selectedCategories: string[];
  onToggleCategory: (themeId: string) => void;
  onSelectAll: () => void;
  onClose: () => void;
  onApply: () => void;
}
