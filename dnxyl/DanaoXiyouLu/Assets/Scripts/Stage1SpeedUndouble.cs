using System.Reflection;
using UnityEngine;

[DefaultExecutionOrder(101)]
public class Stage1SpeedUndouble : MonoBehaviour
{
    static readonly FieldInfo SpeedField =
        typeof(GameRoot).GetField("_speed", BindingFlags.NonPublic | BindingFlags.Instance);

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<Stage1SpeedUndouble>() != null) return;
        var go = new GameObject("Stage1SpeedUndouble");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<Stage1SpeedUndouble>();
    }

    void LateUpdate()
    {
        var g = GameRoot.I;
        if (g == null || g.stage != 1 || g.player == null) return;

        float want = StagePaceFix.Stage1Base * StagePaceFix.Stage1Pace(g);
        if (SpeedField != null)
            SpeedField.SetValue(g, want);

        if (g.Halted) return;
        float extra = want * (g.PlayPace - 1f) * Time.deltaTime;
        if (extra <= 0.00001f) return;
        Vector3 p = g.player.position;
        p.z -= extra;
        g.player.position = p;
    }
}
