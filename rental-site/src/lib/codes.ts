import { randomInt } from "node:crypto";

const REFERENCE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sans I/O/0/1 pour éviter les confusions

function randomString(length: number, alphabet: string): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += alphabet[randomInt(alphabet.length)];
  }
  return result;
}

/** Référence de réservation courte et lisible, ex: "RES-7K9QF2" */
export function generateBookingReference(): string {
  return `RES-${randomString(6, REFERENCE_ALPHABET)}`;
}

/** Code d'accès numérique à 6 chiffres transmis après validation du check-in */
export function generateAccessCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
