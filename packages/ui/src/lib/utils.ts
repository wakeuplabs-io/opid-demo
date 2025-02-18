import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortenString(str: string) {
  if (str.length < 10) return str;
  return str.slice(0, 10) + "..." + str.slice(-10);
}
