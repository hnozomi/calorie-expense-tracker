export const matchesSearch = (
  texts: (string | null | undefined)[],
  search: string,
): boolean => {
  const normalized = search.trim().toLowerCase();
  if (!normalized) return true;
  return texts.some((text) => text?.toLowerCase().includes(normalized));
};
