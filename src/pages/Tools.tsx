import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurvivalTools } from "@/components/SurvivalTools";

export default function Tools() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background hexagon-bg">
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-background/80 border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-warning/20">
              <Wrench className="w-6 h-6 text-warning" />
            </div>
            <div>
              <h1 className="font-display font-bold text-lg">Survival Tools</h1>
              <p className="text-xs text-muted-foreground">Essential utilities</p>
            </div>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4">
        <SurvivalTools />

        <div className="bg-card/50 border border-border rounded-xl p-4">
          <h3 className="font-display font-semibold text-foreground mb-3">Tool Guide</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>🔦 <strong className="text-foreground">Flashlight:</strong> Uses device flash LED for emergency lighting.</p>
            <p>🔊 <strong className="text-foreground">Siren:</strong> Loud emergency tone to attract attention.</p>
            <p>🧭 <strong className="text-foreground">Compass:</strong> Digital compass using device magnetometer.</p>
            <p>🪞 <strong className="text-foreground">Mirror:</strong> Bright screen for signaling aircraft or rescuers.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
