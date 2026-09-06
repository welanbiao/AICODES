using UnityEngine;

public static class LootArt
{
    public static void TreasureMeshes(Transform go, int stage, int elem)
    {
        elem = Mathf.Clamp(elem, 0, 4);
        Material accent = stage == 1 ? Mats.Spirit(elem) : Mats.Gold;
        Material trim = stage == 1 ? Mats.Spirit(elem) : Mats.Trim;
        int kind = stage == 1 ? elem : elem % 5;
        switch (kind)
        {
            case 0:
                Danao.Mesh(go, "gem", MeshForge.Crystal(), Vector3.zero, new Vector3(0.72f, 0.92f, 0.72f), accent);
                Danao.Mesh(go, "gem2", MeshForge.Crystal(), new Vector3(-0.18f, -0.08f, 0.06f),
                    new Vector3(0.38f, 0.48f, 0.38f), Quaternion.Euler(8f, 25f, 16f), accent);
                Danao.Mesh(go, "gem3", MeshForge.Crystal(), new Vector3(0.16f, -0.1f, -0.05f),
                    new Vector3(0.32f, 0.42f, 0.32f), Quaternion.Euler(-6f, -18f, -12f), trim);
                break;
            case 1:
                Danao.Mesh(go, "gem", MeshForge.Peach(), Vector3.zero, Vector3.one * 0.78f,
                    Mats.Solid(new Color(1f, 0.42f, 0.36f), Color.white, new Color(0.22f, 0.04f, 0.02f), "lootPeach"));
                Danao.Mesh(go, "leaf", MeshForge.Sphere(12, 8), new Vector3(0.1f, 0.28f, 0f),
                    new Vector3(0.2f, 0.07f, 0.12f), Mats.Solid(new Color(0.22f, 0.58f, 0.2f), "lootLeaf"));
                break;
            case 2:
                Danao.Mesh(go, "gem", MeshForge.Drop(), Vector3.zero, new Vector3(0.7f, 0.88f, 0.7f), accent);
                Danao.Mesh(go, "core", MeshForge.Sphere(14, 10), new Vector3(0f, -0.06f, 0f), Vector3.one * 0.22f, trim);
                break;
            case 3:
                Danao.Mesh(go, "gem", MeshForge.Gourd(), Vector3.zero, new Vector3(0.62f, 0.88f, 0.62f),
                    Mats.Solid(new Color(0.16f, 0.52f, 0.26f), Color.white, new Color(0.03f, 0.1f, 0.03f), "lootGourd"));
                Danao.Mesh(go, "cork", MeshForge.Cylinder(10), new Vector3(0f, 0.42f, 0f),
                    new Vector3(0.1f, 0.09f, 0.1f), Mats.Cloth);
                break;
            default:
                Danao.Mesh(go, "gem", MeshForge.Golem(), Vector3.zero, new Vector3(0.78f, 0.62f, 0.78f), accent);
                Danao.Mesh(go, "ring", MeshForge.Cylinder(16), new Vector3(0f, -0.12f, 0f),
                    new Vector3(0.55f, 0.06f, 0.55f), trim);
                break;
        }
    }

    public static void GateIcon(Transform icon, int stage, int elem)
    {
        elem = Mathf.Clamp(elem, 0, 4);
        if (stage == 1)
        {
            SpiritFigure.Attach(icon, elem, 0.55f);
            return;
        }
        Material gold = Mats.Gold;
        Danao.Mesh(icon, "core", MeshForge.Crystal(), Vector3.zero, new Vector3(0.62f, 0.78f, 0.62f), gold);
        Danao.Mesh(icon, "ring", MeshForge.Cylinder(18), new Vector3(0f, -0.08f, 0f),
            new Vector3(0.82f, 0.07f, 0.82f), Mats.Trim);
        Danao.Mesh(icon, "cap", MeshForge.Sphere(14, 10), new Vector3(0f, 0.28f, 0f), Vector3.one * 0.18f, gold);
    }
}
