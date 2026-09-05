using UnityEngine;

public class StageBackdrop : MonoBehaviour
{
    public Light sun;
    Transform _sunBall;
    Transform _mountain;
    Material _sky;
    Material _oceanMat;
    float _period = 42f;

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
        _mountain = Danao.Node(transform, "Mountain", Vector3.zero);
        var mtn = Mats.Solid(Color.white, new Color(1f, 0.82f, 0.55f), new Color(0.08f, 0.05f, 0.03f), "mtn");
        var snow = Mats.Solid(Color.white, Color.white, new Color(0.22f, 0.2f, 0.18f), "snowPeak");
        var rock = Mats.Solid(new Color(0.85f, 0.78f, 0.7f), "mtnRock");

        Danao.Mesh(_mountain, "peak", MeshForge.Peak(), new Vector3(0f, -50f, -8f), new Vector3(72f, 50.2f, 72f), mtn);
        Danao.Mesh(_mountain, "summit", MeshForge.Cylinder(20), new Vector3(0f, -0.18f, 0f), new Vector3(4.2f, 0.28f, 4.2f), rock);
        Danao.Mesh(_mountain, "snow", MeshForge.Peak(), new Vector3(0f, -8f, -8f), new Vector3(20f, 10f, 20f), snow);
        Danao.Mesh(_mountain, "flankL", MeshForge.Peak(), new Vector3(-28f, -44f, -18f), new Vector3(34f, 40f, 48f), mtn);
        Danao.Mesh(_mountain, "flankR", MeshForge.Peak(), new Vector3(30f, -46f, -16f), new Vector3(36f, 42f, 50f), rock);
        Danao.Mesh(_mountain, "base", MeshForge.Peak(), new Vector3(0f, -62f, -22f), new Vector3(110f, 48f, 90f), rock);

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
            Danao.Mesh(ocean, "foam" + i, MeshForge.Sphere(10, 8),
                new Vector3(x, -17.2f, 38f + (i % 3) * 8f),
                new Vector3(8f, 0.6f, 5f), Mats.White);
        }

        var sunRoot = Danao.Node(transform, "sunRig", Vector3.zero);
        _sunBall = Danao.Mesh(sunRoot, "sun", MeshForge.Sphere(28, 18), Vector3.zero, Vector3.one * 22f, Mats.SunBall()).transform;
        var halo = Danao.Mesh(sunRoot, "halo", MeshForge.Sphere(16, 12), Vector3.zero, Vector3.one * 32f,
            Mats.Glow(new Color(1f, 0.72f, 0.32f, 0.28f), "sunHalo"));
        halo.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        _sunBall.GetComponent<MeshRenderer>().shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
    }

    public void Follow(Vector3 playerPos)
    {
        transform.position = new Vector3(playerPos.x, 0f, playerPos.z);
        TickSun();
        if (_oceanMat != null)
            _oceanMat.SetTextureOffset("_MainTex", new Vector2(Time.time * 0.018f, Time.time * 0.01f));
    }

    void TickSun()
    {
        float t = Mathf.Repeat(Time.time / _period, 1f);
        float theta = Mathf.Lerp(-95f, 95f, t) * Mathf.Deg2Rad;
        float r = 118f;
        Vector3 local = new Vector3(Mathf.Sin(theta) * r, Mathf.Max(6f, Mathf.Cos(theta) * r * 0.62f + 18f), 95f);
        if (_sunBall != null)
        {
            _sunBall.parent.localPosition = local;
            float above = Mathf.Clamp01((local.y - 4f) / 70f);
            _sunBall.localScale = Vector3.one * Mathf.Lerp(16f, 24f, above);
            _sunBall.Rotate(0f, 10f * Time.deltaTime, 6f * Time.deltaTime, Space.Self);
        }
        if (sun != null)
        {
            Vector3 world = transform.TransformPoint(local);
            Vector3 look = transform.position + Vector3.up * 2f + Vector3.forward * 30f;
            sun.transform.rotation = Quaternion.LookRotation((look - world).normalized);
            float day = Mathf.Clamp01(Mathf.Sin(t * Mathf.PI));
            sun.intensity = 0.45f + day * 1.05f;
            Color dawn = new Color(1f, 0.5f, 0.28f);
            Color noon = new Color(1f, 0.94f, 0.75f);
            Color dusk = new Color(1f, 0.38f, 0.2f);
            sun.color = t < 0.5f ? Color.Lerp(dawn, noon, t * 2f) : Color.Lerp(noon, dusk, (t - 0.5f) * 2f);
        }
        if (_sky == null) _sky = RenderSettings.skybox;
        if (_sky != null && _sky.HasProperty("_SkyTint"))
        {
            Color morning = new Color(0.45f, 0.62f, 0.95f);
            Color day = new Color(0.35f, 0.62f, 1f);
            Color evening = new Color(0.55f, 0.4f, 0.7f);
            Color tint = t < 0.5f ? Color.Lerp(morning, day, t * 2f) : Color.Lerp(day, evening, (t - 0.5f) * 2f);
            _sky.SetColor("_SkyTint", tint);
            _sky.SetFloat("_AtmosphereThickness", 0.85f + (1f - Mathf.Sin(t * Mathf.PI)) * 0.35f);
        }
        RenderSettings.ambientSkyColor = Color.Lerp(new Color(0.45f, 0.55f, 0.85f), new Color(0.55f, 0.72f, 1f), Mathf.Sin(t * Mathf.PI));
    }
}
