using UnityEngine;

[DefaultExecutionOrder(30)]
public class StageWukongArt : MonoBehaviour
{
    int _builtForm = -1;
    bool _failed;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<StageWukongArt>() != null) return;
        var go = new GameObject("StageWukongArt");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<StageWukongArt>();
    }

    void LateUpdate()
    {
        if (GameRoot.I == null) return;
        int form = GameRoot.I.stage;
        Transform slot = GameRoot.I.modelSlot;
        if (slot == null) return;
        if (form < 2 || form > 5)
        {
            _builtForm = form;
            _failed = false;
            return;
        }

        Transform ok = FindPortrait(slot, form);
        if (ok != null)
        {
            _builtForm = form;
            _failed = false;
            ok.localRotation = Quaternion.identity;
            StripPortraitWhite(ok);
            return;
        }
        if (_builtForm == form && _failed) return;

        _builtForm = form;
        for (int i = slot.childCount - 1; i >= 0; i--)
            Object.DestroyImmediate(slot.GetChild(i).gameObject);
        var built = WukongArt.BuildPortrait(slot, form);
        _failed = built == null;
    }

    static Transform FindPortrait(Transform slot, int form)
    {
        for (int i = 0; i < slot.childCount; i++)
        {
            Transform c = slot.GetChild(i);
            if (c.name == "Wukong_F" + form && c.GetComponent<PortraitOk>() != null && c.Find("art") != null)
                return c;
        }
        return null;
    }

    static void StripPortraitWhite(Transform root)
    {
        Transform art = root.Find("art");
        if (art == null || art.GetComponent<WkCutMark>() != null) return;
        var r = art.GetComponent<MeshRenderer>();
        if (r == null) return;
        Material m = r.material;
        if (m == null) return;
        var tex = m.HasProperty("_MainTex") ? m.GetTexture("_MainTex") as Texture2D : null;
        if (tex != null)
            m.SetTexture("_MainTex", CutoutPrep.RunPortrait(tex));
        if (m.HasProperty("_Cutoff"))
            m.SetFloat("_Cutoff", 0.16f);
        Vector3 s = art.localScale;
        var punched = m.HasProperty("_MainTex") ? m.GetTexture("_MainTex") as Texture2D : null;
        if (punched != null && punched.height > 8)
        {
            float h = s.y;
            Vector3 want = Tex.BillboardScale(punched, h);
            art.localScale = want;
        }
        art.gameObject.AddComponent<WkCutMark>();
    }
}

public class WkCutMark : MonoBehaviour { }
