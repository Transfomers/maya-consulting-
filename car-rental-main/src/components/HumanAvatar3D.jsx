import { useId } from "react";

/**
 * Avatar illustré style « 3D » (dégradés, reflets, ombres douces), 100 % SVG, sans service externe.
 * Props :
 *  skin     : couleur de peau (ex. "#8d5524")
 *  hair     : "short" | "fade" | "curly" | "bun" | "long" | "bald"
 *  hairColor: couleur des cheveux
 *  outfit   : couleur de la veste
 *  shirt    : couleur de la chemise / du haut
 *  tie      : couleur de la cravate (optionnel)
 *  glasses  : true pour des lunettes
 *  beard    : true pour une barbe courte
 */
export default function HumanAvatar3D({
  skin = "#8d5524",
  hair = "short",
  hairColor = "#1b1210",
  outfit = "#1f2937",
  shirt = "#ffffff",
  tie,
  glasses = false,
  beard = false,
  title,
}) {
  const uid = useId().replace(/:/g, "");
  const id = (n) => `${n}-${uid}`;
  const shade = (hex, amt) => {
    const n = parseInt(hex.slice(1), 16);
    const c = (v) => Math.max(0, Math.min(255, Math.round(v + amt * 255)));
    return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
  };

  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id={id("skin")} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor={shade(skin, 0.16)} />
          <stop offset="55%" stopColor={skin} />
          <stop offset="100%" stopColor={shade(skin, -0.16)} />
        </radialGradient>
        <linearGradient id={id("neck")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shade(skin, -0.14)} />
          <stop offset="100%" stopColor={shade(skin, -0.04)} />
        </linearGradient>
        <radialGradient id={id("hair")} cx="35%" cy="25%" r="80%">
          <stop offset="0%" stopColor={shade(hairColor, 0.18)} />
          <stop offset="100%" stopColor={hairColor} />
        </radialGradient>
        <radialGradient id={id("outfit")} cx="35%" cy="15%" r="95%">
          <stop offset="0%" stopColor={shade(outfit, 0.18)} />
          <stop offset="70%" stopColor={outfit} />
          <stop offset="100%" stopColor={shade(outfit, -0.12)} />
        </radialGradient>
        <linearGradient id={id("shirt")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={shirt} />
          <stop offset="100%" stopColor={shade(shirt, -0.12)} />
        </linearGradient>
        <radialGradient id={id("eye")} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#5b3a29" />
          <stop offset="100%" stopColor="#1a0f0a" />
        </radialGradient>
        <filter id={id("soft")} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Ombre portée */}
      <ellipse cx="100" cy="196" rx="70" ry="8" fill="rgba(0,0,0,0.25)" filter={`url(#${id("soft")})`} />

      {/* Cheveux longs (derrière la tête) */}
      {hair === "long" && (
        <path d="M52 92 C48 140 58 170 70 178 L130 178 C142 170 152 140 148 92 Z" fill={`url(#${id("hair")})`} />
      )}

      {/* Buste / veste */}
      <path d="M28 200 C30 166 52 148 100 146 C148 148 170 166 172 200 Z" fill={`url(#${id("outfit")})`} />
      {/* Chemise en V */}
      <path d="M82 148 L100 182 L118 148 C112 146 106 145 100 145 C94 145 88 146 82 148 Z" fill={`url(#${id("shirt")})`} />
      {/* Revers de veste */}
      <path d="M80 149 L96 184 L86 200 L70 162 Z" fill={shade(outfit, -0.08)} opacity="0.9" />
      <path d="M120 149 L104 184 L114 200 L130 162 Z" fill={shade(outfit, -0.08)} opacity="0.9" />
      {tie && (
        <path d="M96 156 L104 156 L106 162 L102 192 L98 192 L94 162 Z" fill={tie} />
      )}

      {/* Cou */}
      <path d="M86 122 L86 148 C92 156 108 156 114 148 L114 122 Z" fill={`url(#${id("neck")})`} />

      {/* Oreilles */}
      <ellipse cx="57" cy="98" rx="8" ry="12" fill={shade(skin, -0.06)} />
      <ellipse cx="143" cy="98" rx="8" ry="12" fill={shade(skin, -0.06)} />

      {/* Tête */}
      <ellipse cx="100" cy="92" rx="43" ry="50" fill={`url(#${id("skin")})`} />

      {/* Cheveux (dessus) */}
      {hair === "short" && (
        <path d="M57 88 C54 52 76 36 100 36 C126 36 148 52 143 88 C138 70 124 60 100 60 C78 60 62 70 57 88 Z" fill={`url(#${id("hair")})`} />
      )}
      {hair === "fade" && (
        <path d="M60 80 C60 52 78 40 100 40 C122 40 140 52 140 80 C132 66 118 58 100 58 C82 58 68 66 60 80 Z" fill={`url(#${id("hair")})`} opacity="0.92" />
      )}
      {hair === "curly" && (
        <g fill={`url(#${id("hair")})`}>
          {[[64, 66], [76, 50], [92, 42], [108, 42], [124, 50], [136, 66], [70, 58], [130, 58], [100, 48], [84, 46], [116, 46]].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="14" />
          ))}
        </g>
      )}
      {hair === "bun" && (
        <g fill={`url(#${id("hair")})`}>
          <circle cx="100" cy="34" r="18" />
          <path d="M57 90 C52 54 76 40 100 40 C124 40 148 54 143 90 C136 70 122 62 100 62 C78 62 64 70 57 90 Z" />
        </g>
      )}
      {hair === "long" && (
        <path d="M55 96 C50 54 74 36 100 36 C126 36 150 54 145 96 C140 72 128 58 106 56 C96 66 76 72 62 74 C58 80 56 88 55 96 Z" fill={`url(#${id("hair")})`} />
      )}

      {/* Sourcils */}
      <path d="M74 80 Q83 74 92 79" stroke={shade(hairColor, 0.05)} strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M108 79 Q117 74 126 80" stroke={shade(hairColor, 0.05)} strokeWidth="4" fill="none" strokeLinecap="round" />

      {/* Yeux */}
      {[83, 117].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="94" rx="8" ry="7" fill="#fff" />
          <circle cx={cx + 0.5} cy="95" r="5" fill={`url(#${id("eye")})`} />
          <circle cx={cx + 2} cy="93" r="1.8" fill="#fff" />
        </g>
      ))}

      {/* Lunettes */}
      {glasses && (
        <g fill="none" stroke="#111827" strokeWidth="2.6">
          <rect x="70" y="84" width="27" height="20" rx="7" />
          <rect x="103" y="84" width="27" height="20" rx="7" />
          <path d="M97 92 L103 92" />
        </g>
      )}

      {/* Nez */}
      <ellipse cx="103" cy="106" rx="4" ry="9" fill={shade(skin, -0.12)} opacity="0.5" />
      <ellipse cx="99" cy="104" rx="2.4" ry="7" fill="#fff" opacity="0.14" />
      <path d="M92 112 Q100 117 108 112" stroke={shade(skin, -0.22)} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="95" cy="112" r="1.6" fill={shade(skin, -0.3)} />
      <circle cx="105" cy="112" r="1.6" fill={shade(skin, -0.3)} />

      {/* Joues */}
      <ellipse cx="74" cy="112" rx="8" ry="5" fill="#ff7a7a" opacity="0.18" />
      <ellipse cx="126" cy="112" rx="8" ry="5" fill="#ff7a7a" opacity="0.18" />

      {/* Barbe courte */}
      {beard && (
        <path d="M66 108 C68 132 84 142 100 142 C116 142 132 132 134 108 C128 124 116 130 100 130 C84 130 72 124 66 108 Z" fill={hairColor} opacity="0.85" />
      )}

      {/* Sourire */}
      <path d="M86 122 Q100 133 114 122" stroke={shade(skin, -0.32)} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M90 124 Q100 130 110 124" fill="#fff" opacity="0.85" />

      {/* Reflet (volume 3D) */}
      <ellipse cx="82" cy="66" rx="16" ry="9" fill="#fff" opacity="0.12" transform="rotate(-20 82 66)" />
    </svg>
  );
}
