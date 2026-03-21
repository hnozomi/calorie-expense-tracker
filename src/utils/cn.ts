import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind CSS classes with conditional support */
export const cn = (...inputs: ClassValue[]) => {
  return twMerge(clsx(inputs));
};
