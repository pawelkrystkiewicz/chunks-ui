// Isometric illustrations. Decorative only: callers wrap them in aria-hidden.
// Hover lifts are CSS-only, driven by the nearest `group/iso` (hero) or `group/pr` (principle cell).
// Server components: classes are joined as plain strings, so no two pieces set the same property.

const ISO = "transform-3d [transform:rotateX(58deg)_rotateZ(-45deg)]";
const LIFT = "transition-transform ease-fluid motion-reduce:transition-none";

const LAYER = `absolute inset-0 border duration-600 ${LIFT}`;
const GLASS = "border-white/55 bg-[rgb(120_160_255/.12)]";
const LABEL =
  "absolute left-3 whitespace-nowrap border bg-black/25 px-2 py-[3px] font-mono text-[11px] tracking-[.12em]";
const LAYER_LABEL = `${LABEL} -bottom-[26px] border-white/40 text-white`;

export function HeroStack({ total }: { total: number }) {
  return (
    <div className="group/iso relative flex h-[360px] items-center justify-center lg:h-[460px]">
      <div className="relative mt-10 size-[340px] flex-none transform-3d [transform:rotateX(58deg)_rotateZ(-45deg)_scale(.75)] lg:[transform:rotateX(58deg)_rotateZ(-45deg)]">
        <div className="absolute -inset-[70px] border border-white/18 border-dashed">
          <span className={`${LABEL} -bottom-7 border-white/20 text-white/60`}>YOUR APP</span>
        </div>
        <div className={`${LAYER} ${GLASS}`}>
          <span className={LAYER_LABEL}>BASE UI · HEADLESS</span>
        </div>
        <div className={`${LAYER} ${GLASS} translate-z-[46px] group-hover/iso:translate-z-[64px]`}>
          <span className={LAYER_LABEL}>TAILWIND V4 · STYLE</span>
        </div>
        <div className={`${LAYER} ${GLASS} translate-z-[92px] group-hover/iso:translate-z-[128px]`}>
          <span className={LAYER_LABEL}>MOTION · SPRINGS</span>
        </div>
        <div
          className={`${LAYER} translate-z-[138px] border-[oklch(80%_.1_257)] bg-(--l-brand)/85 shadow-[0_0_80px_oklch(60%_.22_257)] group-hover/iso:translate-z-[192px]`}
        >
          <span className={LAYER_LABEL}>CHUNKS-UI · {total} COMPONENTS</span>
        </div>
      </div>
    </div>
  );
}

const PLATE = `absolute border-[1.5px] duration-500 ${LIFT}`;
const MUTED = "border-(--l-ill) bg-(--l-card)";
const ACCENT = "border-primary bg-primary/18";

const SCOPE_TILES = [
  { pos: "top-[calc(50%-76px)] left-[calc(50%-126px)]", lift: "", accent: true },
  { pos: "top-[calc(50%-30px)] left-[calc(50%-30px)]", lift: "delay-60" },
  { pos: "top-[calc(50%+16px)] left-[calc(50%+66px)]", lift: "delay-120" },
  { pos: "top-[calc(50%+16px)] left-[calc(50%-126px)]", lift: "delay-180" },
];

/** Separate tiles, one lifted per job. */
export function ScopeArt() {
  return (
    <div className="relative h-[200px]">
      {SCOPE_TILES.map(({ pos, lift, accent }) => (
        <div key={pos} className={`absolute size-[60px] ${ISO} ${pos}`}>
          <span className="absolute inset-0 border border-(--l-ill) border-dashed opacity-60" />
          <span
            className={`${PLATE} inset-0 ${accent ? ACCENT : MUTED} ${lift} group-hover/pr:translate-z-[22px]`}
          />
        </div>
      ))}
    </div>
  );
}

/** A thin stack of plates. */
export function SizeArt() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <div className={`relative size-[110px] ${ISO}`}>
        <span className={`${PLATE} inset-0 ${MUTED}`} />
        <span
          className={`${PLATE} inset-0 ${MUTED} translate-z-[18px] group-hover/pr:translate-z-[26px]`}
        />
        <span
          className={`${PLATE} inset-0 ${MUTED} translate-z-[36px] group-hover/pr:translate-z-[52px]`}
        />
        <span
          className={`${PLATE} inset-0 ${ACCENT} translate-z-[54px] group-hover/pr:translate-z-[80px]`}
        />
      </div>
    </div>
  );
}

/** A predictable grid with one chunk lifting out of it. */
export function ApiArt() {
  return (
    <div className="flex h-[200px] items-center justify-center">
      <div className={`relative size-[126px] ${ISO}`}>
        <span className={`${PLATE} inset-0 ${MUTED}`} />
        <span
          className={`${PLATE} inset-0 ${MUTED} translate-z-px bg-(image:--l-grid) group-hover/pr:translate-z-[22px]`}
        />
        <span
          className={`${PLATE} ${ACCENT} top-[42px] left-[63px] size-[21px] translate-z-[2px] group-hover/pr:translate-z-[46px]`}
        />
      </div>
    </div>
  );
}
