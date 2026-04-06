import "./Mascot.css";

/**
 * Dindy - the DinApp soil mascot 🌿
 * Animates its mouth/eyes when AI is typing (isTalking=true)
 */
export default function Mascot({ isTalking = false, size = null }) {
    return (
        <div className={`mascot ${isTalking ? "mascot--talking" : ""}`}>
            <svg
                className="mascot__svg"
                viewBox="0 0 160 200"
                xmlns="http://www.w3.org/2000/svg"
                style={size ? { width: size, height: 'auto' } : undefined}
            >
                {/* === Body (rounded little robot/plant shape) === */}
                <ellipse cx="80" cy="150" rx="38" ry="45" fill="#5d9e6a" />

                {/* Belly - mini carrot 🥕 */}
                <ellipse cx="80" cy="163" rx="15" ry="16" fill="#ff7043" />
                <polygon points="80,179 68,163 92,163" fill="#ff7043" />
                {/* Carrot tip */}
                <polygon points="80,186 76,179 84,179" fill="#e64a19" />
                {/* Carrot leaf/stem */}
                <path d="M74 148 Q70 138 66 132" stroke="#4caf50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M80 147 Q80 136 80 129" stroke="#66bb6a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                <path d="M86 148 Q90 138 94 132" stroke="#4caf50" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                {/* Carrot texture lines */}
                <path d="M70 158 Q80 156 90 158" stroke="#e64a19" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />
                <path d="M69 166 Q80 163 91 166" stroke="#e64a19" strokeWidth="1" fill="none" strokeLinecap="round" opacity="0.6" />

                {/* === Leaves on head (proper leaf shapes) === */}
                {/* Left leaf */}
                <g transform="rotate(-35 55 75) translate(38, 48)">
                    <path d="M8 26 Q-10 10 8 0 Q26 10 8 26 Z" fill="#43a047" />
                    <line x1="8" y1="1" x2="8" y2="25" stroke="#2e7d32" strokeWidth="1" opacity="0.5" />
                </g>
                {/* Center leaf (tallest) */}
                <g transform="translate(68, 30)">
                    <path d="M12 32 Q-4 14 12 0 Q28 14 12 32 Z" fill="#66bb6a" />
                    <line x1="12" y1="1" x2="12" y2="31" stroke="#2e7d32" strokeWidth="1" opacity="0.5" />
                </g>
                {/* Right leaf */}
                <g transform="rotate(35 105 75) translate(88, 48)">
                    <path d="M8 26 Q-10 10 8 0 Q26 10 8 26 Z" fill="#43a047" />
                    <line x1="8" y1="1" x2="8" y2="25" stroke="#2e7d32" strokeWidth="1" opacity="0.5" />
                </g>

                {/* === Head === */}
                <ellipse cx="80" cy="100" rx="42" ry="38" fill="#a5d6a7" />

                {/* === Cheek blush === */}
                <ellipse cx="55" cy="110" rx="10" ry="6" fill="#ef9a9a" opacity="0.5" />
                <ellipse cx="105" cy="110" rx="10" ry="6" fill="#ef9a9a" opacity="0.5" />

                {/* === Eyes === */}
                {/* Eye whites */}
                <ellipse cx="63" cy="97" rx="11" ry="12" fill="white" />
                <ellipse cx="97" cy="97" rx="11" ry="12" fill="white" />

                {/* Pupils */}
                <ellipse
                    className="mascot__pupil-left"
                    cx="65" cy="99" rx="6" ry="7"
                    fill="#2e7d32"
                />
                <ellipse
                    className="mascot__pupil-right"
                    cx="99" cy="99" rx="6" ry="7"
                    fill="#2e7d32"
                />

                {/* Pupil shine */}
                <circle cx="67" cy="96" r="2" fill="white" />
                <circle cx="101" cy="96" r="2" fill="white" />

                {/* Eye blink layers (animated via CSS) */}
                <ellipse
                    className="mascot__blink-left"
                    cx="63" cy="97" rx="11" ry="0"
                    fill="#a5d6a7"
                />
                <ellipse
                    className="mascot__blink-right"
                    cx="97" cy="97" rx="11" ry="0"
                    fill="#a5d6a7"
                />

                {/* === Mouth === */}
                {/* Mouth base (closed smile) */}
                <path
                    className="mascot__mouth-closed"
                    d="M 65 118 Q 80 130 95 118"
                    stroke="#388e3c"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                />

                {/* Mouth open (shown when talking) */}
                <ellipse
                    className="mascot__mouth-open"
                    cx="80" cy="121"
                    rx="14" ry="8"
                    fill="#1b4332"
                />
                {/* Teeth */}
                <rect
                    className="mascot__mouth-open"
                    x="70" y="117"
                    width="8" height="5"
                    rx="1"
                    fill="white"
                />
                <rect
                    className="mascot__mouth-open"
                    x="82" y="117"
                    width="8" height="5"
                    rx="1"
                    fill="white"
                />

                {/* === Arms — dark rounded nubs === */}
                {/* Left arm */}
                <ellipse cx="42" cy="148" rx="10" ry="6" fill="#2e2e2e" transform="rotate(-20 42 148)" />
                {/* Right arm */}
                <ellipse cx="118" cy="148" rx="10" ry="6" fill="#2e2e2e" transform="rotate(20 118 148)" />

                {/* === Realistic branch held in right hand === */}
                <path d="M124 150 Q155 130 178 108" stroke="#4a1c0a" strokeWidth="5" fill="none" strokeLinecap="round" />
                {/* Left sub-branch */}
                <path d="M150 132 Q144 118 142 108" stroke="#5d2a0e" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Right sub-branch */}
                <path d="M170 118 Q173 106 175 98" stroke="#5d2a0e" strokeWidth="3" fill="none" strokeLinecap="round" />
                {/* Leaves at left tip */}
                <ellipse cx="145" cy="109" rx="7" ry="4" fill="#3a6b35" transform="rotate(-40 145 109)" />
                <ellipse cx="141" cy="106" rx="6" ry="3.5" fill="#4a8040" transform="rotate(20 141 106)" />
                {/* Leaves at right tip */}
                <ellipse cx="174" cy="99" rx="7" ry="4" fill="#4a8040" transform="rotate(-50 174 99)" />
                <ellipse cx="177" cy="96" rx="6" ry="3.5" fill="#3a6b35" transform="rotate(15 177 96)" />
                {/* One leaf at main stem tip */}
                <ellipse cx="179" cy="107" rx="7" ry="4" fill="#3a6b35" transform="rotate(-30 179 107)" />
            </svg>

            {/* Speech bubble when talking */}
            {isTalking && (
                <div className="mascot__bubble">
                    <span></span><span></span><span></span>
                </div>
            )}
        </div>
    );
}
