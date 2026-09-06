using UnityEngine;

public partial class GameRoot
{
    public float PlayPace
    {
        get
        {
            float ramp = 1f + _playTime / 920f;
            return Mathf.Min(3f, ramp);
        }
    }
}
