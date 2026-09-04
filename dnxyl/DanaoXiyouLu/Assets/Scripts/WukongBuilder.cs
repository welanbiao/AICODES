using UnityEngine;

public enum WukongOutfit
{
    Bare = 0,
    Cloth = 1,
    Robe = 2
}

public static class WukongBuilder
{
    public static GameObject Build(int form, Transform parent)
    {
        if (form <= 1) return BuildStone(parent);
        float h = form == 2 ? 0.90f : form == 3 ? 1.16f : form == 4 ? 1.46f : 1.74f;
        WukongOutfit o = form <= 3 ? WukongOutfit.Bare : form == 4 ? WukongOutfit.Cloth : WukongOutfit.Robe;
        return BuildMonkey(parent, h, o, form);
    }

    static GameObject BuildStone(Transform parent)
    {
        var root = Danao.Node(parent, "FiveColorStone", new Vector3(0, 0.95f, 0)).gameObject;
        var core = Danao.Node(root.transform, "core", Vector3.zero);
        Color[] cols = Danao.WuXing;
        for (int i = 0; i < 5; i++)
        {
            float a = i * 72f;
            var mat = Mats.Solid(cols[i], Color.white, cols[i] * 0.45f, "stone" + i);
            Danao.Prim(core, "facet" + i, PrimitiveType.Sphere,
                Quaternion.Euler(18, a, 0) * Vector3.forward * 0.18f,
                new Vector3(0.72f, 0.95f, 0.58f),
                Quaternion.Euler(25, a, 12), mat);
        }
        Danao.Prim(core, "heart", PrimitiveType.Sphere, Vector3.zero, Vector3.one * 0.42f,
            Mats.Solid(Color.white, Danao.Gold, new Color(0.8f, 0.6f, 0.2f), "stoneHeart"));
        for (int i = 0; i < 8; i++)
        {
            Danao.Prim(core, "crack" + i, PrimitiveType.Cube,
                Random.insideUnitSphere * 0.22f,
                new Vector3(0.03f, 0.55f + i * 0.02f, 0.03f),
                Quaternion.Euler(i * 40, i * 70, i * 15),
                Mats.Gold);
        }
        Danao.Glow(root.transform, Danao.Gold, 1.6f, 7f);
        var halo = Danao.Prim(root.transform, "halo", PrimitiveType.Sphere, Vector3.zero, Vector3.one * 1.55f, Mats.Glow(new Color(1f, 0.85f, 0.4f, 0.35f), "stoneHalo"));
        halo.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        var bob = root.AddComponent<BobSpin>();
        bob.spin = new Vector3(8, 35, 5);
        bob.amp = 0.16f;
        bob.freq = 1.8f;
        return root;
    }

    static GameObject BuildMonkey(Transform parent, float h, WukongOutfit outfit, int form)
    {
        var root = Danao.Node(parent, "Wukong_F" + form, Vector3.zero).gameObject;
        float s = h / 1.74f;
        var hip = Danao.Node(root.transform, "hip", new Vector3(0, 0.92f * s, 0));
        var torso = Danao.Node(hip, "torso", Vector3.zero);
        Danao.Prim(torso, "belly", PrimitiveType.Capsule, new Vector3(0, 0.18f * s, 0.02f), new Vector3(0.34f * s, 0.22f * s, 0.22f * s), Mats.Fur);
        Danao.Prim(torso, "chest", PrimitiveType.Sphere, new Vector3(0, 0.38f * s, 0.03f), new Vector3(0.38f * s, 0.28f * s, 0.24f * s), Mats.Fur);
        var neck = Danao.Node(torso, "neck", new Vector3(0, 0.52f * s, 0));
        Danao.Prim(neck, "neckm", PrimitiveType.Capsule, new Vector3(0, 0.04f * s, 0), new Vector3(0.12f * s, 0.07f * s, 0.12f * s), Mats.Fur);
        var head = BuildHead(neck, s, form);
        head.localPosition = new Vector3(0, 0.12f * s, 0.02f);

        var lShoulder = Danao.Node(torso, "lShoulder", new Vector3(-0.22f * s, 0.42f * s, 0));
        var rShoulder = Danao.Node(torso, "rShoulder", new Vector3(0.22f * s, 0.42f * s, 0));
        var lArm = BuildArm(lShoulder, s, false);
        var rArm = BuildArm(rShoulder, s, true);

        var lHip = Danao.Node(hip, "lHip", new Vector3(-0.09f * s, -0.02f * s, 0));
        var rHip = Danao.Node(hip, "rHip", new Vector3(0.09f * s, -0.02f * s, 0));
        var lLeg = BuildLeg(lHip, s);
        var rLeg = BuildLeg(rHip, s);

        var tail = Danao.Node(hip, "tail", new Vector3(0, 0.05f * s, -0.12f * s));
        Danao.Prim(tail, "t1", PrimitiveType.Capsule, new Vector3(0, 0, -0.16f * s), new Vector3(0.07f * s, 0.18f * s, 0.07f * s), Quaternion.Euler(90, 0, 0), Mats.Fur);
        Danao.Prim(tail, "t2", PrimitiveType.Capsule, new Vector3(0.04f * s, 0.05f * s, -0.34f * s), new Vector3(0.06f * s, 0.16f * s, 0.06f * s), Quaternion.Euler(70, 18, 0), Mats.Hair);

        Transform staff = null;
        if (form >= 2)
        {
            staff = BuildStaff(rArm.Find("fore") ?? rArm, s, form);
        }

        if (outfit == WukongOutfit.Cloth) WearCloth(torso, hip, s);
        if (outfit == WukongOutfit.Robe) WearRobe(torso, hip, neck, s);

        var run = root.AddComponent<RunCycle>();
        run.leftArm = lArm;
        run.rightArm = rArm;
        run.leftLeg = lLeg;
        run.rightLeg = rLeg;
        run.tail = tail;
        run.torso = torso;
        run.staff = staff;

        Danao.Glow(head, Danao.Gold, 0.55f + form * 0.12f, 4.5f + form);
        return root;
    }

    static Transform BuildHead(Transform neck, float s, int form)
    {
        var head = Danao.Node(neck, "head", Vector3.zero);
        Danao.Prim(head, "skull", PrimitiveType.Sphere, Vector3.zero, new Vector3(0.22f * s, 0.24f * s, 0.22f * s), Mats.Skin);
        Danao.Prim(head, "cheeks", PrimitiveType.Sphere, new Vector3(0, -0.03f * s, 0.02f), new Vector3(0.20f * s, 0.16f * s, 0.18f * s), Mats.Skin);
        // golden hair cap and strands — face stays hairless
        Danao.Prim(head, "hairCap", PrimitiveType.Sphere, new Vector3(0, 0.07f * s, -0.01f), new Vector3(0.23f * s, 0.18f * s, 0.23f * s), Mats.Hair);
        for (int i = 0; i < 14; i++)
        {
            float a = -70f + i * 11f;
            float lift = 18f + (i % 3) * 8f;
            Danao.Prim(head, "strand" + i, PrimitiveType.Capsule,
                Quaternion.Euler(-lift, a, 0) * Vector3.up * 0.16f * s,
                new Vector3(0.045f * s, 0.10f * s, 0.045f * s),
                Quaternion.Euler(-lift, a, 0), Mats.Hair);
        }
        Danao.Prim(head, "bangL", PrimitiveType.Sphere, new Vector3(-0.08f * s, 0.06f * s, 0.09f * s), Vector3.one * 0.07f * s, Mats.Hair);
        Danao.Prim(head, "bangR", PrimitiveType.Sphere, new Vector3(0.08f * s, 0.06f * s, 0.09f * s), Vector3.one * 0.07f * s, Mats.Hair);

        BuildEye(head, new Vector3(-0.055f * s, 0.02f * s, 0.095f * s), s);
        BuildEye(head, new Vector3(0.055f * s, 0.02f * s, 0.095f * s), s);
        Danao.Prim(head, "browL", PrimitiveType.Cube, new Vector3(-0.055f * s, 0.055f * s, 0.10f * s), new Vector3(0.06f * s, 0.012f * s, 0.02f * s), Quaternion.Euler(0, 0, 12), Mats.Dark);
        Danao.Prim(head, "browR", PrimitiveType.Cube, new Vector3(0.055f * s, 0.055f * s, 0.10f * s), new Vector3(0.06f * s, 0.012f * s, 0.02f * s), Quaternion.Euler(0, 0, -12), Mats.Dark);
        Danao.Prim(head, "nose", PrimitiveType.Sphere, new Vector3(0, -0.01f * s, 0.115f * s), new Vector3(0.035f * s, 0.04f * s, 0.03f * s), Mats.Skin);
        Danao.Prim(head, "mouth", PrimitiveType.Sphere, new Vector3(0, -0.055f * s, 0.10f * s), new Vector3(0.06f * s, 0.018f * s, 0.02f * s), Mats.Solid(new Color(0.72f, 0.28f, 0.28f), "lip"));
        Danao.Prim(head, "earL", PrimitiveType.Sphere, new Vector3(-0.12f * s, 0.01f * s, 0), new Vector3(0.045f * s, 0.07f * s, 0.03f * s), Mats.Skin);
        Danao.Prim(head, "earR", PrimitiveType.Sphere, new Vector3(0.12f * s, 0.01f * s, 0), new Vector3(0.045f * s, 0.07f * s, 0.03f * s), Mats.Skin);
        Danao.Prim(head, "sideburnL", PrimitiveType.Sphere, new Vector3(-0.10f * s, -0.02f * s, 0.02f), new Vector3(0.05f * s, 0.08f * s, 0.05f * s), Mats.Hair);
        Danao.Prim(head, "sideburnR", PrimitiveType.Sphere, new Vector3(0.10f * s, -0.02f * s, 0.02f), new Vector3(0.05f * s, 0.08f * s, 0.05f * s), Mats.Hair);

        if (form >= 5)
        {
            Danao.Prim(head, "crown", PrimitiveType.Cylinder, new Vector3(0, 0.16f * s, 0), new Vector3(0.12f * s, 0.03f * s, 0.12f * s), Mats.Gold);
            Danao.Prim(head, "jewel", PrimitiveType.Sphere, new Vector3(0, 0.20f * s, 0.04f * s), Vector3.one * 0.05f * s, Mats.Solid(new Color(0.9f, 0.15f, 0.18f), Color.white, new Color(0.4f, 0.05f, 0.05f), "jade"));
        }
        return head;
    }

    static void BuildEye(Transform head, Vector3 pos, float s)
    {
        var e = Danao.Node(head, "eye", pos);
        Danao.Prim(e, "w", PrimitiveType.Sphere, Vector3.zero, new Vector3(0.038f * s, 0.032f * s, 0.02f * s), Mats.EyeWhite);
        Danao.Prim(e, "iris", PrimitiveType.Sphere, new Vector3(0, 0, 0.008f * s), Vector3.one * 0.022f * s, Mats.EyeGold);
        Danao.Prim(e, "pupil", PrimitiveType.Sphere, new Vector3(0, 0, 0.014f * s), Vector3.one * 0.012f * s, Mats.Dark);
        Danao.Prim(e, "hi", PrimitiveType.Sphere, new Vector3(-0.006f * s, 0.006f * s, 0.016f * s), Vector3.one * 0.007f * s, Mats.White);
    }

    static Transform BuildArm(Transform shoulder, float s, bool right)
    {
        var arm = Danao.Node(shoulder, right ? "rArm" : "lArm", Vector3.zero);
        Danao.Prim(arm, "upper", PrimitiveType.Capsule, new Vector3(0, -0.13f * s, 0), new Vector3(0.10f * s, 0.13f * s, 0.10f * s), Mats.Fur);
        var fore = Danao.Node(arm, "fore", new Vector3(0, -0.26f * s, 0));
        Danao.Prim(fore, "forearm", PrimitiveType.Capsule, new Vector3(0, -0.10f * s, 0), new Vector3(0.085f * s, 0.11f * s, 0.085f * s), Mats.Fur);
        Danao.Prim(fore, "hand", PrimitiveType.Sphere, new Vector3(0, -0.22f * s, 0.01f * s), new Vector3(0.08f * s, 0.07f * s, 0.06f * s), Mats.Skin);
        return arm;
    }

    static Transform BuildLeg(Transform hip, float s)
    {
        var leg = Danao.Node(hip, "leg", Vector3.zero);
        Danao.Prim(leg, "thigh", PrimitiveType.Capsule, new Vector3(0, -0.18f * s, 0), new Vector3(0.12f * s, 0.16f * s, 0.12f * s), Mats.Fur);
        var shin = Danao.Node(leg, "shin", new Vector3(0, -0.34f * s, 0));
        Danao.Prim(shin, "calf", PrimitiveType.Capsule, new Vector3(0, -0.12f * s, 0), new Vector3(0.10f * s, 0.13f * s, 0.10f * s), Mats.Fur);
        Danao.Prim(shin, "foot", PrimitiveType.Sphere, new Vector3(0, -0.26f * s, 0.04f * s), new Vector3(0.09f * s, 0.05f * s, 0.13f * s), Mats.Skin);
        return leg;
    }

    static Transform BuildStaff(Transform hand, float s, int form)
    {
        var staff = Danao.Node(hand, "staff", new Vector3(0.02f * s, -0.22f * s, 0.08f * s));
        float len = 0.85f * s + form * 0.08f;
        Danao.Prim(staff, "pole", PrimitiveType.Cylinder, Vector3.zero, new Vector3(0.035f * s, len * 0.5f, 0.035f * s), Quaternion.Euler(8, 0, 12), Mats.Gold);
        Danao.Prim(staff, "capT", PrimitiveType.Cylinder, new Vector3(0, len * 0.48f, 0), new Vector3(0.055f * s, 0.03f * s, 0.055f * s), Mats.Trim);
        Danao.Prim(staff, "capB", PrimitiveType.Cylinder, new Vector3(0, -len * 0.48f, 0), new Vector3(0.055f * s, 0.03f * s, 0.055f * s), Mats.Trim);
        return staff;
    }

    static void WearCloth(Transform torso, Transform hip, float s)
    {
        Danao.Prim(torso, "tunic", PrimitiveType.Cube, new Vector3(0, 0.22f * s, 0.01f), new Vector3(0.40f * s, 0.42f * s, 0.28f * s), Mats.Cloth);
        Danao.Prim(hip, "sash", PrimitiveType.Cylinder, new Vector3(0, 0.06f * s, 0), new Vector3(0.22f * s, 0.025f * s, 0.16f * s), Mats.Solid(new Color(0.45f, 0.22f, 0.12f), "rope"));
        Danao.Prim(torso, "sleeveL", PrimitiveType.Capsule, new Vector3(-0.24f * s, 0.28f * s, 0), new Vector3(0.12f * s, 0.14f * s, 0.12f * s), Mats.Cloth);
        Danao.Prim(torso, "sleeveR", PrimitiveType.Capsule, new Vector3(0.24f * s, 0.28f * s, 0), new Vector3(0.12f * s, 0.14f * s, 0.12f * s), Mats.Cloth);
    }

    static void WearRobe(Transform torso, Transform hip, Transform neck, float s)
    {
        Danao.Prim(torso, "inner", PrimitiveType.Cube, new Vector3(0, 0.22f * s, 0.02f), new Vector3(0.36f * s, 0.40f * s, 0.24f * s), Mats.White);
        Danao.Prim(torso, "robe", PrimitiveType.Cube, new Vector3(0, 0.12f * s, 0), new Vector3(0.48f * s, 0.70f * s, 0.32f * s), Mats.Robe);
        Danao.Prim(torso, "trimF", PrimitiveType.Cube, new Vector3(0, 0.16f * s, 0.16f * s), new Vector3(0.06f * s, 0.62f * s, 0.02f * s), Mats.Trim);
        Danao.Prim(hip, "sash", PrimitiveType.Cylinder, new Vector3(0, 0.08f * s, 0), new Vector3(0.24f * s, 0.03f * s, 0.18f * s), Mats.Gold);
        Danao.Prim(torso, "sleeveL", PrimitiveType.Cube, new Vector3(-0.32f * s, 0.30f * s, 0), new Vector3(0.22f * s, 0.28f * s, 0.18f * s), Mats.Robe);
        Danao.Prim(torso, "sleeveR", PrimitiveType.Cube, new Vector3(0.32f * s, 0.30f * s, 0), new Vector3(0.22f * s, 0.28f * s, 0.18f * s), Mats.Robe);
        Danao.Prim(neck, "collar", PrimitiveType.Cylinder, new Vector3(0, 0.02f * s, 0), new Vector3(0.12f * s, 0.02f * s, 0.12f * s), Mats.Trim);
    }
}
