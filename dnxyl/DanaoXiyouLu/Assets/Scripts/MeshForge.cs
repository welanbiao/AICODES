using System;
using System.Collections.Generic;
using UnityEngine;

public static class MeshForge
{
    static readonly Dictionary<string, Mesh> Cache = new Dictionary<string, Mesh>();

    public static Mesh Get(string key, Func<Mesh> make)
    {
        Mesh m;
        if (Cache.TryGetValue(key, out m) && m != null) return m;
        m = make();
        m.name = key;
        Cache[key] = m;
        return m;
    }

    public static Mesh Sphere(int lon = 36, int lat = 22)
    {
        return Get("sph" + lon + "x" + lat, () => BuildSphere(lon, lat, null));
    }

    public static Mesh Capsule(int segs = 24, int rings = 10)
    {
        return Get("cap" + segs + "x" + rings, () => BuildCapsule(segs, rings));
    }

    public static Mesh Cylinder(int segs = 24)
    {
        return Get("cyl" + segs, () => BuildCylinder(segs, true));
    }

    public static Mesh Crystal()
    {
        return Get("crystal", BuildCrystal);
    }

    public static Mesh Flame()
    {
        return Get("flame", () => Lathe(new[]
        {
            new Vector2(0.00f, -0.50f),
            new Vector2(0.18f, -0.42f),
            new Vector2(0.38f, -0.18f),
            new Vector2(0.42f, 0.05f),
            new Vector2(0.28f, 0.28f),
            new Vector2(0.14f, 0.48f),
            new Vector2(0.00f, 0.62f)
        }, 20));
    }

    public static Mesh Drop()
    {
        return Get("drop", () => Lathe(new[]
        {
            new Vector2(0.00f, -0.45f),
            new Vector2(0.22f, -0.38f),
            new Vector2(0.40f, -0.10f),
            new Vector2(0.38f, 0.18f),
            new Vector2(0.22f, 0.38f),
            new Vector2(0.00f, 0.50f)
        }, 24));
    }

    public static Mesh WukongHead()
    {
        return Get("wkHead3", () => BuildSphere(44, 30, WarpHead));
    }

    public static Mesh WukongHairCap()
    {
        return Get("wkHair3", () => BuildSphere(32, 18, WarpHairCap));
    }

    public static Mesh Peach()
    {
        return Get("peach", () => BuildSphere(22, 16, p =>
        {
            p.x *= 1.08f;
            p.z *= 1.02f;
            p.y *= 0.96f;
            float crease = Mathf.Exp(-p.x * p.x * 55f) * Mathf.Max(0f, p.y);
            p.x *= 1f - crease * 0.18f;
            if (p.y > 0.25f) p *= 0.92f;
            return p * 0.5f;
        }));
    }

    public static Mesh Gourd()
    {
        return Get("gourd", () => Lathe(new[]
        {
            new Vector2(0.00f, -0.50f),
            new Vector2(0.28f, -0.42f),
            new Vector2(0.38f, -0.18f),
            new Vector2(0.16f, 0.02f),
            new Vector2(0.28f, 0.22f),
            new Vector2(0.24f, 0.40f),
            new Vector2(0.00f, 0.50f)
        }, 20));
    }

    public static Mesh Ear()
    {
        return Get("ear", () => BuildSphere(16, 12, p =>
        {
            p.x *= 0.55f;
            p.y *= 1.15f;
            p.z *= 0.35f;
            if (p.y > 0.2f) p.y += 0.08f;
            return p * 0.5f;
        }));
    }

    public static Mesh Robe(bool wide)
    {
        string k = wide ? "robeW" : "robeN";
        return Get(k, () => Lathe(wide
            ? new[]
            {
                new Vector2(0.10f, 0.92f),
                new Vector2(0.16f, 0.82f),
                new Vector2(0.26f, 0.62f),
                new Vector2(0.30f, 0.38f),
                new Vector2(0.34f, 0.12f),
                new Vector2(0.42f, -0.18f),
                new Vector2(0.50f, -0.42f)
            }
            : new[]
            {
                new Vector2(0.12f, 0.78f),
                new Vector2(0.22f, 0.58f),
                new Vector2(0.26f, 0.32f),
                new Vector2(0.28f, 0.08f),
                new Vector2(0.30f, -0.18f)
            }, 28));
    }

    public static Mesh Sleeve()
    {
        return Get("sleeve", () => Lathe(new[]
        {
            new Vector2(0.06f, 0.22f),
            new Vector2(0.10f, 0.08f),
            new Vector2(0.14f, -0.06f),
            new Vector2(0.18f, -0.22f)
        }, 16));
    }

    public static Mesh Torso()
    {
        return Get("torso2", () => Lathe(new[]
        {
            new Vector2(0.11f, 0.44f),
            new Vector2(0.22f, 0.36f),
            new Vector2(0.24f, 0.20f),
            new Vector2(0.20f, 0.04f),
            new Vector2(0.17f, -0.12f),
            new Vector2(0.14f, -0.22f)
        }, 26));
    }

    public static Mesh StaffPole()
    {
        return Get("staff", () => BuildCylinder(18, false));
    }

    public static Mesh Strand()
    {
        return Get("strand", () => BuildTaper(8, 10, 0.5f, 0.08f, 1f));
    }

    public static Mesh Tail()
    {
        return Get("tail", () => BuildTaper(10, 12, 0.5f, 0.12f, 1.2f));
    }

    public static Mesh BeastBody()
    {
        return Get("beast", () => Lathe(new[]
        {
            new Vector2(0.00f, -0.55f),
            new Vector2(0.18f, -0.48f),
            new Vector2(0.32f, -0.22f),
            new Vector2(0.36f, 0.05f),
            new Vector2(0.30f, 0.32f),
            new Vector2(0.18f, 0.48f),
            new Vector2(0.00f, 0.55f)
        }, 20));
    }

    public static Mesh Golem()
    {
        return Get("golem", () => BuildSphere(16, 12, p =>
        {
            float n = Mathf.PerlinNoise(p.x * 3.1f + 2f, p.y * 3.1f) * 0.18f;
            return p * (0.5f + n) + new Vector3(0, 0, n * 0.1f);
        }));
    }

    public static Mesh Peak()
    {
        return Get("peak4", () => BuildPeak(40, 22));
    }

    public static Mesh FetusEgg()
    {
        return Get("fetusEgg", () => BuildSphere(40, 30, WarpEgg));
    }

    public static Mesh FetusBody()
    {
        return Get("fetusBody", () => BuildSphere(28, 20, WarpFetus));
    }

    public static Mesh Quad()
    {
        return Get("quad", BuildQuad);
    }

    static Vector3 WarpEgg(Vector3 p)
    {
        Vector3 v = new Vector3(p.x * 0.70f, p.y * 1.20f, p.z * 0.78f);
        float t = Mathf.Clamp01((v.y + 0.6f) / 1.2f);
        float r = Mathf.Lerp(1.14f, 0.68f, t * t);
        v.x *= r;
        v.z *= r;
        if (v.z > 0f && v.y < 0.12f) v.z += 0.07f * (0.35f - Mathf.Abs(v.y));
        return v * 0.5f;
    }

    static Vector3 WarpFetus(Vector3 p)
    {
        float curl = 0.16f * Mathf.Sin((p.y + 1f) * 1.7f);
        Vector3 v = new Vector3(p.x * 0.40f, p.y * 0.58f + curl * 0.35f, p.z * 0.36f + curl + 0.08f);
        v.y -= 0.04f;
        return v * 0.5f;
    }

    static Vector3 WarpHead(Vector3 p)
    {
        float peach = 1f + 0.14f * Mathf.Exp(-p.y * p.y * 4.2f) - 0.22f * Mathf.Max(0f, -p.y - 0.12f);
        Vector3 v = new Vector3(p.x * 0.82f * peach, p.y * 1.06f, p.z * 0.84f);
        float front = Mathf.Max(0f, v.z);
        float nose = Mathf.Exp(-v.x * v.x * 140f - (v.y + 0.05f) * (v.y + 0.05f) * 85f) * front;
        v += new Vector3(0f, -0.008f, 0.048f) * nose;
        float cheek = Mathf.Exp(-Mathf.Pow(Mathf.Abs(v.x) - 0.26f, 2f) * 26f - (v.y + 0.02f) * (v.y + 0.02f) * 16f) * front;
        v += new Vector3(Mathf.Sign(v.x + 0.0001f) * 0.038f, -0.006f, 0.016f) * cheek;
        float brow = Mathf.Exp(-Mathf.Pow(Mathf.Abs(v.x) - 0.13f, 2f) * 60f - Mathf.Pow(v.y - 0.24f, 2f) * 90f) * front;
        v += new Vector3(0f, 0.016f, 0.018f) * brow;
        float socket = Mathf.Exp(-Mathf.Pow(Mathf.Abs(v.x) - 0.15f, 2f) * 80f - Mathf.Pow(v.y - 0.08f, 2f) * 110f) * front;
        v.z -= socket * 0.028f;
        float chin = Mathf.Exp(-v.x * v.x * 36f - Mathf.Pow(v.y + 0.50f, 2f) * 36f) * front;
        v += new Vector3(0f, -0.04f, 0.02f) * chin;
        if (v.z < 0f) v.z *= 0.86f;
        return v * 0.48f;
    }

    static Vector3 WarpHairCap(Vector3 p)
    {
        if (p.z > 0.02f && p.y < 0.22f) p *= 0.06f;
        p.y = Mathf.Max(p.y, 0.02f);
        p.x *= 1.08f;
        p.z = p.z < 0f ? p.z * 1.18f : p.z * 0.88f;
        p.y *= 0.78f;
        p.y += 0.15f;
        return p * 0.50f;
    }

    static Mesh BuildSphere(int lon, int lat, Func<Vector3, Vector3> warp)
    {
        var verts = new List<Vector3>();
        var nrm = new List<Vector3>();
        var uv = new List<Vector2>();
        var tris = new List<int>();
        for (int y = 0; y <= lat; y++)
        {
            float v = y / (float)lat;
            float ay = Mathf.PI * v;
            float sy = Mathf.Sin(ay);
            float cy = Mathf.Cos(ay);
            for (int x = 0; x <= lon; x++)
            {
                float u = x / (float)lon;
                float ax = u * Mathf.PI * 2f;
                Vector3 p = new Vector3(Mathf.Cos(ax) * sy, cy, Mathf.Sin(ax) * sy);
                Vector3 w = warp != null ? warp(p) : p * 0.5f;
                verts.Add(w);
                nrm.Add(w.normalized);
                uv.Add(new Vector2(u, 1f - v));
            }
        }
        int cols = lon + 1;
        for (int y = 0; y < lat; y++)
        for (int x = 0; x < lon; x++)
        {
            int i = y * cols + x;
            tris.Add(i);
            tris.Add(i + cols);
            tris.Add(i + 1);
            tris.Add(i + 1);
            tris.Add(i + cols);
            tris.Add(i + cols + 1);
        }
        return Finish(verts, nrm, uv, tris);
    }

    static Mesh BuildCapsule(int segs, int rings)
    {
        var verts = new List<Vector3>();
        var uv = new List<Vector2>();
        var tris = new List<int>();
        int rows = rings * 2 + 2;
        for (int y = 0; y <= rows; y++)
        {
            float t = y / (float)rows;
            float py;
            float r;
            if (t < 0.25f)
            {
                float a = t / 0.25f * Mathf.PI * 0.5f;
                py = 0.5f + Mathf.Cos(a) * 0.5f;
                r = Mathf.Sin(a) * 0.5f;
            }
            else if (t > 0.75f)
            {
                float a = (t - 0.75f) / 0.25f * Mathf.PI * 0.5f;
                py = -0.5f - Mathf.Sin(a) * 0.5f;
                r = Mathf.Cos(a) * 0.5f;
            }
            else
            {
                py = Mathf.Lerp(0.5f, -0.5f, (t - 0.25f) / 0.5f);
                r = 0.5f;
            }
            for (int x = 0; x <= segs; x++)
            {
                float u = x / (float)segs;
                float ax = u * Mathf.PI * 2f;
                verts.Add(new Vector3(Mathf.Cos(ax) * r, py, Mathf.Sin(ax) * r));
                uv.Add(new Vector2(u, t));
            }
        }
        int cols = segs + 1;
        for (int y = 0; y < rows; y++)
        for (int x = 0; x < segs; x++)
        {
            int i = y * cols + x;
            tris.Add(i);
            tris.Add(i + 1);
            tris.Add(i + cols);
            tris.Add(i + 1);
            tris.Add(i + cols + 1);
            tris.Add(i + cols);
        }
        return Finish(verts, null, uv, tris);
    }

    static Mesh BuildCylinder(int segs, bool caps)
    {
        var verts = new List<Vector3>();
        var uv = new List<Vector2>();
        var tris = new List<int>();
        for (int y = 0; y <= 1; y++)
        {
            float py = y == 0 ? -0.5f : 0.5f;
            for (int x = 0; x <= segs; x++)
            {
                float u = x / (float)segs;
                float a = u * Mathf.PI * 2f;
                verts.Add(new Vector3(Mathf.Cos(a) * 0.5f, py, Mathf.Sin(a) * 0.5f));
                uv.Add(new Vector2(u, y));
            }
        }
        int cols = segs + 1;
        for (int x = 0; x < segs; x++)
        {
            tris.Add(x);
            tris.Add(x + 1);
            tris.Add(x + cols);
            tris.Add(x + 1);
            tris.Add(x + cols + 1);
            tris.Add(x + cols);
        }
        if (caps)
        {
            int top = verts.Count;
            verts.Add(new Vector3(0, 0.5f, 0));
            uv.Add(new Vector2(0.5f, 0.5f));
            int bot = verts.Count;
            verts.Add(new Vector3(0, -0.5f, 0));
            uv.Add(new Vector2(0.5f, 0.5f));
            for (int x = 0; x < segs; x++)
            {
                tris.Add(top);
                tris.Add(cols + x + 1);
                tris.Add(cols + x);
                tris.Add(bot);
                tris.Add(x);
                tris.Add(x + 1);
            }
        }
        return Finish(verts, null, uv, tris);
    }

    static Mesh BuildTaper(int segs, int stacks, float r0, float r1, float len)
    {
        var verts = new List<Vector3>();
        var uv = new List<Vector2>();
        var tris = new List<int>();
        for (int y = 0; y <= stacks; y++)
        {
            float t = y / (float)stacks;
            float r = Mathf.Lerp(r0, r1, t) * 0.5f;
            float py = Mathf.Lerp(0f, -len, t);
            for (int x = 0; x <= segs; x++)
            {
                float u = x / (float)segs;
                float a = u * Mathf.PI * 2f;
                verts.Add(new Vector3(Mathf.Cos(a) * r, py, Mathf.Sin(a) * r));
                uv.Add(new Vector2(u, t));
            }
        }
        int cols = segs + 1;
        for (int y = 0; y < stacks; y++)
        for (int x = 0; x < segs; x++)
        {
            int i = y * cols + x;
            tris.Add(i);
            tris.Add(i + 1);
            tris.Add(i + cols);
            tris.Add(i + 1);
            tris.Add(i + cols + 1);
            tris.Add(i + cols);
        }
        return Finish(verts, null, uv, tris);
    }

    public static Mesh Lathe(Vector2[] profile, int segs)
    {
        var verts = new List<Vector3>();
        var uv = new List<Vector2>();
        var tris = new List<int>();
        int rows = profile.Length;
        for (int y = 0; y < rows; y++)
        {
            float v = y / (float)(rows - 1);
            for (int x = 0; x <= segs; x++)
            {
                float u = x / (float)segs;
                float a = u * Mathf.PI * 2f;
                float r = profile[y].x;
                verts.Add(new Vector3(Mathf.Cos(a) * r, profile[y].y, Mathf.Sin(a) * r));
                uv.Add(new Vector2(u, v));
            }
        }
        int cols = segs + 1;
        for (int y = 0; y < rows - 1; y++)
        for (int x = 0; x < segs; x++)
        {
            int i = y * cols + x;
            tris.Add(i);
            tris.Add(i + cols);
            tris.Add(i + 1);
            tris.Add(i + 1);
            tris.Add(i + cols);
            tris.Add(i + cols + 1);
        }
        return Finish(verts, null, uv, tris);
    }

    static Mesh BuildCrystal()
    {
        var verts = new List<Vector3>();
        var uv = new List<Vector2>();
        var tris = new List<int>();
        Vector3[] tips =
        {
            new Vector3(0, 0.62f, 0),
            new Vector3(0, -0.55f, 0)
        };
        int sides = 6;
        var ring = new Vector3[sides];
        for (int i = 0; i < sides; i++)
        {
            float a = i / (float)sides * Mathf.PI * 2f + 0.2f;
            ring[i] = new Vector3(Mathf.Cos(a) * 0.28f, (i % 2) * 0.06f, Mathf.Sin(a) * 0.22f);
        }
        int Add(Vector3 p) { verts.Add(p); uv.Add(new Vector2(p.x + 0.5f, p.y + 0.5f)); return verts.Count - 1; }
        int t0 = Add(tips[0]);
        int t1 = Add(tips[1]);
        var ri = new int[sides];
        for (int i = 0; i < sides; i++) ri[i] = Add(ring[i]);
        for (int i = 0; i < sides; i++)
        {
            int n = (i + 1) % sides;
            tris.Add(t0); tris.Add(ri[n]); tris.Add(ri[i]);
            tris.Add(t1); tris.Add(ri[i]); tris.Add(ri[n]);
        }
        return Finish(verts, null, uv, tris);
    }

    static Mesh BuildPeak(int segs, int stacks)
    {
        var verts = new List<Vector3>();
        var uv = new List<Vector2>();
        var tris = new List<int>();
        for (int y = 0; y <= stacks; y++)
        {
            float v = y / (float)stacks;
            float baseR = Mathf.Lerp(0.52f, 0.016f, Mathf.Pow(v, 0.82f));
            for (int x = 0; x <= segs; x++)
            {
                float u = x / (float)segs;
                float a = u * Mathf.PI * 2f;
                float n = Mathf.PerlinNoise(Mathf.Cos(a) * 2.4f + 3.1f, v * 5.2f);
                float ridge = Mathf.Abs(Mathf.Sin(a * 3.5f + v * 2f)) * 0.09f * (1f - v);
                float r = baseR * (1f + n * 0.24f + ridge);
                verts.Add(new Vector3(Mathf.Cos(a) * r, v, Mathf.Sin(a) * r));
                uv.Add(new Vector2(u * 3f, v * 2.2f));
            }
        }
        int cols = segs + 1;
        for (int y = 0; y < stacks; y++)
        for (int x = 0; x < segs; x++)
        {
            int i = y * cols + x;
            tris.Add(i);
            tris.Add(i + cols);
            tris.Add(i + 1);
            tris.Add(i + 1);
            tris.Add(i + cols);
            tris.Add(i + cols + 1);
        }
        return Finish(verts, null, uv, tris);
    }

    static Mesh BuildQuad()
    {
        var verts = new List<Vector3>
        {
            new Vector3(-0.5f, 0f, -0.5f),
            new Vector3(0.5f, 0f, -0.5f),
            new Vector3(0.5f, 0f, 0.5f),
            new Vector3(-0.5f, 0f, 0.5f)
        };
        var uv = new List<Vector2>
        {
            new Vector2(0, 0), new Vector2(1, 0), new Vector2(1, 1), new Vector2(0, 1)
        };
        var tris = new List<int> { 0, 2, 1, 0, 3, 2, 0, 1, 2, 0, 2, 3 };
        return Finish(verts, null, uv, tris);
    }

    static Mesh Finish(List<Vector3> verts, List<Vector3> nrm, List<Vector2> uv, List<int> tris)
    {
        var m = new Mesh();
        m.SetVertices(verts);
        m.SetUVs(0, uv);
        m.SetTriangles(tris, 0);
        if (nrm != null && nrm.Count == verts.Count) m.SetNormals(nrm);
        else m.RecalculateNormals();
        m.RecalculateBounds();
        m.RecalculateTangents();
        return m;
    }
}
