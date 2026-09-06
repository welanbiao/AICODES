using UnityEngine;

public partial class GameRoot
{
    public float PlayClock
    {
        get { return _playTime; }
        set { _playTime = value; }
    }

    public void PublicClearWorld(bool resetPath)
    {
        ClearWorld(resetPath);
    }

    public void PublicApplyStageVisuals()
    {
        ApplyStageVisuals();
    }

    public void PublicEnsureChunks()
    {
        EnsureChunks();
    }

    public void PublicPlaceLane(Transform chunk, int index)
    {
        PlaceLaneContent(chunk, index);
    }
}
