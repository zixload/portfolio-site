/** Pastille discrète sur les entrées encore en cours d'écriture. */
export function WipBadge() {
  return (
    <span className="shrink-0 rounded-full border border-zinc-200 px-1.5 py-px text-[0.65rem] leading-normal text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
      writing…
    </span>
  );
}
