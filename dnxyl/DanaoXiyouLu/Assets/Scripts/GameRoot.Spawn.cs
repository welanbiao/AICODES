using UnityEngine;

public partial class GameRoot
{
    void TickSpawn()
    {
        _spawnCd -= Time.deltaTime;
        if (_spawnCd > 0) return;
        _spawnCd = SpawnInterval();
        int live = Object.FindObjectsByType<Mob>(FindObjectsSortMode.None).Length;
        if (live >= 28) return;

        int pack = Random.Range(1, PackSize() + 1);
        float[] lanes = stage == 1
            ? new[] { -4.4f, -2.2f, 0f, 2.2f, 4.4f }
            : new[] { -2.8f, -1.4f, 0f, 1.4f, 2.8f };
        for (int i = 0; i < pack; i++)
        {
            float lane = lanes[Random.Range(0, lanes.Length)];
            float dz = Random.Range(16f, 28f) + i * 1.1f;
            Vector3 pos = stage == 1
                ? new Vector3(lane, 0f, player.position.z + dz)
                : player.position + new Vector3(lane, 0f, dz);
            SpawnMob(PickKind(), pos);
        }
    }

    float SpawnInterval()
    {
        if (stage == 1) return Mathf.Max(0.34f, 1.05f / PlayPace);
        return Mathf.Max(0.28f, (1.15f - stage * 0.08f) / PlayPace);
    }

    int PackSize()
    {
        if (stage == 1) return 2;
        return 2 + stage / 2;
    }

    MobKind PickKind()
    {
        switch (stage)
        {
            case 1:
                return (MobKind)Random.Range(0, 5);
            case 2:
                if (Random.value < 0.22f) return MobKind.MonkeyGeneral;
                return (MobKind)Random.Range((int)MobKind.Tiger, (int)MobKind.Snake + 1);
            case 3:
                return (MobKind)Random.Range((int)MobKind.FishMan, (int)MobKind.Jelly + 1);
            case 4:
                return Random.value < 0.55f ? MobKind.DiscipleSword : MobKind.DiscipleStaff;
            default:
                if (Random.value < 0.28f) return MobKind.GoldenGuard;
                return Random.value < 0.5f ? MobKind.DiscipleSword : MobKind.DiscipleStaff;
        }
    }

    void SpawnMob(MobKind k, Vector3 pos)
    {
        var root = new GameObject("Mob_" + k);
        if (stage == 1)
        {
            EnsureLaneShift();
            root.transform.SetParent(_laneShift, false);
            root.transform.localPosition = pos;
        }
        else
        {
            root.transform.position = pos;
        }
        var vis = EnemyBuilder.Build(k, root.transform);
        vis.transform.localPosition = stage == 1 ? Vector3.up * 0.85f : Vector3.zero;
        if (stage == 1) vis.transform.localScale = Vector3.one * 1.65f;
        var mob = root.AddComponent<Mob>();
        mob.Init(k, player, stage);
        Vector3 lookAt = new Vector3(player.position.x, root.transform.position.y, player.position.z);
        if ((lookAt - root.transform.position).sqrMagnitude > 0.01f)
            root.transform.LookAt(lookAt);
    }

    public void CaptureSpirit(Mob m)
    {
        if (m == null || m.dead) return;
        int e = m.element;
        if (e >= 0)
        {
            wuXing[e] = Mathf.Min(20, wuXing[e] + 1);
            FloatText.Show(m.transform.position + Vector3.up * 0.4f, "捕获 " + Danao.WuXingNames[e] + "  " + wuXing[e] + "/20", Danao.WuXing[e]);
            Vfx.Burst(m.transform.position + Vector3.up, Danao.WuXing[e], 16);
            Vfx.Ring(player.position, Danao.WuXing[e], 0.55f);
            StageAudio.PlayHit();
        }
        hp = Mathf.Min(maxHp, hp + 1);
        m.dead = true;
        Destroy(m.gameObject);
    }

    public void OnMobKilled(Mob m)
    {
        Vfx.Burst(m.transform.position + Vector3.up, m.element >= 0 ? Danao.WuXing[m.element] : Danao.Gold, 18);
        if (stage == 1 && m.element >= 0)
        {
            wuXing[m.element] = Mathf.Min(20, wuXing[m.element] + 1);
            FloatText.Show(m.transform.position + Vector3.up * 0.4f, Danao.WuXingNames[m.element] + "+1", Danao.WuXing[m.element]);
        }
        else
        {
            int gain = 12 + stage * 6 + Random.Range(0, 10);
            if (stage == 3) gain = Random.Range(55, 85);
            if (stage == 4) gain = Random.Range(220, 330);
            if (stage >= 5) gain = Random.Range(900, 1350);
            xiuwei += gain;
            FloatText.Show(m.transform.position + Vector3.up * 0.4f, "修为+" + gain, Danao.Gold);
        }
        hp = Mathf.Min(maxHp, hp + 1);
    }

    public void ApplyGate(GateTrigger g)
    {
        if (_gateLock > 0) return;
        _gateLock = 0.2f;
        var bonus = g.GetComponent<GateBonus>();
        if (bonus != null) bonus.Grant();
        if (stage == 1 && g.element >= 0)
        {
            wuXing[g.element] = Mathf.Min(20, wuXing[g.element] + g.add);
            FloatText.Show(player.position, Danao.WuXingNames[g.element] + "+" + g.add, Danao.WuXing[g.element]);
        }
        else
        {
            if (g.mul > 1.01f) xiuwei = (long)(xiuwei * g.mul);
            xiuwei += g.xiuAdd;
            if (bonus == null || string.IsNullOrEmpty(bonus.label))
                FloatText.Show(player.position, "修为提升", Danao.Gold);
        }
        Vfx.Ring(player.position, stage == 1 && g.element >= 0 ? Danao.WuXing[g.element] : Danao.Gold, 0.8f);
        StageAudio.PlayPickup();
    }

    public void ApplyPickup(PickupOrb p)
    {
        if (p.element >= 0)
        {
            wuXing[p.element] = Mathf.Min(20, wuXing[p.element] + p.qi);
            FloatText.Show(player.position, Danao.WuXingNames[p.element] + "+" + p.qi, Danao.WuXing[p.element]);
        }
        if (p.xiu > 0)
        {
            xiuwei += p.xiu;
            FloatText.Show(player.position, "宝物 修为+" + p.xiu, Danao.Gold);
        }
        if (p.heal > 0) hp = Mathf.Min(maxHp, hp + p.heal);
        Vfx.Burst(p.transform.position, Danao.Gold, 16);
        StageAudio.PlayPickup();
    }

    public void OnBarrelBreak(Vector3 pos)
    {
        if (stage == 1)
        {
            int e = Random.Range(0, 5);
            int g = Random.Range(2, 5);
            wuXing[e] = Mathf.Min(20, wuXing[e] + g);
            FloatText.Show(pos, Danao.WuXingNames[e] + "+" + g, Danao.WuXing[e]);
        }
        else
        {
            int g = 20 + stage * 15;
            xiuwei += g;
            FloatText.Show(pos, "修为+" + g, Danao.Gold);
        }
        Vfx.Burst(pos, Danao.Gold, 12);
    }

    public long NeedXiu()
    {
        if (stage == 2) return 6000;
        long n = 3000;
        for (int i = 2; i < stage; i++) n *= 5;
        return n;
    }

    public bool CanBreak()
    {
        if (stage >= 5) return false;
        if (stage == 1)
        {
            for (int i = 0; i < 5; i++) if (wuXing[i] < 20) return false;
            return true;
        }
        return xiuwei >= NeedXiu();
    }
}
