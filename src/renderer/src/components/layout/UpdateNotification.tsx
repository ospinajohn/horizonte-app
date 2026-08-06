import { useEffect, useState } from "react";
import { Download, RefreshCw, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

type UpdatePhase = "idle" | "available" | "downloading" | "downloaded";

export function UpdateNotification(): JSX.Element | null {
  const [phase, setPhase] = useState<UpdatePhase>("idle");
  const [version, setVersion] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    window.api.updater.onAvailable((info) => {
      setVersion(info.version);
      setPhase("available");
      setDismissed(false);
    });
    window.api.updater.onProgress((p) => {
      setProgress(p.percent);
    });
    window.api.updater.onDownloaded((info) => {
      setVersion(info.version);
      setPhase("downloaded");
      setDismissed(false);
    });
  }, []);

  if (phase === "idle" || dismissed) return null;

  const handleDownload = async (): Promise<void> => {
    setPhase("downloading");
    await window.api.updater.download();
  };

  const handleInstall = async (): Promise<void> => {
    await window.api.updater.install();
  };

  return (
    <div className="fixed bottom-6 right-6 z-[60] w-full max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[#121418] border border-white/[0.08] rounded-3xl p-5 shadow-2xl shadow-black/50 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0",
                phase === "downloaded"
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                  : "bg-sky-500/15 text-sky-400 border-sky-500/20",
              )}
            >
              {phase === "downloaded" ? (
                <RefreshCw size={16} />
              ) : (
                <Sparkles size={16} />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-white">
                {phase === "downloaded"
                  ? "Actualización lista"
                  : "Nueva versión disponible"}
              </p>
              {version && (
                <p className="text-[11px] text-gray-500 font-mono">
                  v{version}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all shrink-0"
          >
            <X size={12} />
          </button>
        </div>

        {phase === "downloading" && (
          <div className="mt-4">
            <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[11px] text-gray-500 mt-1.5">
              Descargando… {progress}%
            </p>
          </div>
        )}

        {phase === "available" && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-medium hover:text-white hover:bg-white/[0.08] transition-all"
            >
              Más tarde
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 h-9 rounded-xl bg-sky-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-sky-400 transition-all"
            >
              <Download size={13} /> Descargar
            </button>
          </div>
        )}

        {phase === "downloaded" && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setDismissed(true)}
              className="flex-1 h-9 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-medium hover:text-white hover:bg-white/[0.08] transition-all"
            >
              Después
            </button>
            <button
              onClick={handleInstall}
              className="flex-1 h-9 rounded-xl bg-emerald-500 text-black font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-400 transition-all"
            >
              <RefreshCw size={13} /> Reiniciar y actualizar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
