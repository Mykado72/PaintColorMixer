namespace ColorMixer.Models;

// ─── Mode de peinture ─────────────────────────────────────────────────────────
public enum PaintMode { Opaque, Watercolor }

// ─── Color Info ───────────────────────────────────────────────────────────────
public class ColorInfo
{
    public int R { get; }
    public int G { get; }
    public int B { get; }

    public ColorInfo(int r, int g, int b)
    {
        R = Math.Clamp(r, 0, 255);
        G = Math.Clamp(g, 0, 255);
        B = Math.Clamp(b, 0, 255);
    }

    public string Hex => $"#{R:X2}{G:X2}{B:X2}";

    private (double h, double s, double l) _hsl => RgbToHsl(R, G, B);
    public int H => (int)Math.Round(_hsl.h * 360);
    public int S => (int)Math.Round(_hsl.s * 100);
    public int L => (int)Math.Round(_hsl.l * 100);

    public (double L, double a, double b) Lab => RgbToLab(R, G, B);

    private static (double h, double s, double l) RgbToHsl(int r, int g, int b)
    {
        double rd = r/255.0, gd = g/255.0, bd = b/255.0;
        double max = Math.Max(rd, Math.Max(gd, bd));
        double min = Math.Min(rd, Math.Min(gd, bd));
        double l = (max + min) / 2.0;
        if (max == min) return (0, 0, l);
        double d = max - min;
        double s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        double h = max == rd ? (gd - bd) / d + (gd < bd ? 6 : 0)
                 : max == gd ? (bd - rd) / d + 2
                 :             (rd - gd) / d + 4;
        return (h / 6.0, s, l);
    }

    private static (double L, double a, double b) RgbToLab(int r, int g, int b)
    {
        double Lin(int c) { double v = c/255.0; return v <= 0.04045 ? v/12.92 : Math.Pow((v+0.055)/1.055, 2.4); }
        double rl = Lin(r), gl = Lin(g), bl = Lin(b);
        double X = rl*0.4124564 + gl*0.3575761 + bl*0.1804375;
        double Y = rl*0.2126729 + gl*0.7151522 + bl*0.0721750;
        double Z = rl*0.0193339 + gl*0.1191920 + bl*0.9503041;
        double f(double t) => t > 0.008856 ? Math.Cbrt(t) : 7.787*t + 16.0/116.0;
        double fx = f(X/0.95047), fy = f(Y/1.0), fz = f(Z/1.08883);
        return (116*fy - 16, 500*(fx - fy), 200*(fy - fz));
    }

    public double DeltaE(ColorInfo o)
    {
        var (L1,a1,b1) = Lab; var (L2,a2,b2) = o.Lab;
        return Math.Sqrt(Math.Pow(L1-L2,2) + Math.Pow(a1-a2,2) + Math.Pow(b1-b2,2));
    }
}

// ─── Paint Colors ─────────────────────────────────────────────────────────────
public class PaintColor
{
    public string Name          { get; set; } = "";
    public string Hex           { get; set; } = "#000000";
    // Aquarelle uniquement
    public string PigmentCode   { get; set; } = "";       // ex: PB15:3
    public bool   IsTransparent { get; set; } = true;
    public bool   IsGranulating { get; set; } = false;
    public bool   IsStaining    { get; set; } = false;    // tache le papier
    public double DryingFactor  { get; set; } = 0.25;     // éclaircissement au séchage (0–0.4)

    public ColorInfo ToColorInfo() => new(
        Convert.ToInt32(Hex.Substring(1,2), 16),
        Convert.ToInt32(Hex.Substring(3,2), 16),
        Convert.ToInt32(Hex.Substring(5,2), 16));
}

public class PaintBrand
{
    public string    Name      { get; set; } = "";
    public PaintMode Mode      { get; set; } = PaintMode.Opaque;
    public List<PaintColor> Colors { get; set; } = new();
}

// ─── Mixing Results ───────────────────────────────────────────────────────────
public class MixComponent
{
    public PaintColor Paint { get; set; } = new();
    public double     Ratio { get; set; }           // 0–100 %
    public double     Water { get; set; } = 0;      // aquarelle : ratio eau (0–100 %)
}

public class MixFormula
{
    public List<MixComponent> Components { get; set; } = new();
    public string ResultHex    { get; set; } = "#000000";
    public string DriedHex     { get; set; } = "#000000"; // aquarelle : couleur après séchage
    public double DeltaE       { get; set; }
    public double WaterRatio   { get; set; } = 0;         // dilution globale aquarelle
}

public class MixResult
{
    public MixFormula Mix2 { get; set; } = new();
    public MixFormula Mix3 { get; set; } = new();
}
