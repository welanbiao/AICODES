using UnityEngine;

[DefaultExecutionOrder(200)]
public class KillGlowAdd : MonoBehaviour
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<KillGlowAdd>() != null) return;
        var go = new GameObject("KillGlowAdd");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<KillGlowAdd>();
    }

    void LateUpdate()
    {
        Strip(Object.FindObjectsByType<GateTrigger>(FindObjectsSortMode.None));
        var orbs = Object.FindObjectsByType<PickupOrb>(FindObjectsSortMode.None);
        for (int i = 0; i < orbs.Length; i++)
            StripNode(orbs[i].transform);
    }

    static void Strip(GateTrigger[] gates)
    {
        for (int i = 0; i < gates.Length; i++)
            StripNode(gates[i].transform);
    }

    static void StripNode(Transform go)
    {
        var rs = go.GetComponentsInChildren<Renderer>(true);
        for (int i = 0; i < rs.Length; i++)
        {
            var mat = rs[i].sharedMaterial;
            if (mat == null || mat.shader == null) continue;
            string n = mat.shader.name;
            if (n == "Danao/GlowAdd" || n.IndexOf("GlowAdd") >= 0)
                Object.Destroy(rs[i].gameObject);
        }
    }
}
