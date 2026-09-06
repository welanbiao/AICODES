using UnityEngine;
using UnityEngine.UI;

[DefaultExecutionOrder(40)]
public class PlayFit : MonoBehaviour
{
    CanvasScaler _scaler;
    int _lastW;
    int _lastH;
    int _tick;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<PlayFit>() != null) return;
        var go = new GameObject("PlayFit");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<PlayFit>();
#if UNITY_WEBGL && !UNITY_EDITOR
        Screen.orientation = ScreenOrientation.Portrait;
        Screen.autorotateToLandscapeLeft = false;
        Screen.autorotateToLandscapeRight = false;
        Screen.autorotateToPortrait = true;
        Screen.autorotateToPortraitUpsideDown = false;
#endif
        Application.targetFrameRate = 60;
    }

    public static bool Portrait
    {
        get { return Screen.height >= Screen.width * 0.98f; }
    }

    void LateUpdate()
    {
        if ((_tick++ % 12) == 0) StripPuffs();
        FitCanvas();
    }

    void FitCanvas()
    {
        if (Screen.width == _lastW && Screen.height == _lastH && _scaler != null) return;
        _lastW = Screen.width;
        _lastH = Screen.height;
        if (_scaler == null)
        {
            var canvases = Object.FindObjectsByType<CanvasScaler>(FindObjectsSortMode.None);
            for (int i = 0; i < canvases.Length; i++)
            {
                if (canvases[i] != null && canvases[i].name == "HUD")
                {
                    _scaler = canvases[i];
                    break;
                }
            }
            if (_scaler == null && canvases.Length > 0) _scaler = canvases[0];
        }
        if (_scaler == null) return;
        _scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        if (Portrait)
        {
            _scaler.referenceResolution = new Vector2(720f, 1280f);
            _scaler.matchWidthOrHeight = 0f;
        }
        else
        {
            _scaler.referenceResolution = new Vector2(1280f, 720f);
            _scaler.matchWidthOrHeight = 0.5f;
        }
    }

    static void StripPuffs()
    {
        if (GameRoot.I == null || GameRoot.I.stage != 1) return;
        var all = Object.FindObjectsByType<Transform>(FindObjectsSortMode.None);
        for (int i = 0; i < all.Length; i++)
        {
            Transform t = all[i];
            if (t == null) continue;
            if (t.name.StartsWith("puff"))
                Object.Destroy(t.gameObject);
        }
    }
}
