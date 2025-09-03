import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Trunca um texto para um comprimento máximo especificado
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo do texto (padrão: 60)
 * @returns Texto truncado com "..." se necessário
 */
export function truncateText(text: string, maxLength: number = 60): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}
