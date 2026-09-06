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
        PlayerSettings.SetScriptingBackend(BuildTargetGroup.Standalone, ScriptingImplementation.Mono2x);
        PlayerSettings.SetArchitecture(BuildTargetGroup.Standalone, 1);
        var t = EditorUserBuildSettings.activeBuildTarget;
        if (t != BuildTarget.StandaloneWindows64 && t != BuildTarget.WebGL)
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Standalone, BuildTarget.StandaloneWindows64);

        KeepShaders();
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

    [MenuItem("大闹西游路/切到 Windows x64")]
    static void ForceWin64()
    {
        EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.Standalone, BuildTarget.StandaloneWindows64);
        PlayerSettings.SetArchitecture(BuildTargetGroup.Standalone, 1);
        Debug.Log("已切换到 Standalone Windows x64，匹配 2022.3.62f3c1");
    }

    [MenuItem("大闹西游路/切到 WebGL")]
    static void SwitchWebGL()
    {
        if (!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.WebGL, BuildTarget.WebGL))
        {
            EditorUtility.DisplayDialog("缺少 WebGL 模块",
                "当前 Unity 没有 WebGL Build Support。\n\n" +
                "1. 完全退出 Unity。\n" +
                "2. 下载并安装：\n" +
                "https://download.unitychina.cn/download_unity/1623fc0bbb97/TargetSupportInstaller/UnitySetup-WebGL-Support-for-Editor-2022.3.62f3c1.exe\n\n" +
                "安装路径选：D:\\Unity\\Editor\\2022.3.62f3c1",
                "确定");
            return;
        }
        EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.WebGL, BuildTarget.WebGL);
        ApplyWebGLPlayerSettings();
        Debug.Log("已切换到 WebGL。构建后运行 serve-webgl.ps1（端口 5173）。");
    }

    [MenuItem("大闹西游路/构建 WebGL（浏览器 5173）")]
    public static void BuildWebGL()
    {
        if (!BuildPipeline.IsBuildTargetSupported(BuildTargetGroup.WebGL, BuildTarget.WebGL))
        {
            SwitchWebGL();
            return;
        }
        if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.WebGL)
            EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.WebGL, BuildTarget.WebGL);

        ApplyWebGLPlayerSettings();
        const string outDir = "Builds/WebGL";
        if (!System.IO.Directory.Exists(outDir))
            System.IO.Directory.CreateDirectory(outDir);

        var opts = new BuildPlayerOptions
        {
            scenes = new[] { "Assets/Scenes/Main.unity" },
            locationPathName = outDir,
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };
        var report = BuildPipeline.BuildPlayer(opts);
        if (report.summary.result == UnityEditor.Build.Reporting.BuildResult.Succeeded)
            Debug.Log("WebGL 构建完成。在项目目录运行：powershell -File serve-webgl.ps1  →  http://127.0.0.1:5173/");
        else
            Debug.LogError("WebGL 构建失败：" + report.summary.result);
    }

    static void ApplyWebGLPlayerSettings()
    {
        PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
        PlayerSettings.WebGL.decompressionFallback = true;
        PlayerSettings.WebGL.memoryGrowthMode = WebGLMemoryGrowthMode.Geometric;
        PlayerSettings.WebGL.initialMemorySize = 256;
        PlayerSettings.SetScriptingBackend(BuildTargetGroup.WebGL, ScriptingImplementation.IL2CPP);
        PlayerSettings.WebGL.template = "PROJECT:DanaoPhone";
        PlayerSettings.defaultWebScreenWidth = 720;
        PlayerSettings.defaultWebScreenHeight = 1280;
        KeepShaders();
    }

    static void KeepShaders()
    {
        var objs = UnityEditor.AssetDatabase.LoadAllAssetsAtPath("ProjectSettings/GraphicsSettings.asset");
        if (objs == null || objs.Length == 0) return;
        var so = new SerializedObject(objs[0]);
        var arr = so.FindProperty("m_AlwaysIncludedShaders");
        if (arr == null) return;
        string[] names =
        {
            "Danao/SpiritInner", "Danao/Mythic", "Danao/Cutout", "Danao/Sun",
            "Danao/Cloud", "Danao/GlowAdd", "Sprites/Default", "Unlit/Color",
            "Particles/Standard Unlit", "UI/Default"
        };
        for (int n = 0; n < names.Length; n++)
        {
            var sh = Shader.Find(names[n]);
            if (sh == null) continue;
            bool found = false;
            for (int i = 0; i < arr.arraySize; i++)
            {
                if (arr.GetArrayElementAtIndex(i).objectReferenceValue == sh)
                {
                    found = true;
                    break;
                }
            }
            if (found) continue;
            arr.arraySize++;
            arr.GetArrayElementAtIndex(arr.arraySize - 1).objectReferenceValue = sh;
        }
        so.ApplyModifiedProperties();
    }
}
#endif
