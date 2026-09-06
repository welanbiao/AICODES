using UnityEngine;

[DefaultExecutionOrder(-35)]
public class AudioListenerFix : MonoBehaviour
{
    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<AudioListenerFix>() != null) return;
        var go = new GameObject("AudioListenerFix");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<AudioListenerFix>();
    }

    void LateUpdate()
    {
        if (Object.FindFirstObjectByType<AudioListener>() != null) return;
        Camera cam = Camera.main;
        if (cam != null) cam.gameObject.AddComponent<AudioListener>();
    }
}
