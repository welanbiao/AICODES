using System.Collections.Generic;
using UnityEngine;

public static class ArtLoader
{
    static readonly Dictionary<string, Texture2D> Cache = new Dictionary<string, Texture2D>();

    public static void ClearCache()
    {
        Cache.Clear();
    }

    public static Texture2D Load(string fileName)
    {
        Texture2D t;
        if (Cache.TryGetValue(fileName, out t) && t != null)
        {
            if (t.name != null && t.name.EndsWith("_pcut")) return t;
            t = CutoutPrep.RunPortrait(t);
            Cache[fileName] = t;
            return t;
        }
        t = LoadFromResources(fileName);
        if (t != null)
        {
            t = CutoutPrep.RunPortrait(t);
            t.wrapMode = TextureWrapMode.Clamp;
            t.filterMode = FilterMode.Bilinear;
            Cache[fileName] = t;
            return t;
        }
#if UNITY_WEBGL && !UNITY_EDITOR
        return null;
#else
        string[] names = Aliases(fileName);
        string data = Application.dataPath;
        string[] roots =
        {
            System.IO.Path.GetFullPath(System.IO.Path.Combine(data, "..", "..")),
            System.IO.Path.GetFullPath(System.IO.Path.Combine(data, "..")),
            System.IO.Path.Combine(data, "Resources", "Tex"),
            Application.streamingAssetsPath
        };
        var paths = new List<string>();
        for (int r = 0; r < roots.Length; r++)
        {
            if (string.IsNullOrEmpty(roots[r])) continue;
            for (int n = 0; n < names.Length; n++)
                paths.Add(System.IO.Path.Combine(roots[r], names[n]));
        }
        for (int i = 0; i < paths.Count; i++)
        {
            if (string.IsNullOrEmpty(paths[i]) || !System.IO.File.Exists(paths[i])) continue;
            t = new Texture2D(2, 2, TextureFormat.RGBA32, true);
            t.LoadImage(System.IO.File.ReadAllBytes(paths[i]));
            t = CutoutPrep.RunPortrait(t);
            t.wrapMode = TextureWrapMode.Clamp;
            t.filterMode = FilterMode.Bilinear;
            t.anisoLevel = 4;
            Cache[fileName] = t;
            return t;
        }
        return null;
#endif
    }

    static Texture2D LoadFromResources(string fileName)
    {
        string[] keys = ResourceKeys(fileName);
        for (int i = 0; i < keys.Length; i++)
        {
            var t = Resources.Load<Texture2D>(keys[i]);
            if (t != null) return t;
        }
        return null;
    }

    static string[] ResourceKeys(string fileName)
    {
        if (fileName == "孙悟空.jpg" || fileName == "孙悟空2.jpg")
            return new[] { "Art/wukong2", "Art/孙悟空2" };
        if (fileName.IndexOf("3") >= 0)
            return new[] { "Art/wukong3", "Art/孙悟空3" };
        if (fileName.IndexOf("4") >= 0)
            return new[] { "Art/wukong4", "Art/孙悟空4" };
        if (fileName.IndexOf("5") >= 0)
            return new[] { "Art/wukong5", "Art/孙悟空5" };
        if (fileName.IndexOf("太阳") >= 0)
            return new[] { "Art/sun", "Tex/tex_sun" };
        if (fileName.IndexOf("五彩石") >= 0)
            return new[] { "Art/wucaishi", "Tex/tex_fetus_stone" };
        if (fileName.IndexOf("五彩山") >= 0)
            return new[] { "Art/wucaishan", "Tex/tex_mountain" };
        return new[] { "Art/" + System.IO.Path.GetFileNameWithoutExtension(fileName) };
    }

    public static Material Billboard(string key, string fileName)
    {
        Texture2D t = Load(fileName);
        var m = Mats.Picture(key, t, false);
        if (m != null && t != null)
        {
            m.SetTexture("_MainTex", t);
            if (m.HasProperty("_Cutoff")) m.SetFloat("_Cutoff", 0.16f);
        }
        return m;
    }

    static string[] Aliases(string fileName)
    {
        if (fileName == "孙悟空.jpg" || fileName == "孙悟空2.jpg")
            return new[] { "孙悟空.jpg", "孙悟空2.jpg", "孙悟空.JPG", "孙悟空2.JPG", "孙悟空2.Jpg" };
        if (fileName.IndexOf("3") >= 0)
            return new[] { "孙悟空3.jpg", "孙悟空3.Jpg", "孙悟空3.JPG", "孙悟空3.jpeg" };
        if (fileName.IndexOf("4") >= 0)
            return new[] { "孙悟空4.jpg", "孙悟空4.Jpg", "孙悟空4.JPG", "孙悟空4.jpeg" };
        if (fileName.IndexOf("5") >= 0)
            return new[] { "孙悟空5.jpg", "孙悟空5.Jpg", "孙悟空5.JPG", "孙悟空5.jpeg" };
        return new[] { fileName };
    }

    static bool IsPaper(Color c)
    {
        if (c.a < 0.06f) return true;
        float lum = c.r * 0.30f + c.g * 0.50f + c.b * 0.20f;
        float chroma = Mathf.Max(c.r, Mathf.Max(c.g, c.b)) - Mathf.Min(c.r, Mathf.Min(c.g, c.b));
        return lum > 0.88f && chroma < 0.12f;
    }

    static bool IsBorderInk(Color c)
    {
        if (c.a < 0.06f) return true;
        if (IsPaper(c)) return true;
        float lum = c.r * 0.30f + c.g * 0.50f + c.b * 0.20f;
        float chroma = Mathf.Max(c.r, Mathf.Max(c.g, c.b)) - Mathf.Min(c.r, Mathf.Min(c.g, c.b));
        return lum < 0.22f && chroma < 0.12f;
    }

    static bool RowIsBorder(Color[] px, int w, int y)
    {
        int n = 0;
        int row = y * w;
        for (int x = 0; x < w; x++)
            if (IsBorderInk(px[row + x])) n++;
        return n > w * 0.88f;
    }

    static bool ColIsBorder(Color[] px, int w, int h, int x)
    {
        int n = 0;
        for (int y = 0; y < h; y++)
            if (IsBorderInk(px[y * w + x])) n++;
        return n > h * 0.88f;
    }

    static Texture2D CleanPortrait(Texture2D tex)
    {
        int w = tex.width;
        int h = tex.height;
        if (w < 16 || h < 16) return tex;
        Color[] px;
        try { px = tex.GetPixels(); }
        catch { return tex; }

        int maxCrop = Mathf.Max(8, Mathf.Min(w, h) / 6);
        int top = 0, bot = h - 1, left = 0, right = w - 1;
        while (top < maxCrop && top < bot && RowIsBorder(px, w, top)) top++;
        while (h - 1 - bot < maxCrop && bot > top && RowIsBorder(px, w, bot)) bot--;
        while (left < maxCrop && left < right && ColIsBorder(px, w, h, left)) left++;
        while (w - 1 - right < maxCrop && right > left && ColIsBorder(px, w, h, right)) right--;

        var seen = new bool[px.Length];
        var q = new Queue<int>();
        System.Action<int, int> enq = (x, y) =>
        {
            if ((uint)x >= (uint)w || (uint)y >= (uint)h) return;
            if (x < left || x > right || y < top || y > bot) return;
            int i = y * w + x;
            if (seen[i] || !IsPaper(px[i])) return;
            seen[i] = true;
            q.Enqueue(i);
        };
        for (int x = left; x <= right; x++)
        {
            enq(x, top);
            enq(x, bot);
        }
        for (int y = top; y <= bot; y++)
        {
            enq(left, y);
            enq(right, y);
        }
        while (q.Count > 0)
        {
            int i = q.Dequeue();
            px[i] = new Color(0f, 0f, 0f, 0f);
            int x = i % w;
            int y = i / w;
            enq(x + 1, y);
            enq(x - 1, y);
            enq(x, y + 1);
            enq(x, y - 1);
        }

        int nw0 = right - left + 1;
        int nh0 = bot - top + 1;
        int band = Mathf.Max(6, Mathf.Min(nw0, nh0) / 18);
        System.Action<int, int> enqInk = (x, y) =>
        {
            if ((uint)x >= (uint)w || (uint)y >= (uint)h) return;
            if (x < left || x > right || y < top || y > bot) return;
            bool near = x <= left + band || x >= right - band || y <= top + band || y >= bot - band;
            if (!near) return;
            int i = y * w + x;
            if (seen[i] || !IsBorderInk(px[i])) return;
            seen[i] = true;
            q.Enqueue(i);
        };
        for (int x = left; x <= right; x++)
        {
            enqInk(x, top);
            enqInk(x, bot);
        }
        for (int y = top; y <= bot; y++)
        {
            enqInk(left, y);
            enqInk(right, y);
        }
        while (q.Count > 0)
        {
            int i = q.Dequeue();
            px[i] = new Color(0f, 0f, 0f, 0f);
            int x = i % w;
            int y = i / w;
            enqInk(x + 1, y);
            enqInk(x - 1, y);
            enqInk(x, y + 1);
            enqInk(x, y - 1);
        }

        int nw = right - left + 1;
        int nh = bot - top + 1;
        if (nw < 16 || nh < 16)
        {
            tex.SetPixels(px);
            tex.Apply(true, false);
            return tex;
        }
        var cropped = new Texture2D(nw, nh, TextureFormat.RGBA32, true);
        var np = new Color[nw * nh];
        for (int y = 0; y < nh; y++)
        {
            int src = (top + y) * w + left;
            int dst = y * nw;
            for (int x = 0; x < nw; x++)
                np[dst + x] = px[src + x];
        }
        cropped.SetPixels(np);
        cropped.Apply(true, false);
        cropped.wrapMode = TextureWrapMode.Clamp;
        cropped.filterMode = FilterMode.Bilinear;
        return cropped;
    }
}
