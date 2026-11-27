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
  female = false,
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
        female ? (
          <path
            d="M44 90 C36 138 42 178 62 192 L138 192 C158 178 164 138 156 90 C154 48 130 28 100 28 C70 28 46 48 44 90 Z"
            fill={`url(#${id("hair")})`}
          />
        ) : (
          <path d="M52 92 C48 140 58 170 70 178 L130 178 C142 170 152 140 148 92 Z" fill={`url(#${id("hair")})`} />
        )
      )}

      {/* Buste / veste */}
      {female ? (
        <>
          <path d="M36 200 C38 168 58 150 100 148 C142 150 162 168 164 200 Z" fill={`url(#${id("outfit")})`} />
          <path d="M78 150 Q100 176 122 150 C115 147 108 146 100 146 C92 146 85 147 78 150 Z" fill={`url(#${id("shirt")})`} />
          {/* Collier doré */}
          <path d="M84 152 Q100 166 116 152" stroke="#f5c542" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="100" cy="161" r="3" fill="#fde68a" stroke="#d97706" strokeWidth="0.8" />
        </>
      ) : (
        <>
          <path d="M28 200 C30 166 52 148 100 146 C148 148 170 166 172 200 Z" fill={`url(#${id("outfit")})`} />
          {/* Chemise en V */}
          <path d="M82 148 L100 182 L118 148 C112 146 106 145 100 145 C94 145 88 146 82 148 Z" fill={`url(#${id("shirt")})`} />
          {/* Revers de veste */}
          <path d="M80 149 L96 184 L86 200 L70 162 Z" fill={shade(outfit, -0.08)} opacity="0.9" />
          <path d="M120 149 L104 184 L114 200 L130 162 Z" fill={shade(outfit, -0.08)} opacity="0.9" />
          {tie && (
            <path d="M96 156 L104 156 L106 162 L102 192 L98 192 L94 162 Z" fill={tie} />
          )}
        </>
      )}

      {/* Cou */}
      <path d={female ? "M89 124 L89 150 C94 156 106 156 111 150 L111 124 Z" : "M86 122 L86 148 C92 156 108 156 114 148 L114 122 Z"} fill={`url(#${id("neck")})`} />

      {/* Oreilles + boucles d'oreilles */}
      <ellipse cx="57" cy="98" rx="7.5" ry="11" fill={shade(skin, -0.06)} />
      <ellipse cx="143" cy="98" rx="7.5" ry="11" fill={shade(skin, -0.06)} />
      {female && (
        <g>
          <circle cx="56" cy="110" r="3.6" fill="#f5c542" stroke="#b45309" strokeWidth="0.9" />
          <circle cx="144" cy="110" r="3.6" fill="#f5c542" stroke="#b45309" strokeWidth="0.9" />
        </g>
      )}

      {/* Tête */}
      <ellipse cx="100" cy="92" rx={female ? "41" : "43"} ry="49" fill={`url(#${id("skin")})`} />

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
        female ? (
          <g fill={`url(#${id("hair")})`}>
            <path d="M54 102 C48 56 72 34 100 34 C128 34 152 56 146 102 C142 74 128 56 108 54 C96 66 76 70 62 76 C56 84 55 92 54 102 Z" />
            <path d="M52 94 C44 126 48 158 60 176 C56 152 56 124 62 102 Z" />
            <path d="M148 94 C156 126 152 158 140 176 C144 152 144 124 138 102 Z" />
          </g>
        ) : (
          <path d="M55 96 C50 54 74 36 100 36 C126 36 150 54 145 96 C140 72 128 58 106 56 C96 66 76 72 62 74 C58 80 56 88 55 96 Z" fill={`url(#${id("hair")})`} />
        )
      )}

      {/* Sourcils */}
      <path d={female ? "M74 81 Q83 74 92 79" : "M74 80 Q83 74 92 79"} stroke={shade(hairColor, 0.05)} strokeWidth={female ? "2.4" : "4"} fill="none" strokeLinecap="round" />
      <path d={female ? "M108 79 Q117 74 126 81" : "M108 79 Q117 74 126 80"} stroke={shade(hairColor, 0.05)} strokeWidth={female ? "2.4" : "4"} fill="none" strokeLinecap="round" />

      {/* Yeux (+ cils féminins) */}
      {[83, 117].map((cx) => (
        <g key={cx}>
          <ellipse cx={cx} cy="94" rx="8" ry={female ? "6.8" : "7"} fill="#fff" />
          <circle cx={cx + 0.5} cy="95" r="5" fill={`url(#${id("eye")})`} />
          <circle cx={cx + 2} cy="93" r="1.8" fill="#fff" />
          {female && (
            <path
              d={cx < 100 ? "M74 91 Q78 86 89 89 M73 89 L76 92" : "M126 91 Q122 86 111 89 M127 89 L124 92"}
              stroke="#1a0f0a"
              strokeWidth="1.9"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </g>
      ))}

      {/* Lunettes */}
      {glasses && (
        female ? (
          <g fill="none" stroke="#92400e" strokeWidth="2.1">
            <ellipse cx="83" cy="94" rx="13.5" ry="9.5" />
            <ellipse cx="117" cy="94" rx="13.5" ry="9.5" />
            <path d="M96.5 93 L103.5 93" />
          </g>
        ) : (
          <g fill="none" stroke="#111827" strokeWidth="2.6">
            <rect x="70" y="84" width="27" height="20" rx="7" />
            <rect x="103" y="84" width="27" height="20" rx="7" />
            <path d="M97 92 L103 92" />
          </g>
        )
      )}

      {/* Nez */}
      <ellipse cx="103" cy="106" rx="4" ry="9" fill={shade(skin, -0.12)} opacity="0.5" />
      <ellipse cx="99" cy="104" rx="2.4" ry="7" fill="#fff" opacity="0.14" />
      <path d="M92 112 Q100 117 108 112" stroke={shade(skin, -0.22)} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <circle cx="95" cy="112" r="1.6" fill={shade(skin, -0.3)} />
      <circle cx="105" cy="112" r="1.6" fill={shade(skin, -0.3)} />

      {/* Joues */}
      <ellipse cx="74" cy="112" rx="8" ry="5" fill="#ff7a7a" opacity={female ? "0.26" : "0.18"} />
      <ellipse cx="126" cy="112" rx="8" ry="5" fill="#ff7a7a" opacity={female ? "0.26" : "0.18"} />

      {/* Barbe courte */}
      {beard && (
        <path d="M66 108 C68 132 84 142 100 142 C116 142 132 132 134 108 C128 124 116 130 100 130 C84 130 72 124 66 108 Z" fill={hairColor} opacity="0.85" />
      )}

      {/* Sourire */}
      {female ? (
        <g>
          <path d="M87 122 Q100 134 113 122 Q106 120 100 122 Q94 120 87 122 Z" fill="#be185d" />
          <path d="M91 124 Q100 129 109 124" fill="#fff" opacity="0.9" />
        </g>
      ) : (
        <>
          <path d="M86 122 Q100 133 114 122" stroke={shade(skin, -0.32)} strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M90 124 Q100 130 110 124" fill="#fff" opacity="0.85" />
        </>
      )}

      {/* Reflet (volume 3D) */}
      <ellipse cx="82" cy="66" rx="16" ry="9" fill="#fff" opacity="0.12" transform="rotate(-20 82 66)" />
    </svg>
  );
}
