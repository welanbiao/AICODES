using UnityEngine;

public class GateBonus : MonoBehaviour
{
    public int shotAdd;
    public float dmgMul = 1f;
    public float fireMul = 1f;
    public string label = "";
    bool _used;

    public static void Stamp(GameObject go)
    {
        if (go == null || go.GetComponent<GateBonus>() != null) return;
        var root = GameRoot.I;
        if (root == null || root.stage <= 1) return;

        var b = go.AddComponent<GateBonus>();
        int k = Random.Range(0, 6);
        if (k == 0)
        {
            b.shotAdd = 1;
            b.label = "连射 +1";
        }
        else if (k == 1)
        {
            b.shotAdd = 2;
            b.label = "弹幕 +2";
        }
        else if (k == 2)
        {
            b.dmgMul = 1.22f;
            b.label = "威力 +22%";
        }
        else if (k == 3)
        {
            b.fireMul = 1.18f;
            b.label = "射速 +18%";
        }
        else if (k == 4)
        {
            b.shotAdd = 1;
            b.dmgMul = 1.12f;
            b.label = "弹幕强化";
        }
        else
            b.label = "";

        if (string.IsNullOrEmpty(b.label)) return;
        Transform lab = go.transform.Find("lab");
        TextMesh tm = lab != null ? lab.GetComponent<TextMesh>() : null;
        if (tm != null) tm.text = b.label;
    }

    public void Grant()
    {
        if (_used || GameRoot.I == null) return;
        _used = true;
        var g = GameRoot.I;
        if (shotAdd != 0)
            g.bonusShots = Mathf.Clamp(g.bonusShots + shotAdd, 0, 7);
        if (dmgMul > 1.001f)
            g.bonusDmg = Mathf.Min(2.8f, g.bonusDmg * dmgMul);
        if (fireMul > 1.001f)
            g.bonusFire = Mathf.Min(2.4f, g.bonusFire * fireMul);
        if (!string.IsNullOrEmpty(label))
            FloatText.Show(g.player.position + Vector3.up * 1.4f, label, Danao.Gold);
    }
}
