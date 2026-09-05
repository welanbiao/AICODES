using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;

public static class Danao
{
    public static readonly string[] WuXingNames = { "金", "木", "水", "火", "土" };
    public static readonly Color[] WuXing =
    {
        new Color(1.00f, 0.84f, 0.28f),
        new Color(0.28f, 0.88f, 0.42f),
        new Color(0.28f, 0.72f, 1.00f),
        new Color(1.00f, 0.38f, 0.18f),
        new Color(0.78f, 0.52f, 0.28f)
    };

    public static readonly string[] StageNames =
    {
        "补天五彩石",
        "花果山小灵猴",
        "出海寻仙",
        "方寸山外门",
        "方寸山问道"
    };

    public static readonly string[] BreakTitles =
    {
        "石破天惊 · 灵猴出世",
        "水帘洞天 · 洞府自成",
        "乘槎破浪 · 方寸在望",
        "粗布换霞 · 道袍将成",
        "金身问道 · 学成出师"
    };

    public static Color Gold = new Color(1f, 0.82f, 0.28f);
    public static Color Fur = new Color(0.86f, 0.58f, 0.16f);
    public static Color Hair = new Color(0.98f, 0.78f, 0.18f);
    public static Color Skin = new Color(1.00f, 0.80f, 0.66f);
    public static Color Cloth = new Color(0.72f, 0.62f, 0.46f);
    public static Color Robe = new Color(0.12f, 0.42f, 0.40f);
    public static Color Trim = new Color(0.95f, 0.78f, 0.28f);

    public static Transform Node(Transform parent, string name, Vector3 local)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        go.transform.localPosition = local;
        go.transform.localRotation = Quaternion.identity;
        go.transform.localScale = Vector3.one;
        return go.transform;
    }

    public static MeshRenderer Prim(Transform parent, string name, PrimitiveType type, Vector3 pos, Vector3 scale, Quaternion rot, Material mat)
    {
        var go = GameObject.CreatePrimitive(type);
        go.name = name;
        Object.Destroy(go.GetComponent<Collider>());
        go.transform.SetParent(parent, false);
        go.transform.localPosition = pos;
        go.transform.localRotation = rot;
        go.transform.localScale = scale;
        var r = go.GetComponent<MeshRenderer>();
        r.sharedMaterial = mat;
        r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
        return r;
    }

    public static MeshRenderer Prim(Transform parent, string name, PrimitiveType type, Vector3 pos, Vector3 scale, Material mat)
    {
        return Prim(parent, name, type, pos, scale, Quaternion.identity, mat);
    }

    public static MeshRenderer Mesh(Transform parent, string name, UnityEngine.Mesh mesh, Vector3 pos, Vector3 scale, Quaternion rot, Material mat)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        go.transform.localPosition = pos;
        go.transform.localRotation = rot;
        go.transform.localScale = scale;
        go.AddComponent<MeshFilter>().sharedMesh = mesh;
        var r = go.AddComponent<MeshRenderer>();
        r.sharedMaterial = mat;
        r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.On;
        return r;
    }

    public static MeshRenderer Mesh(Transform parent, string name, UnityEngine.Mesh mesh, Vector3 pos, Vector3 scale, Material mat)
    {
        return Mesh(parent, name, mesh, pos, scale, Quaternion.identity, mat);
    }

    public static Light Glow(Transform parent, Color c, float intensity, float range)
    {
        var t = Node(parent, "glow", Vector3.up * 0.4f);
        var l = t.gameObject.AddComponent<Light>();
        l.type = LightType.Point;
        l.color = c;
        l.intensity = intensity;
        l.range = range;
        l.shadows = LightShadows.None;
        return l;
    }

    public static TextMesh Label3D(Transform parent, string name, string text, Vector3 pos, float size, Color color)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        go.transform.localPosition = pos;
        go.transform.localRotation = Quaternion.Euler(12f, 180f, 0f);
        var tm = go.AddComponent<TextMesh>();
        tm.text = text;
        tm.font = Fonts.Cjk();
        tm.fontSize = 64;
        tm.characterSize = size;
        tm.anchor = TextAnchor.MiddleCenter;
        tm.alignment = TextAlignment.Center;
        tm.color = color;
        tm.fontStyle = FontStyle.Bold;
        var r = go.GetComponent<MeshRenderer>();
        if (r != null)
        {
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            if (tm.font != null && tm.font.material != null)
                r.sharedMaterial = tm.font.material;
        }
        go.AddComponent<FaceCam>();
        return tm;
    }
}

public static class Fonts
{
    static Font _cjk;

    public static Font Cjk()
    {
        if (_cjk != null) return _cjk;
        _cjk = Font.CreateDynamicFontFromOSFont(new[]
        {
            "Microsoft YaHei",
            "Microsoft YaHei UI",
            "SimHei",
            "PingFang SC",
            "Noto Sans CJK SC",
            "Source Han Sans SC",
            "Arial Unicode MS",
            "Arial"
        }, 28);
        return _cjk;
    }
}

public static class Tex
{
    static Texture2D _white;
    static Texture2D _soft;
    static Texture2D _noise;
    static readonly Dictionary<int, Texture2D> Cache = new Dictionary<int, Texture2D>();
    static readonly Dictionary<string, Texture2D> Files = new Dictionary<string, Texture2D>();

    public static Texture2D Res(string name, Texture2D fallback)
    {
        Texture2D t;
        if (Files.TryGetValue(name, out t) && t != null) return t;
        t = Resources.Load<Texture2D>(name);
        if (t == null)
        {
            string path = Application.dataPath + "/Resources/" + name + ".png";
            if (System.IO.File.Exists(path))
            {
                t = new Texture2D(2, 2, TextureFormat.RGBA32, true);
                t.LoadImage(System.IO.File.ReadAllBytes(path));
                t.wrapMode = TextureWrapMode.Repeat;
                t.filterMode = FilterMode.Bilinear;
                t.anisoLevel = 4;
            }
        }
        if (t == null) return fallback;
        Files[name] = t;
        return t;
    }

    public static Texture2D SunArt()
    {
        Texture2D t;
        if (Files.TryGetValue("sunArt", out t) && t != null) return t;
        byte[] bytes = null;
        string[] paths =
        {
            System.IO.Path.GetFullPath(System.IO.Path.Combine(Application.dataPath, "..", "3.png")),
            System.IO.Path.GetFullPath(System.IO.Path.Combine(Application.dataPath, "..", "3.PNG")),
            Application.dataPath + "/Resources/Tex/tex_sun.png"
        };
        for (int i = 0; i < paths.Length; i++)
        {
            if (System.IO.File.Exists(paths[i]))
            {
                bytes = System.IO.File.ReadAllBytes(paths[i]);
                break;
            }
        }
        if (bytes != null)
        {
            t = new Texture2D(2, 2, TextureFormat.RGBA32, true);
            t.LoadImage(bytes);
            PunchPaper(t);
            t.wrapMode = TextureWrapMode.Clamp;
            t.filterMode = FilterMode.Bilinear;
            t.anisoLevel = 4;
            Files["sunArt"] = t;
            return t;
        }
        return Res("Tex/tex_sun", Soft);
    }

    static void PunchPaper(Texture2D tex)
    {
        Color[] px = tex.GetPixels();
        for (int i = 0; i < px.Length; i++)
        {
            Color c = px[i];
            float lum = c.r * 0.30f + c.g * 0.50f + c.b * 0.20f;
            float chroma = Mathf.Max(c.r, Mathf.Max(c.g, c.b)) - Mathf.Min(c.r, Mathf.Min(c.g, c.b));
            if (lum > 0.86f && chroma < 0.12f)
            {
                c.r = 0f;
                c.g = 0f;
                c.b = 0f;
                c.a = 0f;
                px[i] = c;
            }
        }
        tex.SetPixels(px);
        tex.Apply(true, false);
    }

    public static Texture2D White
    {
        get
        {
            if (_white != null) return _white;
            _white = new Texture2D(2, 2, TextureFormat.RGBA32, false);
            _white.SetPixels(new[] { Color.white, Color.white, Color.white, Color.white });
            _white.Apply();
            return _white;
        }
    }

    public static Texture2D Soft
    {
        get
        {
            if (_soft != null) return _soft;
            _soft = new Texture2D(64, 64, TextureFormat.RGBA32, false);
            for (int y = 0; y < 64; y++)
            for (int x = 0; x < 64; x++)
            {
                float dx = (x - 31.5f) / 31.5f;
                float dy = (y - 31.5f) / 31.5f;
                float a = Mathf.Clamp01(1f - Mathf.Sqrt(dx * dx + dy * dy));
                a = a * a;
                _soft.SetPixel(x, y, new Color(1, 1, 1, a));
            }
            _soft.Apply();
            return _soft;
        }
    }

    public static Texture2D Noise
    {
        get
        {
            if (_noise != null) return _noise;
            _noise = new Texture2D(128, 128, TextureFormat.RGBA32, true);
            for (int y = 0; y < 128; y++)
            for (int x = 0; x < 128; x++)
            {
                float n = Mathf.PerlinNoise(x * 0.11f, y * 0.11f);
                float n2 = Mathf.PerlinNoise(x * 0.37f + 8, y * 0.37f);
                float v = 0.55f + n * 0.35f + n2 * 0.12f;
                _noise.SetPixel(x, y, new Color(v, v * 0.92f, v * 0.75f, 1));
            }
            _noise.Apply();
            return _noise;
        }
    }

    public static Texture2D Gradient(Color a, Color b, bool vertical, int id)
    {
        if (Cache.ContainsKey(id)) return Cache[id];
        var t = new Texture2D(32, 32, TextureFormat.RGBA32, false);
        for (int y = 0; y < 32; y++)
        for (int x = 0; x < 32; x++)
        {
            float k = vertical ? y / 31f : x / 31f;
            t.SetPixel(x, y, Color.Lerp(a, b, k));
        }
        t.wrapMode = TextureWrapMode.Clamp;
        t.Apply();
        Cache[id] = t;
        return t;
    }

    public static Texture2D FacePortrait(int form)
    {
        int id = 900 + form;
        if (Cache.ContainsKey(id)) return Cache[id];
        var t = new Texture2D(128, 128, TextureFormat.RGBA32, false);
        Color bg = new Color(0.18f, 0.08f, 0.22f, 0);
        Color skin = Danao.Skin;
        Color hair = Danao.Hair;
        for (int y = 0; y < 128; y++)
        for (int x = 0; x < 128; x++)
        {
            float nx = (x - 64) / 64f;
            float ny = (y - 64) / 64f;
            Color c = bg;
            if (form == 1)
            {
                float r = Mathf.Sqrt(nx * nx * 0.7f + ny * ny);
                if (r < 0.72f)
                {
                    float ang = Mathf.Atan2(ny, nx);
                    int k = Mathf.FloorToInt(((ang + Mathf.PI) / (Mathf.PI * 2f)) * 5f) % 5;
                    c = Color.Lerp(Danao.WuXing[k], Color.white, 0.15f + Mathf.PerlinNoise(x * 0.08f, y * 0.08f) * 0.2f);
                    c.a = 1;
                }
            }
            else
            {
                if (nx * nx + (ny - 0.18f) * (ny - 0.18f) < 0.42f) { c = hair; c.a = 1; }
                if (nx * nx * 1.05f + (ny + 0.06f) * (ny + 0.06f) * 1.25f < 0.28f) { c = skin; c.a = 1; }
                float le = (nx + 0.11f) * (nx + 0.11f) + (ny - 0.02f) * (ny - 0.02f);
                float re = (nx - 0.11f) * (nx - 0.11f) + (ny - 0.02f) * (ny - 0.02f);
                if (le < 0.012f || re < 0.012f) { c = Color.white; c.a = 1; }
                if (le < 0.005f || re < 0.005f) { c = new Color(0.85f, 0.55f, 0.08f); c.a = 1; }
                if (nx * nx + (ny + 0.12f) * (ny + 0.12f) < 0.004f) { c = new Color(0.55f, 0.22f, 0.18f); c.a = 1; }
                if (form >= 5 && ny > 0.28f && Mathf.Abs(nx) < 0.22f) { c = Danao.Trim; c.a = 1; }
            }
            t.SetPixel(x, y, c);
        }
        t.Apply();
        Cache[id] = t;
        return t;
    }

    public static Texture2D Ground(int stage)
    {
        int id = 100 + stage;
        if (Cache.ContainsKey(id)) return Cache[id];
        var t = new Texture2D(128, 128, TextureFormat.RGBA32, true);
        for (int y = 0; y < 128; y++)
        for (int x = 0; x < 128; x++)
        {
            float n = Mathf.PerlinNoise(x * 0.07f + stage * 3.1f, y * 0.07f);
            Color c;
            switch (stage)
            {
                case 1:
                    int band = (x / 25) % 5;
                    c = Color.Lerp(Danao.WuXing[band], Color.white, n * 0.25f);
                    break;
                case 2:
                    c = Color.Lerp(new Color(0.22f, 0.48f, 0.18f), new Color(0.42f, 0.28f, 0.12f), n);
                    break;
                case 3:
                    c = Color.Lerp(new Color(0.08f, 0.28f, 0.52f), new Color(0.25f, 0.62f, 0.78f), n);
                    break;
                case 4:
                    c = Color.Lerp(new Color(0.32f, 0.34f, 0.30f), new Color(0.55f, 0.48f, 0.36f), n);
                    break;
                default:
                    c = Color.Lerp(new Color(0.78f, 0.72f, 0.55f), new Color(1f, 0.88f, 0.45f), n);
                    break;
            }
            t.SetPixel(x, y, c);
        }
        t.wrapMode = TextureWrapMode.Repeat;
        t.Apply();
        Cache[id] = t;
        return t;
    }

    public static Texture2D Skin
    {
        get
        {
            if (Cache.ContainsKey(501)) return Cache[501];
            var t = new Texture2D(256, 256, TextureFormat.RGBA32, true);
            for (int y = 0; y < 256; y++)
            for (int x = 0; x < 256; x++)
            {
                float n = Mathf.PerlinNoise(x * 0.04f, y * 0.04f);
                Color c = Color.Lerp(new Color(1f, 0.82f, 0.70f), new Color(0.96f, 0.72f, 0.58f), n * 0.45f);
                float blush = Mathf.Exp(-Mathf.Pow((x - 70) / 40f, 2) - Mathf.Pow((y - 110) / 36f, 2));
                blush += Mathf.Exp(-Mathf.Pow((x - 186) / 40f, 2) - Mathf.Pow((y - 110) / 36f, 2));
                c = Color.Lerp(c, new Color(1f, 0.55f, 0.48f), blush * 0.28f);
                t.SetPixel(x, y, c);
            }
            t.Apply();
            Cache[501] = t;
            return t;
        }
    }

    public static Texture2D Fur
    {
        get
        {
            if (Cache.ContainsKey(502)) return Cache[502];
            var t = new Texture2D(256, 256, TextureFormat.RGBA32, true);
            for (int y = 0; y < 256; y++)
            for (int x = 0; x < 256; x++)
            {
                float s = Mathf.PerlinNoise(x * 0.35f, y * 0.02f);
                float s2 = Mathf.PerlinNoise(x * 0.12f + 4, y * 0.08f);
                Color a = new Color(0.72f, 0.42f, 0.10f);
                Color b = new Color(1f, 0.84f, 0.32f);
                t.SetPixel(x, y, Color.Lerp(a, b, 0.35f + s * 0.5f + s2 * 0.15f));
            }
            t.wrapMode = TextureWrapMode.Repeat;
            t.Apply();
            Cache[502] = t;
            return t;
        }
    }

    public static Texture2D Silk
    {
        get
        {
            if (Cache.ContainsKey(503)) return Cache[503];
            var t = new Texture2D(256, 256, TextureFormat.RGBA32, true);
            for (int y = 0; y < 256; y++)
            for (int x = 0; x < 256; x++)
            {
                float wave = 0.5f + 0.5f * Mathf.Sin(x * 0.08f + Mathf.Sin(y * 0.05f));
                float cloud = Mathf.PerlinNoise(x * 0.03f, y * 0.03f);
                Color baseC = Color.Lerp(new Color(0.08f, 0.32f, 0.30f), new Color(0.18f, 0.52f, 0.48f), wave);
                if (cloud > 0.62f) baseC = Color.Lerp(baseC, new Color(0.95f, 0.82f, 0.35f), (cloud - 0.62f) * 1.6f);
                t.SetPixel(x, y, baseC);
            }
            t.wrapMode = TextureWrapMode.Repeat;
            t.Apply();
            Cache[503] = t;
            return t;
        }
    }

    public static Texture2D Gold
    {
        get
        {
            if (Cache.ContainsKey(504)) return Cache[504];
            var t = new Texture2D(256, 256, TextureFormat.RGBA32, true);
            for (int y = 0; y < 256; y++)
            for (int x = 0; x < 256; x++)
            {
                float n = Mathf.PerlinNoise(x * 0.09f, y * 0.09f);
                float n2 = Mathf.PerlinNoise(x * 0.4f, y * 0.4f);
                t.SetPixel(x, y, Color.Lerp(new Color(0.72f, 0.48f, 0.12f), new Color(1f, 0.92f, 0.45f), n * 0.7f + n2 * 0.3f));
            }
            t.wrapMode = TextureWrapMode.Repeat;
            t.Apply();
            Cache[504] = t;
            return t;
        }
    }
}

public static class Mats
{
    static Shader _mythic;
    static Shader _glow;
    static Shader _cloud;
    static Shader _sun;
    static readonly Dictionary<string, Material> Cache = new Dictionary<string, Material>();

    public static Shader MythicShader
    {
        get
        {
            if (_mythic == null) _mythic = Shader.Find("Danao/Mythic");
            if (_mythic == null) _mythic = Shader.Find("Standard");
            if (_mythic == null) _mythic = Shader.Find("Diffuse");
            return _mythic;
        }
    }

    public static Shader GlowShader
    {
        get
        {
            if (_glow == null) _glow = Shader.Find("Danao/GlowAdd");
            if (_glow == null) _glow = Shader.Find("Particles/Standard Unlit");
            if (_glow == null) _glow = Shader.Find("Mobile/Particles/Additive");
            if (_glow == null) _glow = Shader.Find("Sprites/Default");
            return _glow;
        }
    }

    public static Shader CloudShader
    {
        get
        {
            if (_cloud == null) _cloud = Shader.Find("Danao/Cloud");
            if (_cloud == null) _cloud = GlowShader;
            return _cloud;
        }
    }

    public static Shader SunShader
    {
        get
        {
            if (_sun == null) _sun = Shader.Find("Danao/Sun");
            if (_sun == null) _sun = GlowShader;
            return _sun;
        }
    }

    public static Material Solid(Color c, Color rim, Color emit, string key)
    {
        if (Cache.ContainsKey(key)) return Cache[key];
        var m = new Material(MythicShader);
        m.SetColor("_Color", c);
        m.SetColor("_RimColor", rim);
        m.SetColor("_Emission", emit);
        m.SetFloat("_Gloss", 0.55f);
        Texture2D tex = Tex.Noise;
        if (key.StartsWith("skin") || key == "skin") tex = Tex.Res("Tex/tex_skin", Tex.Skin);
        else if (key.StartsWith("fur") || key == "fur" || key.StartsWith("hair") || key == "hair") tex = Tex.Res("Tex/tex_fur", Tex.Fur);
        else if (key.StartsWith("robe") || key == "robe") tex = Tex.Res("Tex/tex_robe", Tex.Silk);
        else if (key.StartsWith("gold") || key == "gold" || key == "trim") tex = Tex.Gold;
        else if (key.StartsWith("mtn") || key == "stele" || key == "mtnRock") tex = Tex.Res("Tex/tex_mountain", Tex.Noise);
        else if (key.StartsWith("snow") || key == "mtnSnow") tex = Tex.Res("Tex/tex_snow", Tex.White);
        else if (key.StartsWith("fetus") || key == "stoneHeart") tex = Tex.Res("Tex/tex_fetus_stone", Tex.Noise);
        else if (key.StartsWith("pill")) tex = Tex.Res("Tex/tex_pill", Tex.Gold);
        m.SetTexture("_MainTex", tex);
        if (key.StartsWith("mtn") || key.StartsWith("snow")) m.SetTextureScale("_MainTex", new Vector2(3.5f, 3.5f));
        Cache[key] = m;
        return m;
    }

    public static Material Solid(Color c, string key)
    {
        return Solid(c, Color.Lerp(c, Color.white, 0.45f), c * 0.12f, key);
    }

    public static Material Unlit(Color c, string key)
    {
        key = "u_" + key;
        if (Cache.ContainsKey(key)) return Cache[key];
        var sh = Shader.Find("Unlit/Color");
        if (sh == null) sh = Shader.Find("Sprites/Default");
        var m = new Material(sh);
        m.color = c;
        Cache[key] = m;
        return m;
    }

    public static Material Glow(Color c, string key)
    {
        key = "g_" + key;
        if (Cache.ContainsKey(key)) return Cache[key];
        var m = new Material(GlowShader);
        m.SetColor("_Tint", c);
        m.SetTexture("_MainTex", Tex.Soft);
        m.SetFloat("_Boost", 1.8f);
        Cache[key] = m;
        return m;
    }

    public static Material Ground(int stage)
    {
        string key = "ground" + stage;
        if (Cache.ContainsKey(key)) return Cache[key];
        var m = new Material(MythicShader);
        m.SetColor("_Color", Color.white);
        m.SetTexture("_MainTex", stage == 1 ? Tex.Res("Tex/tex_cloud_wuxing", Tex.Ground(stage)) : Tex.Ground(stage));
        m.SetColor("_RimColor", new Color(1, 0.9f, 0.6f, 1) * 0.25f);
        m.SetColor("_Emission", stage == 1 ? new Color(0.12f, 0.08f, 0.04f) : Color.black);
        if (stage == 1) m.SetTextureScale("_MainTex", new Vector2(4f, 8f));
        Cache[key] = m;
        return m;
    }

    public static Material Cloud(Color c, string key)
    {
        return Cloud(c, key, new Vector4(0.028f + key.Length * 0.001f, 0.01f, 0f, 0f));
    }

    public static Material Cloud(Color c, string key, Vector4 scroll)
    {
        key = "cloud_" + key + "_" + scroll.x.ToString("0.###") + "_" + scroll.y.ToString("0.###");
        if (Cache.ContainsKey(key)) return Cache[key];
        var m = new Material(CloudShader);
        c.a = Mathf.Clamp01(c.a < 0.15f ? 0.72f : c.a);
        m.SetColor("_Tint", c);
        m.SetTexture("_MainTex", Tex.Res("Tex/tex_cloud_wuxing", Tex.Soft));
        m.SetVector("_Scroll", scroll);
        Cache[key] = m;
        return m;
    }

    public static Material CloudLane(int i)
    {
        i = Mathf.Clamp(i, 0, 4);
        string key = "cloudLane" + i;
        if (Cache.ContainsKey(key)) return Cache[key];
        Color c = Color.Lerp(Color.white, Danao.WuXing[i], 0.42f);
        c.a = 0.94f;
        var m = new Material(CloudShader);
        m.SetColor("_Tint", c);
        m.SetTexture("_MainTex", Tex.Res("Tex/tex_cloud_wuxing", Tex.Soft));
        m.SetTextureScale("_MainTex", new Vector2(0.22f, 2.4f));
        m.SetTextureOffset("_MainTex", new Vector2(i * 0.2f, 0f));
        m.SetVector("_Scroll", new Vector4(0f, 0.055f, 0f, 0f));
        Cache[key] = m;
        return m;
    }

    public static Material SunBall()
    {
        if (Cache.ContainsKey("sunBallTex")) return Cache["sunBallTex"];
        var m = new Material(SunShader);
        m.SetColor("_Tint", new Color(1f, 0.95f, 0.72f, 1f));
        Texture2D tex = Tex.SunArt();
        tex.wrapMode = TextureWrapMode.Clamp;
        m.SetTexture("_MainTex", tex);
        m.SetFloat("_Boost", 1.85f);
        Cache["sunBallTex"] = m;
        return m;
    }

    public static Material Painted(Color tint, Color rim, Color emit, string key, string resource)
    {
        if (Cache.ContainsKey(key)) return Cache[key];
        var m = new Material(MythicShader);
        m.SetColor("_Color", tint);
        m.SetColor("_RimColor", rim);
        m.SetColor("_Emission", emit);
        m.SetTexture("_MainTex", Tex.Res(resource, Tex.Noise));
        Cache[key] = m;
        return m;
    }

    public static Material Spirit(int elem)
    {
        string[] files =
        {
            "Tex/tex_spirit_metal",
            "Tex/tex_spirit_wood",
            "Tex/tex_spirit_water",
            "Tex/tex_spirit_fire",
            "Tex/tex_spirit_earth"
        };
        Color c = Danao.WuXing[Mathf.Clamp(elem, 0, 4)];
        return Painted(Color.white, Color.white, c * 0.22f, "spiritPaint" + elem, files[Mathf.Clamp(elem, 0, 4)]);
    }

    public static Material Ocean()
    {
        if (Cache.ContainsKey("ocean")) return Cache["ocean"];
        var m = Painted(new Color(0.18f, 0.48f, 0.82f), new Color(0.55f, 0.85f, 1f), new Color(0.02f, 0.1f, 0.18f), "ocean", "Tex/tex_spirit_water");
        m.SetTextureScale("_MainTex", new Vector2(18f, 12f));
        return m;
    }

    public static Material OceanFar()
    {
        if (Cache.ContainsKey("oceanFar")) return Cache["oceanFar"];
        var m = Painted(new Color(0.12f, 0.38f, 0.72f), new Color(0.4f, 0.7f, 1f), new Color(0.03f, 0.08f, 0.16f), "oceanFar", "Tex/tex_spirit_water");
        m.SetTextureScale("_MainTex", new Vector2(10f, 6f));
        return m;
    }

    public static Material Skin { get { return Solid(Danao.Skin, new Color(1, 0.7f, 0.5f), new Color(0.12f, 0.04f, 0.02f), "skin"); } }
    public static Material Fur { get { return Solid(Danao.Fur, Danao.Gold, new Color(0.18f, 0.08f, 0.01f), "fur"); } }
    public static Material Hair { get { return Solid(Danao.Hair, new Color(1, 0.95f, 0.55f), new Color(0.28f, 0.14f, 0.02f), "hair"); } }
    public static Material Gold { get { return Solid(Danao.Gold, Color.white, new Color(0.45f, 0.28f, 0.05f), "gold"); } }
    public static Material Cloth { get { return Solid(Danao.Cloth, new Color(0.9f, 0.8f, 0.6f), Color.black, "cloth"); } }
    public static Material Robe { get { return Solid(Danao.Robe, Danao.Trim, new Color(0.02f, 0.08f, 0.06f), "robe"); } }
    public static Material Trim { get { return Solid(Danao.Trim, Color.white, new Color(0.35f, 0.22f, 0.04f), "trim"); } }
    public static Material Dark { get { return Solid(new Color(0.12f, 0.08f, 0.06f), "dark"); } }
    public static Material White { get { return Solid(new Color(0.95f, 0.93f, 0.88f), "white"); } }
    public static Material EyeWhite { get { return Solid(new Color(0.97f, 0.96f, 0.93f), "eyew"); } }
    public static Material EyeGold { get { return Solid(new Color(0.95f, 0.72f, 0.12f), Color.yellow, new Color(0.55f, 0.32f, 0.02f), "eyeg"); } }
}

public class FaceCam : MonoBehaviour
{
    void LateUpdate()
    {
        var cam = Camera.main;
        if (cam == null) return;
        Vector3 dir = transform.position - cam.transform.position;
        if (dir.sqrMagnitude < 0.0001f) return;
        transform.rotation = Quaternion.LookRotation(dir);
    }
}

public class BobSpin : MonoBehaviour
{
    public Vector3 spin = new Vector3(0, 40, 0);
    public float amp = 0.12f;
    public float freq = 2.2f;
    public float baseY;
    bool _init;

    void LateUpdate()
    {
        if (!_init) { baseY = transform.localPosition.y; _init = true; }
        transform.Rotate(spin * Time.deltaTime, Space.Self);
        Vector3 p = transform.localPosition;
        p.y = baseY + Mathf.Sin(Time.time * freq) * amp;
        transform.localPosition = p;
    }
}

public class RunCycle : MonoBehaviour
{
    public Transform leftArm, rightArm, leftLeg, rightLeg, tail, staff, torso;
    public float run;
    public float attack;

    void LateUpdate()
    {
        float t = Time.time * (8f + run * 6f);
        float s = Mathf.Lerp(6f, 28f, run);
        if (leftLeg) leftLeg.localRotation = Quaternion.Euler(Mathf.Sin(t) * s, 0, 0);
        if (rightLeg) rightLeg.localRotation = Quaternion.Euler(-Mathf.Sin(t) * s, 0, 0);
        if (leftArm) leftArm.localRotation = Quaternion.Euler(-Mathf.Sin(t) * s * 0.7f, 0, 8);
        if (rightArm)
        {
            float swing = Mathf.Lerp(-Mathf.Sin(t) * s * 0.55f, -110f, attack);
            rightArm.localRotation = Quaternion.Euler(swing, 12, -8);
        }
        if (tail) tail.localRotation = Quaternion.Euler(Mathf.Sin(t * 0.7f) * 12f, Mathf.Sin(t * 0.5f) * 18f, 0);
        if (torso) torso.localPosition = new Vector3(0, 0.02f * Mathf.Abs(Mathf.Sin(t)), 0);
        attack = Mathf.MoveTowards(attack, 0, Time.deltaTime * 3.2f);
    }
}

public class FloatText : MonoBehaviour
{
    public float life = 0.85f;
    Vector3 _v;
    TextMesh _tm;
    Color _c;

    public static void Show(Vector3 pos, string s, Color c)
    {
        var go = new GameObject("ft");
        go.transform.position = pos + Vector3.up * 1.2f;
        var tm = go.AddComponent<TextMesh>();
        tm.text = s;
        tm.font = Fonts.Cjk();
        tm.fontSize = 42;
        tm.characterSize = 0.055f;
        tm.anchor = TextAnchor.MiddleCenter;
        tm.alignment = TextAlignment.Center;
        tm.color = c;
        var f = go.AddComponent<FloatText>();
        f._tm = tm;
        f._c = c;
        f._v = Vector3.up * 1.6f + new Vector3(Random.Range(-0.3f, 0.3f), 0, 0);
    }

    void Update()
    {
        float dt = Time.deltaTime;
        life -= dt;
        transform.position += _v * dt;
        _v.y -= dt * 0.6f;
        if (Camera.main) transform.rotation = Quaternion.LookRotation(transform.position - Camera.main.transform.position);
        _c.a = Mathf.Clamp01(life / 0.35f);
        if (_tm) _tm.color = _c;
        if (life <= 0) Destroy(gameObject);
    }
}

public static class Ui
{
    public static Text Label(Transform parent, string name, string text, int size, TextAnchor anchor, Color color, Vector2 ancMin, Vector2 ancMax, Vector2 offMin, Vector2 offMax)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();
        rt.anchorMin = ancMin;
        rt.anchorMax = ancMax;
        rt.offsetMin = offMin;
        rt.offsetMax = offMax;
        var t = go.AddComponent<Text>();
        t.font = Fonts.Cjk();
        t.fontSize = size;
        t.alignment = anchor;
        t.color = color;
        t.text = text;
        t.horizontalOverflow = HorizontalWrapMode.Overflow;
        t.verticalOverflow = VerticalWrapMode.Overflow;
        t.raycastTarget = false;
        var o = go.AddComponent<Outline>();
        o.effectColor = new Color(0, 0, 0, 0.7f);
        o.effectDistance = new Vector2(1.2f, -1.2f);
        return t;
    }

    public static Image Panel(Transform parent, string name, Color c, Vector2 ancMin, Vector2 ancMax, Vector2 offMin, Vector2 offMax)
    {
        var go = new GameObject(name);
        go.transform.SetParent(parent, false);
        var rt = go.AddComponent<RectTransform>();
        rt.anchorMin = ancMin;
        rt.anchorMax = ancMax;
        rt.offsetMin = offMin;
        rt.offsetMax = offMax;
        var img = go.AddComponent<Image>();
        img.color = c;
        img.raycastTarget = false;
        return img;
    }
}
