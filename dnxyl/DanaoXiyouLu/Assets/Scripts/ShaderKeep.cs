using UnityEngine;

public static class ShaderKeep
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
    static void Warm()
    {
        var mats = Resources.LoadAll<Material>("Keep");
        for (int i = 0; i < mats.Length; i++)
        {
            if (mats[i] == null || mats[i].shader == null) continue;
            Shader.Find(mats[i].shader.name);
        }
        Shader.Find("Danao/SpiritInner");
        Shader.Find("Danao/Mythic");
        Shader.Find("Danao/Cutout");
        Shader.Find("Danao/Sun");
        Shader.Find("Danao/Cloud");
        Shader.Find("Danao/GlowAdd");
        Shader.Find("Sprites/Default");
        Shader.Find("Unlit/Color");
        Shader.Find("UI/Default");
        Resources.Load<Font>("Fonts/Cjk");
        Fonts.Cjk();
    }
}
