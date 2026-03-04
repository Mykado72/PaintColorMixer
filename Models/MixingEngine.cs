namespace ColorMixer.Models;

/// <summary>
/// Finds the best 2-color and 3-color paint mixes using subtractive (pigment) mixing in CIE Lab space.
/// Ratios are searched via a step grid and refined with golden-section search.
/// </summary>
public static class MixingEngine
{
    private const int StepCount = 20;  // grid resolution for brute-force stage

    public static MixResult Compute(ColorInfo target, List<PaintColor> palette)
    {
        return new MixResult
        {
            Mix2 = BestMix2(target, palette),
            Mix3 = BestMix3(target, palette),
        };
    }

    // ─── 2-color ──────────────────────────────────────────────────────────────
    private static MixFormula BestMix2(ColorInfo target, List<PaintColor> palette)
    {
        MixFormula best = new() { DeltaE = double.MaxValue };

        for (int i = 0; i < palette.Count - 1; i++)
        for (int j = i + 1; j < palette.Count; j++)
        {
            var ci = palette[i].ToColorInfo();
            var cj = palette[j].ToColorInfo();

            // Find best ratio by grid then refine
            double bestR = 0.5;
            double bestDE = double.MaxValue;

            for (int step = 0; step <= StepCount; step++)
            {
                double r = step / (double)StepCount;
                var mixed = BlendColors(ci, cj, r);
                double de = target.DeltaE(mixed);
                if (de < bestDE) { bestDE = de; bestR = r; }
            }

            // Ternary search refinement
            bestR = TernarySearch(r =>
            {
                var m = BlendColors(ci, cj, r);
                return target.DeltaE(m);
            }, Math.Max(0, bestR - 0.1), Math.Min(1, bestR + 0.1), 30);

            var finalMix = BlendColors(ci, cj, bestR);
            double finalDE = target.DeltaE(finalMix);

            if (finalDE < best.DeltaE)
            {
                best = new MixFormula
                {
                    ResultHex  = finalMix.Hex,
                    DeltaE     = finalDE,
                    Components = new List<MixComponent>
                    {
                        new() { Paint = palette[i], Ratio = (1-bestR)*100 },
                        new() { Paint = palette[j], Ratio = bestR*100 },
                    }
                };
            }
        }
        return best;
    }

    // ─── 3-color ──────────────────────────────────────────────────────────────
    private static MixFormula BestMix3(ColorInfo target, List<PaintColor> palette)
    {
        MixFormula best = new() { DeltaE = double.MaxValue };
        const int step3 = 10; // coarser for 3-color to keep complexity manageable

        for (int i = 0; i < palette.Count - 2; i++)
        for (int j = i + 1; j < palette.Count - 1; j++)
        for (int k = j + 1; k < palette.Count; k++)
        {
            var ci = palette[i].ToColorInfo();
            var cj = palette[j].ToColorInfo();
            var ck = palette[k].ToColorInfo();

            double bestDE = double.MaxValue;
            double bestA  = 1.0/3, bestB = 1.0/3;

            for (int ai = 0; ai <= step3; ai++)
            for (int bi = 0; bi <= step3 - ai; bi++)
            {
                double a = ai / (double)step3;
                double b = bi / (double)step3;
                double c = 1.0 - a - b;
                if (c < 0) continue;

                var mixed = BlendThree(ci, cj, ck, a, b, c);
                double de  = target.DeltaE(mixed);
                if (de < bestDE) { bestDE = de; bestA = a; bestB = b; }
            }

            double bestC = 1.0 - bestA - bestB;
            var finalMix = BlendThree(ci, cj, ck, bestA, bestB, bestC);
            double finalDE = target.DeltaE(finalMix);

            if (finalDE < best.DeltaE)
            {
                best = new MixFormula
                {
                    ResultHex  = finalMix.Hex,
                    DeltaE     = finalDE,
                    Components = new List<MixComponent>
                    {
                        new() { Paint = palette[i], Ratio = bestA  * 100 },
                        new() { Paint = palette[j], Ratio = bestB  * 100 },
                        new() { Paint = palette[k], Ratio = bestC  * 100 },
                    }
                };
            }
        }
        return best;
    }

    // ─── Color Blending (subtractive / KM approximation in linear RGB) ────────
    /// <summary>
    /// Kubelka-Munk simplified: mix in linear light, then gamma-encode.
    /// t=0 → colorA,  t=1 → colorB
    /// </summary>
    private static ColorInfo BlendColors(ColorInfo a, ColorInfo b, double t)
    {
        // Work in linear light (approximate)
        double ra = Math.Pow(a.R / 255.0, 2.2);
        double ga = Math.Pow(a.G / 255.0, 2.2);
        double ba2 = Math.Pow(a.B / 255.0, 2.2);

        double rb = Math.Pow(b.R / 255.0, 2.2);
        double gb = Math.Pow(b.G / 255.0, 2.2);
        double bb2 = Math.Pow(b.B / 255.0, 2.2);

        double r = Math.Pow((1-t)*ra + t*rb, 1/2.2);
        double g = Math.Pow((1-t)*ga + t*gb, 1/2.2);
        double bl = Math.Pow((1-t)*ba2 + t*bb2, 1/2.2);

        return new ColorInfo(
            (int)Math.Round(r * 255),
            (int)Math.Round(g * 255),
            (int)Math.Round(bl * 255));
    }

    private static ColorInfo BlendThree(ColorInfo a, ColorInfo b, ColorInfo c, double wa, double wb, double wc)
    {
        double ra  = Math.Pow(a.R/255.0, 2.2);
        double ga  = Math.Pow(a.G/255.0, 2.2);
        double ba2 = Math.Pow(a.B/255.0, 2.2);
        double rb  = Math.Pow(b.R/255.0, 2.2);
        double gb  = Math.Pow(b.G/255.0, 2.2);
        double bb2 = Math.Pow(b.B/255.0, 2.2);
        double rc  = Math.Pow(c.R/255.0, 2.2);
        double gc  = Math.Pow(c.G/255.0, 2.2);
        double bc2 = Math.Pow(c.B/255.0, 2.2);

        double r  = Math.Pow(wa*ra  + wb*rb  + wc*rc,  1/2.2);
        double g  = Math.Pow(wa*ga  + wb*gb  + wc*gc,  1/2.2);
        double bl = Math.Pow(wa*ba2 + wb*bb2 + wc*bc2, 1/2.2);

        return new ColorInfo(
            (int)Math.Round(r  * 255),
            (int)Math.Round(g  * 255),
            (int)Math.Round(bl * 255));
    }

    // ─── Ternary search for 1D optimisation ──────────────────────────────────
    private static double TernarySearch(Func<double,double> f, double lo, double hi, int iters)
    {
        for (int i = 0; i < iters; i++)
        {
            double m1 = lo + (hi - lo) / 3;
            double m2 = hi - (hi - lo) / 3;
            if (f(m1) < f(m2)) hi = m2;
            else                lo = m1;
        }
        return (lo + hi) / 2;
    }
}
