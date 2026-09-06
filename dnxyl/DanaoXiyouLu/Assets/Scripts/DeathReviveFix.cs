using UnityEngine;

[DefaultExecutionOrder(-20)]
public class DeathReviveFix : MonoBehaviour
{
    int _savedStage = 1;
    long _savedXiu;
    readonly int[] _savedWx = new int[5];
    int _savedMax = 100;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<DeathReviveFix>() != null) return;
        var go = new GameObject("DeathReviveFix");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<DeathReviveFix>();
    }

    void LateUpdate()
    {
        var g = GameRoot.I;
        if (g == null) return;

        bool resetToOne = _savedStage > 1 && g.stage == 1 && g.hp >= g.maxHp - 1
            && g.PlayClock < 0.35f
            && (g.player == null || g.player.position.sqrMagnitude < 0.8f);
        if (resetToOne)
            Restore(g);

        if (g.hp > 0)
        {
            _savedStage = Mathf.Max(1, g.stage);
            _savedXiu = g.xiuwei;
            _savedMax = Mathf.Max(100, g.maxHp);
            for (int i = 0; i < 5; i++) _savedWx[i] = g.wuXing[i];
        }
    }

    void Restore(GameRoot g)
    {
        g.stage = _savedStage;
        g.xiuwei = _savedXiu;
        g.maxHp = Mathf.Max(100, _savedMax);
        g.hp = g.maxHp;
        for (int i = 0; i < 5; i++) g.wuXing[i] = _savedWx[i];
        g.PlayClock = 0f;
        g.Paused = false;
        g.SetUserPause(false);
        if (g.player != null) g.player.position = Vector3.zero;
        g.PublicClearWorld(true);
        g.PublicApplyStageVisuals();
        g.RebuildModel();
        g.PublicEnsureChunks();
        Vector3 p = g.player != null ? g.player.position + Vector3.up * 2f : Vector3.up * 2f;
        FloatText.Show(p, "元神溃散 · 本关再炼", new Color(1f, 0.45f, 0.35f));
    }
}
