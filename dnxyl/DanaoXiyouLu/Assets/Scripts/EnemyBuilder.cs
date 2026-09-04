using UnityEngine;

public enum MobKind
{
    Metal, Wood, Water, Fire, Earth,
    Tiger, Wolf, Boar, Snake,
    MonkeyGeneral,
    FishMan, Shark, Crab, Jelly,
    DiscipleSword, DiscipleStaff, GoldenGuard
}

public static class EnemyBuilder
{
    public static GameObject Build(MobKind kind, Transform parent)
    {
        switch (kind)
        {
            case MobKind.Metal: return Spirit(parent, 0, PrimitiveType.Cube);
            case MobKind.Wood: return Spirit(parent, 1, PrimitiveType.Capsule);
            case MobKind.Water: return Spirit(parent, 2, PrimitiveType.Sphere);
            case MobKind.Fire: return Spirit(parent, 3, PrimitiveType.Capsule);
            case MobKind.Earth: return Spirit(parent, 4, PrimitiveType.Cube);
            case MobKind.Tiger: return Beast(parent, new Color(0.9f, 0.55f, 0.12f), 1.05f, true);
            case MobKind.Wolf: return Beast(parent, new Color(0.45f, 0.48f, 0.52f), 0.92f, false);
            case MobKind.Boar: return Beast(parent, new Color(0.42f, 0.28f, 0.18f), 0.88f, false);
            case MobKind.Snake: return Snake(parent);
            case MobKind.MonkeyGeneral: return MonkeyGen(parent);
            case MobKind.FishMan: return Fish(parent, new Color(0.2f, 0.55f, 0.55f), 1f);
            case MobKind.Shark: return Fish(parent, new Color(0.25f, 0.32f, 0.4f), 1.25f);
            case MobKind.Crab: return Crab(parent);
            case MobKind.Jelly: return Jelly(parent);
            case MobKind.DiscipleSword: return Disciple(parent, new Color(0.55f, 0.18f, 0.18f), true);
            case MobKind.DiscipleStaff: return Disciple(parent, new Color(0.18f, 0.35f, 0.55f), false);
            default: return Disciple(parent, new Color(0.72f, 0.62f, 0.22f), true);
        }
    }

    public static int ElementOf(MobKind k)
    {
        if (k == MobKind.Metal) return 0;
        if (k == MobKind.Wood) return 1;
        if (k == MobKind.Water) return 2;
        if (k == MobKind.Fire) return 3;
        if (k == MobKind.Earth) return 4;
        return -1;
    }

    static GameObject Spirit(Transform parent, int elem, PrimitiveType body)
    {
        Color c = Danao.WuXing[elem];
        var root = Danao.Node(parent, "Spirit_" + Danao.WuXingNames[elem], Vector3.up * 0.7f).gameObject;
        var mat = Mats.Solid(c, Color.white, c * 0.5f, "sp" + elem);
        Danao.Prim(root.transform, "body", body, Vector3.zero, new Vector3(0.55f, 0.8f, 0.45f), mat);
        Danao.Prim(root.transform, "head", PrimitiveType.Sphere, new Vector3(0, 0.55f, 0), Vector3.one * 0.42f, mat);
        Danao.Prim(root.transform, "core", PrimitiveType.Sphere, new Vector3(0, 0.1f, 0.18f), Vector3.one * 0.22f,
            Mats.Solid(Color.white, c, c, "spc" + elem));
        Danao.Prim(root.transform, "armL", PrimitiveType.Capsule, new Vector3(-0.38f, 0.05f, 0), new Vector3(0.16f, 0.28f, 0.16f), mat);
        Danao.Prim(root.transform, "armR", PrimitiveType.Capsule, new Vector3(0.38f, 0.05f, 0), new Vector3(0.16f, 0.28f, 0.16f), mat);
        if (elem == 1)
        {
            Danao.Prim(root.transform, "leaf", PrimitiveType.Sphere, new Vector3(0, 0.85f, 0), new Vector3(0.35f, 0.12f, 0.2f), mat);
        }
        if (elem == 0)
        {
            Danao.Prim(root.transform, "blade", PrimitiveType.Cube, new Vector3(0.45f, 0.2f, 0), new Vector3(0.08f, 0.55f, 0.02f), Mats.Gold);
        }
        var bob = root.AddComponent<BobSpin>();
        bob.spin = new Vector3(0, 50 + elem * 10, 0);
        bob.amp = 0.14f;
        return root;
    }

    static GameObject Beast(Transform parent, Color fur, float scale, bool stripes)
    {
        var root = Danao.Node(parent, "Beast", Vector3.zero).gameObject;
        var mat = Mats.Solid(fur, Color.Lerp(fur, Color.white, 0.3f), fur * 0.08f, "beast" + fur.GetHashCode());
        Danao.Prim(root.transform, "body", PrimitiveType.Capsule, new Vector3(0, 0.45f * scale, 0), new Vector3(0.45f * scale, 0.35f * scale, 0.7f * scale), Quaternion.Euler(90, 0, 0), mat);
        Danao.Prim(root.transform, "head", PrimitiveType.Sphere, new Vector3(0, 0.58f * scale, 0.42f * scale), Vector3.one * 0.38f * scale, mat);
        Danao.Prim(root.transform, "snout", PrimitiveType.Sphere, new Vector3(0, 0.50f * scale, 0.58f * scale), new Vector3(0.18f, 0.14f, 0.22f) * scale, mat);
        Danao.Prim(root.transform, "earL", PrimitiveType.Sphere, new Vector3(-0.14f * scale, 0.78f * scale, 0.38f * scale), new Vector3(0.08f, 0.14f, 0.06f) * scale, mat);
        Danao.Prim(root.transform, "earR", PrimitiveType.Sphere, new Vector3(0.14f * scale, 0.78f * scale, 0.38f * scale), new Vector3(0.08f, 0.14f, 0.06f) * scale, mat);
        for (int i = 0; i < 4; i++)
        {
            float x = i % 2 == 0 ? -0.16f : 0.16f;
            float z = i < 2 ? 0.22f : -0.22f;
            Danao.Prim(root.transform, "leg" + i, PrimitiveType.Capsule, new Vector3(x, 0.22f, z) * scale, new Vector3(0.12f, 0.22f, 0.12f) * scale, mat);
        }
        if (stripes)
        {
            var sm = Mats.Dark;
            Danao.Prim(root.transform, "st1", PrimitiveType.Cube, new Vector3(0, 0.55f * scale, 0.05f), new Vector3(0.48f, 0.04f, 0.08f) * scale, sm);
            Danao.Prim(root.transform, "st2", PrimitiveType.Cube, new Vector3(0, 0.48f * scale, -0.1f), new Vector3(0.48f, 0.04f, 0.08f) * scale, sm);
        }
        Danao.Prim(root.transform, "eyeL", PrimitiveType.Sphere, new Vector3(-0.1f, 0.64f, 0.55f) * scale, Vector3.one * 0.06f * scale, Mats.EyeGold);
        Danao.Prim(root.transform, "eyeR", PrimitiveType.Sphere, new Vector3(0.1f, 0.64f, 0.55f) * scale, Vector3.one * 0.06f * scale, Mats.EyeGold);
        root.transform.localScale = Vector3.one * scale;
        return root;
    }

    static GameObject Snake(Transform parent)
    {
        var root = Danao.Node(parent, "Snake", Vector3.up * 0.2f).gameObject;
        var mat = Mats.Solid(new Color(0.25f, 0.7f, 0.35f), "snake");
        for (int i = 0; i < 6; i++)
            Danao.Prim(root.transform, "s" + i, PrimitiveType.Sphere, new Vector3(Mathf.Sin(i) * 0.1f, 0.12f * i, -0.16f * i), Vector3.one * (0.28f - i * 0.02f), mat);
        Danao.Prim(root.transform, "head", PrimitiveType.Sphere, new Vector3(0, 0.85f, 0.15f), new Vector3(0.28f, 0.22f, 0.38f), mat);
        return root;
    }

    static GameObject MonkeyGen(Transform parent)
    {
        var root = Danao.Node(parent, "MonkeyGeneral", Vector3.zero).gameObject;
        Danao.Prim(root.transform, "body", PrimitiveType.Capsule, new Vector3(0, 0.7f, 0), new Vector3(0.4f, 0.35f, 0.28f), Mats.Fur);
        Danao.Prim(root.transform, "head", PrimitiveType.Sphere, new Vector3(0, 1.15f, 0.05f), Vector3.one * 0.32f, Mats.Skin);
        Danao.Prim(root.transform, "hair", PrimitiveType.Sphere, new Vector3(0, 1.28f, 0), new Vector3(0.3f, 0.16f, 0.3f), Mats.Hair);
        Danao.Prim(root.transform, "armor", PrimitiveType.Cube, new Vector3(0, 0.75f, 0.05f), new Vector3(0.42f, 0.28f, 0.28f), Mats.Gold);
        Danao.Prim(root.transform, "helm", PrimitiveType.Cylinder, new Vector3(0, 1.32f, 0), new Vector3(0.18f, 0.06f, 0.18f), Mats.Gold);
        Danao.Prim(root.transform, "armL", PrimitiveType.Capsule, new Vector3(-0.32f, 0.7f, 0), new Vector3(0.12f, 0.22f, 0.12f), Mats.Fur);
        Danao.Prim(root.transform, "armR", PrimitiveType.Capsule, new Vector3(0.32f, 0.7f, 0), new Vector3(0.12f, 0.22f, 0.12f), Mats.Fur);
        Danao.Prim(root.transform, "legL", PrimitiveType.Capsule, new Vector3(-0.12f, 0.28f, 0), new Vector3(0.14f, 0.22f, 0.14f), Mats.Fur);
        Danao.Prim(root.transform, "legR", PrimitiveType.Capsule, new Vector3(0.12f, 0.28f, 0), new Vector3(0.14f, 0.22f, 0.14f), Mats.Fur);
        Danao.Prim(root.transform, "staff", PrimitiveType.Cylinder, new Vector3(0.38f, 0.85f, 0.1f), new Vector3(0.04f, 0.45f, 0.04f), Mats.Gold);
        return root;
    }

    static GameObject Fish(Transform parent, Color c, float scale)
    {
        var root = Danao.Node(parent, "Fish", Vector3.up * 0.4f).gameObject;
        var mat = Mats.Solid(c, Color.cyan, c * 0.2f, "fish" + c.GetHashCode());
        Danao.Prim(root.transform, "body", PrimitiveType.Sphere, Vector3.zero, new Vector3(0.35f, 0.28f, 0.7f) * scale, mat);
        Danao.Prim(root.transform, "tail", PrimitiveType.Cube, new Vector3(0, 0, -0.45f) * scale, new Vector3(0.05f, 0.32f, 0.22f) * scale, mat);
        Danao.Prim(root.transform, "fin", PrimitiveType.Cube, new Vector3(0, 0.22f, 0) * scale, new Vector3(0.04f, 0.22f, 0.18f) * scale, mat);
        Danao.Prim(root.transform, "eyeL", PrimitiveType.Sphere, new Vector3(-0.12f, 0.08f, 0.22f) * scale, Vector3.one * 0.08f * scale, Mats.EyeGold);
        Danao.Prim(root.transform, "eyeR", PrimitiveType.Sphere, new Vector3(0.12f, 0.08f, 0.22f) * scale, Vector3.one * 0.08f * scale, Mats.EyeGold);
        var bob = root.AddComponent<BobSpin>();
        bob.spin = new Vector3(0, 0, 0);
        bob.amp = 0.2f;
        bob.freq = 3f;
        return root;
    }

    static GameObject Crab(Transform parent)
    {
        var root = Danao.Node(parent, "Crab", Vector3.up * 0.25f).gameObject;
        var mat = Mats.Solid(new Color(0.85f, 0.25f, 0.18f), "crab");
        Danao.Prim(root.transform, "shell", PrimitiveType.Sphere, Vector3.zero, new Vector3(0.7f, 0.28f, 0.5f), mat);
        Danao.Prim(root.transform, "clawL", PrimitiveType.Cube, new Vector3(-0.45f, 0.05f, 0.25f), new Vector3(0.28f, 0.12f, 0.18f), mat);
        Danao.Prim(root.transform, "clawR", PrimitiveType.Cube, new Vector3(0.45f, 0.05f, 0.25f), new Vector3(0.28f, 0.12f, 0.18f), mat);
        return root;
    }

    static GameObject Jelly(Transform parent)
    {
        var root = Danao.Node(parent, "Jelly", Vector3.up * 0.6f).gameObject;
        var mat = Mats.Solid(new Color(0.55f, 0.85f, 1f, 0.7f), Color.white, new Color(0.2f, 0.4f, 0.6f), "jelly");
        Danao.Prim(root.transform, "dome", PrimitiveType.Sphere, Vector3.zero, new Vector3(0.55f, 0.35f, 0.55f), mat);
        for (int i = 0; i < 5; i++)
            Danao.Prim(root.transform, "t" + i, PrimitiveType.Capsule, new Vector3((i - 2) * 0.1f, -0.35f, 0), new Vector3(0.06f, 0.22f, 0.06f), mat);
        var bob = root.AddComponent<BobSpin>();
        bob.amp = 0.25f;
        return root;
    }

    static GameObject Disciple(Transform parent, Color robe, bool sword)
    {
        var root = Danao.Node(parent, "Disciple", Vector3.zero).gameObject;
        var rm = Mats.Solid(robe, Color.Lerp(robe, Color.white, 0.4f), robe * 0.1f, "disc" + robe.GetHashCode());
        Danao.Prim(root.transform, "body", PrimitiveType.Capsule, new Vector3(0, 0.75f, 0), new Vector3(0.35f, 0.4f, 0.22f), rm);
        Danao.Prim(root.transform, "head", PrimitiveType.Sphere, new Vector3(0, 1.22f, 0), Vector3.one * 0.26f, Mats.Skin);
        Danao.Prim(root.transform, "hair", PrimitiveType.Sphere, new Vector3(0, 1.34f, -0.02f), new Vector3(0.24f, 0.12f, 0.24f), Mats.Dark);
        Danao.Prim(root.transform, "hat", PrimitiveType.Cylinder, new Vector3(0, 1.42f, 0), new Vector3(0.16f, 0.05f, 0.16f), Mats.Gold);
        Danao.Prim(root.transform, "armL", PrimitiveType.Capsule, new Vector3(-0.28f, 0.8f, 0), new Vector3(0.1f, 0.22f, 0.1f), rm);
        Danao.Prim(root.transform, "armR", PrimitiveType.Capsule, new Vector3(0.28f, 0.8f, 0), new Vector3(0.1f, 0.22f, 0.1f), rm);
        Danao.Prim(root.transform, "legL", PrimitiveType.Capsule, new Vector3(-0.1f, 0.28f, 0), new Vector3(0.12f, 0.22f, 0.12f), rm);
        Danao.Prim(root.transform, "legR", PrimitiveType.Capsule, new Vector3(0.1f, 0.28f, 0), new Vector3(0.12f, 0.22f, 0.12f), rm);
        if (sword)
            Danao.Prim(root.transform, "sword", PrimitiveType.Cube, new Vector3(0.38f, 0.95f, 0.05f), new Vector3(0.04f, 0.55f, 0.02f), Mats.Gold);
        else
            Danao.Prim(root.transform, "staff", PrimitiveType.Cylinder, new Vector3(0.34f, 1.0f, 0.05f), new Vector3(0.035f, 0.5f, 0.035f), Mats.Trim);
        return root;
    }
}
