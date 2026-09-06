using UnityEngine;

public static class SpiritFigure
{
    static readonly Material[] Flesh = new Material[5];
    static readonly Material[] Core = new Material[5];
    static Shader _inner;

    public static Color Hue(int elem)
    {
        switch (Mathf.Clamp(elem, 0, 4))
        {
            case 0: return new Color(1.00f, 0.82f, 0.16f);
            case 1: return new Color(0.14f, 0.84f, 0.22f);
            case 2: return new Color(0.12f, 0.40f, 1.00f);
            case 3: return new Color(1.00f, 0.10f, 0.06f);
            default: return new Color(0.70f, 0.46f, 0.22f);
        }
    }

    static Shader InnerShader()
    {
        if (_inner == null)
        {
            var keep = Resources.Load<Material>("Keep/KeepSpiritInner");
            if (keep != null) _inner = keep.shader;
        }
        if (_inner == null) _inner = Shader.Find("Danao/SpiritInner");
        if (_inner == null) _inner = Shader.Find("Danao/Mythic");
        if (_inner == null) _inner = Shader.Find("Unlit/Color");
        if (_inner == null) _inner = Shader.Find("Sprites/Default");
        if (_inner == null) _inner = Shader.Find("Standard");
        return _inner;
    }

    static Material MakeInner(Color c, Color emit, float gloss, float flow)
    {
        var m = new Material(InnerShader());
        m.SetColor("_Color", c);
        m.SetColor("_Emission", emit);
        if (m.HasProperty("_FlowSpeed")) m.SetFloat("_FlowSpeed", flow);
        if (m.HasProperty("_Gloss")) m.SetFloat("_Gloss", gloss);
        if (m.HasProperty("_RimColor")) m.SetColor("_RimColor", Color.Lerp(c, Color.black, 0.55f));
        if (m.HasProperty("_RimPower")) m.SetFloat("_RimPower", 4.5f);
        if (m.HasProperty("_MainTex")) m.SetTexture("_MainTex", Tex.White);
        return m;
    }

    public static Material BodyMat(int elem)
    {
        elem = Mathf.Clamp(elem, 0, 4);
        if (Flesh[elem] != null) return Flesh[elem];
        Color c = Hue(elem);
        Flesh[elem] = MakeInner(c, c * 0.72f, 0.48f, 2.35f + elem * 0.18f);
        return Flesh[elem];
    }

    public static Material CoreMat(int elem)
    {
        elem = Mathf.Clamp(elem, 0, 4);
        if (Core[elem] != null) return Core[elem];
        Color c = Color.Lerp(Hue(elem), Color.white, 0.22f);
        Core[elem] = MakeInner(c, c * 1.15f, 0.62f, 3.4f);
        return Core[elem];
    }

    public static void Clear(Transform t)
    {
        for (int i = t.childCount - 1; i >= 0; i--)
            Object.Destroy(t.GetChild(i).gameObject);
    }

    public static void Attach(Transform t, int elem, float s)
    {
        elem = Mathf.Clamp(elem, 0, 4);
        var body = BodyMat(elem);
        var core = CoreMat(elem);

        Danao.Mesh(t, "footL", MeshForge.Sphere(20, 14), new Vector3(-0.12f * s, 0.07f * s, 0.03f * s), Vector3.one * 0.13f * s, body);
        Danao.Mesh(t, "footR", MeshForge.Sphere(20, 14), new Vector3(0.12f * s, 0.07f * s, 0.03f * s), Vector3.one * 0.13f * s, body);
        Danao.Mesh(t, "legL", MeshForge.Capsule(22, 12), new Vector3(-0.12f * s, 0.36f * s, 0f), new Vector3(0.12f * s, 0.30f * s, 0.12f * s), body);
        Danao.Mesh(t, "legR", MeshForge.Capsule(22, 12), new Vector3(0.12f * s, 0.36f * s, 0f), new Vector3(0.12f * s, 0.30f * s, 0.12f * s), body);
        Danao.Mesh(t, "thighL", MeshForge.Capsule(22, 12), new Vector3(-0.11f * s, 0.68f * s, 0.01f * s), new Vector3(0.14f * s, 0.24f * s, 0.14f * s), body);
        Danao.Mesh(t, "thighR", MeshForge.Capsule(22, 12), new Vector3(0.11f * s, 0.68f * s, 0.01f * s), new Vector3(0.14f * s, 0.24f * s, 0.14f * s), body);
        Danao.Mesh(t, "hips", MeshForge.Sphere(24, 16), new Vector3(0f, 0.86f * s, 0f), new Vector3(0.24f * s, 0.14f * s, 0.16f * s), body);
        Danao.Mesh(t, "torso", MeshForge.SpiritBody(), new Vector3(0f, 1.18f * s, 0.02f * s), Vector3.one * s, body);
        Danao.Mesh(t, "heart", MeshForge.Sphere(16, 12), new Vector3(0f, 1.22f * s, 0.08f * s), Vector3.one * 0.07f * s, core);
        Danao.Mesh(t, "neck", MeshForge.Capsule(18, 10), new Vector3(0f, 1.48f * s, 0.01f * s), new Vector3(0.09f * s, 0.08f * s, 0.09f * s), body);
        Danao.Mesh(t, "head", MeshForge.SpiritHead(), new Vector3(0f, 1.68f * s, 0.03f * s), Vector3.one * s, body);
        Danao.Mesh(t, "hair", MeshForge.Sphere(24, 16), new Vector3(0f, 1.80f * s, -0.03f * s), new Vector3(0.24f * s, 0.16f * s, 0.24f * s), body);
        Danao.Mesh(t, "eyeL", MeshForge.Sphere(12, 10), new Vector3(-0.07f * s, 1.70f * s, 0.18f * s), Vector3.one * 0.045f * s, core);
        Danao.Mesh(t, "eyeR", MeshForge.Sphere(12, 10), new Vector3(0.07f * s, 1.70f * s, 0.18f * s), Vector3.one * 0.045f * s, core);
        Danao.Mesh(t, "shL", MeshForge.Sphere(18, 12), new Vector3(-0.26f * s, 1.40f * s, 0f), Vector3.one * 0.14f * s, body);
        Danao.Mesh(t, "shR", MeshForge.Sphere(18, 12), new Vector3(0.26f * s, 1.40f * s, 0f), Vector3.one * 0.14f * s, body);
        Danao.Mesh(t, "armL", MeshForge.Capsule(20, 10), new Vector3(-0.34f * s, 1.16f * s, 0.02f * s),
            new Vector3(0.11f * s, 0.28f * s, 0.11f * s), Quaternion.Euler(10f, 0f, 18f), body);
        Danao.Mesh(t, "armR", MeshForge.Capsule(20, 10), new Vector3(0.34f * s, 1.16f * s, 0.02f * s),
            new Vector3(0.11f * s, 0.28f * s, 0.11f * s), Quaternion.Euler(10f, 0f, -18f), body);
        Danao.Mesh(t, "handL", MeshForge.Sphere(14, 10), new Vector3(-0.46f * s, 0.88f * s, 0.06f * s), Vector3.one * 0.10f * s, body);
        Danao.Mesh(t, "handR", MeshForge.Sphere(14, 10), new Vector3(0.46f * s, 0.88f * s, 0.06f * s), Vector3.one * 0.10f * s, body);

        switch (elem)
        {
            case 0:
                Danao.Mesh(t, "crest", MeshForge.Crystal(), new Vector3(0f, 1.96f * s, 0.01f * s),
                    new Vector3(0.10f * s, 0.16f * s, 0.10f * s), core);
                break;
            case 1:
                Danao.Mesh(t, "leaf1", MeshForge.Sphere(16, 12), new Vector3(-0.10f * s, 1.94f * s, 0.02f * s),
                    new Vector3(0.12f * s, 0.09f * s, 0.12f * s), body);
                Danao.Mesh(t, "leaf2", MeshForge.Sphere(16, 12), new Vector3(0.11f * s, 1.96f * s, -0.02f * s),
                    new Vector3(0.11f * s, 0.08f * s, 0.11f * s), core);
                break;
            case 2:
                Danao.Mesh(t, "drop", MeshForge.Drop(), new Vector3(0f, 2.00f * s, 0.02f * s),
                    new Vector3(0.10f * s, 0.14f * s, 0.10f * s), core);
                break;
            case 3:
                Danao.Mesh(t, "flame", MeshForge.Flame(), new Vector3(0f, 2.02f * s, 0.01f * s),
                    new Vector3(0.18f * s, 0.28f * s, 0.18f * s), core);
                break;
            default:
                Danao.Mesh(t, "crown", MeshForge.Golem(), new Vector3(0f, 1.90f * s, 0f),
                    new Vector3(0.16f * s, 0.10f * s, 0.16f * s), body);
                break;
        }
    }
}

public class HumanoidMark : MonoBehaviour { }
