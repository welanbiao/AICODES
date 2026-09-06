using UnityEngine;

public partial class GameRoot
{
    public int bonusShots;
    public float bonusDmg = 1f;
    public float bonusFire = 1f;

    public void ResetCombatBonus()
    {
        bonusShots = 0;
        bonusDmg = 1f;
        bonusFire = 1f;
    }

    public void FireBonusVolley(Vector3 muzzle, Vector3 dir)
    {
        if (stage <= 1 || bonusShots <= 0) return;
        int n = bonusShots;
        for (int i = 0; i < n; i++)
        {
            float spread = (i - (n - 1) * 0.5f) * 0.08f;
            Vector3 d = Quaternion.Euler(0f, spread * 40f, 0f) * dir;
            SpawnBolt(muzzle, d);
        }
    }
}
