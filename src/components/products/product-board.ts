export type PodiumTone = "gold" | "silver" | "bronze" | "rest";

export type PodiumStyle = {
  frame: string;
  bar: string;
  rail: string;
  wash: string;
  plaque: string;
  medal: string;
  rank: string;
  badge: string;
  ring: string;
  logoRing: string;
  stat: string;
  heat: string;
  heatLabel: string;
  rule: string;
};

export type ProductBoardPlaque = "rank" | "date" | "none";

export function podiumTone(index: number): PodiumTone {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  if (index === 2) return "bronze";
  return "rest";
}

export function launchPlaqueDate(value: string) {
  const date = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return { month: "TBD", day: "—" };
  return {
    month: date.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
    day: date.toLocaleDateString("en-US", { day: "2-digit", timeZone: "UTC" }),
  };
}

export function podiumStyle(tone: PodiumTone): PodiumStyle {
  switch (tone) {
    case "gold":
      return {
        frame: "border-[#e4c15a] bg-[#fffdf6] shadow-[0_14px_32px_rgba(201,148,32,.12)]",
        bar: "bg-gradient-to-r from-[#fff1b8] via-[#f0c54a] to-[#d9a21a]",
        rail: "bg-gradient-to-b from-[#fff1b8] via-[#f0c54a] to-[#d9a21a]",
        wash: "bg-[#fff0b5]/45",
        plaque: "border-[#c58a0a]/40 bg-[linear-gradient(180deg,#fff8df,#ffdc7c)] text-[#7f570b]",
        medal: "border-[#e4c15a] bg-[linear-gradient(180deg,#fffdf4,#ffe8a8,#f5d36a)] text-[#7f570b]",
        rank: "text-[#7f570b]",
        badge: "border-[#f4c788] bg-[#fff4d6] text-[#c24b2a]",
        ring: "border-[#e9c96b]",
        logoRing: "ring-[#f7d26e]/80",
        stat: "text-[#a26d08]",
        heat: "bg-gradient-to-r from-[#fff1b8] via-[#f0c54a] to-[#d9a21a]",
        heatLabel: "text-[#a26d08]",
        rule: "border-[#e4c15a]/35",
      };
    case "silver":
      return {
        frame: "border-[#b7cfe0] bg-[#f7fbfe] shadow-[0_14px_32px_rgba(80,130,170,.1)]",
        bar: "bg-gradient-to-r from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]",
        rail: "bg-gradient-to-b from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]",
        wash: "bg-[#d9ecfb]/45",
        plaque: "border-[#7aa0bc] bg-[linear-gradient(180deg,#eef6fc,#c5d8e8)] text-[#355875]",
        medal: "border-[#b7cfe0] bg-[linear-gradient(180deg,#fbfdff,#eef6fc,#c7dced)] text-[#355875]",
        rank: "text-[#355875]",
        badge: "border-[#c5d8e8] bg-[#eef6fc] text-[#355875]",
        ring: "border-[#b9d2e6]",
        logoRing: "ring-[#d5e3ef]",
        stat: "text-[#40698c]",
        heat: "bg-gradient-to-r from-[#e4f1fa] via-[#9bbdd4] to-[#6f97b4]",
        heatLabel: "text-[#40698c]",
        rule: "border-[#b7cfe0]/50",
      };
    case "bronze":
      return {
        frame: "border-[#e2b189] bg-[#fffaf5] shadow-[0_14px_32px_rgba(176,110,58,.1)]",
        bar: "bg-gradient-to-r from-[#f8e0c8] via-[#dca371] to-[#b56a38]",
        rail: "bg-gradient-to-b from-[#f8e0c8] via-[#dca371] to-[#b56a38]",
        wash: "bg-[#f6dfca]/45",
        plaque: "border-[#c4844a] bg-[linear-gradient(180deg,#fff4ea,#e2b189)] text-[#9b5d2d]",
        medal: "border-[#e2b189] bg-[linear-gradient(180deg,#fffaf6,#f8e0c8,#e2b189)] text-[#9b5d2d]",
        rank: "text-[#9b5d2d]",
        badge: "border-[#e2b189] bg-[#fff4ea] text-[#9b5d2d]",
        ring: "border-[#e2b189]",
        logoRing: "ring-[#e1ae7b]/80",
        stat: "text-[#a86636]",
        heat: "bg-gradient-to-r from-[#f8e0c8] via-[#dca371] to-[#b56a38]",
        heatLabel: "text-[#a86636]",
        rule: "border-[#e2b189]/45",
      };
    case "rest":
      return {
        frame: "border-[#d6e3ef] bg-white shadow-[0_10px_24px_rgba(20,33,43,.06)]",
        bar: "bg-gradient-to-r from-[#e8eef4] via-[#c9d7e4] to-[#9bbdd4]",
        rail: "bg-gradient-to-b from-[#e8eef4] via-[#c9d7e4] to-[#9bbdd4]",
        wash: "bg-[#eef4fa]/50",
        plaque: "border-line bg-paper text-ink",
        medal: "border-[#c9d7e4] bg-[linear-gradient(180deg,#ffffff,#eef4fa,#d6e3ef)] text-ink",
        rank: "text-ink",
        badge: "border-line bg-paper text-muted",
        ring: "border-[#c9d7e4]",
        logoRing: "ring-[#d5e3ef]",
        stat: "text-[#40698c]",
        heat: "bg-gradient-to-r from-[#e8eef4] via-[#c9d7e4] to-[#9bbdd4]",
        heatLabel: "text-[#40698c]",
        rule: "border-line",
      };
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}
