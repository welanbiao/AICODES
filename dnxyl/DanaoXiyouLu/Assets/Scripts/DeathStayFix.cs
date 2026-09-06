using UnityEngine;

[DefaultExecutionOrder(-20)]
public class DeathStayFix : MonoBehaviour
{
    int _keepStage = 1;
    int _keepMaxHp = 100;
    long _keepXiu;
    readonly int[] _keepWx = new int[5];
    int _keepShots;
    float _keepDmg = 1f;
    float _keepFire = 1f;
    bool _restoring;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<DeathStayFix>() != null) return;
        var go = new GameObject("DeathStayFix");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<DeathStayFix>();
    }

    void LateUpdate()
    {
        var g = GameRoot.I;
        if (g == null || g.player == null) return;
        if (_restoring)
        {
            _restoring = false;
            Snapshot(g);
            return;
        }

        if (g.stage >= 2 && g.hp > 0)
            Snapshot(g);

        bool resetToOne = g.stage == 1 && _keepStage >= 2 && g.hp == g.maxHp
            && g.player.position.sqrMagnitude < 0.8f && g.PlayClock < 0.35f;
        if (!resetToOne) return;

        g.stage = _keepStage;
        g.maxHp = _keepMaxHp;
        g.hp = g.maxHp;
        g.xiuwei = _keepXiu;
        g.bonusShots = _keepShots;
        g.bonusDmg = _keepDmg;
        g.bonusFire = _keepFire;
        if (g.wuXing != null && g.wuXing.Length >= 5)
        {
            for (int i = 0; i < 5; i++)
                g.wuXing[i] = _keepWx[i];
        }
        g.PlayClock = 0f;
        g.PublicClearWorld(true);
        g.PublicApplyStageVisuals();
        g.RebuildModel();
        g.PublicEnsureChunks();
        _restoring = true;
        FloatText.Show(g.player.position + Vector3.up * 2f, "元神溃散 · 就地重炼", new Color(1f, 0.45f, 0.35f));
    }

    void Snapshot(GameRoot g)
    {
        _keepStage = g.stage;
        _keepMaxHp = g.maxHp;
        _keepXiu = g.xiuwei;
        _keepShots = g.bonusShots;
        _keepDmg = g.bonusDmg;
        _keepFire = g.bonusFire;
        if (g.wuXing == null) return;
        int n = Mathf.Min(5, g.wuXing.Length);
        for (int i = 0; i < n; i++)
            _keepWx[i] = g.wuXing[i];
    }
}
