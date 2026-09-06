using UnityEngine;

public static class Vfx
{
    static Material Spark(Color c)
    {
        var sh = Shader.Find("Sprites/Default");
        if (sh == null) sh = Shader.Find("Unlit/Color");
        if (sh == null) sh = Shader.Find("Danao/GlowAdd");
        if (sh == null) sh = Shader.Find("Particles/Standard Unlit");
        var m = new Material(sh);
        if (m.HasProperty("_Color")) m.SetColor("_Color", c);
        if (m.HasProperty("_TintColor")) m.SetColor("_TintColor", c);
        if (m.HasProperty("_Tint")) m.SetColor("_Tint", c);
        m.color = c;
        return m;
    }

    public static void Burst(Vector3 pos, Color c, int n)
    {
        n = Mathf.Clamp(n, 6, 28);
        var go = new GameObject("burst");
        go.transform.position = pos;
        var ps = go.AddComponent<ParticleSystem>();
        var main = ps.main;
        main.startLifetime = 0.55f;
        main.startSpeed = 3.4f;
        main.startSize = 0.18f;
        main.startColor = c;
        main.gravityModifier = 0.22f;
        main.loop = false;
        main.playOnAwake = false;
        main.maxParticles = n + 8;
        main.simulationSpace = ParticleSystemSimulationSpace.World;
        main.useUnscaledTime = true;
        var em = ps.emission;
        em.rateOverTime = 0;
        em.SetBursts(new[] { new ParticleSystem.Burst(0, (short)n) });
        var sh = ps.shape;
        sh.shapeType = ParticleSystemShapeType.Sphere;
        sh.radius = 0.22f;
        var col = ps.colorOverLifetime;
        col.enabled = true;
        var g = new Gradient();
        g.SetKeys(
            new[] { new GradientColorKey(c, 0), new GradientColorKey(Color.white, 1) },
            new[] { new GradientAlphaKey(1, 0), new GradientAlphaKey(0, 1) });
        col.color = g;
        var r = go.GetComponent<ParticleSystemRenderer>();
        r.material = Spark(c);
        r.renderMode = ParticleSystemRenderMode.Billboard;
        ps.Play();
        Object.Destroy(go, 1.2f);

        int sparks = Mathf.Min(10, n / 2);
        for (int i = 0; i < sparks; i++)
        {
            var sp = GameObject.CreatePrimitive(PrimitiveType.Sphere);
            Object.Destroy(sp.GetComponent<Collider>());
            sp.transform.position = pos + Random.insideUnitSphere * 0.18f;
            sp.transform.localScale = Vector3.one * Random.Range(0.08f, 0.16f);
            var mr = sp.GetComponent<MeshRenderer>();
            mr.sharedMaterial = Mats.Unlit(c, "vfxSpark" + c.GetHashCode());
            mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
            var fly = sp.AddComponent<SparkFly>();
            fly.vel = Random.insideUnitSphere * 4.2f + Vector3.up * 1.6f;
            fly.life = 0.7f;
        }
    }

    public static GameObject Aura(Transform parent, Color c, float size)
    {
        return null;
    }

    public static void Ring(Vector3 pos, Color c, float dur)
    {
        var go = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        Object.Destroy(go.GetComponent<Collider>());
        go.transform.position = pos;
        go.transform.localScale = new Vector3(0.35f, 0.015f, 0.35f);
        var mr = go.GetComponent<MeshRenderer>();
        mr.sharedMaterial = Mats.Unlit(new Color(c.r, c.g, c.b, 1f), "ringSolid" + c.GetHashCode());
        mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        go.AddComponent<RingGrow>().life = dur * 0.65f;
    }
}

public class SparkFly : MonoBehaviour
{
    public Vector3 vel;
    public float life = 0.7f;

    void Update()
    {
        float dt = Time.deltaTime;
        life -= dt;
        vel.y -= 4.2f * dt;
        transform.position += vel * dt;
        float k = Mathf.Clamp01(life / 0.7f);
        transform.localScale = Vector3.one * (0.06f + 0.1f * k);
        if (life <= 0f) Destroy(gameObject);
    }
}

public class RingGrow : MonoBehaviour
{
    public float life = 0.7f;
    float _t;

    void Update()
    {
        _t += Time.deltaTime;
        float k = _t / life;
        float s = Mathf.Lerp(0.35f, 3.2f, k);
        transform.localScale = new Vector3(s, 0.02f, s);
        if (_t >= life) Destroy(gameObject);
    }
}
