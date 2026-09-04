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
            var mat = Mats.Solid(cols[i], Color.white, cols[i] * 0.55f, "crystal" + i);
            Danao.Mesh(core, "facet" + i, MeshForge.Crystal(),
                Quaternion.Euler(12, a, 8) * Vector3.up * 0.08f + Quaternion.Euler(0, a, 0) * Vector3.forward * 0.12f,
                new Vector3(0.85f, 1.15f, 0.75f),
                Quaternion.Euler(18 + i * 7, a, 10), mat);
        }
        Danao.Mesh(core, "heart", MeshForge.Sphere(28, 18), Vector3.zero, Vector3.one * 0.55f,
            Mats.Solid(Color.white, Danao.Gold, new Color(0.9f, 0.7f, 0.2f), "stoneHeart"));
        Danao.Glow(root.transform, Danao.Gold, 1.8f, 7f);
        var halo = Danao.Mesh(root.transform, "halo", MeshForge.Sphere(20, 14), Vector3.zero, Vector3.one * 1.7f,
            Mats.Glow(new Color(1f, 0.85f, 0.4f, 0.35f), "stoneHalo"));
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
        Danao.Mesh(torso, "body", MeshForge.Torso(), new Vector3(0, 0.12f * s, 0.02f), Vector3.one * s, Mats.Fur);
        var neck = Danao.Node(torso, "neck", new Vector3(0, 0.50f * s, 0.01f * s));
        Danao.Mesh(neck, "neckm", MeshForge.Capsule(16, 8), new Vector3(0, 0.04f * s, 0), new Vector3(0.11f * s, 0.08f * s, 0.11f * s), Mats.Fur);
        var head = BuildHead(neck, s, form);
        head.localPosition = new Vector3(0, 0.14f * s, 0.02f);

        var lShoulder = Danao.Node(torso, "lShoulder", new Vector3(-0.20f * s, 0.40f * s, 0));
        var rShoulder = Danao.Node(torso, "rShoulder", new Vector3(0.20f * s, 0.40f * s, 0));
        var lArm = BuildArm(lShoulder, s, false);
        var rArm = BuildArm(rShoulder, s, true);

        var lHip = Danao.Node(hip, "lHip", new Vector3(-0.08f * s, -0.02f * s, 0));
        var rHip = Danao.Node(hip, "rHip", new Vector3(0.08f * s, -0.02f * s, 0));
        var lLeg = BuildLeg(lHip, s);
        var rLeg = BuildLeg(rHip, s);

        var tail = Danao.Node(hip, "tail", new Vector3(0, 0.06f * s, -0.10f * s));
        Danao.Mesh(tail, "t1", MeshForge.Tail(), Vector3.zero, new Vector3(0.9f, 1f, 0.9f) * s, Quaternion.Euler(55, 0, 0), Mats.Fur);
        Danao.Mesh(tail, "t2", MeshForge.Tail(), new Vector3(0.02f * s, -0.05f * s, -0.28f * s), new Vector3(0.7f, 0.85f, 0.7f) * s, Quaternion.Euler(70, 12, 0), Mats.Hair);

        Transform staff = null;
        if (form >= 2) staff = BuildStaff(rArm.Find("fore") ?? rArm, s, form);

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
        Danao.Mesh(head, "skull", MeshForge.WukongHead(), Vector3.zero, Vector3.one * s * 1.05f, Mats.Skin);
        Danao.Mesh(head, "hairCap", MeshForge.WukongHairCap(), new Vector3(0, 0.02f * s, -0.01f * s), Vector3.one * s * 1.12f, Mats.Hair);

        int n = 28;
        for (int i = 0; i < n; i++)
        {
            float u = i / (n - 1f);
            float yaw = Mathf.Lerp(-78f, 78f, u);
            float lift = 28f + Mathf.Sin(u * Mathf.PI) * 22f + (i % 3) * 4f;
            float back = 8f + Mathf.Abs(yaw) * 0.12f;
            Quaternion rot = Quaternion.Euler(-lift, yaw, 0) * Quaternion.Euler(back, 0, 0);
            Vector3 pos = rot * Vector3.up * (0.13f * s);
            float thick = 0.055f * s * (0.85f + 0.25f * Mathf.Sin(u * Mathf.PI));
            Danao.Mesh(head, "strand" + i, MeshForge.Strand(), pos,
                new Vector3(thick, 0.16f * s, thick), rot, Mats.Hair);
        }
        Danao.Mesh(head, "bangL", MeshForge.Sphere(14, 10), new Vector3(-0.07f * s, 0.07f * s, 0.09f * s), Vector3.one * 0.07f * s, Mats.Hair);
        Danao.Mesh(head, "bangR", MeshForge.Sphere(14, 10), new Vector3(0.07f * s, 0.07f * s, 0.09f * s), Vector3.one * 0.07f * s, Mats.Hair);
        Danao.Mesh(head, "sideL", MeshForge.Sphere(12, 10), new Vector3(-0.10f * s, -0.01f * s, 0.02f * s), new Vector3(0.05f, 0.09f, 0.05f) * s, Mats.Hair);
        Danao.Mesh(head, "sideR", MeshForge.Sphere(12, 10), new Vector3(0.10f * s, -0.01f * s, 0.02f * s), new Vector3(0.05f, 0.09f, 0.05f) * s, Mats.Hair);

        BuildEye(head, new Vector3(-0.05f * s, 0.03f * s, 0.10f * s), s);
        BuildEye(head, new Vector3(0.05f * s, 0.03f * s, 0.10f * s), s);
        Danao.Mesh(head, "browL", MeshForge.Sphere(10, 8), new Vector3(-0.05f * s, 0.07f * s, 0.105f * s), new Vector3(0.055f, 0.012f, 0.018f) * s, Quaternion.Euler(0, 0, 14), Mats.Dark);
        Danao.Mesh(head, "browR", MeshForge.Sphere(10, 8), new Vector3(0.05f * s, 0.07f * s, 0.105f * s), new Vector3(0.055f, 0.012f, 0.018f) * s, Quaternion.Euler(0, 0, -14), Mats.Dark);
        Danao.Mesh(head, "nose", MeshForge.Sphere(12, 10), new Vector3(0, -0.005f * s, 0.125f * s), new Vector3(0.028f, 0.038f, 0.032f) * s, Mats.Skin);
        Danao.Mesh(head, "mouth", MeshForge.Sphere(12, 8), new Vector3(0, -0.055f * s, 0.108f * s), new Vector3(0.055f, 0.016f, 0.02f) * s, Mats.Solid(new Color(0.78f, 0.32f, 0.32f), "lip"));
        Danao.Mesh(head, "earL", MeshForge.Ear(), new Vector3(-0.12f * s, 0.01f * s, 0), new Vector3(s, s, s), Quaternion.Euler(0, -18, 8), Mats.Skin);
        Danao.Mesh(head, "earR", MeshForge.Ear(), new Vector3(0.12f * s, 0.01f * s, 0), new Vector3(-s, s, s), Quaternion.Euler(0, 18, -8), Mats.Skin);

        if (form >= 5)
        {
            Danao.Mesh(head, "crown", MeshForge.Cylinder(20), new Vector3(0, 0.16f * s, 0), new Vector3(0.14f * s, 0.035f * s, 0.14f * s), Mats.Gold);
            Danao.Mesh(head, "jewel", MeshForge.Crystal(), new Vector3(0, 0.21f * s, 0.03f * s), Vector3.one * 0.12f * s, Mats.Solid(new Color(0.9f, 0.12f, 0.16f), Color.white, new Color(0.45f, 0.04f, 0.04f), "jade"));
        }
        return head;
    }

    static void BuildEye(Transform head, Vector3 pos, float s)
    {
        var e = Danao.Node(head, "eye", pos);
        Danao.Mesh(e, "w", MeshForge.Sphere(16, 12), Vector3.zero, new Vector3(0.036f, 0.030f, 0.022f) * s, Mats.EyeWhite);
        Danao.Mesh(e, "iris", MeshForge.Sphere(14, 10), new Vector3(0, 0, 0.008f * s), Vector3.one * 0.022f * s, Mats.EyeGold);
        Danao.Mesh(e, "pupil", MeshForge.Sphere(10, 8), new Vector3(0, 0, 0.015f * s), Vector3.one * 0.011f * s, Mats.Dark);
        Danao.Mesh(e, "hi", MeshForge.Sphere(8, 6), new Vector3(-0.006f * s, 0.006f * s, 0.017f * s), Vector3.one * 0.006f * s, Mats.White);
    }

    static Transform BuildArm(Transform shoulder, float s, bool right)
    {
        var arm = Danao.Node(shoulder, right ? "rArm" : "lArm", Vector3.zero);
        Danao.Mesh(arm, "upper", MeshForge.Capsule(18, 8), new Vector3(0, -0.13f * s, 0), new Vector3(0.10f * s, 0.14f * s, 0.10f * s), Mats.Fur);
        var fore = Danao.Node(arm, "fore", new Vector3(0, -0.26f * s, 0));
        Danao.Mesh(fore, "forearm", MeshForge.Capsule(16, 8), new Vector3(0, -0.10f * s, 0), new Vector3(0.08f * s, 0.12f * s, 0.08f * s), Mats.Fur);
        Danao.Mesh(fore, "hand", MeshForge.Sphere(14, 10), new Vector3(0, -0.22f * s, 0.01f * s), new Vector3(0.075f, 0.065f, 0.055f) * s, Mats.Skin);
        float side = right ? 1f : -1f;
        for (int i = 0; i < 4; i++)
        {
            float x = (i - 1.5f) * 0.018f * s;
            Danao.Mesh(fore, "f" + i, MeshForge.Capsule(8, 4), new Vector3(x, -0.28f * s, 0.02f * s), new Vector3(0.018f, 0.04f, 0.018f) * s, Mats.Skin);
        }
        Danao.Mesh(fore, "thumb", MeshForge.Capsule(8, 4), new Vector3(side * 0.04f * s, -0.24f * s, 0.03f * s), new Vector3(0.02f, 0.035f, 0.02f) * s, Quaternion.Euler(0, 0, side * -35f), Mats.Skin);
        return arm;
    }

    static Transform BuildLeg(Transform hip, float s)
    {
        var leg = Danao.Node(hip, "leg", Vector3.zero);
        Danao.Mesh(leg, "thigh", MeshForge.Capsule(18, 8), new Vector3(0, -0.18f * s, 0), new Vector3(0.12f * s, 0.17f * s, 0.12f * s), Mats.Fur);
        var shin = Danao.Node(leg, "shin", new Vector3(0, -0.34f * s, 0));
        Danao.Mesh(shin, "calf", MeshForge.Capsule(16, 8), new Vector3(0, -0.12f * s, 0), new Vector3(0.10f * s, 0.14f * s, 0.10f * s), Mats.Fur);
        Danao.Mesh(shin, "foot", MeshForge.Sphere(14, 10), new Vector3(0, -0.27f * s, 0.05f * s), new Vector3(0.085f, 0.045f, 0.13f) * s, Mats.Skin);
        return leg;
    }

    static Transform BuildStaff(Transform hand, float s, int form)
    {
        var staff = Danao.Node(hand, "staff", new Vector3(0.02f * s, -0.22f * s, 0.08f * s));
        float len = 0.95f * s + form * 0.08f;
        Danao.Mesh(staff, "pole", MeshForge.StaffPole(), Vector3.zero, new Vector3(0.038f * s, len, 0.038f * s), Quaternion.Euler(8, 0, 12), Mats.Gold);
        Danao.Mesh(staff, "capT", MeshForge.Cylinder(16), new Vector3(0, len * 0.48f, 0), new Vector3(0.06f * s, 0.035f * s, 0.06f * s), Mats.Trim);
        Danao.Mesh(staff, "capB", MeshForge.Cylinder(16), new Vector3(0, -len * 0.48f, 0), new Vector3(0.06f * s, 0.035f * s, 0.06f * s), Mats.Trim);
        Danao.Mesh(staff, "ring", MeshForge.Cylinder(16), new Vector3(0, len * 0.2f, 0), new Vector3(0.05f * s, 0.02f * s, 0.05f * s), Mats.Trim);
        return staff;
    }

    static void WearCloth(Transform torso, Transform hip, float s)
    {
        Danao.Mesh(torso, "tunic", MeshForge.Robe(false), new Vector3(0, 0.08f * s, 0), Vector3.one * s * 1.05f, Mats.Cloth);
        Danao.Mesh(hip, "sash", MeshForge.Cylinder(18), new Vector3(0, 0.05f * s, 0), new Vector3(0.24f * s, 0.03f * s, 0.18f * s), Mats.Solid(new Color(0.45f, 0.22f, 0.12f), "rope"));
        Danao.Mesh(torso, "sleeveL", MeshForge.Sleeve(), new Vector3(-0.22f * s, 0.32f * s, 0), new Vector3(s, s, s), Quaternion.Euler(0, 0, 18), Mats.Cloth);
        Danao.Mesh(torso, "sleeveR", MeshForge.Sleeve(), new Vector3(0.22f * s, 0.32f * s, 0), new Vector3(s, s, s), Quaternion.Euler(0, 0, -18), Mats.Cloth);
    }

    static void WearRobe(Transform torso, Transform hip, Transform neck, float s)
    {
        Danao.Mesh(torso, "inner", MeshForge.Robe(false), new Vector3(0, 0.1f * s, 0.01f * s), Vector3.one * s * 0.95f, Mats.White);
        Danao.Mesh(torso, "robe", MeshForge.Robe(true), new Vector3(0, 0.08f * s, 0), Vector3.one * s * 1.08f, Mats.Robe);
        Danao.Mesh(torso, "trimF", MeshForge.Capsule(10, 6), new Vector3(0, 0.12f * s, 0.16f * s), new Vector3(0.04f * s, 0.55f * s, 0.03f * s), Mats.Trim);
        Danao.Mesh(hip, "sash", MeshForge.Cylinder(18), new Vector3(0, 0.08f * s, 0), new Vector3(0.26f * s, 0.035f * s, 0.20f * s), Mats.Gold);
        Danao.Mesh(torso, "sleeveL", MeshForge.Sleeve(), new Vector3(-0.26f * s, 0.34f * s, 0), new Vector3(1.25f * s, 1.15f * s, 1.25f * s), Quaternion.Euler(8, 0, 22), Mats.Robe);
        Danao.Mesh(torso, "sleeveR", MeshForge.Sleeve(), new Vector3(0.26f * s, 0.34f * s, 0), new Vector3(1.25f * s, 1.15f * s, 1.25f * s), Quaternion.Euler(8, 0, -22), Mats.Robe);
        Danao.Mesh(neck, "collar", MeshForge.Cylinder(18), new Vector3(0, 0.02f * s, 0), new Vector3(0.13f * s, 0.025f * s, 0.13f * s), Mats.Trim);
    }
}
