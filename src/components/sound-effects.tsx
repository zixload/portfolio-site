"use client";

import { useEffect } from "react";
import { initSound } from "@/lib/ui-sound";

/** Branche les petits sons de survol sur tout le site. N'affiche rien. */
export function SoundEffects() {
  useEffect(() => initSound(), []);
  return null;
}
