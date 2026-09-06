using UnityEngine;

[DefaultExecutionOrder(100)]
public class Stage1Boost : MonoBehaviour
{
    public const float ForwardZ = 13.8f;
    const float MtnH = 52.65f;
    const float StoneH = 6.24f;
    public const float CloudY = 0.20f;
    bool _sunPunched;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<Stage1Boost>() != null) return;
        var go = new GameObject("Stage1Boost");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<Stage1Boost>();
    }

    void LateUpdate()
    {
        if (GameRoot.I == null || GameRoot.I.stage != 1 || GameRoot.I.UserPaused) return;
        BoostCloudFlow();
        BoostMountain();
        BoostClouds();
        BoostCamera();
        BoostGates();
        BoostMobs();
        PunchSunSky();
        GameRoot.I.PlaceHpBar();
    }

    void BoostCloudFlow()
    {
        if (GameRoot.I.Halted) return;
        float pace = GameRoot.I.PlayPace;
        Transform p = GameRoot.I.player;
        if (p != null)
        {
            var speedField = typeof(GameRoot).GetField("_speed", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
            float spd = speedField != null ? (float)speedField.GetValue(GameRoot.I) : 4.6f;
            Vector3 pos = p.position;
            pos.z += spd * (pace - 1f) * Time.deltaTime;
            p.position = pos;
        }
        var all = Object.FindObjectsByType<MeshRenderer>(FindObjectsSortMode.None);
        for (int i = 0; i < all.Length; i++)
        {
            MeshRenderer r = all[i];
            string n = r.name;
            if (n != "cloudBed" && n != "bankL" && n != "bankR" && !n.StartsWith("lane"))
                continue;
            Material m = r.sharedMaterial;
            if (m == null || !m.HasProperty("_Scroll")) continue;
            Vector4 sc = m.GetVector("_Scroll");
            float baseY = n.StartsWith("lane") ? 0.08f : 0.055f;
            sc.y = baseY * pace;
            m.SetVector("_Scroll", sc);
        }
    }

    void BoostMobs()
    {
        var mobs = Object.FindObjectsByType<Mob>(FindObjectsSortMode.None);
        for (int i = 0; i < mobs.Length; i++)
        {
            Mob m = mobs[i];
            if (m.element < 0) continue;
            if (m.GetComponent<Stage1BoostMark>() != null) continue;
            var col = m.GetComponent<CapsuleCollider>();
            if (col != null)
            {
                col.height = 3.15f;
                col.radius = 0.82f;
                col.center = new Vector3(0f, 1.45f, 0f);
            }
            m.gameObject.AddComponent<Stage1BoostMark>();
        }
    }

    void BoostMountain()
    {
        Transform slot = GameRoot.I.modelSlot;
        if (slot == null) return;
        Transform mtn = null;
        var all = slot.GetComponentsInChildren<Transform>();
        for (int i = 0; i < all.Length; i++)
        {
            if (all[i].name == "mountain") { mtn = all[i]; break; }
        }
        if (mtn == null) return;
        StripMtnWhite(mtn);
        Transform root = mtn.parent;
        Transform stone = root != null ? root.Find("stone") : null;

        Vector3 ms = mtn.localScale;
        float mAspect = ms.y > 0.001f ? ms.x / ms.y : 1f;
        mtn.localScale = new Vector3(MtnH * mAspect, MtnH, 1f);
        mtn.localPosition = new Vector3(0f, MtnH * 0.5f, -0.85f);
        float mtnPeak = MtnH;
        if (stone != null)
        {
            Vector3 ss = stone.localScale;
            float sAspect = ss.y > 0.001f ? ss.x / ss.y : 1f;
            stone.localScale = new Vector3(StoneH * sAspect, StoneH, 1f);
            stone.localPosition = new Vector3(0f, mtnPeak + StoneH * 0.18f, 0.55f);
        }

        if (root != null)
        {
            float rootY = CloudY - mtnPeak;
            root.localPosition = new Vector3(0f, rootY, ForwardZ);
            var bob = root.GetComponent<BobSpin>();
            if (bob != null)
            {
                bob.baseY = rootY;
                bob.amp = 0f;
                bob.spin = Vector3.zero;
            }
            var face = root.GetComponent<FaceCam>();
            if (face != null)
            {
                face.lockYawOnly = true;
                face.parallel = false;
            }
            if (root.GetComponent<PolishedMark>() == null)
                root.gameObject.AddComponent<PolishedMark>();
            if (mtn.GetComponent<PolishedMark>() == null)
                mtn.gameObject.AddComponent<PolishedMark>();
        }

        var col = GameRoot.I.player.GetComponent<CapsuleCollider>();
        if (col != null)
        {
            col.height = 2.6f;
            col.radius = 0.95f;
            col.center = new Vector3(0f, CloudY + 1.15f, ForwardZ);
        }
    }

    static void StripMtnWhite(Transform mtn)
    {
        if (mtn.GetComponent<MtnCutMark>() != null) return;
        var r = mtn.GetComponent<MeshRenderer>();
        if (r == null) return;
        Material m = r.material;
        if (m == null) return;
        var tex = m.HasProperty("_MainTex") ? m.GetTexture("_MainTex") as Texture2D : null;
        if (tex != null)
            m.SetTexture("_MainTex", CutoutPrep.Run(tex));
        if (m.HasProperty("_Cutoff"))
            m.SetFloat("_Cutoff", 0.28f);
        mtn.gameObject.AddComponent<MtnCutMark>();
    }

    void BoostClouds()
    {
        var pathWField = typeof(GameRoot).GetField("_pathW", System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        if (pathWField != null) pathWField.SetValue(GameRoot.I, 12.4f);

        var all = Object.FindObjectsByType<Transform>(FindObjectsSortMode.None);
        for (int i = 0; i < all.Length; i++)
        {
            Transform t = all[i];
            string n = t.name;
            if (n == "cloudBed")
            {
                Vector3 s = t.localScale;
                t.localScale = new Vector3(30.8f, s.y, s.z);
            }
            else if (n.Length == 5 && n.StartsWith("lane") && n[4] >= '0' && n[4] <= '4')
            {
                int idx = n[4] - '0';
                float x = Mathf.Lerp(-13f, 13f, (idx + 0.5f) / 5f);
                Vector3 s = t.localScale;
                t.localScale = new Vector3(5.1f, s.y, s.z);
                Vector3 p = t.localPosition;
                p.x = x;
                t.localPosition = p;
            }
            else if (n == "bankL")
            {
                Vector3 s = t.localScale;
                t.localScale = new Vector3(4.1f, 0.85f, s.z);
                Vector3 p = t.localPosition;
                p.x = -17.2f;
                t.localPosition = p;
            }
            else if (n == "bankR")
            {
                Vector3 s = t.localScale;
                t.localScale = new Vector3(4.1f, 0.85f, s.z);
                Vector3 p = t.localPosition;
                p.x = 17.2f;
                t.localPosition = p;
            }
            else if (n.StartsWith("puff"))
            {
                Object.Destroy(t.gameObject);
            }
        }
    }

    void BoostCamera()
    {
        Camera cam = Camera.main;
        Transform player = GameRoot.I.player;
        if (cam == null || player == null) return;
        bool port = Screen.height >= Screen.width * 0.98f;
        Vector3 want = port
            ? player.position + new Vector3(0f, 16.2f, -20.5f)
            : player.position + new Vector3(0f, 22.5f, -34f);
        cam.transform.position = Vector3.Lerp(cam.transform.position, want, 1f - Mathf.Exp(-8f * Time.deltaTime));
        Vector3 look = port
            ? player.position + new Vector3(0f, CloudY + 4.2f, ForwardZ + 8f)
            : player.position + new Vector3(0f, CloudY + 3.6f, ForwardZ + 16f);
        cam.transform.LookAt(look);
        cam.fieldOfView = port ? 60f : 58f;
    }

    void BoostGates()
    {
        var gates = Object.FindObjectsByType<GateTrigger>(FindObjectsSortMode.None);
        for (int i = 0; i < gates.Length; i++)
        {
            GateTrigger g = gates[i];
            if (g.GetComponent<Stage1BoostMark>() != null) continue;
            Transform icon = g.transform.Find("icon");
            if (icon == null) continue;
            if (icon.Find("torso") == null && icon.Find("head") == null)
            {
                for (int c = icon.childCount - 1; c >= 0; c--)
                    Object.DestroyImmediate(icon.GetChild(c).gameObject);
                SpiritFigure.Attach(icon, Mathf.Clamp(g.element, 0, 4), 0.58f);
            }
            icon.localScale = Vector3.one * 2.44f;
            icon.localPosition = new Vector3(0f, 0.28f, 0f);
            Transform cushion = g.transform.Find("cushion");
            if (cushion != null) cushion.localScale = new Vector3(2.76f, 0.48f, 2.76f);
            var box = g.GetComponent<BoxCollider>();
            if (box != null)
            {
                box.size = new Vector3(3.6f, 4.6f, 1.8f);
                box.center = new Vector3(0f, 2.05f, 0f);
            }
            Transform lab = g.transform.Find("lab");
            if (lab != null)
            {
                Vector3 lp = lab.localPosition;
                lp.y = 4.15f;
                lab.localPosition = lp;
                var tm = lab.GetComponent<TextMesh>();
                if (tm != null) tm.characterSize = 0.11f;
            }
            Transform frame = g.transform.Find("frame");
            if (frame != null)
            {
                Vector3 fp = frame.localPosition;
                fp.y = 1.95f;
                frame.localPosition = fp;
                frame.localScale = new Vector3(2.16f, 2.44f, 1f);
            }
            g.gameObject.AddComponent<Stage1BoostMark>();
        }
    }

    void PunchSunSky()
    {
        if (_sunPunched) return;
        var bd = Object.FindFirstObjectByType<StageBackdrop>();
        if (bd == null) return;
        var rends = bd.GetComponentsInChildren<MeshRenderer>();
        for (int i = 0; i < rends.Length; i++)
        {
            if (rends[i].name != "png") continue;
            Material m = rends[i].sharedMaterial;
            if (m == null) continue;
            Texture tex = m.GetTexture("_MainTex");
            var t2 = tex as Texture2D;
            if (t2 == null) continue;
            PunchSkyBlue(t2);
            _sunPunched = true;
            return;
        }
    }

    static bool IsSkyBlue(Color c)
    {
        if (c.a < 0.06f) return true;
        if (c.b > c.r + 0.035f && c.b >= c.g - 0.02f) return true;
        if (c.b > 0.45f && (c.b - c.r) > 0.07f && c.g >= c.r - 0.02f) return true;
        return false;
    }

    static void PunchSkyBlue(Texture2D tex)
    {
        int w = tex.width;
        int h = tex.height;
        if (w < 2 || h < 2) return;
        Color[] px;
        try { px = tex.GetPixels(); }
        catch { return; }
        var seen = new bool[px.Length];
        var q = new System.Collections.Generic.Queue<int>();
        System.Action<int, int> enq = (x, y) =>
        {
            if ((uint)x >= (uint)w || (uint)y >= (uint)h) return;
            int i = y * w + x;
            if (seen[i] || !IsSkyBlue(px[i])) return;
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
            px[i] = new Color(0f, 0f, 0f, 0f);
            int x = i % w;
            int y = i / w;
            enq(x + 1, y);
            enq(x - 1, y);
            enq(x, y + 1);
            enq(x, y - 1);
        }
        tex.SetPixels(px);
        tex.Apply(true, false);
    }
}

public class Stage1BoostMark : MonoBehaviour { }
public class MtnCutMark : MonoBehaviour { }
