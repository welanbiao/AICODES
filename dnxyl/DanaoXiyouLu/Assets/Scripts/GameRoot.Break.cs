using System.Collections;
using UnityEngine;

public partial class GameRoot
{
    IEnumerator BreakthroughCo()
    {
        _breaking = true;
        Paused = true;
        int from = stage;
        StageBreakAudio.Play(from);
        Color[] cols = Danao.WuXing;
        Vector3 p = player.position + Vector3.up;
        if (_breakRoot != null)
        {
            _breakRoot.gameObject.SetActive(true);
            _breakRoot.color = new Color(0.08f, 0.02f, 0.12f, 0.42f);
            if (_breakTitle != null)
                _breakTitle.text = Danao.BreakTitles[Mathf.Clamp(from - 1, 0, 4)];
            if (_breakBtn != null) _breakBtn.gameObject.SetActive(false);
        }

        if (from == 1)
        {
            for (int i = 0; i < 18; i++)
            {
                Vfx.Burst(p + Random.insideUnitSphere, cols[i % 5], 16);
                Vfx.Ring(player.position, cols[i % 5], 0.7f);
                yield return new WaitForSeconds(0.12f);
            }
        }
        else if (from == 2)
        {
            for (int i = 0; i < 12; i++)
            {
                Vfx.Burst(p + Vector3.up * (i * 0.15f), new Color(0.4f, 0.8f, 1f), 14);
                yield return new WaitForSeconds(0.1f);
            }
            Vfx.Ring(player.position, Color.cyan, 1.3f);
        }
        else if (from == 3)
        {
            for (int i = 0; i < 10; i++)
            {
                Vfx.Burst(p, new Color(0.3f, 0.55f, 1f), 18);
                yield return new WaitForSeconds(0.1f);
            }
            Vfx.Ring(player.position, Danao.Gold, 1.2f);
        }
        else if (from == 4)
        {
            for (int i = 0; i < 10; i++)
            {
                Vfx.Burst(p, Danao.Robe, 12);
                Vfx.Burst(p + Vector3.up, Danao.Trim, 10);
                yield return new WaitForSeconds(0.11f);
            }
        }
        else
        {
            for (int i = 0; i < 16; i++)
            {
                Vfx.Burst(p, Danao.Gold, 20);
                Vfx.Ring(player.position, Color.Lerp(Danao.Gold, Color.white, i / 16f), 0.8f);
                yield return new WaitForSeconds(0.1f);
            }
        }

        if (from >= 5)
        {
            if (_breakRoot != null) _breakRoot.gameObject.SetActive(false);
            _endRoot.gameObject.SetActive(true);
            _breaking = false;
            yield break;
        }

        if (from == 1)
        {
            for (int i = 0; i < 5; i++) wuXing[i] = 0;
        }
        xiuwei = 0;
        stage = from + 1;
        ResetCombatBonus();
        _playTime = 0f;
        maxHp = 100 + stage * 20;
        hp = maxHp;
        _breakPrompted = false;
        ClearWorld();
        ApplyStageVisuals();
        RebuildModel();
        EnsureChunks();
        FloatText.Show(player.position + Vector3.up * 2f, Danao.BreakTitles[from - 1], Danao.Gold);
        if (_breakRoot != null) _breakRoot.gameObject.SetActive(false);
        Paused = false;
        _breaking = false;
    }
}
