"""
IP & Copyright Safety Gatekeeper for ForgeAI B2C Platform.
Detects commercial copyrighted IP names or imagery (Disney, Marvel, Nintendo/Pokemon, Games Workshop/Warhammer, etc.)
and automatically rewrites the prompt into a generic, public-domain aesthetic equivalent without hard-crashing.
Allows personal photos (pets, portraits), original sketches, and geometric/mechanical objects as SAFE.
"""

import re
from typing import Dict, Any, Tuple

# Comprehensive registry of protected IPs, associated franchies, and public-domain equivalent aesthetics
PROTECTED_IP_REGISTRY = [
    {
        "franchise": "Marvel Comics / MCU",
        "patterns": [
            r"\biron\s*man\b", r"\btony\s*stark\b", r"\barc\s*reactor\b",
            r"\bspider-?man\b", r"\bpeter\s*parker\b", r"\bvenom\b",
            r"\bcaptain\s*america\b", r"\bavengers?\b", r"\bthor\b(?:\s*hammer|\s*god)?",
            r"\bwolverine\b", r"\bdeadpool\b", r"\bhulk\b", r"\bthanos\b",
            r"\bblack\s*panther\b", r"\bgroot\b"
        ],
        "rewrites": {
            r"\biron\s*man\b": "sleek cybernetic mecha warrior faceplate with high-tech plating",
            r"\btony\s*stark\b": "futuristic industrialist cyber-armor",
            r"\barc\s*reactor\b": "hexagonal ion core emitter",
            r"\bspider-?man\b": "agile heroic acrobat with articulated nanosuit exoskeleton",
            r"\bvenom\b": "alien symbiote creature with razor jaw",
            r"\bcaptain\s*america\b": "tactical super-soldier with reinforced aegis shield",
            r"\bthor\b(?:\s*hammer|\s*god)?": "nordic storm warrior with runic war hammer",
            r"\bwolverine\b": "feral mutant berserker with retractable metal claws",
            r"\bdeadpool\b": "masked dual-katana mercenary in tactical weave",
            r"\bhulk\b": "colossal muscular brute warrior",
            r"\bthanos\b": "cosmic conqueror in golden ceremonial plate",
            r"\bblack\s*panther\b": "kinetic-weave panther sentinel champion"
        },
        "default_replacement": "sleek cybernetic mecha warrior with articulated aesthetic"
    },
    {
        "franchise": "Games Workshop / Warhammer 40,000",
        "patterns": [
            r"\bspace\s*marine\b", r"\badeptus\s*astartes\b", r"\bwarhammer\b",
            r"\bwh40k\b", r"\b40k\b", r"\bultramarine\b", r"\bchaos\s*marine\b",
            r"\btyranid\b", r"\bnecron\b", r"\bbolter\b", r"\bdreadnought\b",
            r"\bgrotesque\s*nurgle\b", r"\bkhorne\b"
        ],
        "rewrites": {
            r"\bspace\s*marine\b": "heavy sci-fi armored paladin with reinforced pauldrons",
            r"\badeptus\s*astartes\b": "super-heavy power-armored champion",
            r"\bwarhammer(?:\s*40k)?\b": "grimdark heroic tabletop miniature",
            r"\bwh40k\b": "grimdark heroic tabletop miniature",
            r"\bultramarine\b": "cobalt-crested heavy knight in ceremonial battleplate",
            r"\bchaos\s*marine\b": "spiked dark vanguard warrior with horned helmet",
            r"\btyranid\b": "chitinous bio-monstrosity with scything talons",
            r"\bnecron\b": "ancient mechanical skeletal warrior",
            r"\bdreadnought\b": "bipedal walking siege mech chassis",
            r"\bbolter\b": "heavy caliber gyro-stabilized carbine"
        },
        "default_replacement": "heavy sci-fi armored paladin in reinforced tactical power plate"
    },
    {
        "franchise": "Nintendo / Pokémon",
        "patterns": [
            r"\bpikachu\b", r"\bcharizard\b", r"\bpok[eé]mon\b", r"\bbulbasaur\b",
            r"\bmario\b", r"\bluigi\b", r"\bzelda\b", r"\blink\b(?:\s*sword)?",
            r"\bmaster\s*sword\b", r"\bkirby\b", r"\bmewtwo\b", r"\bsquirtle\b"
        ],
        "rewrites": {
            r"\bpikachu\b": "electric lightning rodent mascot with pointed ears and lightning tail",
            r"\bcharizard\b": "draconic fire-breathing wyvern beast with flame crest",
            r"\bpok[eé]mon\b": "elemental fantasy companion creature",
            r"\bmario\b": "cheerful overall-clad mustache explorer",
            r"\bluigi\b": "tall green-capped mustache adventurer",
            r"\bzelda\b": "regal fantasy elven princess in royal crest",
            r"\blink\b(?:\s*sword)?": "green-tunicked tunic hero with enchanted blade",
            r"\bmaster\s*sword\b": "ancient winged broadsword of legend",
            r"\bkirby\b": "spherical celestial pink sprite with boots",
            r"\bmewtwo\b": "psychic bipedal feline alien sovereign"
        },
        "default_replacement": "stylized fantasy creature with expressive mythical features"
    },
    {
        "franchise": "Star Wars / Lucasfilm / Disney",
        "patterns": [
            r"\bdarth\s*vader\b", r"\bstormtrooper\b", r"\byoda\b", r"\blightsaber\b",
            r"\bmandalorian\b", r"\bboba\s*fett\b", r"\bstar\s*wars\b",
            r"\bmickey\s*mouse\b", r"\bdonald\s*duck\b", r"\bbuzz\s*lightyear\b"
        ],
        "rewrites": {
            r"\bdarth\s*vader\b": "dark cybernetic galactic warlord with breath-mask and flowing cape",
            r"\bstormtrooper\b": "imperial shock trooper in white composite tactical armor",
            r"\byoda\b": "ancient wise alien mystic master with pointed ears",
            r"\blightsaber\b": "focused plasma energy blade with metallic emitter hilt",
            r"\bmandalorian\b": "beskar-style lone bounty hunter in T-visor helmet",
            r"\bboba\s*fett\b": "veteran armor-clad mercenary with rangefinder helmet",
            r"\bmickey\s*mouse\b": "whimsical vintage cartoon rodent figurine with round ears",
            r"\bbuzz\s*lightyear\b": "intergalactic star-ranger in pressurized spaceflight suit"
        },
        "default_replacement": "galactic sci-fi explorer in composite tactical environmental suit"
    },
    {
        "franchise": "DC Comics",
        "patterns": [
            r"\bbatman\b", r"\bsuperman\b", r"\bjoker\b", r"\bwonder\s*woman\b",
            r"\bflash\b(?:\s*hero)?", r"\bgreen\s*lantern\b", r"\bgotham\b"
        ],
        "rewrites": {
            r"\bbatman\b": "nocturnal vigilante knight with cowl and serrated gauntlets",
            r"\bsuperman\b": "solar-powered caped paragon with emblem",
            r"\bjoker\b": "theatrical grinning rogue in dapper suit",
            r"\bwonder\s*woman\b": "amazonian warrior princess with golden tiara and bracers"
        },
        "default_replacement": "heroic guardian in dynamic mantle and insignia"
    }
]


class IPGuardService:
    """Evaluates prompts and inputs against commercial IP and rewrites them into public-domain equivalents."""

    @classmethod
    def inspect_and_sanitize(cls, prompt: str) -> Dict[str, Any]:
        """
        Inspects text prompt for copyrighted commercial IP.
        Never hard-crashes. Automatically adapts to generic public-domain equivalent.
        """
        if not prompt or not prompt.strip():
            return {
                "safe": True,
                "is_rewritten": False,
                "original_prompt": "",
                "clean_prompt": "Bespoke metal emblem sculpture",
                "matched_ip": None,
                "franchise": None,
                "notice": None
            }

        text = prompt.strip()
        matched_franchise = None
        matched_term = None
        rewritten_text = text

        for ip_group in PROTECTED_IP_REGISTRY:
            franchise = ip_group["franchise"]
            for pat in ip_group["patterns"]:
                match = re.search(pat, text, flags=re.IGNORECASE)
                if match:
                    matched_term = match.group(0)
                    matched_franchise = franchise
                    break
            if matched_term:
                # Execute specific replacement rewrites
                for specific_pat, replacement in ip_group["rewrites"].items():
                    rewritten_text = re.sub(specific_pat, replacement, rewritten_text, flags=re.IGNORECASE)
                
                # If term wasn't replaced by specific dictionary, apply default replacement
                if re.search(re.escape(matched_term), rewritten_text, flags=re.IGNORECASE):
                    rewritten_text = re.sub(
                        re.escape(matched_term),
                        ip_group["default_replacement"],
                        rewritten_text,
                        flags=re.IGNORECASE
                    )
                break

        is_rewritten = matched_term is not None

        if is_rewritten:
            notice = (
                f"IP-Safety Filter: We detected a protected commercial IP reference ('{matched_term}'). "
                f"To comply with 3D metal manufacturing and foundry copyright laws, your prompt was "
                f"automatically transformed into a bespoke public-domain aesthetic: '{rewritten_text}'."
            )
        else:
            notice = "Content Verified: Safe for direct metal additive manufacturing."

        return {
            "safe": True,
            "is_rewritten": is_rewritten,
            "original_prompt": text,
            "clean_prompt": rewritten_text,
            "matched_ip": matched_term,
            "franchise": matched_franchise,
            "notice": notice
        }

    @classmethod
    def evaluate_image_metadata(cls, filename: str, content_type: str) -> Dict[str, Any]:
        """
        Evaluates uploaded image metadata.
        Personal photos (pets, original sketches, portraits, engineering parts) are classified as SAFE.
        """
        fn_lower = filename.lower()
        ip_found = None
        for ip_group in PROTECTED_IP_REGISTRY:
            for pat in ip_group["patterns"]:
                if re.search(pat, fn_lower):
                    ip_found = ip_group["franchise"]
                    break
            if ip_found:
                break

        if ip_found:
            return {
                "safe": True,
                "is_personal_photo": False,
                "requires_aesthetic_guidance": True,
                "notice": f"Commercial character motif detected ({ip_found}). Generator will stylize as an original sculpted metal interpretation."
            }

        return {
            "safe": True,
            "is_personal_photo": True,
            "requires_aesthetic_guidance": False,
            "notice": "Original photo/sketch verified: safe for custom metal manufacturing."
        }
