using UnityEngine;

public class StageBackdrop : MonoBehaviour
{
    public Light sun;
    Transform _sunBall;
    Transform _clouds;
    Material _sky;
    float _period = 48f;

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
        var mtn = Mats.Solid(new Color(0.42f, 0.36f, 0.40f), new Color(0.85f, 0.7f, 0.75f), new Color(0.08f, 0.04f, 0.06f), "mtn");
        var snow = Mats.Solid(new Color(0.92f, 0.90f, 0.93f), Color.white, new Color(0.18f, 0.16f, 0.2f), "mtnSnow");
        var stone = Mats.Solid(new Color(0.38f, 0.32f, 0.30f), "mtnRock");

        Danao.Mesh(transform, "peak", MeshForge.Peak(), new Vector3(0f, -58f, 26f), new Vector3(86f, 58f, 86f), mtn);
        Danao.Mesh(transform, "snow", MeshForge.Peak(), new Vector3(0f, -8f, 24f), new Vector3(22f, 12f, 22f), snow);
        Danao.Mesh(transform, "ridgeL", MeshForge.Peak(), new Vector3(-48f, -64f, 70f), new Vector3(54f, 48f, 54f), mtn);
        Danao.Mesh(transform, "ridgeR", MeshForge.Peak(), new Vector3(52f, -70f, 88f), new Vector3(62f, 52f, 62f), mtn);
        Danao.Mesh(transform, "far", MeshForge.Peak(), new Vector3(-18f, -80f, 160f), new Vector3(120f, 72f, 120f), stone);
        Danao.Mesh(transform, "far2", MeshForge.Peak(), new Vector3(70f, -88f, 190f), new Vector3(90f, 64f, 90f), mtn);
        Danao.Mesh(transform, "shoulderL", MeshForge.Golem(), new Vector3(-14f, -6f, 8f), new Vector3(18f, 10f, 14f), stone);
        Danao.Mesh(transform, "shoulderR", MeshForge.Golem(), new Vector3(16f, -7f, 12f), new Vector3(16f, 9f, 13f), stone);

        for (int i = 0; i < 8; i++)
        {
            float a = i / 8f * Mathf.PI * 2f;
            Color c = Danao.WuXing[i % 5];
            Danao.Mesh(transform, "vein" + i, MeshForge.Crystal(),
                new Vector3(Mathf.Cos(a) * 18f, -4f - (i % 3), 20f + Mathf.Sin(a) * 14f),
                new Vector3(2.4f, 5.5f + i % 3, 2.4f),
                Quaternion.Euler(12, a * Mathf.Rad2Deg, 8),
                Mats.Solid(c, Color.white, c * 0.35f, "vein" + i));
        }

        _clouds = Danao.Node(transform, "clouds", Vector3.zero);
        BuildCloudSea();
        BuildPeakFlow();

        var sunRoot = Danao.Node(transform, "sunRig", Vector3.zero);
        _sunBall = Danao.Mesh(sunRoot, "sun", MeshForge.Sphere(24, 16), Vector3.zero, Vector3.one * 14f,
            Mats.Solid(new Color(1f, 0.86f, 0.45f), Color.white, new Color(1.2f, 0.7f, 0.2f), "sunBall")).transform;
        Danao.Mesh(sunRoot, "halo", MeshForge.Sphere(16, 12), Vector3.zero, Vector3.one * 22f,
            Mats.Glow(new Color(1f, 0.75f, 0.35f, 0.4f), "sunHalo"));
    }

    void BuildCloudSea()
    {
        for (int i = 0; i < 46; i++)
        {
            int e = i % 5;
            Color c = Color.Lerp(Color.white, Danao.WuXing[e], 0.42f);
            c = Color.Lerp(c, new Color(1f, 0.82f, 0.9f), 0.2f);
            float x = Random.Range(-95f, 95f);
            float y = Random.Range(-36f, -22f);
            float z = Random.Range(-40f, 140f);
            var r = Danao.Mesh(_clouds, "sea" + i, MeshForge.Sphere(14, 10),
                new Vector3(x, y, z),
                new Vector3(Random.Range(10f, 22f), Random.Range(3.2f, 6.5f), Random.Range(8f, 16f)),
                Mats.Cloud(c, "cloud" + e + (i % 3)));
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            var drift = r.gameObject.AddComponent<CloudDrift>();
            drift.vel = new Vector3(Random.Range(1.6f, 3.4f), Random.Range(-0.12f, 0.18f), Random.Range(-0.4f, 0.8f));
            drift.wrapX = 110f;
            drift.wrapZ = 160f;
        }
    }

    void BuildPeakFlow()
    {
        for (int i = 0; i < 18; i++)
        {
            Color c = Color.Lerp(Color.white, Danao.WuXing[i % 5], 0.55f);
            var r = Danao.Mesh(_clouds, "flow" + i, MeshForge.Sphere(12, 8),
                new Vector3(Random.Range(-8f, 8f), Random.Range(4f, 14f), Random.Range(10f, 36f)),
                new Vector3(Random.Range(4.5f, 9f), Random.Range(1.6f, 3.2f), Random.Range(3.5f, 7f)),
                Mats.Cloud(c, "flow" + (i % 5)));
            r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            var drift = r.gameObject.AddComponent<CloudDrift>();
            drift.vel = new Vector3(Random.Range(2.2f, 4.5f), Random.Range(0.05f, 0.35f), Random.Range(0.6f, 1.8f));
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
        float theta = Mathf.Lerp(-105f, 105f, t) * Mathf.Deg2Rad;
        float r = 130f;
        Vector3 local = new Vector3(Mathf.Sin(theta) * r, Mathf.Cos(theta) * r * 0.72f + 8f, 55f);
        if (_sunBall != null)
        {
            _sunBall.parent.localPosition = local;
            float above = Mathf.Clamp01((local.y + 10f) / 70f);
            _sunBall.localScale = Vector3.one * Mathf.Lerp(10f, 16f, above);
        }
        if (sun != null)
        {
            Vector3 world = transform.TransformPoint(local);
            Vector3 look = transform.position + Vector3.up * 4f + Vector3.forward * 20f;
            sun.transform.rotation = Quaternion.LookRotation((look - world).normalized);
            float day = Mathf.Clamp01(Mathf.Sin(t * Mathf.PI));
            sun.intensity = 0.28f + day * 1.05f;
            Color dawn = new Color(1f, 0.45f, 0.32f);
            Color noon = new Color(1f, 0.92f, 0.72f);
            Color dusk = new Color(1f, 0.38f, 0.22f);
            sun.color = t < 0.5f ? Color.Lerp(dawn, noon, t * 2f) : Color.Lerp(noon, dusk, (t - 0.5f) * 2f);
        }
        if (_sky == null) _sky = RenderSettings.skybox;
        if (_sky != null && _sky.HasProperty("_SkyTint"))
        {
            Color morning = new Color(0.55f, 0.35f, 0.75f);
            Color day = new Color(0.95f, 0.55f, 0.72f);
            Color evening = new Color(0.85f, 0.28f, 0.35f);
            Color tint = t < 0.5f ? Color.Lerp(morning, day, t * 2f) : Color.Lerp(day, evening, (t - 0.5f) * 2f);
            _sky.SetColor("_SkyTint", tint);
            _sky.SetFloat("_AtmosphereThickness", 0.85f + (1f - Mathf.Sin(t * Mathf.PI)) * 0.45f);
        }
        RenderSettings.ambientSkyColor = Color.Lerp(new Color(0.45f, 0.28f, 0.5f), new Color(0.85f, 0.62f, 0.75f), Mathf.Sin(t * Mathf.PI));
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
