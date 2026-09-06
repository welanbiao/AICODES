using System.Collections.Generic;
using UnityEngine;

public static class CutoutPrep
{
    public static Texture2D Run(Texture2D src)
    {
        if (src == null) return null;
        if (src.name != null && src.name.EndsWith("_cutout")) return src;
        Texture2D t = Copy(src);
        Punch(t);
        Defringe(t, 3);
        BleedRgbIntoClear(t);
        t.name = (src.name ?? "art") + "_cutout";
        t.wrapMode = TextureWrapMode.Clamp;
        t.filterMode = FilterMode.Bilinear;
        t.anisoLevel = 4;
        return CropAlpha(t);
    }

    public static Texture2D RunSun(Texture2D src)
    {
        if (src == null) return null;
        if (src.name != null && src.name.EndsWith("_sunround")) return src;
        Texture2D t = Copy(src);
        Punch(t);
        t = CircleCrop(t);
        t.name = (src.name ?? "sun") + "_sunround";
        t.wrapMode = TextureWrapMode.Clamp;
        t.filterMode = FilterMode.Bilinear;
        t.anisoLevel = 4;
        return t;
    }

    public static Texture2D RunNamed(Texture2D src, string fileName)
    {
        if (src == null) return null;
        if (!string.IsNullOrEmpty(fileName) && fileName.IndexOf("太阳") >= 0)
            return RunSun(src);
        return Run(src);
    }

    static Texture2D CircleCrop(Texture2D tex)
    {
        int w = tex.width;
        int h = tex.height;
        Color[] px = tex.GetPixels();
        int left = w, right = 0, top = h, bot = 0;
        double cxAcc = 0, cyAcc = 0, wAcc = 0;
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                float a = px[y * w + x].a;
                if (a < 0.18f) continue;
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bot) bot = y;
                cxAcc += x * a;
                cyAcc += y * a;
                wAcc += a;
            }
        }
        if (wAcc < 8f) return tex;
        float cx = (float)(cxAcc / wAcc);
        float cy = (float)(cyAcc / wAcc);
        float bw = right - left + 1;
        float bh = bot - top + 1;
        float r = Mathf.Min(bw, bh) * 0.5f;
        r = Mathf.Min(r, cx - left + 0.5f, right - cx + 0.5f, cy - top + 0.5f, bot - cy + 0.5f);
        r = Mathf.Max(8f, r - 1.25f);
        int size = Mathf.Max(16, Mathf.CeilToInt(r * 2f) + 2);
        var dst = new Texture2D(size, size, TextureFormat.RGBA32, false);
        var np = new Color[size * size];
        float feather = 1.6f;
        float ox = cx - (size - 1) * 0.5f;
        float oy = cy - (size - 1) * 0.5f;
        for (int y = 0; y < size; y++)
        {
            for (int x = 0; x < size; x++)
            {
                float sx = ox + x;
                float sy = oy + y;
                int ix = Mathf.Clamp(Mathf.FloorToInt(sx), 0, w - 1);
                int iy = Mathf.Clamp(Mathf.FloorToInt(sy), 0, h - 1);
                Color c = px[iy * w + ix];
                float dx = x - (size - 1) * 0.5f;
                float dy = y - (size - 1) * 0.5f;
                float d = Mathf.Sqrt(dx * dx + dy * dy);
                float a = 1f - Mathf.Clamp01((d - (r - feather)) / feather);
                c.a *= a;
                if (c.a < 0.02f) c = Color.clear;
                np[y * size + x] = c;
            }
        }
        dst.SetPixels(np);
        dst.Apply(false, false);
        dst.wrapMode = TextureWrapMode.Clamp;
        dst.filterMode = FilterMode.Bilinear;
        return dst;
    }

    public static Texture2D RunPortrait(Texture2D src)
    {
        if (src == null) return null;
        if (src.name != null && src.name.EndsWith("_pcut")) return src;
        Texture2D t = Copy(src);
        Color bg = SampleCornerBg(t);
        PunchNearBg(t, bg, 0.075f);
        PeelHalo(t, bg, 5, 0.17f);
        Defringe(t, 2);
        BleedRgbIntoClear(t);
        t.name = (src.name ?? "wk") + "_pcut";
        t.wrapMode = TextureWrapMode.Clamp;
        t.filterMode = FilterMode.Bilinear;
        t.anisoLevel = 4;
        return CropAlpha(t);
    }

    static Color SampleCornerBg(Texture2D tex)
    {
        int w = tex.width;
        int h = tex.height;
        int s = Mathf.Max(2, Mathf.Min(w, h) / 28);
        Color[] px = tex.GetPixels();
        Color acc = Color.clear;
        int n = 0;
        System.Action<int, int> add = (x0, y0) =>
        {
            for (int y = y0; y < y0 + s; y++)
            {
                for (int x = x0; x < x0 + s; x++)
                {
                    if ((uint)x >= (uint)w || (uint)y >= (uint)h) continue;
                    acc += px[y * w + x];
                    n++;
                }
            }
        };
        add(0, 0);
        add(w - s, 0);
        add(0, h - s);
        add(w - s, h - s);
        if (n == 0) return Color.white;
        acc /= n;
        acc.a = 1f;
        return acc;
    }

    static float DistBg(Color c, Color bg)
    {
        float dr = Mathf.Abs(c.r - bg.r);
        float dg = Mathf.Abs(c.g - bg.g);
        float db = Mathf.Abs(c.b - bg.b);
        return Mathf.Max(dr, Mathf.Max(dg, db));
    }

    static void PunchNearBg(Texture2D tex, Color bg, float tol)
    {
        int w = tex.width;
        int h = tex.height;
        Color[] px = tex.GetPixels();
        var seen = new bool[px.Length];
        var q = new Queue<int>();
        System.Action<int, int> enq = (x, y) =>
        {
            if ((uint)x >= (uint)w || (uint)y >= (uint)h) return;
            int i = y * w + x;
            if (seen[i]) return;
            if (px[i].a > 0.04f && DistBg(px[i], bg) > tol) return;
            seen[i] = true;
            q.Enqueue(i);
        };
        for (int x = 0; x < w; x++)
        {
            enq(x, 0);
            enq(x, h - 1);
        }
        for (int y = 0; y < h; y++)
        {
            enq(0, y);
            enq(w - 1, y);
        }
        while (q.Count > 0)
        {
            int i = q.Dequeue();
            px[i] = Color.clear;
            int x = i % w;
            int y = i / w;
            enq(x + 1, y);
            enq(x - 1, y);
            enq(x, y + 1);
            enq(x, y - 1);
        }
        tex.SetPixels(px);
        tex.Apply(false, false);
    }

    static void PeelHalo(Texture2D tex, Color bg, int passes, float tol)
    {
        int w = tex.width;
        int h = tex.height;
        Color[] px = tex.GetPixels();
        for (int pass = 0; pass < passes; pass++)
        {
            Color[] next = (Color[])px.Clone();
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    int i = y * w + x;
                    if (px[i].a < 0.08f) { next[i] = Color.clear; continue; }
                    bool edge = false;
                    for (int oy = -1; oy <= 1 && !edge; oy++)
                    {
                        for (int ox = -1; ox <= 1; ox++)
                        {
                            if (ox == 0 && oy == 0) continue;
                            int nx = x + ox;
                            int ny = y + oy;
                            if ((uint)nx >= (uint)w || (uint)ny >= (uint)h) { edge = true; break; }
                            if (px[ny * w + nx].a < 0.12f) { edge = true; break; }
                        }
                    }
                    if (edge && DistBg(px[i], bg) < tol)
                        next[i] = Color.clear;
                }
            }
            px = next;
        }
        tex.SetPixels(px);
        tex.Apply(false, false);
    }

    static Texture2D CropAlpha(Texture2D tex)
    {
        int w = tex.width;
        int h = tex.height;
        Color[] px = tex.GetPixels();
        int left = w, right = 0, top = h, bot = 0;
        bool any = false;
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                if (px[y * w + x].a < 0.16f) continue;
                any = true;
                if (x < left) left = x;
                if (x > right) right = x;
                if (y < top) top = y;
                if (y > bot) bot = y;
            }
        }
        if (!any) return tex;
        int pad = 2;
        left = Mathf.Max(0, left - pad);
        top = Mathf.Max(0, top - pad);
        right = Mathf.Min(w - 1, right + pad);
        bot = Mathf.Min(h - 1, bot + pad);
        int nw = right - left + 1;
        int nh = bot - top + 1;
        if (nw >= w - 1 && nh >= h - 1) return tex;
        if (nw < 8 || nh < 8) return tex;
        var cropped = new Texture2D(nw, nh, TextureFormat.RGBA32, false);
        var np = new Color[nw * nh];
        for (int y = 0; y < nh; y++)
        {
            int src = (top + y) * w + left;
            int dst = y * nw;
            for (int x = 0; x < nw; x++)
                np[dst + x] = px[src + x];
        }
        cropped.SetPixels(np);
        cropped.Apply(false, false);
        cropped.name = tex.name;
        cropped.wrapMode = TextureWrapMode.Clamp;
        cropped.filterMode = FilterMode.Bilinear;
        return cropped;
    }

    static Texture2D Copy(Texture2D src)
    {
        int w = src.width;
        int h = src.height;
        var dst = new Texture2D(w, h, TextureFormat.RGBA32, false);
        if (src.isReadable)
        {
            dst.SetPixels(src.GetPixels());
            dst.Apply(false, false);
            return dst;
        }
        RenderTexture rt = RenderTexture.GetTemporary(w, h, 0, RenderTextureFormat.ARGB32);
        Graphics.Blit(src, rt);
        RenderTexture prev = RenderTexture.active;
        RenderTexture.active = rt;
        dst.ReadPixels(new Rect(0, 0, w, h), 0, 0, false);
        dst.Apply(false, false);
        RenderTexture.active = prev;
        RenderTexture.ReleaseTemporary(rt);
        return dst;
    }

    static bool IsPaper(Color c)
    {
        if (c.a < 0.04f) return true;
        float lum = c.r * 0.30f + c.g * 0.50f + c.b * 0.20f;
        float chroma = Mathf.Max(c.r, Mathf.Max(c.g, c.b)) - Mathf.Min(c.r, Mathf.Min(c.g, c.b));
        return lum > 0.82f && chroma < 0.20f;
    }

    static void Punch(Texture2D tex)
    {
        int w = tex.width;
        int h = tex.height;
        Color[] px = tex.GetPixels();
        var seen = new bool[px.Length];
        var q = new Queue<int>();
        System.Action<int, int> enq = (x, y) =>
        {
            if ((uint)x >= (uint)w || (uint)y >= (uint)h) return;
            int i = y * w + x;
            if (seen[i] || !IsPaper(px[i])) return;
            seen[i] = true;
            q.Enqueue(i);
        };
        for (int x = 0; x < w; x++)
        {
            enq(x, 0);
            enq(x, h - 1);
        }
        for (int y = 0; y < h; y++)
        {
            enq(0, y);
            enq(w - 1, y);
        }
        if (q.Count == 0) return;
        while (q.Count > 0)
        {
            int i = q.Dequeue();
            px[i] = Color.clear;
            int x = i % w;
            int y = i / w;
            enq(x + 1, y);
            enq(x - 1, y);
            enq(x, y + 1);
            enq(x, y - 1);
        }
        tex.SetPixels(px);
        tex.Apply(false, false);
    }

    static void Defringe(Texture2D tex, int passes)
    {
        int w = tex.width;
        int h = tex.height;
        Color[] px = tex.GetPixels();
        for (int pass = 0; pass < passes; pass++)
        {
            Color[] next = (Color[])px.Clone();
            for (int y = 0; y < h; y++)
            {
                for (int x = 0; x < w; x++)
                {
                    int i = y * w + x;
                    if (px[i].a < 0.08f)
                    {
                        next[i] = Color.clear;
                        continue;
                    }
                    bool edge = false;
                    for (int oy = -1; oy <= 1 && !edge; oy++)
                    {
                        for (int ox = -1; ox <= 1; ox++)
                        {
                            if (ox == 0 && oy == 0) continue;
                            int nx = x + ox;
                            int ny = y + oy;
                            if ((uint)nx >= (uint)w || (uint)ny >= (uint)h) { edge = true; break; }
                            if (px[ny * w + nx].a < 0.12f) { edge = true; break; }
                        }
                    }
                    if (!edge) continue;
                    Color c = px[i];
                    float lum = c.r * 0.30f + c.g * 0.50f + c.b * 0.20f;
                    float chroma = Mathf.Max(c.r, Mathf.Max(c.g, c.b)) - Mathf.Min(c.r, Mathf.Min(c.g, c.b));
                    if (lum > 0.68f && chroma < 0.34f)
                    {
                        next[i] = Color.clear;
                        continue;
                    }
                    float whiteMix = Mathf.Clamp01((lum - 0.42f) / 0.48f) * Mathf.Clamp01((0.38f - chroma) / 0.38f);
                    if (whiteMix > 0.12f)
                    {
                        float keep = 1f - whiteMix * 0.92f;
                        if (keep < 0.22f) { next[i] = Color.clear; continue; }
                        next[i] = new Color(
                            Mathf.Clamp01((c.r - whiteMix) / (keep + 0.0001f)),
                            Mathf.Clamp01((c.g - whiteMix) / (keep + 0.0001f)),
                            Mathf.Clamp01((c.b - whiteMix) / (keep + 0.0001f)),
                            c.a * keep);
                    }
                }
            }
            px = next;
        }
        tex.SetPixels(px);
        tex.Apply(false, false);
    }

    static void BleedRgbIntoClear(Texture2D tex)
    {
        int w = tex.width;
        int h = tex.height;
        Color[] px = tex.GetPixels();
        Color[] next = (Color[])px.Clone();
        for (int y = 0; y < h; y++)
        {
            for (int x = 0; x < w; x++)
            {
                int i = y * w + x;
                if (px[i].a >= 0.08f)
                {
                    if (px[i].a < 0.12f) next[i] = Color.clear;
                    continue;
                }
                Color acc = Color.clear;
                int n = 0;
                for (int oy = -1; oy <= 1; oy++)
                {
                    for (int ox = -1; ox <= 1; ox++)
                    {
                        int nx = x + ox;
                        int ny = y + oy;
                        if ((uint)nx >= (uint)w || (uint)ny >= (uint)h) continue;
                        Color s = px[ny * w + nx];
                        if (s.a < 0.35f) continue;
                        acc.r += s.r;
                        acc.g += s.g;
                        acc.b += s.b;
                        n++;
                    }
                }
                if (n > 0)
                    next[i] = new Color(acc.r / n, acc.g / n, acc.b / n, 0f);
                else
                    next[i] = Color.clear;
            }
        }
        tex.SetPixels(next);
        tex.Apply(false, false);
    }
}
