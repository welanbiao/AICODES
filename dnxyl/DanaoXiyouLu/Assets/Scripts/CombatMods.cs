using System.Collections.Generic;
using System.Reflection;
using UnityEngine;

[DefaultExecutionOrder(50)]
public class CombatMods : MonoBehaviour
{
    static readonly FieldInfo ChunksField =
        typeof(GameRoot).GetField("_chunks", BindingFlags.NonPublic | BindingFlags.Instance);

    int _prevBolts;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<CombatMods>() != null) return;
        var go = new GameObject("CombatMods");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<CombatMods>();
    }

    void LateUpdate()
    {
        var g = GameRoot.I;
        if (g == null || g.UserPaused) return;
        StripGlow();
        StampGateBonuses();
        ExtraLoot(g);
        UpgradeTreasures(g);
        PaceFire(g);
        ExtraShots(g);
        ScaleBoltDamage(g);
    }

    static void StripGlow()
    {
        var gates = Object.FindObjectsByType<GateTrigger>(FindObjectsSortMode.None);
        for (int i = 0; i < gates.Length; i++) StripNode(gates[i].transform);
        var orbs = Object.FindObjectsByType<PickupOrb>(FindObjectsSortMode.None);
        for (int i = 0; i < orbs.Length; i++) StripNode(orbs[i].transform);
    }

    static void StripNode(Transform go)
    {
        Transform frame = go.Find("frame");
        if (frame != null) Object.Destroy(frame.gameObject);
        Transform aura = go.Find("aura");
        if (aura != null) Object.Destroy(aura.gameObject);
        Transform glow = go.Find("glow");
        if (glow != null) Object.Destroy(glow.gameObject);
        var lights = go.GetComponentsInChildren<Light>(true);
        for (int i = 0; i < lights.Length; i++)
            if (lights[i].type == LightType.Point) Object.Destroy(lights[i]);
    }

    static void StampGateBonuses()
    {
        var gates = Object.FindObjectsByType<GateTrigger>(FindObjectsSortMode.None);
        for (int i = 0; i < gates.Length; i++)
            GateBonus.Stamp(gates[i].gameObject);
    }

    static void ExtraLoot(GameRoot g)
    {
        if (g.player == null || ChunksField == null) return;
        var chunks = ChunksField.GetValue(g) as List<GameObject>;
        if (chunks == null) return;
        for (int i = 0; i < chunks.Count; i++)
        {
            GameObject chGo = chunks[i];
            if (chGo == null) continue;
            if (chGo.name == "Chunk_0")
            {
                if (chGo.GetComponent<LootBoostMark>() == null)
                    chGo.AddComponent<LootBoostMark>();
                continue;
            }
            Transform ch = chGo.transform;
            if (ch.GetComponent<LootBoostMark>() != null) continue;
            int index = 0;
            int us = chGo.name.LastIndexOf('_');
            if (us >= 0) int.TryParse(chGo.name.Substring(us + 1), out index);
            int n = CountLoot(ch);
            if (n == 0)
            {
                int rows = Random.value < 0.78f ? 2 : 1;
                for (int r = 0; r < rows; r++)
                    g.PublicPlaceLane(ch, index);
            }
            else if (n < 4 && Random.value < 0.7f)
            {
                g.PublicPlaceLane(ch, index);
            }
            n = CountLoot(ch);
            if (n < 4)
            {
                float z = 3.5f + n * 4.8f + Random.Range(0f, 1.4f);
                if (Random.value < 0.5f) SpawnTreasure(ch, z, g.stage);
                else SpawnGate(ch, z, g.stage);
                n++;
            }
            while (n < 2)
            {
                float z = 3.5f + n * 4.6f + Random.Range(0f, 1.6f);
                if (n % 2 == 0) SpawnTreasure(ch, z, g.stage);
                else SpawnGate(ch, z, g.stage);
                n++;
            }
            ch.gameObject.AddComponent<LootBoostMark>();
        }
    }

    static int CountLoot(Transform ch)
    {
        int n = 0;
        for (int c = 0; c < ch.childCount; c++)
        {
            string name = ch.GetChild(c).name;
            if (name == "Gate" || name == "Treasure") n++;
        }
        return n;
    }

    static void SpawnTreasure(Transform chunk, float z, int stage)
    {
        var go = new GameObject("Treasure");
        go.transform.SetParent(chunk, false);
        go.transform.localPosition = new Vector3(Random.value < 0.5f ? -2.15f : 2.15f, 0.58f, z);
        int elem = Random.Range(0, 5);
        LootArt.TreasureMeshes(go.transform, stage, elem);
        go.AddComponent<LootArtMark>();
        var col = go.AddComponent<SphereCollider>();
        col.isTrigger = true;
        col.radius = 0.85f;
        var rb = go.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        rb.useGravity = false;
        var p = go.AddComponent<PickupOrb>();
        if (stage == 1) { p.element = elem; p.qi = Random.Range(2, 5); }
        else { p.xiu = 40 + stage * 30; }
        p.heal = Random.value > 0.65f ? 10 : 0;
        go.AddComponent<BobSpin>().amp = 0.06f;
    }

    static void SpawnGate(Transform chunk, float z, int stage)
    {
        var go = new GameObject("Gate");
        go.transform.SetParent(chunk, false);
        go.transform.localPosition = new Vector3(Random.value < 0.5f ? -2.15f : 2.15f, 0f, z);
        int elem = Random.Range(0, 5);
        Danao.Mesh(go.transform, "cushion", MeshForge.Cylinder(16), new Vector3(0f, 0.12f, 0f),
            new Vector3(1.05f, 0.16f, 1.05f), Mats.Solid(new Color(0.5f, 0.38f, 0.28f), "stele2"));
        var icon = Danao.Node(go.transform, "icon", new Vector3(0f, 0.58f, 0f));
        LootArt.GateIcon(icon, stage, elem);
        icon.gameObject.AddComponent<BobSpin>().amp = 0.04f;
        var col = go.AddComponent<BoxCollider>();
        col.isTrigger = true;
        col.center = new Vector3(0f, 1.1f, 0f);
        col.size = new Vector3(2.4f, 2.6f, 1.4f);
        var rb = go.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        rb.useGravity = false;
        var gt = go.AddComponent<GateTrigger>();
        string label;
        if (stage == 1)
        {
            gt.element = elem;
            gt.add = Random.Range(3, 7);
            label = Danao.WuXingNames[elem] + " +" + gt.add;
        }
        else
        {
            gt.xiuAdd = 80 + stage * 40;
            label = "选项";
        }
        Danao.Label3D(go.transform, "lab", label, new Vector3(0f, 2.05f, -0.12f), 0.05f, Color.white);
        GateBonus.Stamp(go);
    }

    static void UpgradeTreasures(GameRoot g)
    {
        var orbs = Object.FindObjectsByType<PickupOrb>(FindObjectsSortMode.None);
        for (int i = 0; i < orbs.Length; i++)
        {
            PickupOrb p = orbs[i];
            if (p.GetComponent<LootArtMark>() != null) continue;
            Transform t = p.transform;
            for (int c = t.childCount - 1; c >= 0; c--)
            {
                Transform ch = t.GetChild(c);
                if (ch.name == "glow" || ch.name == "gem" || ch.name == "core")
                    Object.DestroyImmediate(ch.gameObject);
            }
            int elem = p.element >= 0 ? p.element : Random.Range(0, 5);
            LootArt.TreasureMeshes(t, g.stage, elem);
            p.gameObject.AddComponent<LootArtMark>();
        }
    }

    static void PaceFire(GameRoot g)
    {
        if (g.stage <= 1) return;
        var field = typeof(GameRoot).GetField("_atkCd", BindingFlags.NonPublic | BindingFlags.Instance);
        if (field == null) return;
        float pace = Mathf.Min(3f, g.PlayPace);
        float want = Mathf.Max(0.08f, (0.36f - g.stage * 0.018f) / (0.82f + 0.38f * pace) / Mathf.Max(1f, g.bonusFire));
        float cd = (float)field.GetValue(g);
        if (cd > want) field.SetValue(g, want);
    }

    static int BaseShots(GameRoot g)
    {
        if (g.stage <= 1) return 1;
        if (g.xiuwei > 80000) return 4;
        if (g.xiuwei > 12000) return 3;
        if (g.xiuwei > 1500) return 2;
        return 1;
    }

    void ExtraShots(GameRoot g)
    {
        var bolts = Object.FindObjectsByType<Bolt>(FindObjectsSortMode.None);
        int n = bolts.Length;
        int spawned = n - _prevBolts;
        _prevBolts = n;
        if (g.stage <= 1 || spawned <= 0 || g.player == null) return;
        int want = Mathf.Clamp(BaseShots(g) + Mathf.Clamp(g.bonusShots, 0, 7), 1, 8);
        int missing = want - spawned;
        if (missing <= 0) return;

        Vector3 muzzle = g.player.position + Vector3.up * 1.15f + Vector3.forward * 0.4f;
        Vector3 dir = Vector3.forward;
        for (int i = 0; i < bolts.Length; i++)
        {
            if (bolts[i].vel.sqrMagnitude > 1f)
            {
                dir = bolts[i].vel.normalized;
                break;
            }
        }
        for (int i = 0; i < missing; i++)
        {
            float spread = (i - (missing - 1) * 0.5f) * 0.08f;
            Vector3 d = Quaternion.Euler(0f, spread * 40f, 0f) * dir;
            SpawnStageBolt(g, muzzle, d);
        }
        _prevBolts = Object.FindObjectsByType<Bolt>(FindObjectsSortMode.None).Length;
    }

    static void ScaleBoltDamage(GameRoot g)
    {
        if (g.bonusDmg <= 1.001f) return;
        float unscaled = 11f + g.stage * 7f;
        if (g.stage != 1) unscaled += Mathf.Log(1f + g.xiuwei) * 1.8f;
        var bolts = Object.FindObjectsByType<Bolt>(FindObjectsSortMode.None);
        for (int i = 0; i < bolts.Length; i++)
        {
            Bolt b = bolts[i];
            if (b.GetComponent<DmgScaled>() != null) continue;
            if (Mathf.Abs(b.dmg - unscaled) < 0.6f)
                b.dmg *= g.bonusDmg;
            b.gameObject.AddComponent<DmgScaled>();
        }
    }

    static void SpawnStageBolt(GameRoot g, Vector3 pos, Vector3 dir)
    {
        dir = dir.normalized;
        var go = new GameObject("Bolt");
        go.transform.position = pos;
        go.transform.rotation = Quaternion.LookRotation(dir);
        var mf = go.AddComponent<MeshFilter>();
        var mr = go.AddComponent<MeshRenderer>();
        mr.shadowCastingMode = UnityEngine.Rendering.ShadowCastingMode.Off;
        float life = 2.3f;
        float speed = 22f;
        bool faceVel = false;
        switch (g.stage)
        {
            case 2:
                mf.sharedMesh = MeshForge.Golem();
                go.transform.localScale = Vector3.one * 0.32f;
                mr.sharedMaterial = Mats.Solid(new Color(0.55f, 0.5f, 0.45f), "mtnRock");
                speed = 18f;
                break;
            case 3:
                mf.sharedMesh = MeshForge.Cylinder(12);
                go.transform.localScale = new Vector3(0.22f, 1.35f, 0.22f);
                go.transform.rotation = Quaternion.FromToRotation(Vector3.up, dir);
                mr.sharedMaterial = Mats.Spirit(2);
                faceVel = true;
                speed = 24f;
                break;
            case 4:
                mf.sharedMesh = MeshForge.StaffPole();
                go.transform.localScale = new Vector3(0.07f, 0.85f, 0.07f);
                go.transform.rotation = Quaternion.FromToRotation(Vector3.up, dir);
                mr.sharedMaterial = Mats.Solid(new Color(0.45f, 0.28f, 0.12f), "bark");
                faceVel = true;
                speed = 20f;
                break;
            default:
                mf.sharedMesh = MeshForge.Sphere(16, 12);
                go.transform.localScale = Vector3.one * 0.28f;
                mr.sharedMaterial = Mats.Spirit(3);
                Danao.Mesh(go.transform, "fl", MeshForge.Flame(), new Vector3(0f, 0f, -0.12f),
                    new Vector3(0.55f, 0.7f, 0.55f), Quaternion.Euler(90f, 0f, 0f), Mats.Spirit(3));
                speed = 23f;
                break;
        }
        var sc = go.AddComponent<SphereCollider>();
        sc.isTrigger = true;
        sc.radius = 0.55f;
        var rb = go.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        rb.useGravity = false;
        var b = go.AddComponent<Bolt>();
        b.vel = dir * speed;
        b.dmg = (11f + g.stage * 7f + Mathf.Log(1f + g.xiuwei) * 1.8f) * Mathf.Max(1f, g.bonusDmg);
        b.faceVel = faceVel;
        go.AddComponent<DmgScaled>();
        Object.Destroy(go, life);
    }
}

public class LootBoostMark : MonoBehaviour { }
public class LootArtMark : MonoBehaviour { }
public class DmgScaled : MonoBehaviour { }
