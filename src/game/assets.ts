import playerUrl from "./assets/player.png";
import raiderUrl from "./assets/raider.png";
import scoutUrl from "./assets/scout.png";
import dreadUrl from "./assets/dread.png";
import bananaUrl from "./assets/banana.png";
import berryUrl from "./assets/berry.png";
import melonUrl from "./assets/melon.png";
import multiUrl from "./assets/multi.png";
import shieldUrl from "./assets/shield.png";
import speedUrl from "./assets/speed.png";
import bombUrl from "./assets/bomb.png";

export const spriteUrls = {
  player: playerUrl,
  raider: raiderUrl,
  scout: scoutUrl,
  dread: dreadUrl,
  banana: bananaUrl,
  berry: berryUrl,
  melon: melonUrl,
  multi: multiUrl,
  shield: shieldUrl,
  speed: speedUrl,
  bomb: bombUrl,
} as const;

export type SpriteKey = keyof typeof spriteUrls;

export type SpriteSet = Record<SpriteKey, HTMLImageElement>;

export function loadSprites(): Promise<SpriteSet> {
  const entries = Object.entries(spriteUrls) as [SpriteKey, string][];
  return Promise.all(
    entries.map(
      ([key, src]) =>
        new Promise<[SpriteKey, HTMLImageElement]>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve([key, img]);
          img.onerror = () => reject(new Error(`sprite ${key}`));
          img.src = src;
        }),
    ),
  ).then((list) => {
    const out = {} as SpriteSet;
    for (const [k, img] of list) out[k] = img;
    return out;
  });
}
