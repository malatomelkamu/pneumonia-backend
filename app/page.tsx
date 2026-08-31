"use client"

import { useState } from "react"
import { Activity, CheckCircle2, FileImage, ShieldCheck, UploadCloud, X } from "lucide-react"

export default function Home() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [status, setStatus] = useState("Ready for an X-ray")
  const [result, setResult] = useState<{ prediction: string; confidence: number } | null>(null)

  function handleFileChange(selectedFile: File | null) {
    if (!selectedFile) return
    setFile(selectedFile)
    setPreview(URL.createObjectURL(selectedFile))
    setResult(null)
    setStatus("Ready for an X-ray")
  }

  function handleClear() {
    setFile(null)
    setPreview(null)
    setResult(null)
    setStatus("Ready for an X-ray")
  }

  async function analyze() {
    if (!file) return
    setStatus("Analyzing image…")
    setResult(null)
    const body = new FormData(); body.append("file", file)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/predict`, { method: "POST", body })
      if (!response.ok) throw new Error("Request failed")
      const data = await response.json()
      setResult(data); setStatus("Analysis complete")
    } catch { setStatus("Unable to reach the model API") }
  }

  return <main className="min-h-screen px-5 py-8 md:px-10">
    <header className="mx-auto flex max-w-6xl items-center justify-between border-b border-[#d7e5e8] pb-6">
      <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-xl bg-[#087f8c] text-white"><Activity size={21} /></span><div><p className="m-0 text-lg font-bold tracking-tight">PneumaScan</p><p className="m-0 text-xs text-[#617982]">Clinical imaging support</p></div></div>
      <span className="flex items-center gap-2 text-sm text-[#617982]"><ShieldCheck size={16} /> Local model workflow</span>
    </header>
    <section className="mx-auto grid max-w-6xl gap-10 py-14 lg:grid-cols-[1fr_420px] lg:items-center">
      <div><p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c]">Chest X-ray screening</p><h1 className="max-w-xl text-5xl font-bold leading-[1.05] tracking-[-0.04em] md:text-6xl">A clearer first look at every image.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-[#617982]">Upload a chest X-ray to receive a model-generated screening result. Use this tool as decision support, not as a diagnosis.</p><div className="mt-8 flex items-center gap-2 text-sm text-[#617982]"><CheckCircle2 size={17} className="text-[#087f8c]" /> Images are processed by your connected API</div></div>
      <div className="rounded-2xl border border-[#d7e5e8] bg-white p-6 shadow-[0_20px_50px_rgba(18,48,58,0.08)]"><div className="mb-5 flex items-start justify-between"><div><h2 className="m-0 text-xl font-bold">Analyze an image</h2><p className="mt-1 text-sm text-[#617982]">PNG, JPG, or JPEG</p></div><FileImage className="text-[#087f8c]" size={22} /></div>{!preview ? <label className="flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#b8d2d7] bg-[#f4f8fa] px-5 text-center transition hover:border-[#087f8c] hover:bg-[#edf7f8]"><UploadCloud className="mb-3 text-[#087f8c]" size={30} /><span className="font-semibold">Choose a chest X-ray</span><span className="mt-1 text-sm text-[#617982]">or drop it here</span><input className="sr-only" type="file" accept="image/png,image/jpeg" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} /></label> : <div className="relative overflow-hidden rounded-xl border border-[#b8d2d7] bg-black"><img src={preview} alt="X-ray preview" className="h-48 w-full object-contain" /><button type="button" onClick={handleClear} className="absolute right-2 top-2 flex size-7 items-center justify-center rounded-full bg-black/70 text-white" title="Remove image"><X size={16} /></button><div className="truncate bg-slate-900/80 px-3 py-1.5 text-xs text-slate-300">{file?.name}</div></div>}<button onClick={analyze} disabled={!file || status === "Analyzing image…"} className="mt-5 w-full rounded-lg bg-[#087f8c] px-4 py-3 font-bold text-white transition hover:bg-[#075e69] disabled:cursor-not-allowed disabled:opacity-45">{status === "Analyzing image…" ? "Analyzing…" : "Run screening"}</button><p className="mt-4 text-center text-sm text-[#617982]">{status}</p>{result && <div className="mt-4 rounded-lg border border-[#b8d2d7] bg-[#edf7f8] p-4"><p className="m-0 text-xs font-bold uppercase tracking-wider text-[#617982]">Model result</p><p className="mt-2 text-2xl font-bold">{result.prediction}</p><p className="mt-1 text-sm text-[#617982]">Confidence: {result.confidence}%</p></div>}</div>
    </section>
  </main>
}
