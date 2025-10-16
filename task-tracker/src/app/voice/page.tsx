"use client";
import { useEffect, useRef, useState } from "react";
import { GlassCard } from "@/components/Card";
import { Mic, Square, Wand2 } from "lucide-react";

export default function VoicePage() {
  const mediaRef = useRef<MediaRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [text, setText] = useState("");
  const [enhanced, setEnhanced] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (mediaRef.current && mediaRef.current.state !== "inactive") mediaRef.current.stop();
    };
  }, []);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    setChunks([]);
    rec.ondataavailable = (e) => setChunks((prev) => [...prev, e.data]);
    rec.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      setBusy(true);
      try {
        const fd = new FormData();
        fd.append("file", blob, "audio.webm");
        const res = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
        const j = await res.json();
        setText(j.text || "");
      } finally {
        setBusy(false);
      }
    };
    rec.start();
    mediaRef.current = rec;
    setRecording(true);
  }

  function stopRecording() {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach((t) => t.stop());
    setRecording(false);
  }

  async function enhance() {
    setBusy(true);
    try {
      const res = await fetch("/api/ai/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ raw: text }),
      });
      const j = await res.json();
      setEnhanced(j);
    } finally {
      setBusy(false);
    }
  }

  async function createTask() {
    if (!enhanced) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: enhanced.title,
        body: enhanced.body,
        subtasks: enhanced.subtasks,
        priority: enhanced.priority,
      }),
    });
    window.location.href = "/board";
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <GlassCard className="p-6">
        <div className="flex items-center gap-3">
          {!recording ? (
            <button onClick={startRecording} className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2">
              <Mic size={16}/> Start dictation
            </button>
          ) : (
            <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2">
              <Square size={16}/> Stop
            </button>
          )}
          <button disabled={!text || busy} onClick={enhance} className="inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 disabled:opacity-50">
            <Wand2 size={16}/> Enhance
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Transcript will appear here" className="w-full rounded-lg bg-black/20 border border-white/10 p-3 min-h-[120px]"/>
          {enhanced && (
            <div className="rounded-lg bg-black/20 border border-white/10 p-3">
              <div className="font-medium">{enhanced.title}</div>
              {enhanced.body && <p className="text-sm opacity-85 mt-1">{enhanced.body}</p>}
              {!!enhanced.subtasks?.length && (
                <ul className="mt-2 list-disc list-inside text-sm opacity-90">
                  {enhanced.subtasks.map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              )}
              <div className="mt-2 text-xs opacity-80">Priority: {enhanced.priority}</div>
              <button onClick={createTask} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2">
                Create task
              </button>
            </div>
          )}
        </div>
      </GlassCard>
    </main>
  );
}
