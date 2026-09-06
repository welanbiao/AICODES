using UnityEngine;

[DefaultExecutionOrder(80)]
public class PickupFrameFix : MonoBehaviour
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<PickupFrameFix>() != null) return;
        var go = new GameObject("PickupFrameFix");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<PickupFrameFix>();
    }

    void LateUpdate()
    {
        if (GameRoot.I == null) return;
        var gates = Object.FindObjectsByType<GateTrigger>(FindObjectsSortMode.None);
        for (int i = 0; i < gates.Length; i++)
            StripAndSize(gates[i].transform, true);

        var orbs = Object.FindObjectsByType<PickupOrb>(FindObjectsSortMode.None);
        for (int i = 0; i < orbs.Length; i++)
            StripAndSize(orbs[i].transform, false);
    }

    static void StripAndSize(Transform go, bool gate)
    {
        KillChild(go, "frame");
        KillChild(go, "aura");
        KillChild(go, "glow");
        var lights = go.GetComponentsInChildren<Light>(true);
        for (int i = 0; i < lights.Length; i++)
        {
            if (lights[i].type == LightType.Point)
                Object.DestroyImmediate(lights[i]);
        }

        if (go.GetComponent<WideFrameMark>() != null) return;
        if (gate)
        {
            Transform icon = go.Find("icon");
            if (icon != null)
            {
                icon.localScale = Vector3.one * 2.15f;
                icon.localPosition = new Vector3(0f, 0.22f, 0f);
            }
            Transform cushion = go.Find("cushion");
            if (cushion != null)
                cushion.localScale = new Vector3(2.1f, 0.32f, 2.1f);
            Transform lab = go.Find("lab");
            if (lab != null)
            {
                Vector3 lp = lab.localPosition;
                lp.y = 3.15f;
                lab.localPosition = lp;
                var tm = lab.GetComponent<TextMesh>();
                if (tm != null) tm.characterSize = 0.08f;
            }
            var box = go.GetComponent<BoxCollider>();
            if (box != null)
            {
                box.size = new Vector3(2.6f, 3.4f, 1.5f);
                box.center = new Vector3(0f, 1.5f, 0f);
            }
        }
        else
        {
            Transform gem = go.Find("gem");
            if (gem != null) gem.localScale = gem.localScale * 1.35f;
            var sph = go.GetComponent<SphereCollider>();
            if (sph != null) sph.radius = 1.05f;
        }
        go.gameObject.AddComponent<WideFrameMark>();
    }

    static void KillChild(Transform go, string name)
    {
        Transform t = go.Find(name);
        if (t != null) Object.DestroyImmediate(t.gameObject);
    }
}

public class WideFrameMark : MonoBehaviour { }
