namespace ColorMixer.Models;

/// <summary>
/// Moteur de mélange unifié — opaque (Kubelka-Munk) et aquarelle (transparent + dilution).
/// </summary>
public static class MixingEngine
{
    private const int StepCount  = 20;
    private const int StepCount3 = 10;

    public static MixResult Compute(ColorInfo target, List<PaintColor> palette, PaintMode mode, double waterRatio = 0)
    {
        return new MixResult
        {
            Mix2 = mode == PaintMode.Watercolor
                ? BestMix2Watercolor(target, palette, waterRatio)
                : BestMix2Opaque(target, palette),
            Mix3 = mode == PaintMode.Watercolor
                ? BestMix3Watercolor(target, palette, waterRatio)
                : BestMix3Opaque(target, palette),
        };
    }

    // ══════════════════════════════════════════════════════════════════════════
    // OPAQUE — Kubelka-Munk simplifié en lumière linéaire
    // ══════════════════════════════════════════════════════════════════════════

    private static MixFormula BestMix2Opaque(ColorInfo target, List<PaintColor> palette)
    {
        MixFormula best = new() { DeltaE = double.MaxValue };
        for (int i = 0; i < palette.Count - 1; i++)
        for (int j = i + 1; j < palette.Count; j++)
        {
            var ci = palette[i].ToColorInfo();
            var cj = palette[j].ToColorInfo();
            double bestR = 0.5, bestDE = double.MaxValue;
            for (int s = 0; s <= StepCount; s++)
            {
                double r = s / (double)StepCount;
                double de = target.DeltaE(BlendOpaque(ci, cj, r));
                if (de < bestDE) { bestDE = de; bestR = r; }
            }
            bestR = TernarySearch(r => target.DeltaE(BlendOpaque(ci, cj, r)),
                                  Math.Max(0, bestR - 0.1), Math.Min(1, bestR + 0.1), 30);
            var mix = BlendOpaque(ci, cj, bestR);
            double de2 = target.DeltaE(mix);
            if (de2 < best.DeltaE)
                best = MakeFormula2(mix, de2, palette[i], (1-bestR)*100, palette[j], bestR*100);
        }
        return best;
    }

    private static MixFormula BestMix3Opaque(ColorInfo target, List<PaintColor> palette)
    {
        MixFormula best = new() { DeltaE = double.MaxValue };
        for (int i = 0; i < palette.Count - 2; i++)
        for (int j = i + 1; j < palette.Count - 1; j++)
        for (int k = j + 1; k < palette.Count; k++)
        {
            var ci = palette[i].ToColorInfo();
            var cj = palette[j].ToColorInfo();
            var ck = palette[k].ToColorInfo();
            double bestA = 1/3.0, bestB = 1/3.0, bestDE = double.MaxValue;
            for (int ai = 0; ai <= StepCount3; ai++)
            for (int bi = 0; bi <= StepCount3 - ai; bi++)
            {
                double a = ai/(double)StepCount3, b = bi/(double)StepCount3, c = 1-a-b;
                if (c < 0) continue;
                double de = target.DeltaE(BlendOpaqueThree(ci, cj, ck, a, b, c));
                if (de < bestDE) { bestDE = de; bestA = a; bestB = b; }
            }
            double bestC = 1 - bestA - bestB;
            var mix = BlendOpaqueThree(ci, cj, ck, bestA, bestB, bestC);
            double de2 = target.DeltaE(mix);
            if (de2 < best.DeltaE)
                best = MakeFormula3(mix, de2,
                    palette[i], bestA*100, palette[j], bestB*100, palette[k], bestC*100);
        }
        return best;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // AQUARELLE — mélange transparent sur fond blanc + facteur séchage
    // ══════════════════════════════════════════════════════════════════════════

    private static MixFormula BestMix2Watercolor(ColorInfo target, List<PaintColor> palette, double waterRatio)
    {
        MixFormula best = new() { DeltaE = double.MaxValue };
        // Compenser le séchage : on cherche à correspondre à la couleur mouillée
        // qui donnera la couleur cible une fois sèche
        var wetTarget = WetFromDried(target, palette, waterRatio);

        for (int i = 0; i < palette.Count - 1; i++)
        for (int j = i + 1; j < palette.Count; j++)
        {
            var ci = palette[i].ToColorInfo();
            var cj = palette[j].ToColorInfo();
            double bestR = 0.5, bestDE = double.MaxValue;
            for (int s = 0; s <= StepCount; s++)
            {
                double r = s / (double)StepCount;
                var wet = BlendWatercolor(ci, cj, r, waterRatio);
                double de = wetTarget.DeltaE(wet);
                if (de < bestDE) { bestDE = de; bestR = r; }
            }
            bestR = TernarySearch(r => wetTarget.DeltaE(BlendWatercolor(ci, cj, r, waterRatio)),
                                  Math.Max(0, bestR - 0.1), Math.Min(1, bestR + 0.1), 30);

            var mixWet  = BlendWatercolor(ci, cj, bestR, waterRatio);
            var mixDry  = ApplyDrying(mixWet, AverageDrying(palette[i], palette[j], bestR), waterRatio);
            double finalDE = target.DeltaE(mixDry);

            if (finalDE < best.DeltaE)
            {
                best = MakeFormula2(mixWet, finalDE, palette[i], (1-bestR)*100, palette[j], bestR*100);
                best.DriedHex  = mixDry.Hex;
                best.WaterRatio = waterRatio;
            }
        }
        return best;
    }

    private static MixFormula BestMix3Watercolor(ColorInfo target, List<PaintColor> palette, double waterRatio)
    {
        MixFormula best = new() { DeltaE = double.MaxValue };
        var wetTarget = WetFromDried(target, palette, waterRatio);

        for (int i = 0; i < palette.Count - 2; i++)
        for (int j = i + 1; j < palette.Count - 1; j++)
        for (int k = j + 1; k < palette.Count; k++)
        {
            var ci = palette[i].ToColorInfo();
            var cj = palette[j].ToColorInfo();
            var ck = palette[k].ToColorInfo();
            double bestA = 1/3.0, bestB = 1/3.0, bestDE = double.MaxValue;
            for (int ai = 0; ai <= StepCount3; ai++)
            for (int bi = 0; bi <= StepCount3 - ai; bi++)
            {
                double a = ai/(double)StepCount3, b = bi/(double)StepCount3, c = 1-a-b;
                if (c < 0) continue;
                var wet = BlendWatercolorThree(ci, cj, ck, a, b, c, waterRatio);
                double de = wetTarget.DeltaE(wet);
                if (de < bestDE) { bestDE = de; bestA = a; bestB = b; }
            }
            double bestC = 1 - bestA - bestB;
            var mixWet = BlendWatercolorThree(ci, cj, ck, bestA, bestB, bestC, waterRatio);
            double df  = AverageDryingThree(palette[i], palette[j], palette[k], bestA, bestB, bestC);
            var mixDry = ApplyDrying(mixWet, df, waterRatio);
            double finalDE = target.DeltaE(mixDry);

            if (finalDE < best.DeltaE)
            {
                best = MakeFormula3(mixWet, finalDE,
                    palette[i], bestA*100, palette[j], bestB*100, palette[k], bestC*100);
                best.DriedHex  = mixDry.Hex;
                best.WaterRatio = waterRatio;
            }
        }
        return best;
    }

    // ══════════════════════════════════════════════════════════════════════════
    // Fonctions de mélange
    // ══════════════════════════════════════════════════════════════════════════

    /// Mélange opaque Kubelka-Munk en lumière linéaire. t=0→a, t=1→b
    private static ColorInfo BlendOpaque(ColorInfo a, ColorInfo b, double t)
    {
        double Mix(int ca, int cb) => Math.Pow((1-t)*Math.Pow(ca/255.0, 2.2) + t*Math.Pow(cb/255.0, 2.2), 1/2.2) * 255;
        return new((int)Math.Round(Mix(a.R,b.R)), (int)Math.Round(Mix(a.G,b.G)), (int)Math.Round(Mix(a.B,b.B)));
    }

    private static ColorInfo BlendOpaqueThree(ColorInfo a, ColorInfo b, ColorInfo c, double wa, double wb, double wc)
    {
        double Mix(int ca, int cb, int cc) =>
            Math.Pow(wa*Math.Pow(ca/255.0,2.2) + wb*Math.Pow(cb/255.0,2.2) + wc*Math.Pow(cc/255.0,2.2), 1/2.2) * 255;
        return new((int)Math.Round(Mix(a.R,b.R,c.R)), (int)Math.Round(Mix(a.G,b.G,c.G)), (int)Math.Round(Mix(a.B,b.B,c.B)));
    }

    /// Mélange aquarelle transparent : superposition sur fond blanc avec dilution à l'eau.
    /// Plus on ajoute d'eau, plus le fond blanc transparaît.
    private static ColorInfo BlendWatercolor(ColorInfo a, ColorInfo b, double t, double waterRatio)
    {
        // Mélange des pigments (soustractif en linéaire)
        double MixPig(int ca, int cb) =>
            Math.Pow((1-t)*Math.Pow(ca/255.0, 2.2) + t*Math.Pow(cb/255.0, 2.2), 1/2.2) * 255;
        var pig = new ColorInfo((int)Math.Round(MixPig(a.R,b.R)), (int)Math.Round(MixPig(a.G,b.G)), (int)Math.Round(MixPig(a.B,b.B)));

        // Dilution : mélange avec le blanc du papier (255,255,255)
        double w = waterRatio / 100.0;
        return new(
            (int)Math.Round(pig.R + (255 - pig.R) * w),
            (int)Math.Round(pig.G + (255 - pig.G) * w),
            (int)Math.Round(pig.B + (255 - pig.B) * w));
    }

    private static ColorInfo BlendWatercolorThree(ColorInfo a, ColorInfo b, ColorInfo c, double wa, double wb, double wc, double waterRatio)
    {
        double MixPig(int ca, int cb, int cc) =>
            Math.Pow(wa*Math.Pow(ca/255.0,2.2) + wb*Math.Pow(cb/255.0,2.2) + wc*Math.Pow(cc/255.0,2.2), 1/2.2) * 255;
        var pig = new ColorInfo(
            (int)Math.Round(MixPig(a.R,b.R,c.R)),
            (int)Math.Round(MixPig(a.G,b.G,c.G)),
            (int)Math.Round(MixPig(a.B,b.B,c.B)));
        double w = waterRatio / 100.0;
        return new(
            (int)Math.Round(pig.R + (255 - pig.R) * w),
            (int)Math.Round(pig.G + (255 - pig.G) * w),
            (int)Math.Round(pig.B + (255 - pig.B) * w));
    }

    /// Applique l'éclaircissement au séchage (la couleur s'éclaircit).
    private static ColorInfo ApplyDrying(ColorInfo wet, double dryingFactor, double waterRatio)
    {
        double totalFactor = dryingFactor + (waterRatio / 100.0) * 0.15; // l'eau amplifie l'éclaircissement
        totalFactor = Math.Min(totalFactor, 0.5);
        return new(
            (int)Math.Round(wet.R + (255 - wet.R) * totalFactor),
            (int)Math.Round(wet.G + (255 - wet.G) * totalFactor),
            (int)Math.Round(wet.B + (255 - wet.B) * totalFactor));
    }

    /// Estime la couleur mouillée qui donnera la couleur cible après séchage.
    private static ColorInfo WetFromDried(ColorInfo dried, List<PaintColor> palette, double waterRatio)
    {
        double avgDry = palette.Average(p => p.DryingFactor);
        double factor = avgDry + (waterRatio / 100.0) * 0.15;
        factor = Math.Min(factor, 0.5);
        // Inverser l'éclaircissement : color_wet = (color_dried - factor*255) / (1 - factor)
        int Invert(int d) => (int)Math.Clamp(Math.Round((d - factor * 255) / (1 - factor)), 0, 255);
        return new(Invert(dried.R), Invert(dried.G), Invert(dried.B));
    }

    private static double AverageDrying(PaintColor a, PaintColor b, double t) =>
        (1-t) * a.DryingFactor + t * b.DryingFactor;

    private static double AverageDryingThree(PaintColor a, PaintColor b, PaintColor c, double wa, double wb, double wc) =>
        wa * a.DryingFactor + wb * b.DryingFactor + wc * c.DryingFactor;

    // ══════════════════════════════════════════════════════════════════════════
    // Helpers
    // ══════════════════════════════════════════════════════════════════════════

    private static MixFormula MakeFormula2(ColorInfo mix, double de, PaintColor p1, double r1, PaintColor p2, double r2) =>
        new() { ResultHex = mix.Hex, DriedHex = mix.Hex, DeltaE = de,
            Components = new() { new() { Paint=p1, Ratio=r1 }, new() { Paint=p2, Ratio=r2 } } };

    private static MixFormula MakeFormula3(ColorInfo mix, double de, PaintColor p1, double r1, PaintColor p2, double r2, PaintColor p3, double r3) =>
        new() { ResultHex = mix.Hex, DriedHex = mix.Hex, DeltaE = de,
            Components = new() { new(){Paint=p1,Ratio=r1}, new(){Paint=p2,Ratio=r2}, new(){Paint=p3,Ratio=r3} } };

    private static double TernarySearch(Func<double,double> f, double lo, double hi, int n)
    {
        for (int i = 0; i < n; i++)
        {
            double m1 = lo + (hi-lo)/3, m2 = hi - (hi-lo)/3;
            if (f(m1) < f(m2)) hi = m2; else lo = m1;
        }
        return (lo+hi)/2;
    }
}
