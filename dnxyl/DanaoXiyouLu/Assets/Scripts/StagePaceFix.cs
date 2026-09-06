using System.Reflection;
using UnityEngine;

[DefaultExecutionOrder(90)]
public class StagePaceFix : MonoBehaviour
{
    public const float Stage1Base = 4.6f * 1.5f;

    static readonly FieldInfo SpeedField = typeof(GameRoot).GetField("_speed", BindingFlags.NonPublic | BindingFlags.Instance);
    static readonly FieldInfo AtkField = typeof(GameRoot).GetField("_atkCd", BindingFlags.NonPublic | BindingFlags.Instance);

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<StagePaceFix>() != null) return;
        var go = new GameObject("StagePaceFix");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<StagePaceFix>();
    }

    public static float Stage1Pace(GameRoot g)
    {
        return Mathf.Min(2.6f, 1f + g.PlayClock / 210f);
    }

    void LateUpdate()
    {
        var g = GameRoot.I;
        if (g == null) return;
        int stage = g.stage;
        float baseSpd = stage <= 1 ? Stage1Base : stage == 2 ? 5.8f : stage == 3 ? 7.0f : stage == 4 ? 8.4f : 9.8f;
        float pace = stage <= 1 ? Stage1Pace(g) : Mathf.Min(3f, g.PlayPace);
        if (SpeedField != null)
            SpeedField.SetValue(g, baseSpd * pace);

        if (stage <= 1 || AtkField == null) return;
        float fire = Mathf.Max(1f, g.bonusFire);
        float baseInt = 0.36f - stage * 0.016f;
        float want = Mathf.Max(0.08f, baseInt / (0.82f + 0.38f * pace) / fire);
        float cd = (float)AtkField.GetValue(g);
        if (cd > want)
            AtkField.SetValue(g, want);

        var bolts = Object.FindObjectsByType<Bolt>(FindObjectsSortMode.None);
        for (int i = 0; i < bolts.Length; i++)
        {
            Bolt b = bolts[i];
            if (b.GetComponent<BoltPaced>() != null) continue;
            b.vel *= 0.85f + 0.18f * pace;
            b.gameObject.AddComponent<BoltPaced>();
        }
    }
}

public class BoltPaced : MonoBehaviour { }
