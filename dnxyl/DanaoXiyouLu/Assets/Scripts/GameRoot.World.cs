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
        Danao.Prim(go.transform, "ground", PrimitiveType.Cube, new Vector3(0, -0.12f, ChunkLen * 0.5f),
            new Vector3(stage == 1 ? 14f : 12f, 0.28f, ChunkLen), Mats.Ground(stage));

        if (stage == 1)
        {
            Danao.Prim(go.transform, "cliffL", PrimitiveType.Cube, new Vector3(-7.6f, -4.5f, ChunkLen * 0.5f),
                new Vector3(2.2f, 9f, ChunkLen), Mats.Solid(new Color(0.36f, 0.30f, 0.32f), "cliff"));
            Danao.Prim(go.transform, "cliffR", PrimitiveType.Cube, new Vector3(7.6f, -4.5f, ChunkLen * 0.5f),
                new Vector3(2.2f, 9f, ChunkLen), Mats.Solid(new Color(0.36f, 0.30f, 0.32f), "cliff"));
        }
        else
        {
            Color rail = stage == 5 ? Danao.Trim : (stage == 3 ? new Color(0.2f, 0.45f, 0.7f) : new Color(0.35f, 0.22f, 0.12f));
            Danao.Prim(go.transform, "railL", PrimitiveType.Cube, new Vector3(-5.6f, 0.35f, ChunkLen * 0.5f),
                new Vector3(0.28f, 0.9f, ChunkLen), Mats.Solid(rail, "rail" + stage));
            Danao.Prim(go.transform, "railR", PrimitiveType.Cube, new Vector3(5.6f, 0.35f, ChunkLen * 0.5f),
                new Vector3(0.28f, 0.9f, ChunkLen), Mats.Solid(rail, "rail" + stage));
        }

        for (int i = 0; i < 6; i++)
        {
            float z = 2 + i * 3.4f;
            float side = i % 2 == 0 ? -1f : 1f;
            Decor(go.transform, new Vector3(side * Random.Range(7.2f, 12f), 0, z), side);
        }

        if (index > 0 && index % 2 == 0) PlaceLaneContent(go.transform, index);
        return go;
    }

    void Decor(Transform parent, Vector3 pos, float side)
    {
        switch (stage)
        {
            case 1:
                Danao.Mesh(parent, "rock", MeshForge.Golem(), pos + Vector3.up * 0.4f,
                    new Vector3(1.6f, 1.1f, 1.4f), Quaternion.Euler(0, pos.z * 30f, 8),
                    Mats.Solid(new Color(0.4f, 0.34f, 0.36f), "peakRock"));
                if (Random.value > 0.55f)
                    Danao.Mesh(parent, "gem", MeshForge.Crystal(), pos + Vector3.up * 1.3f,
                        new Vector3(0.7f, 1.4f, 0.7f), Quaternion.Euler(12, pos.z * 20, 10),
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

    const float LaneX = 2.7f;
    const float LaneY = 0f;

    void PlaceGates(Transform chunk, float z)
    {
        MakeGate(chunk, new Vector3(-LaneX, LaneY, z), Random.Range(0, 5), Random.Range(28, 55));
        MakeGate(chunk, new Vector3(LaneX, LaneY, z), Random.Range(0, 5), Random.Range(28, 55));
    }

    void MakeGate(Transform parent, Vector3 pos, int elem, int add)
    {
        var go = new GameObject("Gate");
        go.transform.SetParent(parent, false);
        go.transform.localPosition = pos;
        go.transform.localScale = Vector3.one * 1.65f;

        Color c = stage == 1 ? Danao.WuXing[elem] : Danao.Gold;
        var stone = Mats.Solid(new Color(0.28f, 0.22f, 0.18f), "stele");
        var dark = Mats.Solid(new Color(0.08f, 0.05f, 0.04f), "plaque");
        var accent = Mats.Solid(c, Color.white, c * 0.18f, "gateA" + elem + stage);

        Danao.Mesh(go.transform, "base", MeshForge.Cylinder(18), new Vector3(0, 0.12f, 0), new Vector3(0.85f, 0.24f, 0.85f), stone);
        Danao.Mesh(go.transform, "post", MeshForge.Cylinder(16), new Vector3(0, 0.62f, 0), new Vector3(0.18f, 0.55f, 0.18f), stone);
        Danao.Prim(go.transform, "plaque", PrimitiveType.Cube, new Vector3(0, 1.18f, 0), new Vector3(0.95f, 0.58f, 0.08f), dark);
        Danao.Prim(go.transform, "rimL", PrimitiveType.Cube, new Vector3(-0.48f, 1.18f, 0), new Vector3(0.06f, 0.68f, 0.14f), Mats.Gold);
        Danao.Prim(go.transform, "rimR", PrimitiveType.Cube, new Vector3(0.48f, 1.18f, 0), new Vector3(0.06f, 0.68f, 0.14f), Mats.Gold);
        Danao.Prim(go.transform, "rimT", PrimitiveType.Cube, new Vector3(0, 1.50f, 0), new Vector3(1.02f, 0.06f, 0.14f), Mats.Gold);
        Danao.Prim(go.transform, "rimB", PrimitiveType.Cube, new Vector3(0, 0.86f, 0), new Vector3(1.02f, 0.06f, 0.14f), Mats.Gold);

        var icon = Danao.Node(go.transform, "icon", new Vector3(0, 1.92f, 0));
        BuildGateIcon(icon, elem, accent);
        icon.gameObject.AddComponent<BobSpin>().amp = 0.06f;

        var col = go.AddComponent<BoxCollider>();
        col.center = new Vector3(0, 1.05f, 0);
        col.size = new Vector3(1.55f, 2.15f, 0.85f);
        col.isTrigger = true;
        var rb = go.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        rb.useGravity = false;
        var g = go.AddComponent<GateTrigger>();
        string label;
        if (stage == 1)
        {
            g.element = elem;
            g.add = add;
            label = Danao.WuXingNames[elem] + " +" + add;
        }
        else
        {
            g.xiuAdd = add * 4 + stage * 20;
            g.mul = Random.value > 0.78f ? 1.15f : 1f;
            label = g.mul > 1.01f ? "修为 x" + g.mul.ToString("0.00") : "修为 +" + g.xiuAdd;
        }
        Danao.Label3D(go.transform, "lab", label, new Vector3(0, 1.18f, -0.12f), 0.045f, Color.white);
    }

    void BuildGateIcon(Transform t, int elem, Material accent)
    {
        if (stage == 1)
        {
            switch (elem)
            {
                case 0:
                    Danao.Mesh(t, "c1", MeshForge.Crystal(), new Vector3(0, 0.02f, 0), new Vector3(0.55f, 0.7f, 0.55f), accent);
                    Danao.Mesh(t, "c2", MeshForge.Crystal(), new Vector3(-0.16f, -0.08f, 0.04f), new Vector3(0.32f, 0.42f, 0.32f), Quaternion.Euler(0, 30, 18), accent);
                    Danao.Mesh(t, "c3", MeshForge.Crystal(), new Vector3(0.16f, -0.1f, -0.02f), new Vector3(0.28f, 0.38f, 0.28f), Quaternion.Euler(8, -20, -12), accent);
                    break;
                case 1:
                    Danao.Mesh(t, "trunk", MeshForge.Cylinder(12), new Vector3(0, -0.12f, 0), new Vector3(0.12f, 0.32f, 0.12f),
                        Mats.Solid(new Color(0.38f, 0.22f, 0.1f), "bark"));
                    Danao.Mesh(t, "leaf", MeshForge.Sphere(14, 10), new Vector3(0, 0.18f, 0), new Vector3(0.42f, 0.36f, 0.42f), accent);
                    Danao.Mesh(t, "leaf2", MeshForge.Sphere(12, 8), new Vector3(0.16f, 0.08f, 0.08f), new Vector3(0.22f, 0.18f, 0.22f), accent);
                    break;
                case 2:
                    Danao.Mesh(t, "drop", MeshForge.Drop(), Vector3.zero, new Vector3(0.55f, 0.7f, 0.55f), accent);
                    break;
                case 3:
                    Danao.Mesh(t, "fl", MeshForge.Flame(), Vector3.zero, new Vector3(0.55f, 0.75f, 0.55f), accent);
                    Danao.Mesh(t, "fl2", MeshForge.Flame(), new Vector3(0.08f, -0.05f, 0), new Vector3(0.32f, 0.5f, 0.32f), Quaternion.Euler(0, 40, 8), accent);
                    break;
                default:
                    Danao.Mesh(t, "rock", MeshForge.Golem(), Vector3.zero, new Vector3(0.7f, 0.55f, 0.7f), accent);
                    Danao.Mesh(t, "rock2", MeshForge.Golem(), new Vector3(0.18f, -0.12f, 0.06f), new Vector3(0.38f, 0.32f, 0.38f), accent);
                    break;
            }
            return;
        }
        switch (elem % 5)
        {
            case 0:
                Danao.Mesh(t, "ingot", MeshForge.Cylinder(6), Vector3.zero, new Vector3(0.55f, 0.18f, 0.32f), Mats.Gold);
                Danao.Mesh(t, "ingot2", MeshForge.Cylinder(6), new Vector3(0, 0.14f, 0), new Vector3(0.42f, 0.12f, 0.24f), Mats.Gold);
                break;
            case 1:
                Danao.Mesh(t, "peach", MeshForge.Peach(), Vector3.zero, Vector3.one * 0.55f,
                    Mats.Solid(new Color(1f, 0.42f, 0.38f), Color.white, new Color(0.25f, 0.04f, 0.02f), "peachI"));
                Danao.Mesh(t, "leaf", MeshForge.Sphere(10, 8), new Vector3(0.08f, 0.22f, 0), new Vector3(0.16f, 0.06f, 0.1f),
                    Mats.Solid(new Color(0.25f, 0.62f, 0.22f), "peachL"));
                break;
            case 2:
                Danao.Mesh(t, "jade", MeshForge.Cylinder(4), Vector3.zero, new Vector3(0.42f, 0.55f, 0.1f), Quaternion.Euler(0, 45, 0),
                    Mats.Solid(new Color(0.35f, 0.85f, 0.55f), Color.white, new Color(0.08f, 0.25f, 0.12f), "jadeI"));
                break;
            case 3:
                Danao.Mesh(t, "gourd", MeshForge.Gourd(), Vector3.zero, new Vector3(0.45f, 0.65f, 0.45f),
                    Mats.Solid(new Color(0.18f, 0.55f, 0.28f), Color.white, new Color(0.04f, 0.12f, 0.04f), "gourd"));
                Danao.Mesh(t, "cork", MeshForge.Cylinder(10), new Vector3(0, 0.32f, 0), new Vector3(0.08f, 0.08f, 0.08f), Mats.Cloth);
                break;
            default:
                Danao.Mesh(t, "pill", MeshForge.Sphere(16, 12), Vector3.zero, Vector3.one * 0.42f, Mats.Gold);
                Danao.Mesh(t, "band", MeshForge.Cylinder(12), Vector3.zero, new Vector3(0.44f, 0.05f, 0.44f), Mats.Trim);
                break;
        }
    }

    void PlaceBarrels(Transform chunk, float z)
    {
        MakeBarrel(chunk, new Vector3(-LaneX, LaneY, z));
        MakeBarrel(chunk, new Vector3(LaneX, LaneY, z));
    }

    void MakeBarrel(Transform chunk, Vector3 pos)
    {
        var go = new GameObject("Barrel");
        go.transform.SetParent(chunk, false);
        go.transform.localPosition = pos;
        go.transform.localScale = Vector3.one * 1.7f;
        Danao.Prim(go.transform, "b", PrimitiveType.Cylinder, new Vector3(0, 0.55f, 0), new Vector3(0.55f, 0.55f, 0.55f),
            Mats.Solid(new Color(0.55f, 0.32f, 0.14f), "bar"));
        Danao.Prim(go.transform, "ring", PrimitiveType.Cylinder, new Vector3(0, 0.75f, 0), new Vector3(0.58f, 0.05f, 0.58f), Mats.Gold);
        var col = go.AddComponent<CapsuleCollider>();
        col.isTrigger = true;
        col.radius = 0.55f;
        col.height = 1.3f;
        col.center = new Vector3(0, 0.55f, 0);
        var rb = go.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        var b = go.AddComponent<Barrel>();
        b.hp = 24 + stage * 12;
        var lab = new GameObject("hp");
        lab.transform.SetParent(go.transform, false);
        lab.transform.localPosition = Vector3.up * 1.25f;
        var tm = lab.AddComponent<TextMesh>();
        tm.text = Mathf.CeilToInt(b.hp).ToString();
        tm.anchor = TextAnchor.MiddleCenter;
        tm.characterSize = 0.08f;
        tm.fontSize = 36;
        tm.color = Color.white;
    }

    void PlaceTreasure(Transform chunk, float z)
    {
        MakePickup(chunk, new Vector3(-LaneX, LaneY, z));
        MakePickup(chunk, new Vector3(LaneX, LaneY, z));
    }

    void MakePickup(Transform chunk, Vector3 pos)
    {
        var go = new GameObject("Treasure");
        go.transform.SetParent(chunk, false);
        go.transform.localPosition = pos;
        go.transform.localScale = Vector3.one * 1.7f;
        Color c = stage == 1 ? Danao.WuXing[Random.Range(0, 5)] : Danao.Gold;
        Danao.Mesh(go.transform, "stand", MeshForge.Cylinder(14), new Vector3(0, 0.18f, 0), new Vector3(0.7f, 0.22f, 0.7f),
            Mats.Solid(new Color(0.28f, 0.22f, 0.18f), "stele"));
        Danao.Prim(go.transform, "gem", PrimitiveType.Sphere, new Vector3(0, 0.85f, 0), Vector3.one * 0.62f,
            Mats.Solid(c, Color.white, c * 0.45f, "gem" + pos.x + pos.z));
        var col = go.AddComponent<SphereCollider>();
        col.isTrigger = true;
        col.radius = 0.7f;
        col.center = new Vector3(0, 0.85f, 0);
        var rb = go.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        var p = go.AddComponent<PickupOrb>();
        if (stage == 1) { p.element = Random.Range(0, 5); p.qi = Random.Range(22, 48); }
        else { p.xiu = 40 + stage * 30; }
        p.heal = Random.value > 0.7f ? 12 : 0;
        var bob = go.AddComponent<BobSpin>();
        bob.amp = 0.08f;
        bob.spin = new Vector3(0, 50, 0);
    }

    void ApplyStageVisuals()
    {
        Color fog, skyA, skyB, sun, ambS, ambE, ambG;
        switch (stage)
        {
            case 1:
                fog = new Color(0.78f, 0.62f, 0.82f);
                skyA = new Color(0.42f, 0.18f, 0.48f);
                skyB = new Color(1f, 0.62f, 0.72f);
                sun = new Color(1f, 0.78f, 0.55f);
                ambS = new Color(0.75f, 0.55f, 0.72f);
                ambE = new Color(0.55f, 0.38f, 0.42f);
                ambG = new Color(0.22f, 0.14f, 0.18f);
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
        if (_cam != null) _cam.backgroundColor = skyA;
        var skyShader = Shader.Find("Skybox/Procedural");
        if (skyShader != null)
        {
            var sky = new Material(skyShader);
            sky.SetFloat("_AtmosphereThickness", 0.9f + stage * 0.08f);
            sky.SetColor("_SkyTint", Color.Lerp(skyA, skyB, 0.4f));
            sky.SetColor("_GroundColor", fog);
            RenderSettings.skybox = sky;
        }
        DynamicGI.UpdateEnvironment();
        if (_heroLight != null) _heroLight.color = stage == 1 ? new Color(1f, 0.7f, 1f) : Danao.Gold;
    }

    void ClearWorld(bool resetPath = false)
    {
        foreach (var c in _chunks) if (c) Destroy(c);
        _chunks.Clear();
        _nextChunk = resetPath ? 0 : Mathf.Max(0, Mathf.FloorToInt(player.position.z / ChunkLen) - 1);
        var mobs = Object.FindObjectsByType<Mob>(FindObjectsSortMode.None);
        for (int i = 0; i < mobs.Length; i++) Destroy(mobs[i].gameObject);
        var extra = Object.FindObjectsByType<Bolt>(FindObjectsSortMode.None);
        for (int i = 0; i < extra.Length; i++) Destroy(extra[i].gameObject);
        var pickups = Object.FindObjectsByType<PickupOrb>(FindObjectsSortMode.None);
        for (int i = 0; i < pickups.Length; i++) Destroy(pickups[i].gameObject);
        var barrels = Object.FindObjectsByType<Barrel>(FindObjectsSortMode.None);
        for (int i = 0; i < barrels.Length; i++) Destroy(barrels[i].gameObject);
        var gates = Object.FindObjectsByType<GateTrigger>(FindObjectsSortMode.None);
        for (int i = 0; i < gates.Length; i++) Destroy(gates[i].gameObject);
    }
}
