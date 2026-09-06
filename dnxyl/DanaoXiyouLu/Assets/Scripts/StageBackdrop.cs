using UnityEngine;

public class StageBackdrop : MonoBehaviour
{
    public Light sun;
    Transform _sunRig;
    Transform _sunCore;
    Material _sky;
    Material _oceanMat;
    Material _sunMat;
    Material _coreMat;
    Light _sunPoint;
    float _period = 6f;
    const float SeaY = -17.2f;

    public static StageBackdrop Create(Light sun)
    {
        var go = new GameObject("StageBackdrop");
        var b = go.AddComponent<StageBackdrop>();
        b.sun = sun;
        b.Build();
        return b;
    }

    void Build()
    {
        var ocean = Danao.Node(transform, "Ocean", Vector3.zero);
        _oceanMat = Mats.Ocean();
        var sea = Danao.Mesh(ocean, "sea", MeshForge.Quad(), new Vector3(0f, -18f, 110f),
            new Vector3(480f, 1f, 320f), _oceanMat);
        sea.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        var sea2 = Danao.Mesh(ocean, "horizon", MeshForge.Quad(), new Vector3(0f, -16.5f, 220f),
            new Vector3(560f, 1f, 180f), Mats.OceanFar());
        sea2.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        for (int i = 0; i < 10; i++)
        {
            float x = (i - 4.5f) * 18f;
            float z = 38f + (i % 3) * 8f;
            BuildSeaIsland(ocean, "island" + i, new Vector3(x, SeaY, z), new Vector3(8f, 0.6f, 5f), i);
        }

        _sunRig = Danao.Node(transform, "sunRig", Vector3.zero);
        _sunMat = Mats.SunBall();
        Texture2D sunTex = Tex.SunArt();
        if (sunTex != null && _sunMat != null)
        {
            sunTex.wrapMode = TextureWrapMode.Clamp;
            _sunMat.SetTexture("_MainTex", sunTex);
        }
        var disc = Danao.Mesh(_sunRig, "png", MeshForge.Billboard(), Vector3.zero,
            new Vector3(14f, 14f, 1f), _sunMat);
        disc.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        var face = disc.gameObject.AddComponent<FaceCam>();
        face.parallel = true;

        _coreMat = Mats.Glow(new Color(1f, 0.85f, 0.45f, 0.7f), "sunCoreHalo");
        if (_coreMat.HasProperty("_Boost")) _coreMat.SetFloat("_Boost", 1.6f);
        var core = Danao.Mesh(_sunRig, "core", MeshForge.Billboard(), new Vector3(0f, 0f, 0.2f),
            new Vector3(5.2f, 5.2f, 1f), _coreMat);
        core.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        var coreFace = core.gameObject.AddComponent<FaceCam>();
        coreFace.parallel = true;
        _sunCore = core.transform;

        _sunPoint = Danao.Glow(_sunRig, new Color(1f, 0.98f, 0.92f), 1.2f, 90f);
        _sunPoint.transform.localPosition = Vector3.zero;
    }

    static void BuildSeaIsland(Transform ocean, string name, Vector3 pos, Vector3 foamScale, int seed)
    {
        float w = foamScale.x;
        float d = foamScale.z;
        float k = 0.88f + (seed % 3) * 0.10f;
        float h = Mathf.Max(w, d) * 0.95f * k;
        float side = seed % 2 == 0 ? -1f : 1f;
        var root = Danao.Node(ocean, name, pos);

        var reef = Danao.Mesh(root, "reef", MeshForge.Sphere(16, 10),
            new Vector3(0f, -0.12f * k, 0f), new Vector3(w * 1.05f * k, 0.38f * k, d * 1.05f * k),
            Mats.Solid(new Color(0.18f, 0.42f, 0.46f), "isleReef" + seed));
        reef.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;

        var beach = Danao.Mesh(root, "beach", MeshForge.Sphere(16, 10),
            new Vector3(0f, 0.08f * k, 0f), new Vector3(w * 0.92f * k, 0.28f * k, d * 0.92f * k),
            Mats.Solid(new Color(0.62f, 0.50f, 0.32f), "isleBeach" + seed));
        beach.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;

        Danao.Mesh(root, "hill", MeshForge.Peak(),
            new Vector3(0f, 0.02f * k, 0f), new Vector3(w * 0.86f * k, h, d * 0.86f * k),
            Mats.Solid(new Color(0.38f, 0.34f, 0.28f), "isleRock" + seed));
        Danao.Mesh(root, "cliff", MeshForge.Golem(),
            new Vector3(side * w * 0.18f * k, h * 0.18f, 0.12f * k),
            new Vector3(w * 0.32f * k, h * 0.42f, d * 0.28f * k),
            Mats.Solid(new Color(0.32f, 0.28f, 0.24f), "isleCliff" + seed));
        Danao.Mesh(root, "canopy", MeshForge.Sphere(14, 10),
            new Vector3(0f, h * 0.62f, 0f), new Vector3(w * 0.55f * k, h * 0.34f, d * 0.55f * k),
            Mats.Solid(new Color(0.16f, 0.46f, 0.18f), "isleLeaf" + seed));
        Danao.Mesh(root, "pine", MeshForge.Peak(),
            new Vector3(side * 0.55f * k, h * 0.48f, -0.12f * k),
            new Vector3(1.15f * k, h * 0.55f, 1.15f * k),
            Mats.Solid(new Color(0.10f, 0.32f, 0.14f), "islePine" + seed));
        Danao.Mesh(root, "pine2", MeshForge.Peak(),
            new Vector3(-side * 0.72f * k, h * 0.40f, 0.22f * k),
            new Vector3(0.85f * k, h * 0.42f, 0.85f * k),
            Mats.Solid(new Color(0.12f, 0.36f, 0.16f), "islePineB" + seed));
    }

    public void Follow(Vector3 playerPos)
    {
        transform.position = new Vector3(0f, 0f, playerPos.z);
        TickSun();
        if (_oceanMat != null)
            _oceanMat.SetTextureOffset("_MainTex", new Vector2(Time.time * 0.018f, Time.time * 0.01f));
    }

    void TickSun()
    {
        float t = Mathf.Repeat(Time.time / _period, 1f);
        const float peakH = 52f;
        const float z = 98f;
        Camera cam = Camera.main;
        float leftX = -120f;
        float rightX = 120f;
        if (cam != null)
        {
            float depth = Mathf.Abs(z - (cam.transform.position.z - transform.position.z));
            if (depth < 8f) depth = 98f;
            Vector3 lp = cam.ViewportToWorldPoint(new Vector3(0f, 0.32f, depth));
            Vector3 rp = cam.ViewportToWorldPoint(new Vector3(1f, 0.32f, depth));
            leftX = lp.x - transform.position.x;
            rightX = rp.x - transform.position.x;
        }
        Vector3 local = new Vector3(
            Mathf.Lerp(leftX, rightX, t),
            SeaY + peakH * Mathf.Sin(t * Mathf.PI),
            z);
        if (_sunRig != null)
        {
            _sunRig.localPosition = local;
            _sunRig.localScale = Vector3.one;
        }
        float day = Mathf.Clamp01(Mathf.Sin(t * Mathf.PI));
        if (sun != null)
        {
            Vector3 world = transform.TransformPoint(local);
            Vector3 look = transform.position + Vector3.up * 2f + Vector3.forward * 30f;
            sun.transform.rotation = Quaternion.LookRotation((look - world).normalized);
            sun.intensity = 0.12f + day * 2.55f;
            Color dawn = new Color(1f, 0.52f, 0.28f);
            Color noon = new Color(1f, 1f, 1f);
            Color dusk = new Color(1f, 0.38f, 0.2f);
            sun.color = t < 0.5f ? Color.Lerp(dawn, noon, t * 2f) : Color.Lerp(noon, dusk, (t - 0.5f) * 2f);
        }
        if (_sunMat != null)
        {
            Color dim = new Color(1f, 0.58f, 0.28f, 1f);
            Color bright = new Color(1f, 1f, 1f, 1f);
            if (_sunMat.HasProperty("_Tint"))
                _sunMat.SetColor("_Tint", Color.Lerp(dim, bright, day));
            if (_sunMat.HasProperty("_WhiteMix"))
                _sunMat.SetFloat("_WhiteMix", day);
            if (_sunMat.HasProperty("_Boost"))
                _sunMat.SetFloat("_Boost", 1.05f + day * 2.6f);
        }
        if (_sunCore != null)
        {
            float cs = Mathf.Lerp(6.2f, 1.4f, day);
            _sunCore.localScale = new Vector3(cs, cs, 1f);
            _sunCore.gameObject.SetActive(day < 0.82f);
            if (_coreMat != null && _coreMat.HasProperty("_Boost"))
                _coreMat.SetFloat("_Boost", Mathf.Lerp(2.2f, 0.4f, day));
            if (_coreMat != null && _coreMat.HasProperty("_Tint"))
                _coreMat.SetColor("_Tint", Color.Lerp(new Color(1f, 0.72f, 0.28f, 0.75f), new Color(1f, 1f, 0.97f, 0.12f), day));
        }
        if (_sunPoint != null)
        {
            _sunPoint.color = Color.Lerp(new Color(1f, 0.72f, 0.32f), Color.white, day);
            _sunPoint.intensity = 0.22f + day * 6.4f;
        }
        if (_sky == null) _sky = RenderSettings.skybox;
        if (_sky != null)
        {
            if (_sky.HasProperty("_SkyTint"))
            {
                Color morning = new Color(0.55f, 0.62f, 0.88f);
                Color dayCol = new Color(0.62f, 0.72f, 0.92f);
                Color evening = new Color(0.55f, 0.4f, 0.7f);
                Color tint = t < 0.5f ? Color.Lerp(morning, dayCol, t * 2f) : Color.Lerp(dayCol, evening, (t - 0.5f) * 2f);
                _sky.SetColor("_SkyTint", tint);
            }
            if (_sky.HasProperty("_AtmosphereThickness"))
                _sky.SetFloat("_AtmosphereThickness", 0.85f + (1f - day) * 0.35f);
            if (_sky.HasProperty("_SunDisk")) _sky.SetFloat("_SunDisk", 0f);
            if (_sky.HasProperty("_SunSize")) _sky.SetFloat("_SunSize", 0f);
            if (_sky.HasProperty("_SunSizeConvergence")) _sky.SetFloat("_SunSizeConvergence", 1f);
        }
        RenderSettings.ambientSkyColor = Color.Lerp(new Color(0.55f, 0.48f, 0.42f), new Color(1f, 0.98f, 0.95f), day);
        RenderSettings.ambientEquatorColor = Color.Lerp(new Color(0.4f, 0.35f, 0.32f), new Color(0.92f, 0.93f, 0.95f), day);
    }
}
