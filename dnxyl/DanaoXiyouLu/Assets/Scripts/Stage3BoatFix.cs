using UnityEngine;

[DefaultExecutionOrder(40)]
public class Stage3BoatFix : MonoBehaviour
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<Stage3BoatFix>() != null) return;
        var go = new GameObject("Stage3BoatFix");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<Stage3BoatFix>();
    }

    void LateUpdate()
    {
        if (GameRoot.I == null) return;
        Transform player = GameRoot.I.player;
        if (player == null) return;
        Transform boat = player.Find("Boat");
        if (GameRoot.I.stage != 3)
        {
            if (boat != null && boat.Find("stem") != null)
            {
                for (int i = boat.childCount - 1; i >= 0; i--)
                    Object.DestroyImmediate(boat.GetChild(i).gameObject);
            }
            return;
        }
        if (boat == null)
        {
            WukongArt.BuildBoat(player);
            return;
        }
        if (boat.Find("stem") != null) return;
        WukongArt.FillBoat(boat);
    }
}
