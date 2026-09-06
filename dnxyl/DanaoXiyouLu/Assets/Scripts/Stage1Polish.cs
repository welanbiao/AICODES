using UnityEngine;
using System.Reflection;

public class Stage1Polish : MonoBehaviour
{
    static Texture2D _frameTex;
    static FieldInfo _pathWField;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<Stage1Polish>() != null) return;
        var go = new GameObject("Stage1Polish");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<Stage1Polish>();
    }

    void LateUpdate()
    {
        if (GameRoot.I == null || GameRoot.I.stage != 1 || GameRoot.I.UserPaused) return;
        if (_pathWField == null)
            _pathWField = typeof(GameRoot).GetField("_pathW", BindingFlags.NonPublic | BindingFlags.Instance);
        if (_pathWField != null) _pathWField.SetValue(GameRoot.I, 6.2f);
        TunePlayer();
        TuneWorld();
        TuneMobs();
        TunePickups();
        if (Camera.main != null && GameRoot.I.player != null)
            Camera.main.transform.LookAt(GameRoot.I.player.position + new Vector3(0f, 1.7f, 18f));
    }

    void TunePlayer()
    {
        Transform slot = GameRoot.I.modelSlot;
        if (slot == null) return;
        Transform mtn = null;
        var stones = slot.GetComponentsInChildren<Transform>();
        for (int i = 0; i < stones.Length; i++)
        {
            if (stones[i].name == "mountain") { mtn = stones[i]; break; }
        }
        if (mtn == null || mtn.GetComponent<PolishedMark>() != null) return;
        float k = 3.55f / 2.12f;
        Vector3 s = mtn.localScale;
        mtn.localScale = new Vector3(s.x * k, s.y * k, s.z);
        mtn.localPosition = new Vector3(0f, 3.55f * 0.46f, -0.08f);
        mtn.gameObject.AddComponent<PolishedMark>();
        Transform stone = mtn.parent != null ? mtn.parent.Find("stone") : null;
        if (stone != null)
        {
            Vector3 ss = stone.localScale;
            float sk = 1.68f / 1.52f;
            stone.localScale = new Vector3(ss.x * sk, ss.y * sk, ss.z);
            stone.localPosition = new Vector3(0f, 3.55f * 0.64f + 1.68f * 0.16f, 0.05f);
        }
    }

    void TuneWorld()
    {
        var all = Object.FindObjectsByType<Transform>(FindObjectsSortMode.None);
        for (int i = 0; i < all.Length; i++)
        {
            Transform t = all[i];
            if (t.GetComponent<PolishedMark>() != null) continue;
            string n = t.name;
            if (n == "cloudBed")
            {
                Vector3 s = t.localScale;
                t.localScale = new Vector3(15.4f, s.y, s.z);
                t.gameObject.AddComponent<PolishedMark>();
            }
            else if (n.Length == 5 && n.StartsWith("lane") && n[4] >= '0' && n[4] <= '4')
            {
                int idx = n[4] - '0';
                float x = Mathf.Lerp(-6.5f, 6.5f, (idx + 0.5f) / 5f);
                Vector3 s = t.localScale;
                t.localScale = new Vector3(2.55f, s.y, s.z);
                Vector3 p = t.localPosition;
                p.x = x;
                t.localPosition = p;
                t.gameObject.AddComponent<PolishedMark>();
            }
            else if (n == "bankL")
            {
                Vector3 s = t.localScale;
                t.localScale = new Vector3(2.05f, 0.85f, s.z);
                Vector3 p = t.localPosition;
                p.x = -8.6f;
                t.localPosition = p;
                t.gameObject.AddComponent<PolishedMark>();
            }
            else if (n == "bankR")
            {
                Vector3 s = t.localScale;
                t.localScale = new Vector3(2.05f, 0.85f, s.z);
                Vector3 p = t.localPosition;
                p.x = 8.6f;
                t.localPosition = p;
                t.gameObject.AddComponent<PolishedMark>();
            }
            else if (n == "crystal")
            {
                Vector3 p = t.localPosition;
                if (Mathf.Abs(p.x) < 11f)
                    p.x = Mathf.Sign(p.x == 0f ? 1f : p.x) * (Mathf.Abs(p.x) + 3.2f);
                t.localPosition = p;
                t.gameObject.AddComponent<PolishedMark>();
            }
            else if (n.StartsWith("puff"))
            {
                Object.Destroy(t.gameObject);
            }
        }
    }

    void TuneMobs()
    {
        var mobs = Object.FindObjectsByType<Mob>(FindObjectsSortMode.None);
        for (int i = 0; i < mobs.Length; i++)
        {
            Mob m = mobs[i];
            if (m.GetComponent<PolishedMark>() != null) continue;
            if (m.element < 0) continue;
            Transform vis = m.transform.childCount > 0 ? m.transform.GetChild(0) : m.transform;
            vis.localScale = Vector3.one * 1.65f;
            vis.localPosition = Vector3.up * 0.85f;
            var col = m.GetComponent<CapsuleCollider>();
            if (col != null)
            {
                col.height = 2.35f;
                col.radius = 0.72f;
                col.center = new Vector3(0f, 1.05f, 0f);
            }
            m.gameObject.AddComponent<PolishedMark>();
        }
    }

    void TunePickups()
    {
        var gates = Object.FindObjectsByType<GateTrigger>(FindObjectsSortMode.None);
        for (int i = 0; i < gates.Length; i++)
        {
            Transform g = gates[i].transform;
            if (g.GetComponent<PolishedMark>() != null) continue;
            Transform icon = g.Find("icon");
            if (icon != null) icon.localScale = Vector3.one * 1.58f;
            Transform cushion = g.Find("cushion");
            if (cushion != null) cushion.localScale = new Vector3(1.38f, 0.24f, 1.38f);
            var box = g.GetComponent<BoxCollider>();
            if (box != null) box.size = new Vector3(2.05f, 1.72f, 1.15f);
            Transform lab = g.Find("lab");
            if (lab != null)
            {
                Vector3 lp = lab.localPosition;
                lp.y = 1.4f;
                lab.localPosition = lp;
                var tm = lab.GetComponent<TextMesh>();
                if (tm != null) tm.characterSize = 0.055f;
            }
            Color c = Danao.WuXing[Mathf.Clamp(gates[i].element, 0, 4)];
            AddFrame(g, c, 0.72f);
            Vector3 gp = g.localPosition;
            if (Mathf.Abs(gp.x) > 0.2f) gp.x = Mathf.Sign(gp.x) * 2.85f;
            g.localPosition = gp;
            g.gameObject.AddComponent<PolishedMark>();
        }

        var orbs = Object.FindObjectsByType<PickupOrb>(FindObjectsSortMode.None);
        for (int i = 0; i < orbs.Length; i++)
        {
            Transform t = orbs[i].transform;
            if (t.GetComponent<PolishedMark>() != null) continue;
            Transform gem = t.Find("gem");
            if (gem != null) gem.localScale = Vector3.one * 0.78f;
            var sph = t.GetComponent<SphereCollider>();
            if (sph != null) sph.radius = 0.82f;
            Vector3 p = t.localPosition;
            if (Mathf.Abs(p.x) > 0.2f) p.x = Mathf.Sign(p.x) * 2.85f;
            t.localPosition = p;
            t.gameObject.AddComponent<PolishedMark>();
        }
    }

    void AddFrame(Transform go, Color c, float y)
    {
        var frame = Danao.Node(go, "frame", new Vector3(0f, y, -0.04f));
        var mat = new Material(Shader.Find("Danao/GlowAdd"));
        if (mat.shader == null || mat.shader.name == "Hidden/InternalErrorShader")
            mat = Mats.Glow(c, "optFrameFb" + c.GetHashCode());
        else
        {
            mat.SetColor("_Tint", new Color(c.r, c.g, c.b, 0.95f));
            mat.SetTexture("_MainTex", FrameTex());
            mat.SetFloat("_Boost", 2.45f);
        }
        var pane = Danao.Mesh(frame, "pane", MeshForge.Billboard(), Vector3.zero,
            new Vector3(2.2f, 2.4f, 1f), mat);
        pane.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        var face = frame.gameObject.AddComponent<FaceCam>();
        face.parallel = true;
        frame.gameObject.AddComponent<FramePulse>();
    }

    static Texture2D FrameTex()
    {
        if (_frameTex != null) return _frameTex;
        int n = 256;
        _frameTex = new Texture2D(n, n, TextureFormat.RGBA32, false);
        _frameTex.wrapMode = TextureWrapMode.Clamp;
        var px = new Color[n * n];
        for (int y = 0; y < n; y++)
        {
            for (int x = 0; x < n; x++)
            {
                float u = (x + 0.5f) / n - 0.5f;
                float v = (y + 0.5f) / n - 0.5f;
                float d = SdRoundBox(u, v, 0.36f, 0.40f, 0.10f);
                float edge = Mathf.Exp(-d * d * 780f);
                float inner = Mathf.Clamp01(-d * 8f) * 0.14f;
                float a = Mathf.Clamp01(edge * 1.2f + inner);
                px[y * n + x] = new Color(1f, 1f, 1f, a);
            }
        }
        _frameTex.SetPixels(px);
        _frameTex.Apply(false, false);
        return _frameTex;
    }

    static float SdRoundBox(float px, float py, float hx, float hy, float rad)
    {
        float ax = Mathf.Abs(px) - hx + rad;
        float ay = Mathf.Abs(py) - hy + rad;
        float ox = Mathf.Max(ax, 0f);
        float oy = Mathf.Max(ay, 0f);
        return Mathf.Sqrt(ox * ox + oy * oy) + Mathf.Min(Mathf.Max(ax, ay), 0f) - rad;
    }
}

public class PolishedMark : MonoBehaviour { }

public class FramePulse : MonoBehaviour
{
    public float freq = 2.8f;
    public float amp = 0.07f;
    Vector3 _base;
    Material _mat;
    float _boost0 = 2.2f;

    void Start()
    {
        _base = transform.localScale;
        var r = GetComponentInChildren<MeshRenderer>();
        if (r != null) _mat = r.material;
        if (_mat != null && _mat.HasProperty("_Boost")) _boost0 = _mat.GetFloat("_Boost");
    }

    void LateUpdate()
    {
        float w = 0.5f + 0.5f * Mathf.Sin(Time.time * freq);
        transform.localScale = _base * (1f + amp * (w * 2f - 1f));
        if (_mat != null && _mat.HasProperty("_Boost"))
            _mat.SetFloat("_Boost", _boost0 * (0.72f + 0.55f * w));
    }
}
