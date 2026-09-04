#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;

[InitializeOnLoad]
public static class DanaoEditorBoot
{
    static DanaoEditorBoot()
    {
        EditorApplication.delayCall += Setup;
    }

    static void Setup()
    {
        PlayerSettings.companyName = "AICODES";
        PlayerSettings.productName = "大闹西游路";
        const string path = "Assets/Scenes/Main.unity";
        if (System.IO.File.Exists(path))
        {
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(path, true) };
            var active = EditorSceneManager.GetActiveScene();
            if (!EditorApplication.isPlayingOrWillChangePlaymode && !active.isDirty && active.path != path)
                EditorSceneManager.OpenScene(path);
        }
    }

    [MenuItem("大闹西游路/打开主场景并播放")]
    static void Play()
    {
        if (!EditorApplication.isPlaying)
        {
            EditorSceneManager.OpenScene("Assets/Scenes/Main.unity");
            EditorApplication.isPlaying = true;
        }
    }
}
#endif
