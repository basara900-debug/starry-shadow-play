import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";

// 간단한 인메모리 캐시 — 동일 (text, voice, instructions) 요청은 한 번만 호출한다.
const cache = new Map<string, ArrayBuffer>();

function keyOf(text: string, voice: string, instructions: string) {
  return createHash("sha256").update(`${voice}\n${instructions}\n${text}`).digest("hex");
}

export const Route = createFileRoute("/api/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env.LOVABLE_API_KEY;
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        let body: { text?: string; voice?: string; instructions?: string };
        try {
          body = await request.json();
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }
        const text = (body.text ?? "").trim();
        const voice = (body.voice ?? "alloy").trim();
        const instructions = (body.instructions ?? "").trim();
        if (!text) return new Response("Missing text", { status: 400 });

        const k = keyOf(text, voice, instructions);
        const cached = cache.get(k);
        if (cached) {
          return new Response(cached, {
            headers: {
              "Content-Type": "audio/mpeg",
              "Cache-Control": "public, max-age=31536000, immutable",
            },
          });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-tts",
            input: text,
            voice,
            instructions: instructions || undefined,
            response_format: "mp3",
            stream_format: "audio",
          }),
        });
        if (!upstream.ok) {
          const errText = await upstream.text().catch(() => "");
          return new Response(`TTS failed: ${upstream.status} ${errText}`, {
            status: upstream.status,
          });
        }
        const buf = await upstream.arrayBuffer();
        cache.set(k, buf);
        return new Response(buf, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});