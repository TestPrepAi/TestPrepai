import { useCallback, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Download, Share2, Copy, MessageCircle } from "lucide-react";

const EXAM_LABEL = { jee_main: "JEE Main", jee_advanced: "JEE Advanced", neet: "NEET" };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawScoreCard(canvas, { name, exam, score, correct, total, subjects, appUrl }) {
  const W = 1080, H = 1080;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0F0A2E";
  ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(W * 0.85, H * 0.1, 50, W * 0.85, H * 0.1, 700);
  g.addColorStop(0, "rgba(109,94,252,0.55)"); g.addColorStop(1, "rgba(109,94,252,0)");
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const g2 = ctx.createRadialGradient(W * 0.1, H * 0.95, 50, W * 0.1, H * 0.95, 600);
  g2.addColorStop(0, "rgba(251,191,36,0.4)"); g2.addColorStop(1, "rgba(251,191,36,0)");
  ctx.fillStyle = g2; ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "#6D5EFC"; roundRect(ctx, 80, 80, 72, 72, 20); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "bold 44px sans-serif"; ctx.textBaseline = "middle";
  ctx.fillText("✦", 96, 118);
  ctx.font = "800 48px sans-serif"; ctx.fillText("TrackPrep", 172, 118);

  ctx.fillStyle = "#C4B5FD"; ctx.font = "600 30px sans-serif"; ctx.letterSpacing = "6px";
  ctx.fillText(`${(EXAM_LABEL[exam] || exam).toUpperCase()} MOCK TEST`, 80, 250);
  ctx.letterSpacing = "0px";

  ctx.fillStyle = "#fff"; ctx.font = "800 64px sans-serif";
  ctx.fillText(name, 80, 330);

  ctx.fillStyle = "#FBBF24"; ctx.font = "800 300px sans-serif";
  const scoreTxt = `${Math.round(score)}%`;
  ctx.fillText(scoreTxt, 72, 560);

  ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "600 40px sans-serif";
  ctx.fillText(`${correct} / ${total} correct`, 80, 740);

  let x = 80;
  ctx.font = "600 28px sans-serif";
  (subjects || []).forEach((s) => {
    const label = s.charAt(0).toUpperCase() + s.slice(1);
    const w = ctx.measureText(label).width + 48;
    ctx.fillStyle = "rgba(255,255,255,0.12)"; roundRect(ctx, x, 800, w, 60, 30); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.fillText(label, x + 24, 830);
    x += w + 16;
  });

  ctx.fillStyle = "rgba(255,255,255,0.08)"; roundRect(ctx, 80, 910, W - 160, 100, 24); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.font = "700 32px sans-serif";
  ctx.fillText("Beat my score? First 5 AI questions are free →", 110, 945);
  ctx.fillStyle = "#FBBF24"; ctx.font = "600 28px sans-serif";
  ctx.fillText(appUrl.replace(/^https?:\/\//, ""), 110, 985);
}

export default function ShareScoreCard({ open, onOpenChange, result, userName }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const appUrl = window.location.origin;
  const examLabel = EXAM_LABEL[result.exam] || result.exam;
  const shareText = `I scored ${Math.round(result.score_pct)}% (${result.correct}/${result.total}) on a ${examLabel} AI mock test on TrackPrep! Think you can beat me? First 5 questions are free: ${appUrl}`;

  const canvasRef = useCallback((node) => {
    if (!node) return;
    drawScoreCard(node, {
      name: userName || "Student",
      exam: result.exam,
      score: result.score_pct,
      correct: result.correct,
      total: result.total,
      subjects: Object.keys(result.subject_stats || {}),
      appUrl,
    });
    node.toBlob((b) => b && setBlobUrl(URL.createObjectURL(b)), "image/png");
  }, [result, userName, appUrl]);

  const download = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `trackprep-score-${Math.round(result.score_pct)}.png`;
    a.click();
    toast.success("Score card downloaded");
  };

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      toast.success("Invite text copied");
    } catch { toast.error("Could not copy"); }
  };

  const nativeShare = async () => {
    try {
      const res = await fetch(blobUrl);
      const file = new File([await res.blob()], "trackprep-score.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: shareText, title: "My TrackPrep score" });
      } else {
        await navigator.share({ text: shareText, url: appUrl });
      }
    } catch { /* user cancelled */ }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white max-w-lg" data-testid="share-dialog">
        <DialogHeader>
          <DialogTitle className="font-display">Share your score card</DialogTitle>
          <DialogDescription>Invite classmates — they get 5 free AI questions to try and beat you.</DialogDescription>
        </DialogHeader>
        <canvas
          ref={canvasRef}
          data-testid="share-canvas"
          className="w-full rounded-2xl shadow-lg border border-slate-200"
          style={{ aspectRatio: "1 / 1" }}
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <Button data-testid="share-download-btn" onClick={download} className="bg-violet-600 hover:bg-violet-700 text-white">
            <Download className="w-4 h-4 mr-2" /> Download PNG
          </Button>
          <Button
            data-testid="share-whatsapp-btn"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank")}
            className="bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
          </Button>
          <Button data-testid="share-copy-btn" variant="outline" onClick={copyText} className="border-slate-300">
            <Copy className="w-4 h-4 mr-2" /> Copy text
          </Button>
          {typeof navigator.share === "function" && (
            <Button data-testid="share-native-btn" variant="outline" onClick={nativeShare} className="border-slate-300">
              <Share2 className="w-4 h-4 mr-2" /> More…
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
