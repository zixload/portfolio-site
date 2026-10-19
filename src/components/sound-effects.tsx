"use client";

import { useEffect } from "react";
import { initSound } from "@/lib/ui-sound";

/** Branche le petit son de clic sur tout le site. N'affiche rien. */
export function SoundEffects() {
  useEffect(() => initSound(), []);
  return null;
}
