"""Generate per-line English voice-acting direction prompts and write them
back into script.json as `lineDirection` on each dialogue entry.

Uses Lovable AI Gateway (openai/gpt-5-mini). One request per scene.

Usage: python3 scripts/gen-line-directions.py <story-id> [--force]
"""
import json, os, sys, urllib.request, urllib.error, pathlib, time

STORY = sys.argv[1] if len(sys.argv) > 1 else "boy-wolf"
FORCE = "--force" in sys.argv
KEY = os.environ["LOVABLE_API_KEY"]
PATH = pathlib.Path(f"src/stories/{STORY}/script.json")
data = json.loads(PATH.read_text())

voices = data["voices"]
emotions = data["emotions"]
global_rule = data.get("globalPerformanceRule", "")

SYS = f"""You are a voice-acting director for a Korean children's fairy-tale audio drama produced with ElevenLabs.
Write ONE concise English performance direction for EACH dialogue line.

Global rule (always applies):
{global_rule}

Character personas:
""" + "\n".join(f"- {k}: {v.get('persona','')}" for k,v in voices.items()) + """

Emotion presets (baseline; refine per line):
""" + "\n".join(f"- {k}: {v.get('directionPrompt','')}" for k,v in emotions.items()) + """

Direction rules:
1. 2-4 short sentences, English only, present tense, second-person imperative ("Speak...", "Let your voice...").
2. Ground the direction in the SPECIFIC line text — what the character feels, wants, or reacts to in THIS moment.
3. Blend: character persona + scene mood + line-specific emotion. Do NOT copy the emotion preset verbatim.
4. Include micro-cues (pauses, breath, tempo, pitch, volume) when they help the actor.
5. Never quote or translate the Korean line. Never mention ElevenLabs or tags.
6. Output STRICT JSON only: {"directions":[{"i":0,"d":"..."},{"i":1,"d":"..."}, ...]} matching every line index.
"""

def call_scene(scene):
    lines = [{"i": i, "who": d["who"], "emotion": d.get("emotion","calm"), "text": d["text"]}
             for i, d in enumerate(scene["dialogue"])]
    user = json.dumps({
        "scene_id": scene["id"],
        "setting": scene.get("setting",""),
        "mood": scene.get("mood",""),
        "lines": lines,
    }, ensure_ascii=False)
    body = json.dumps({
        "model": "google/gemini-2.5-flash",
        "messages": [
            {"role":"system","content":SYS},
            {"role":"user","content":user},
        ],
        "response_format":{"type":"json_object"},
    }).encode()
    req = urllib.request.Request(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        data=body,
        headers={"Authorization":f"Bearer {KEY}","Content-Type":"application/json"},
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                res = json.loads(r.read())
                content = res["choices"][0]["message"]["content"]
                return json.loads(content)["directions"]
        except urllib.error.HTTPError as e:
            print(f"  HTTP {e.code}: {e.read()[:200]}"); time.sleep(2)
        except Exception as e:
            print(f"  err: {e}"); time.sleep(2)
    raise SystemExit(f"failed scene {scene['id']}")

for scene in data["scenes"]:
    need = FORCE or any("lineDirection" not in d for d in scene["dialogue"])
    if not need:
        print(f"[{scene['id']}] skip (already set)"); continue
    print(f"[{scene['id']}] generating {len(scene['dialogue'])} directions...")
    directions = call_scene(scene)
    by_i = {d["i"]: d["d"] for d in directions}
    for i, d in enumerate(scene["dialogue"]):
        if i in by_i:
            d["lineDirection"] = by_i[i]
    PATH.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    print(f"  ✓ saved")

print("done")
