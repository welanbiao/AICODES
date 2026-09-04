using UnityEngine;

public static class Vfx
{
    public static void Burst(Vector3 pos, Color c, int n)
    {
        var go = new GameObject("burst");
        go.transform.position = pos;
        var ps = go.AddComponent<ParticleSystem>();
        var main = ps.main;
        main.startLifetime = 0.45f;
        main.startSpeed = 3.5f;
        main.startSize = 0.18f;
        main.startColor = c;
        main.gravityModifier = 0.4f;
        main.loop = false;
        main.playOnAwake = false;
        main.maxParticles = n + 4;
        var em = ps.emission;
        em.rateOverTime = 0;
        em.SetBursts(new[] { new ParticleSystem.Burst(0, (short)n) });
        var sh = ps.shape;
        sh.shapeType = ParticleSystemShapeType.Sphere;
        sh.radius = 0.15f;
        var col = ps.colorOverLifetime;
        col.enabled = true;
        var g = new Gradient();
        g.SetKeys(
            new[] { new GradientColorKey(c, 0), new GradientColorKey(Color.white, 1) },
            new[] { new GradientAlphaKey(1, 0), new GradientAlphaKey(0, 1) });
        col.color = g;
        var r = go.GetComponent<ParticleSystemRenderer>();
        r.material = Mats.Glow(c, "p_" + c.GetHashCode());
        r.renderMode = ParticleSystemRenderMode.Billboard;
        ps.Play();
        Object.Destroy(go, 1.1f);
    }

    public static GameObject Aura(Transform parent, Color c, float size)
    {
        var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        Object.Destroy(go.GetComponent<Collider>());
        go.name = "aura";
        go.transform.SetParent(parent, false);
        go.transform.localPosition = Vector3.up * 0.6f;
        go.transform.localScale = Vector3.one * size;
        var r = go.GetComponent<MeshRenderer>();
        r.sharedMaterial = Mats.Glow(new Color(c.r, c.g, c.b, 0.25f), "aura" + c.GetHashCode());
        r.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        return go;
    }

    public static void Ring(Vector3 pos, Color c, float dur)
    {
        var go = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
        Object.Destroy(go.GetComponent<Collider>());
        go.transform.position = pos;
        go.transform.localScale = new Vector3(0.4f, 0.02f, 0.4f);
        go.GetComponent<MeshRenderer>().sharedMaterial = Mats.Glow(c, "ring" + c.GetHashCode());
        go.AddComponent<RingGrow>().life = dur;
    }
}

public class RingGrow : MonoBehaviour
{
    public float life = 1.2f;
    float _t;

    void Update()
    {
        _t += Time.deltaTime;
        float k = _t / life;
        float s = Mathf.Lerp(0.4f, 8f, k);
        transform.localScale = new Vector3(s, 0.03f, s);
        if (_t >= life) Destroy(gameObject);
    }
}
