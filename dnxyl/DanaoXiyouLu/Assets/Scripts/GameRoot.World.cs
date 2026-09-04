using UnityEngine;

public partial class GameRoot
{
    void EnsureChunks()
    {
        float z = player.position.z;
        int need = Mathf.FloorToInt(z / ChunkLen) + 4;
        while (_nextChunk <= need)
        {
            _chunks.Add(BuildChunk(_nextChunk));
            _nextChunk++;
        }
        for (int i = _chunks.Count - 1; i >= 0; i--)
        {
            if (_chunks[i] == null) { _chunks.RemoveAt(i); continue; }
            if (_chunks[i].transform.position.z < z - ChunkLen * 2.5f)
            {
                Destroy(_chunks[i]);
                _chunks.RemoveAt(i);
            }
        }
    }

    GameObject BuildChunk(int index)
    {
        var go = new GameObject("Chunk_" + index);
        go.transform.position = new Vector3(0, 0, index * ChunkLen);
        Danao.Prim(go.transform, "ground", PrimitiveType.Cube, new Vector3(0, -0.08f, ChunkLen * 0.5f),
            new Vector3(11f, 0.16f, ChunkLen), Mats.Ground(stage));

        Color rail = stage == 5 ? Danao.Trim : (stage == 3 ? new Color(0.2f, 0.45f, 0.7f) : new Color(0.35f, 0.22f, 0.12f));
        Danao.Prim(go.transform, "railL", PrimitiveType.Cube, new Vector3(-5.2f, 0.25f, ChunkLen * 0.5f),
            new Vector3(0.22f, 0.7f, ChunkLen), Mats.Solid(rail, "rail" + stage));
        Danao.Prim(go.transform, "railR", PrimitiveType.Cube, new Vector3(5.2f, 0.25f, ChunkLen * 0.5f),
            new Vector3(0.22f, 0.7f, ChunkLen), Mats.Solid(rail, "rail" + stage));

        for (int i = 0; i < 6; i++)
        {
            float z = 2 + i * 3.4f;
            float side = i % 2 == 0 ? -1f : 1f;
            Decor(go.transform, new Vector3(side * Random.Range(6.2f, 10.5f), 0, z), side);
        }

        if (index > 0 && index % 2 == 0) PlaceLaneContent(go.transform, index);
        return go;
    }

    void Decor(Transform parent, Vector3 pos, float side)
    {
        switch (stage)
        {
            case 1:
                Danao.Prim(parent, "crystal", PrimitiveType.Cube, pos + Vector3.up * 1.2f,
                    new Vector3(0.5f, 2.4f, 0.5f), Quaternion.Euler(12, pos.z * 20, 18),
                    Mats.Solid(Danao.WuXing[Random.Range(0, 5)], Color.white, Color.white * 0.2f, "cr" + Random.Range(0, 99)));
                break;
            case 2:
                Danao.Prim(parent, "tree", PrimitiveType.Cylinder, pos + Vector3.up * 0.8f, new Vector3(0.18f, 0.8f, 0.18f),
                    Mats.Solid(new Color(0.35f, 0.2f, 0.1f), "bark"));
                Danao.Prim(parent, "leaf", PrimitiveType.Sphere, pos + Vector3.up * 1.9f, new Vector3(1.1f, 0.9f, 1.1f),
                    Mats.Solid(new Color(0.2f, 0.55f, 0.18f), "leaf"));
                if (Random.value > 0.6f)
                    Danao.Prim(parent, "peach", PrimitiveType.Sphere, pos + new Vector3(0.3f, 1.7f, 0.2f), Vector3.one * 0.18f,
                        Mats.Solid(new Color(1f, 0.45f, 0.4f), "peach"));
                break;
            case 3:
                Danao.Prim(parent, "rock", PrimitiveType.Sphere, pos + Vector3.up * 0.3f, new Vector3(1.4f, 0.7f, 1.1f),
                    Mats.Solid(new Color(0.3f, 0.35f, 0.4f), "seaRock"));
                Danao.Prim(parent, "foam", PrimitiveType.Sphere, pos + new Vector3(0, 0.15f, 0.4f), new Vector3(0.8f, 0.12f, 0.8f),
                    Mats.White);
                break;
            case 4:
                Danao.Prim(parent, "pine", PrimitiveType.Cylinder, pos + Vector3.up * 1.1f, new Vector3(0.16f, 1.1f, 0.16f),
                    Mats.Solid(new Color(0.28f, 0.18f, 0.1f), "pine"));
                Danao.Prim(parent, "pneed", PrimitiveType.Sphere, pos + Vector3.up * 2.3f, new Vector3(0.9f, 1.3f, 0.9f),
                    Mats.Solid(new Color(0.12f, 0.38f, 0.22f), "pneed"));
                if (Random.value > 0.7f)
                    Danao.Prim(parent, "lantern", PrimitiveType.Sphere, pos + new Vector3(side * 0.4f, 1.4f, 0), Vector3.one * 0.22f,
                        Mats.Solid(new Color(1f, 0.5f, 0.15f), Color.yellow, new Color(0.5f, 0.2f, 0), "lan"));
                break;
            default:
                Danao.Prim(parent, "pillar", PrimitiveType.Cylinder, pos + Vector3.up * 1.4f, new Vector3(0.28f, 1.4f, 0.28f), Mats.White);
                Danao.Prim(parent, "cap", PrimitiveType.Cylinder, pos + Vector3.up * 2.85f, new Vector3(0.45f, 0.08f, 0.45f), Mats.Gold);
                Danao.Prim(parent, "cloud", PrimitiveType.Sphere, pos + new Vector3(0, 3.4f, 0), new Vector3(1.6f, 0.5f, 1.1f), Mats.White);
                break;
        }
    }

    void PlaceLaneContent(Transform chunk, int index)
    {
        float z0 = Random.Range(6f, 16f);
        float roll = Random.value;
        if (roll < 0.34f) PlaceGates(chunk, z0);
        else if (roll < 0.55f) PlaceBarrels(chunk, z0);
        else PlaceTreasure(chunk, z0);
    }

    void PlaceGates(Transform chunk, float z)
    {
        MakeGate(chunk, new Vector3(-2.0f, 1.15f, z), Random.Range(0, 5), Random.Range(28, 55), 1f);
        MakeGate(chunk, new Vector3(2.0f, 1.15f, z), Random.Range(0, 5), Random.Range(28, 55), 1f);
    }

    void MakeGate(Transform parent, Vector3 pos, int elem, int add, float mul)
    {
        var go = new GameObject("Gate");
        go.transform.SetParent(parent, false);
        go.transform.localPosition = pos;
        Color c = stage == 1 ? Danao.WuXing[elem] : Danao.Gold;
        c.a = 0.45f;
        Danao.Prim(go.transform, "plane", PrimitiveType.Cube, Vector3.zero, new Vector3(3.2f, 2.2f, 0.08f), Mats.Glow(c, "gate" + elem + add));
        Danao.Prim(go.transform, "frameL", PrimitiveType.Cube, new Vector3(-1.6f, 0, 0), new Vector3(0.1f, 2.3f, 0.12f), Mats.Gold);
        Danao.Prim(go.transform, "frameR", PrimitiveType.Cube, new Vector3(1.6f, 0, 0), new Vector3(0.1f, 2.3f, 0.12f), Mats.Gold);
        var col = go.AddComponent<BoxCollider>();
        col.size = new Vector3(3.2f, 2.2f, 0.6f);
        col.isTrigger = true;
        var rb = go.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        var g = go.AddComponent<GateTrigger>();
        if (stage == 1) { g.element = elem; g.add = add; }
        else { g.xiuAdd = add * 4 + stage * 20; g.mul = Random.value > 0.78f ? 1.15f : 1f; }

        var label = new GameObject("lab");
        label.transform.SetParent(go.transform, false);
        label.transform.localPosition = new Vector3(0, 0.15f, -0.1f);
        var tm = label.AddComponent<TextMesh>();
        tm.anchor = TextAnchor.MiddleCenter;
        tm.characterSize = 0.12f;
        tm.fontSize = 48;
        tm.color = Color.white;
        if (stage == 1) tm.text = Danao.WuXingNames[elem] + "+" + add;
        else if (g.mul > 1.01f) tm.text = "修为x" + g.mul.ToString("0.00");
        else tm.text = "修为+" + g.xiuAdd;
    }

    void PlaceBarrels(Transform chunk, float z)
    {
        int n = Random.Range(1, 3);
        for (int i = 0; i < n; i++)
        {
            var go = new GameObject("Barrel");
            go.transform.SetParent(chunk, false);
            go.transform.localPosition = new Vector3(Random.Range(-3.2f, 3.2f), 0.45f, z + i * 1.4f);
            Danao.Prim(go.transform, "b", PrimitiveType.Cylinder, Vector3.zero, new Vector3(0.45f, 0.45f, 0.45f),
                Mats.Solid(new Color(0.55f, 0.32f, 0.14f), "bar"));
            Danao.Prim(go.transform, "ring", PrimitiveType.Cylinder, new Vector3(0, 0.2f, 0), new Vector3(0.48f, 0.04f, 0.48f), Mats.Gold);
            var col = go.AddComponent<CapsuleCollider>();
            col.isTrigger = true;
            col.radius = 0.5f;
            col.height = 1.1f;
            var rb = go.AddComponent<Rigidbody>();
            rb.isKinematic = true;
            var b = go.AddComponent<Barrel>();
            b.hp = 24 + stage * 12;
            var lab = new GameObject("hp");
            lab.transform.SetParent(go.transform, false);
            lab.transform.localPosition = Vector3.up * 0.9f;
            var tm = lab.AddComponent<TextMesh>();
            tm.text = Mathf.CeilToInt(b.hp).ToString();
            tm.anchor = TextAnchor.MiddleCenter;
            tm.characterSize = 0.08f;
            tm.fontSize = 36;
            tm.color = Color.white;
        }
    }

    void PlaceTreasure(Transform chunk, float z)
    {
        var go = new GameObject("Treasure");
        go.transform.SetParent(chunk, false);
        go.transform.localPosition = new Vector3(Random.Range(-3f, 3f), 0.7f, z);
        Color c = stage == 1 ? Danao.WuXing[Random.Range(0, 5)] : Danao.Gold;
        Danao.Prim(go.transform, "gem", PrimitiveType.Sphere, Vector3.zero, Vector3.one * 0.45f, Mats.Solid(c, Color.white, c * 0.5f, "gem" + z));
        Danao.Glow(go.transform, c, 1.2f, 3.5f);
        var col = go.AddComponent<SphereCollider>();
        col.isTrigger = true;
        col.radius = 0.5f;
        var rb = go.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        var p = go.AddComponent<PickupOrb>();
        if (stage == 1) { p.element = Random.Range(0, 5); p.qi = Random.Range(22, 48); }
        else { p.xiu = 40 + stage * 30; }
        p.heal = Random.value > 0.7f ? 12 : 0;
        go.AddComponent<BobSpin>().amp = 0.12f;
    }

    void ApplyStageVisuals()
    {
        Color fog, skyA, skyB, sun, ambS, ambE, ambG;
        switch (stage)
        {
            case 1:
                fog = new Color(0.45f, 0.18f, 0.55f);
                skyA = new Color(0.18f, 0.05f, 0.28f);
                skyB = new Color(0.95f, 0.45f, 0.75f);
                sun = new Color(1f, 0.75f, 0.95f);
                ambS = new Color(0.7f, 0.45f, 0.8f);
                ambE = new Color(0.5f, 0.3f, 0.4f);
                ambG = new Color(0.25f, 0.1f, 0.2f);
                _speed = 4.6f;
                break;
            case 2:
                fog = new Color(0.35f, 0.55f, 0.32f);
                skyA = new Color(0.35f, 0.62f, 0.85f);
                skyB = new Color(0.95f, 0.85f, 0.55f);
                sun = new Color(1f, 0.92f, 0.7f);
                ambS = new Color(0.55f, 0.7f, 0.45f);
                ambE = new Color(0.4f, 0.5f, 0.25f);
                ambG = new Color(0.2f, 0.25f, 0.1f);
                _speed = 5.4f;
                break;
            case 3:
                fog = new Color(0.2f, 0.4f, 0.6f);
                skyA = new Color(0.05f, 0.12f, 0.28f);
                skyB = new Color(0.35f, 0.65f, 0.85f);
                sun = new Color(0.75f, 0.88f, 1f);
                ambS = new Color(0.3f, 0.45f, 0.65f);
                ambE = new Color(0.2f, 0.35f, 0.5f);
                ambG = new Color(0.05f, 0.1f, 0.18f);
                _speed = 5.8f;
                break;
            case 4:
                fog = new Color(0.55f, 0.6f, 0.55f);
                skyA = new Color(0.45f, 0.55f, 0.62f);
                skyB = new Color(0.9f, 0.88f, 0.75f);
                sun = new Color(1f, 0.95f, 0.85f);
                ambS = new Color(0.6f, 0.62f, 0.58f);
                ambE = new Color(0.45f, 0.48f, 0.4f);
                ambG = new Color(0.2f, 0.22f, 0.16f);
                _speed = 5.5f;
                break;
            default:
                fog = new Color(0.85f, 0.72f, 0.4f);
                skyA = new Color(0.25f, 0.18f, 0.45f);
                skyB = new Color(1f, 0.82f, 0.4f);
                sun = new Color(1f, 0.88f, 0.55f);
                ambS = new Color(0.85f, 0.72f, 0.4f);
                ambE = new Color(0.6f, 0.45f, 0.3f);
                ambG = new Color(0.3f, 0.2f, 0.12f);
                _speed = 5.6f;
                break;
        }
        RenderSettings.fogColor = fog;
        RenderSettings.fogDensity = 0.016f + stage * 0.001f;
        RenderSettings.ambientSkyColor = ambS;
        RenderSettings.ambientEquatorColor = ambE;
        RenderSettings.ambientGroundColor = ambG;
        if (_sun != null) { _sun.color = sun; _sun.intensity = 1.05f + stage * 0.05f; }
        var sky = new Material(Shader.Find("Skybox/Procedural"));
        if (sky.shader != null && sky.shader.name.Contains("Procedural"))
        {
            sky.SetFloat("_AtmosphereThickness", 0.9f + stage * 0.08f);
            sky.SetColor("_SkyTint", Color.Lerp(skyA, skyB, 0.4f));
            sky.SetColor("_GroundColor", fog);
            RenderSettings.skybox = sky;
        }
        DynamicGI.UpdateEnvironment();
        if (_heroLight != null) _heroLight.color = stage == 1 ? new Color(1f, 0.7f, 1f) : Danao.Gold;
    }

    void ClearWorld()
    {
        foreach (var c in _chunks) if (c) Destroy(c);
        _chunks.Clear();
        _nextChunk = Mathf.Max(0, Mathf.FloorToInt(player.position.z / ChunkLen) - 1);
        var mobs = FindObjectsOfType<Mob>();
        for (int i = 0; i < mobs.Length; i++) Destroy(mobs[i].gameObject);
        var extra = FindObjectsOfType<Bolt>();
        for (int i = 0; i < extra.Length; i++) Destroy(extra[i].gameObject);
    }
}
