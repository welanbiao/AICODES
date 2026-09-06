using UnityEngine;

public static class WukongArt
{
    static Mesh _card;

    public static string PortraitFile(int form)
    {
        if (form == 2) return "孙悟空.jpg";
        if (form == 3) return "孙悟空3.jpg";
        if (form == 4) return "孙悟空4.jpg";
        return "孙悟空5.jpg";
    }

    public static Mesh Card()
    {
        if (_card != null) return _card;
        _card = new Mesh();
        _card.name = "portraitCard";
        _card.vertices = new[]
        {
            new Vector3(-0.5f, -0.5f, 0f),
            new Vector3(0.5f, -0.5f, 0f),
            new Vector3(0.5f, 0.5f, 0f),
            new Vector3(-0.5f, 0.5f, 0f)
        };
        _card.uv = new[]
        {
            new Vector2(0f, 0f), new Vector2(1f, 0f), new Vector2(1f, 1f), new Vector2(0f, 1f)
        };
        _card.triangles = new[] { 0, 1, 2, 0, 2, 3 };
        _card.RecalculateNormals();
        _card.RecalculateBounds();
        return _card;
    }

    public static GameObject BuildPortrait(Transform parent, int form)
    {
        string file = PortraitFile(form);
        Texture2D tex = ArtLoader.Load(file);
        if (tex == null) return null;
        float h = form == 2 ? 1.9f : form == 3 ? 2.12f : form == 4 ? 2.36f : 2.66f;
        float y0 = form == 3 ? 0.46f : 0.08f;
        var root = Danao.Node(parent, "Wukong_F" + form, new Vector3(0f, y0, 0f)).gameObject;
        AttachBillboard(root.transform, tex, h, form, file);
        return root;
    }

    public static void AttachBillboard(Transform root, Texture2D tex, float h, int form, string file)
    {
        for (int i = root.childCount - 1; i >= 0; i--)
            Object.DestroyImmediate(root.GetChild(i).gameObject);
        var extra = root.GetComponents<MonoBehaviour>();
        for (int i = 0; i < extra.Length; i++)
        {
            if (extra[i] == null) continue;
            if (extra[i] is PortraitOk) continue;
            if (extra[i] is FaceCam || extra[i] is RunCycle || extra[i] is BobSpin)
                Object.DestroyImmediate(extra[i]);
        }

        var art = Danao.Mesh(root, "art", Card(),
            new Vector3(0f, h * 0.5f, 0.02f), Tex.BillboardScale(tex, h),
            ArtLoader.Billboard("wkArtV8_" + form, file));
        art.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        var face = art.gameObject.AddComponent<FaceCam>();
        face.lockYawOnly = true;
        face.parallel = true;
        face.invert = false;
        if (root.GetComponent<PortraitOk>() == null)
            root.gameObject.AddComponent<PortraitOk>();
        root.localRotation = Quaternion.identity;
        root.localScale = Vector3.one;
    }

    public static Transform BuildBoat(Transform player)
    {
        var boat = Danao.Node(player, "Boat", new Vector3(0f, 0.02f, 0.18f));
        FillBoat(boat);
        return boat;
    }

    public static void FillBoat(Transform boat)
    {
        if (boat == null) return;
        for (int i = boat.childCount - 1; i >= 0; i--)
            Object.DestroyImmediate(boat.GetChild(i).gameObject);
        var wood = Mats.Solid(new Color(0.46f, 0.28f, 0.12f), new Color(0.85f, 0.62f, 0.32f), new Color(0.08f, 0.04f, 0.01f), "boatHull");
        var plank = Mats.Solid(new Color(0.55f, 0.34f, 0.16f), new Color(0.9f, 0.7f, 0.4f), new Color(0.06f, 0.03f, 0.01f), "boatPlank");
        var dark = Mats.Solid(new Color(0.28f, 0.16f, 0.07f), "boatDark");
        Danao.Mesh(boat, "hull", MeshForge.WoodBoat(), Vector3.zero, new Vector3(1.55f, 1.28f, 3.15f), wood);
        Danao.Mesh(boat, "gunL", MeshForge.Cylinder(12), new Vector3(-0.52f, 0.22f, 0.04f), new Vector3(0.055f, 1.18f, 0.055f), Quaternion.Euler(90f, 0f, 0f), plank);
        Danao.Mesh(boat, "gunR", MeshForge.Cylinder(12), new Vector3(0.52f, 0.22f, 0.04f), new Vector3(0.055f, 1.18f, 0.055f), Quaternion.Euler(90f, 0f, 0f), plank);
        Danao.Mesh(boat, "seatF", MeshForge.Cylinder(8), new Vector3(0f, 0.18f, 0.48f), new Vector3(0.82f, 0.045f, 0.16f), plank);
        Danao.Mesh(boat, "seatB", MeshForge.Cylinder(8), new Vector3(0f, 0.18f, -0.42f), new Vector3(0.78f, 0.045f, 0.16f), plank);
        Danao.Mesh(boat, "stem", MeshForge.Capsule(14, 8), new Vector3(0f, 0.34f, 1.48f), new Vector3(0.09f, 0.26f, 0.09f), Quaternion.Euler(18f, 0f, 0f), dark);
        Danao.Mesh(boat, "stern", MeshForge.Cylinder(10), new Vector3(0f, 0.20f, -1.42f), new Vector3(0.72f, 0.09f, 0.07f), plank);
        Danao.Mesh(boat, "mast", MeshForge.Cylinder(10), new Vector3(0f, 0.85f, -0.12f), new Vector3(0.05f, 1.15f, 0.05f), dark);
        Danao.Mesh(boat, "oar", MeshForge.StaffPole(), new Vector3(0.62f, 0.46f, -0.12f), new Vector3(0.038f, 1.28f, 0.038f), Quaternion.Euler(18f, 0f, 24f), dark);
        Danao.Mesh(boat, "blade", MeshForge.Drop(), new Vector3(0.86f, 0.06f, -0.68f), new Vector3(0.14f, 0.32f, 0.07f), Quaternion.Euler(70f, 20f, 0f), plank);
        boat.localPosition = new Vector3(0f, 0.02f, 0.18f);
    }
}

public class PortraitOk : MonoBehaviour { }
