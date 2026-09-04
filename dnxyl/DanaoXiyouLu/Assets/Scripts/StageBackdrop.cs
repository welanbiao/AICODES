using UnityEngine;

public class StageBackdrop : MonoBehaviour
{
    public Light sun;
    Transform _sunBall;
    Transform _clouds;
    Transform _mountain;
    Material _sky;
    float _period = 56f;

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

        Danao.Mesh(_mountain, "peak", MeshForge.Peak(), new Vector3(0f, -46f, 62f), new Vector3(78f, 58f, 78f), mtn);
        Danao.Mesh(_mountain, "snow", MeshForge.Peak(), new Vector3(0f, 2f, 62f), new Vector3(22f, 14f, 22f), snow);
        Danao.Mesh(_mountain, "ridgeL", MeshForge.Peak(), new Vector3(-38f, -52f, 28f), new Vector3(36f, 50f, 70f), mtn);
        Danao.Mesh(_mountain, "ridgeR", MeshForge.Peak(), new Vector3(40f, -54f, 34f), new Vector3(38f, 52f, 72f), mtn);
        Danao.Mesh(_mountain, "far", MeshForge.Peak(), new Vector3(-22f, -70f, 150f), new Vector3(110f, 78f, 110f), rock);
        Danao.Mesh(_mountain, "far2", MeshForge.Peak(), new Vector3(64f, -76f, 175f), new Vector3(88f, 70f, 88f), mtn);
        Danao.Mesh(_mountain, "cliffL", MeshForge.Peak(), new Vector3(-14f, -42f, 8f), new Vector3(18f, 40f, 36f), rock);
        Danao.Mesh(_mountain, "cliffR", MeshForge.Peak(), new Vector3(15f, -43f, 12f), new Vector3(17f, 40f, 34f), rock);

        for (int i = 0; i < 8; i++)
        {
            float a = i / 8f * Mathf.PI * 2f;
            Color c = Danao.WuXing[i % 5];
            Danao.Mesh(_mountain, "vein" + i, MeshForge.Crystal(),
                new Vector3(Mathf.Cos(a) * 10f, -2f - (i % 3), 48f + Mathf.Sin(a) * 10f),
                new Vector3(1.8f, 4.2f + i % 3, 1.8f),
                Quaternion.Euler(12, a * Mathf.Rad2Deg, 8),
                Mats.Solid(c, Color.white, c * 0.28f, "vein" + i));
        }

        _clouds = Danao.Node(transform, "clouds", Vector3.zero);
        BuildCloudSea();
        BuildColorRivers();
        BuildPeakFlow();

        var sunRoot = Danao.Node(transform, "sunRig", Vector3.zero);
        _sunBall = Danao.Mesh(sunRoot, "sun", MeshForge.Sphere(28, 18), Vector3.zero, Vector3.one * 18f, Mats.SunBall()).transform;
        var halo = Danao.Mesh(sunRoot, "halo", MeshForge.Sphere(16, 12), Vector3.zero, Vector3.one * 26f,
            Mats.Glow(new Color(1f, 0.72f, 0.32f, 0.28f), "sunHalo"));
        halo.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        _sunBall.GetComponent<MeshRenderer>().shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
    }

    void BuildCloudSea()
    {
        for (int i = 0; i < 52; i++)
        {
            int e = i % 5;
            Color c = Color.Lerp(Color.white, Danao.WuXing[e], 0.38f);
            c = Color.Lerp(c, new Color(1f, 0.86f, 0.62f), 0.22f);
            c.a = 0.78f;
            float x = Random.Range(-110f, 110f);
            float y = Random.Range(-28f, -12f);
            float z = Random.Range(-50f, 160f);
            var r = Danao.Mesh(_clouds, "sea" + i, MeshForge.Sphere(16, 12),
                new Vector3(x, y, z),
                new Vector3(Random.Range(12f, 26f), Random.Range(3.4f, 7.2f), Random.Range(10f, 20f)),
                Mats.Cloud(c, "sea" + e + (i % 4)));
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            var drift = r.gameObject.AddComponent<CloudDrift>();
            drift.vel = new Vector3(Random.Range(1.8f, 3.8f), Random.Range(-0.08f, 0.14f), Random.Range(-0.35f, 0.7f));
            drift.wrapX = 120f;
            drift.wrapZ = 170f;
        }
    }

    void BuildColorRivers()
    {
        float[] xs = { -36f, -18f, 0f, 18f, 36f };
        for (int i = 0; i < 5; i++)
        {
            Color c = Color.Lerp(Color.white, Danao.WuXing[i], 0.62f);
            c.a = 0.82f;
            var r = Danao.Mesh(_clouds, "river" + i, MeshForge.Quad(),
                new Vector3(xs[i], -16f, 48f),
                new Vector3(22f, 1f, 120f),
                Quaternion.Euler(8f, 0f, i * 3f - 6f),
                Mats.Cloud(c, "river" + i));
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            var drift = r.gameObject.AddComponent<CloudDrift>();
            drift.vel = new Vector3(0.4f + i * 0.15f, 0.04f, 1.1f);
            drift.wrapX = 80f;
            drift.wrapZ = 90f;
        }
    }

    void BuildPeakFlow()
    {
        for (int i = 0; i < 22; i++)
        {
            Color c = Color.Lerp(Color.white, Danao.WuXing[i % 5], 0.58f);
            c.a = 0.8f;
            var r = Danao.Mesh(_clouds, "flow" + i, MeshForge.Sphere(14, 10),
                new Vector3(Random.Range(-10f, 10f), Random.Range(1.5f, 12f), Random.Range(8f, 40f)),
                new Vector3(Random.Range(5f, 11f), Random.Range(1.8f, 3.6f), Random.Range(4f, 8.5f)),
                Mats.Cloud(c, "flow" + (i % 5)));
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            var drift = r.gameObject.AddComponent<CloudDrift>();
            drift.vel = new Vector3(Random.Range(2.4f, 4.8f), Random.Range(0.08f, 0.4f), Random.Range(0.8f, 2.1f));
            drift.wrapX = 70f;
            drift.wrapZ = 80f;
        }
    }

    public void Follow(Vector3 playerPos)
    {
        transform.position = new Vector3(0f, 0f, playerPos.z);
        TickSun();
    }

    void TickSun()
    {
        float t = Mathf.Repeat(Time.time / _period, 1f);
        float theta = Mathf.Lerp(-108f, 108f, t) * Mathf.Deg2Rad;
        float r = 145f;
        Vector3 local = new Vector3(Mathf.Sin(theta) * r, Mathf.Cos(theta) * r * 0.68f + 10f, 70f);
        if (_sunBall != null)
        {
            _sunBall.parent.localPosition = local;
            float above = Mathf.Clamp01((local.y + 12f) / 80f);
            _sunBall.localScale = Vector3.one * Mathf.Lerp(12f, 20f, above);
            _sunBall.Rotate(0f, 8f * Time.deltaTime, 4f * Time.deltaTime, Space.Self);
        }
        if (sun != null)
        {
            Vector3 world = transform.TransformPoint(local);
            Vector3 look = transform.position + Vector3.up * 4f + Vector3.forward * 24f;
            sun.transform.rotation = Quaternion.LookRotation((look - world).normalized);
            float day = Mathf.Clamp01(Mathf.Sin(t * Mathf.PI));
            sun.intensity = 0.32f + day * 1.15f;
            Color dawn = new Color(1f, 0.48f, 0.28f);
            Color noon = new Color(1f, 0.93f, 0.72f);
            Color dusk = new Color(1f, 0.36f, 0.18f);
            sun.color = t < 0.5f ? Color.Lerp(dawn, noon, t * 2f) : Color.Lerp(noon, dusk, (t - 0.5f) * 2f);
        }
        if (_sky == null) _sky = RenderSettings.skybox;
        if (_sky != null && _sky.HasProperty("_SkyTint"))
        {
            Color morning = new Color(1f, 0.62f, 0.38f);
            Color day = new Color(1f, 0.78f, 0.48f);
            Color evening = new Color(0.95f, 0.38f, 0.28f);
            Color tint = t < 0.5f ? Color.Lerp(morning, day, t * 2f) : Color.Lerp(day, evening, (t - 0.5f) * 2f);
            _sky.SetColor("_SkyTint", tint);
            _sky.SetFloat("_AtmosphereThickness", 0.95f + (1f - Mathf.Sin(t * Mathf.PI)) * 0.4f);
        }
        RenderSettings.ambientSkyColor = Color.Lerp(new Color(0.75f, 0.42f, 0.32f), new Color(1f, 0.78f, 0.55f), Mathf.Sin(t * Mathf.PI));
    }
}

public class CloudDrift : MonoBehaviour
{
    public Vector3 vel;
    public float wrapX = 100f;
    public float wrapZ = 140f;

    void Update()
    {
        transform.localPosition += vel * Time.deltaTime;
        Vector3 p = transform.localPosition;
        if (p.x > wrapX) p.x -= wrapX * 2f;
        if (p.x < -wrapX) p.x += wrapX * 2f;
        if (p.z > wrapZ) p.z -= wrapZ * 2f;
        if (p.z < -wrapZ) p.z += wrapZ * 2f;
        transform.localPosition = p;
    }
}
