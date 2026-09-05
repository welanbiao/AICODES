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
        for (int i = 0; i < pack; i++)
        {
            float[] lanes = { -2.8f, -1.4f, 0f, 1.4f, 2.8f };
            Vector3 pos = player.position + new Vector3(lanes[Random.Range(0, lanes.Length)], 0, Random.Range(16f, 28f) + i * 1.1f);
            SpawnMob(PickKind(), pos);
        }
    }

    float SpawnInterval()
    {
        if (stage == 1) return 1.05f;
        return Mathf.Max(0.7f, 1.2f - stage * 0.08f);
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
        root.transform.position = pos;
        var vis = EnemyBuilder.Build(k, root.transform);
        vis.transform.localPosition = Vector3.zero;
        var mob = root.AddComponent<Mob>();
        mob.Init(k, player, stage);
        root.transform.LookAt(new Vector3(player.position.x, pos.y, player.position.z));
    }

    public void CaptureSpirit(Mob m)
    {
        if (m == null || m.dead) return;
        int e = m.element;
        if (e >= 0)
        {
            wuXing[e] = Mathf.Min(QiNeed, wuXing[e] + 1);
            FloatText.Show(m.transform.position + Vector3.up * 0.4f, "捕获 " + Danao.WuXingNames[e] + "  " + wuXing[e] + "/" + QiNeed, Danao.WuXing[e]);
            Vfx.Burst(m.transform.position + Vector3.up, Danao.WuXing[e], 16);
            Vfx.Ring(player.position, Danao.WuXing[e], 0.55f);
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
            wuXing[m.element] = Mathf.Min(QiNeed, wuXing[m.element] + 1);
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
        if (stage == 1 && g.element >= 0)
        {
            wuXing[g.element] = Mathf.Min(QiNeed, wuXing[g.element] + g.add);
            FloatText.Show(player.position, Danao.WuXingNames[g.element] + "+" + g.add, Danao.WuXing[g.element]);
        }
        else
        {
            if (g.mul > 1.01f) xiuwei = (long)(xiuwei * g.mul);
            xiuwei += g.xiuAdd;
            FloatText.Show(player.position, "修为提升", Danao.Gold);
        }
        Vfx.Ring(player.position, stage == 1 && g.element >= 0 ? Danao.WuXing[g.element] : Danao.Gold, 0.8f);
    }

    public void ApplyPickup(PickupOrb p)
    {
        if (p.element >= 0)
        {
            wuXing[p.element] = Mathf.Min(QiNeed, wuXing[p.element] + p.qi);
            FloatText.Show(player.position, Danao.WuXingNames[p.element] + "+" + p.qi, Danao.WuXing[p.element]);
        }
        if (p.xiu > 0)
        {
            xiuwei += p.xiu;
            FloatText.Show(player.position, "宝物 修为+" + p.xiu, Danao.Gold);
        }
        if (p.heal > 0) hp = Mathf.Min(maxHp, hp + p.heal);
        Vfx.Burst(p.transform.position, Danao.Gold, 16);
    }

    public void OnBarrelBreak(Vector3 pos)
    {
        if (stage == 1)
        {
            int e = Random.Range(0, 5);
            int g = Random.Range(2, 5);
            wuXing[e] = Mathf.Min(QiNeed, wuXing[e] + g);
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
        long n = 3000;
        for (int i = 2; i < stage; i++) n *= 5;
        return n;
    }

    public bool CanBreak()
    {
        if (stage == 1)
        {
            for (int i = 0; i < 5; i++) if (wuXing[i] < QiNeed) return false;
            return true;
        }
        return xiuwei >= NeedXiu();
    }
}
