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
            case MobKind.Metal: return Spirit(parent, 0);
            case MobKind.Wood: return Spirit(parent, 1);
            case MobKind.Water: return Spirit(parent, 2);
            case MobKind.Fire: return Spirit(parent, 3);
            case MobKind.Earth: return Spirit(parent, 4);
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

    static GameObject Spirit(Transform parent, int elem)
    {
        Color c = Danao.WuXing[elem];
        var root = Danao.Node(parent, "Spirit_" + Danao.WuXingNames[elem], Vector3.up * 0.62f).gameObject;
        var mat = Mats.Spirit(elem);
        switch (elem)
        {
            case 0:
                Danao.Mesh(root.transform, "body", MeshForge.Crystal(), Vector3.zero, new Vector3(0.7f, 1.05f, 0.7f), mat);
                Danao.Mesh(root.transform, "s1", MeshForge.Crystal(), new Vector3(-0.22f, -0.05f, 0.08f), new Vector3(0.32f, 0.55f, 0.32f), Quaternion.Euler(0, 25, 18), mat);
                Danao.Mesh(root.transform, "s2", MeshForge.Crystal(), new Vector3(0.2f, -0.08f, -0.04f), new Vector3(0.28f, 0.48f, 0.28f), Quaternion.Euler(8, -18, -12), mat);
                Danao.Mesh(root.transform, "core", MeshForge.Sphere(14, 10), new Vector3(0, 0.08f, 0.12f), Vector3.one * 0.16f, Mats.Gold);
                break;
            case 1:
                Danao.Mesh(root.transform, "trunk", MeshForge.Cylinder(12), new Vector3(0, -0.08f, 0), new Vector3(0.18f, 0.55f, 0.18f), mat);
                Danao.Mesh(root.transform, "leaf", MeshForge.Sphere(16, 12), new Vector3(0, 0.42f, 0), new Vector3(0.55f, 0.42f, 0.55f), mat);
                Danao.Mesh(root.transform, "leaf2", MeshForge.Sphere(12, 8), new Vector3(0.22f, 0.28f, 0.1f), new Vector3(0.28f, 0.22f, 0.28f), mat);
                Danao.Mesh(root.transform, "armL", MeshForge.Capsule(10, 6), new Vector3(-0.28f, 0.05f, 0), new Vector3(0.1f, 0.22f, 0.1f), mat);
                Danao.Mesh(root.transform, "armR", MeshForge.Capsule(10, 6), new Vector3(0.28f, 0.05f, 0), new Vector3(0.1f, 0.22f, 0.1f), mat);
                break;
            case 2:
                Danao.Mesh(root.transform, "body", MeshForge.Drop(), Vector3.zero, new Vector3(0.62f, 0.9f, 0.62f), mat);
                Danao.Mesh(root.transform, "d2", MeshForge.Drop(), new Vector3(-0.22f, -0.12f, 0.05f), new Vector3(0.28f, 0.4f, 0.28f), mat);
                Danao.Mesh(root.transform, "d3", MeshForge.Drop(), new Vector3(0.2f, -0.16f, -0.04f), new Vector3(0.24f, 0.34f, 0.24f), mat);
                Danao.Mesh(root.transform, "core", MeshForge.Sphere(12, 8), new Vector3(0, 0.06f, 0.12f), Vector3.one * 0.14f, Mats.White);
                break;
            case 3:
                Danao.Mesh(root.transform, "fl", MeshForge.Flame(), Vector3.zero, new Vector3(0.62f, 0.95f, 0.62f), mat);
                Danao.Mesh(root.transform, "fl2", MeshForge.Flame(), new Vector3(0.1f, -0.08f, 0), new Vector3(0.36f, 0.62f, 0.36f), Quaternion.Euler(0, 40, 10), mat);
                Danao.Mesh(root.transform, "core", MeshForge.Sphere(12, 8), new Vector3(0, -0.12f, 0.04f), Vector3.one * 0.18f, Mats.Gold);
                break;
            default:
                Danao.Mesh(root.transform, "body", MeshForge.Golem(), Vector3.zero, new Vector3(0.85f, 0.72f, 0.85f), mat);
                Danao.Mesh(root.transform, "r2", MeshForge.Golem(), new Vector3(0.22f, -0.12f, 0.08f), new Vector3(0.42f, 0.38f, 0.42f), mat);
                Danao.Mesh(root.transform, "head", MeshForge.Sphere(14, 10), new Vector3(0, 0.42f, 0.06f), Vector3.one * 0.32f, mat);
                Danao.Mesh(root.transform, "armL", MeshForge.Capsule(10, 6), new Vector3(-0.32f, 0.08f, 0), new Vector3(0.14f, 0.22f, 0.14f), mat);
                Danao.Mesh(root.transform, "armR", MeshForge.Capsule(10, 6), new Vector3(0.32f, 0.08f, 0), new Vector3(0.14f, 0.22f, 0.14f), mat);
                break;
        }
        Danao.Mesh(root.transform, "eyeL", MeshForge.Sphere(10, 8), new Vector3(-0.08f, 0.22f, 0.22f), Vector3.one * 0.07f, Mats.EyeGold);
        Danao.Mesh(root.transform, "eyeR", MeshForge.Sphere(10, 8), new Vector3(0.08f, 0.22f, 0.22f), Vector3.one * 0.07f, Mats.EyeGold);
        var bob = root.AddComponent<BobSpin>();
        bob.spin = new Vector3(0, 28 + elem * 6, 0);
        bob.amp = 0.12f;
        return root;
    }

    static GameObject Beast(Transform parent, Color fur, float scale, bool stripes)
    {
        var root = Danao.Node(parent, "Beast", Vector3.zero).gameObject;
        var mat = Mats.Solid(fur, Color.Lerp(fur, Color.white, 0.3f), fur * 0.08f, "beast" + fur.GetHashCode());
        Danao.Mesh(root.transform, "body", MeshForge.BeastBody(), new Vector3(0, 0.42f * scale, 0), new Vector3(0.9f, 0.7f, 1.35f) * scale, Quaternion.Euler(90, 0, 0), mat);
        Danao.Mesh(root.transform, "head", MeshForge.Sphere(20, 14), new Vector3(0, 0.58f * scale, 0.42f * scale), new Vector3(0.38f, 0.34f, 0.40f) * scale, mat);
        Danao.Mesh(root.transform, "snout", MeshForge.Drop(), new Vector3(0, 0.48f * scale, 0.62f * scale), new Vector3(0.22f, 0.16f, 0.28f) * scale, Quaternion.Euler(90, 0, 0), mat);
        Danao.Mesh(root.transform, "earL", MeshForge.Ear(), new Vector3(-0.14f * scale, 0.78f * scale, 0.32f * scale), Vector3.one * 0.55f * scale, mat);
        Danao.Mesh(root.transform, "earR", MeshForge.Ear(), new Vector3(0.14f * scale, 0.78f * scale, 0.32f * scale), new Vector3(-0.55f, 0.55f, 0.55f) * scale, mat);
        for (int i = 0; i < 4; i++)
        {
            float x = i % 2 == 0 ? -0.16f : 0.16f;
            float z = i < 2 ? 0.22f : -0.22f;
            Danao.Mesh(root.transform, "leg" + i, MeshForge.Capsule(12, 6), new Vector3(x, 0.22f, z) * scale, new Vector3(0.12f, 0.22f, 0.12f) * scale, mat);
        }
        Danao.Mesh(root.transform, "eyeL", MeshForge.Sphere(10, 8), new Vector3(-0.1f, 0.64f, 0.55f) * scale, Vector3.one * 0.06f * scale, Mats.EyeGold);
        Danao.Mesh(root.transform, "eyeR", MeshForge.Sphere(10, 8), new Vector3(0.1f, 0.64f, 0.55f) * scale, Vector3.one * 0.06f * scale, Mats.EyeGold);
        if (stripes)
        {
            Danao.Mesh(root.transform, "st1", MeshForge.Sphere(8, 6), new Vector3(0, 0.52f * scale, 0.05f), new Vector3(0.5f, 0.04f, 0.1f) * scale, Mats.Dark);
            Danao.Mesh(root.transform, "st2", MeshForge.Sphere(8, 6), new Vector3(0, 0.44f * scale, -0.08f), new Vector3(0.48f, 0.04f, 0.1f) * scale, Mats.Dark);
        }
        return root;
    }

    static GameObject Snake(Transform parent)
    {
        var root = Danao.Node(parent, "Snake", Vector3.up * 0.2f).gameObject;
        var mat = Mats.Solid(new Color(0.25f, 0.7f, 0.35f), "snake");
        for (int i = 0; i < 7; i++)
            Danao.Mesh(root.transform, "s" + i, MeshForge.Sphere(14, 10), new Vector3(Mathf.Sin(i * 0.7f) * 0.08f, 0.10f * i, -0.14f * i), Vector3.one * (0.26f - i * 0.018f), mat);
        Danao.Mesh(root.transform, "head", MeshForge.Drop(), new Vector3(0, 0.82f, 0.18f), new Vector3(0.32f, 0.22f, 0.42f), Quaternion.Euler(90, 0, 0), mat);
        return root;
    }

    static GameObject MonkeyGen(Transform parent)
    {
        var root = Danao.Node(parent, "MonkeyGeneral", Vector3.zero).gameObject;
        Danao.Mesh(root.transform, "body", MeshForge.Torso(), new Vector3(0, 0.62f, 0), Vector3.one * 0.95f, Mats.Fur);
        Danao.Mesh(root.transform, "head", MeshForge.WukongHead(), new Vector3(0, 1.12f, 0.04f), Vector3.one * 0.72f, Mats.Skin);
        Danao.Mesh(root.transform, "hair", MeshForge.WukongHairCap(), new Vector3(0, 1.16f, 0), Vector3.one * 0.78f, Mats.Hair);
        Danao.Mesh(root.transform, "armor", MeshForge.Robe(false), new Vector3(0, 0.7f, 0.02f), Vector3.one * 0.85f, Mats.Gold);
        Danao.Mesh(root.transform, "helm", MeshForge.Cylinder(16), new Vector3(0, 1.28f, 0), new Vector3(0.16f, 0.05f, 0.16f), Mats.Gold);
        Danao.Mesh(root.transform, "armL", MeshForge.Capsule(12, 6), new Vector3(-0.28f, 0.72f, 0), new Vector3(0.12f, 0.22f, 0.12f), Mats.Fur);
        Danao.Mesh(root.transform, "armR", MeshForge.Capsule(12, 6), new Vector3(0.28f, 0.72f, 0), new Vector3(0.12f, 0.22f, 0.12f), Mats.Fur);
        Danao.Mesh(root.transform, "legL", MeshForge.Capsule(12, 6), new Vector3(-0.1f, 0.28f, 0), new Vector3(0.14f, 0.22f, 0.14f), Mats.Fur);
        Danao.Mesh(root.transform, "legR", MeshForge.Capsule(12, 6), new Vector3(0.1f, 0.28f, 0), new Vector3(0.14f, 0.22f, 0.14f), Mats.Fur);
        Danao.Mesh(root.transform, "staff", MeshForge.StaffPole(), new Vector3(0.36f, 0.9f, 0.08f), new Vector3(0.04f, 0.9f, 0.04f), Mats.Gold);
        return root;
    }

    static GameObject Fish(Transform parent, Color c, float scale)
    {
        var root = Danao.Node(parent, "Fish", Vector3.up * 0.4f).gameObject;
        var mat = Mats.Solid(c, Color.cyan, c * 0.2f, "fish" + c.GetHashCode());
        Danao.Mesh(root.transform, "body", MeshForge.Drop(), Vector3.zero, new Vector3(0.38f, 0.28f, 0.85f) * scale, Quaternion.Euler(90, 0, 0), mat);
        Danao.Mesh(root.transform, "tail", MeshForge.Sphere(12, 8), new Vector3(0, 0, -0.42f) * scale, new Vector3(0.06f, 0.32f, 0.22f) * scale, mat);
        Danao.Mesh(root.transform, "fin", MeshForge.Sphere(10, 8), new Vector3(0, 0.2f, 0) * scale, new Vector3(0.04f, 0.22f, 0.16f) * scale, mat);
        Danao.Mesh(root.transform, "eyeL", MeshForge.Sphere(10, 8), new Vector3(-0.1f, 0.08f, 0.22f) * scale, Vector3.one * 0.07f * scale, Mats.EyeGold);
        Danao.Mesh(root.transform, "eyeR", MeshForge.Sphere(10, 8), new Vector3(0.1f, 0.08f, 0.22f) * scale, Vector3.one * 0.07f * scale, Mats.EyeGold);
        var bob = root.AddComponent<BobSpin>();
        bob.spin = Vector3.zero;
        bob.amp = 0.2f;
        bob.freq = 3f;
        return root;
    }

    static GameObject Crab(Transform parent)
    {
        var root = Danao.Node(parent, "Crab", Vector3.up * 0.25f).gameObject;
        var mat = Mats.Solid(new Color(0.85f, 0.25f, 0.18f), "crab");
        Danao.Mesh(root.transform, "shell", MeshForge.Sphere(18, 12), Vector3.zero, new Vector3(0.75f, 0.28f, 0.55f), mat);
        Danao.Mesh(root.transform, "clawL", MeshForge.Drop(), new Vector3(-0.48f, 0.06f, 0.22f), new Vector3(0.32f, 0.14f, 0.22f), Quaternion.Euler(0, 40, 0), mat);
        Danao.Mesh(root.transform, "clawR", MeshForge.Drop(), new Vector3(0.48f, 0.06f, 0.22f), new Vector3(0.32f, 0.14f, 0.22f), Quaternion.Euler(0, -40, 0), mat);
        return root;
    }

    static GameObject Jelly(Transform parent)
    {
        var root = Danao.Node(parent, "Jelly", Vector3.up * 0.6f).gameObject;
        var mat = Mats.Solid(new Color(0.55f, 0.85f, 1f), Color.white, new Color(0.2f, 0.4f, 0.6f), "jelly");
        Danao.Mesh(root.transform, "dome", MeshForge.Drop(), Vector3.zero, new Vector3(0.62f, 0.42f, 0.62f), mat);
        for (int i = 0; i < 5; i++)
            Danao.Mesh(root.transform, "t" + i, MeshForge.Capsule(8, 4), new Vector3((i - 2) * 0.1f, -0.32f, 0), new Vector3(0.06f, 0.22f, 0.06f), mat);
        var bob = root.AddComponent<BobSpin>();
        bob.amp = 0.25f;
        return root;
    }

    static GameObject Disciple(Transform parent, Color robe, bool sword)
    {
        var root = Danao.Node(parent, "Disciple", Vector3.zero).gameObject;
        var rm = Mats.Solid(robe, Color.Lerp(robe, Color.white, 0.4f), robe * 0.1f, "disc" + robe.GetHashCode());
        Danao.Mesh(root.transform, "body", MeshForge.Robe(true), new Vector3(0, 0.55f, 0), Vector3.one * 0.95f, rm);
        Danao.Mesh(root.transform, "head", MeshForge.Sphere(20, 14), new Vector3(0, 1.18f, 0), new Vector3(0.24f, 0.28f, 0.24f), Mats.Skin);
        Danao.Mesh(root.transform, "hair", MeshForge.WukongHairCap(), new Vector3(0, 1.22f, -0.01f), new Vector3(0.55f, 0.45f, 0.55f), Mats.Dark);
        Danao.Mesh(root.transform, "hat", MeshForge.Cylinder(16), new Vector3(0, 1.38f, 0), new Vector3(0.16f, 0.05f, 0.16f), Mats.Gold);
        Danao.Mesh(root.transform, "armL", MeshForge.Sleeve(), new Vector3(-0.26f, 0.85f, 0), Vector3.one * 0.9f, Quaternion.Euler(0, 0, 20), rm);
        Danao.Mesh(root.transform, "armR", MeshForge.Sleeve(), new Vector3(0.26f, 0.85f, 0), Vector3.one * 0.9f, Quaternion.Euler(0, 0, -20), rm);
        Danao.Mesh(root.transform, "legL", MeshForge.Capsule(12, 6), new Vector3(-0.09f, 0.28f, 0), new Vector3(0.12f, 0.22f, 0.12f), rm);
        Danao.Mesh(root.transform, "legR", MeshForge.Capsule(12, 6), new Vector3(0.09f, 0.28f, 0), new Vector3(0.12f, 0.22f, 0.12f), rm);
        if (sword)
            Danao.Mesh(root.transform, "sword", MeshForge.Crystal(), new Vector3(0.36f, 0.95f, 0.05f), new Vector3(0.12f, 0.7f, 0.08f), Mats.Gold);
        else
            Danao.Mesh(root.transform, "staff", MeshForge.StaffPole(), new Vector3(0.32f, 1.0f, 0.05f), new Vector3(0.035f, 1.0f, 0.035f), Mats.Trim);
        return root;
    }
}
