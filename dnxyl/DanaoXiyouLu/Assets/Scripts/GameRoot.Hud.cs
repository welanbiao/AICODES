using UnityEngine;
using UnityEngine.UI;

public partial class GameRoot
{
    Text _stageText;
    Text _xiuText;
    Text _hpText;
    Text[] _wxText;
    Image[] _wxFill;
    Image _hpFill;
    Image _loadRoot;
    Image _loadBar;
    Text _loadText;
    Image _breakRoot;
    Text _breakTitle;
    Button _breakBtn;
    Image _endRoot;
    bool _loading = true;
    bool _breaking;
    bool _breakPrompted;
    float _loadT;

    void BuildHud()
    {
        var canvasGo = new GameObject("HUD");
        var canvas = canvasGo.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 20;
        var scaler = canvasGo.AddComponent<CanvasScaler>();
        scaler.uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        scaler.referenceResolution = new Vector2(1280, 720);
        scaler.matchWidthOrHeight = 0.5f;
        canvasGo.AddComponent<GraphicRaycaster>();
        var es = Object.FindFirstObjectByType<UnityEngine.EventSystems.EventSystem>();
        if (es == null)
        {
            var e = new GameObject("EventSystem");
            e.AddComponent<UnityEngine.EventSystems.EventSystem>();
            e.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }

        var root = canvasGo.transform;
        _stageText = Ui.Label(root, "stage", "第1关  补天五彩石", 28, TextAnchor.UpperLeft,
            Danao.Gold, new Vector2(0, 1), new Vector2(0, 1), new Vector2(24, -86), new Vector2(520, -18));
        _xiuText = Ui.Label(root, "xiu", "EXP  0", 26, TextAnchor.UpperRight,
            Color.white, new Vector2(1, 1), new Vector2(1, 1), new Vector2(-420, -80), new Vector2(-24, -18));

        var hpBg = Ui.Panel(root, "hpBg", new Color(0.12f, 0.08f, 0.06f, 0.82f),
            new Vector2(0.35f, 0.04f), new Vector2(0.65f, 0.075f), Vector2.zero, Vector2.zero);
        _hpFill = Ui.Panel(hpBg.transform, "hp", new Color(0.35f, 0.9f, 0.4f, 1f),
            new Vector2(0, 0), new Vector2(1, 1), Vector2.zero, Vector2.zero);
        _hpText = Ui.Label(hpBg.transform, "hpT", "100", 18, TextAnchor.MiddleCenter,
            Color.white, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);

        _wxText = new Text[5];
        _wxFill = new Image[5];
        for (int i = 0; i < 5; i++)
        {
            float x = 18 + i * 118;
            var bg = Ui.Panel(root, "wx" + i, new Color(0, 0, 0, 0.45f),
                new Vector2(0, 1), new Vector2(0, 1), new Vector2(x, -150), new Vector2(x + 108, -98));
            _wxFill[i] = Ui.Panel(bg.transform, "f", Danao.WuXing[i],
                new Vector2(0, 0), new Vector2(0.02f, 1), Vector2.zero, Vector2.zero);
            _wxText[i] = Ui.Label(bg.transform, "t", Danao.WuXingNames[i] + " 0", 16, TextAnchor.MiddleCenter,
                Color.white, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        }

        _loadRoot = Ui.Panel(root, "load", new Color(0.06f, 0.03f, 0.1f, 1f), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        _loadRoot.raycastTarget = true;
        Ui.Label(_loadRoot.transform, "title", "大闹西游路", 64, TextAnchor.MiddleCenter,
            Danao.Gold, new Vector2(0.1f, 0.55f), new Vector2(0.9f, 0.78f), Vector2.zero, Vector2.zero);
        Ui.Label(_loadRoot.transform, "sub", "石猴补天 · 五灵炼形", 28, TextAnchor.MiddleCenter,
            new Color(1, 0.85f, 0.55f), new Vector2(0.1f, 0.46f), new Vector2(0.9f, 0.55f), Vector2.zero, Vector2.zero);
        var barBg = Ui.Panel(_loadRoot.transform, "barBg", new Color(0.2f, 0.12f, 0.08f, 1),
            new Vector2(0.18f, 0.18f), new Vector2(0.82f, 0.23f), Vector2.zero, Vector2.zero);
        _loadBar = Ui.Panel(barBg.transform, "bar", new Color(1f, 0.55f, 0.15f, 1),
            new Vector2(0, 0), new Vector2(0.02f, 1), Vector2.zero, Vector2.zero);
        _loadText = Ui.Label(_loadRoot.transform, "lt", "正在进入游戏 0%", 22, TextAnchor.MiddleCenter,
            Color.white, new Vector2(0.2f, 0.10f), new Vector2(0.8f, 0.18f), Vector2.zero, Vector2.zero);

        _breakRoot = Ui.Panel(root, "break", new Color(0.05f, 0.02f, 0.08f, 0.0f), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        _breakRoot.gameObject.SetActive(false);
        _breakTitle = Ui.Label(_breakRoot.transform, "bt", "", 42, TextAnchor.MiddleCenter,
            Danao.Gold, new Vector2(0.1f, 0.52f), new Vector2(0.9f, 0.72f), Vector2.zero, Vector2.zero);
        var btnGo = Ui.Panel(_breakRoot.transform, "btn", new Color(0.55f, 0.18f, 0.08f, 0.95f),
            new Vector2(0.38f, 0.28f), new Vector2(0.62f, 0.38f), Vector2.zero, Vector2.zero).gameObject;
        btnGo.GetComponent<Image>().raycastTarget = true;
        _breakBtn = btnGo.AddComponent<Button>();
        _breakBtn.targetGraphic = btnGo.GetComponent<Image>();
        Ui.Label(btnGo.transform, "btxt", "突破", 32, TextAnchor.MiddleCenter, Color.white, Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        _breakBtn.onClick.AddListener(OnClickBreak);

        _endRoot = Ui.Panel(root, "end", new Color(0.04f, 0.02f, 0.08f, 0.92f), Vector2.zero, Vector2.one, Vector2.zero, Vector2.zero);
        _endRoot.gameObject.SetActive(false);
        Ui.Label(_endRoot.transform, "et", "金身问道 · 学成出师", 48, TextAnchor.MiddleCenter,
            Danao.Gold, new Vector2(0.1f, 0.5f), new Vector2(0.9f, 0.7f), Vector2.zero, Vector2.zero);
        Ui.Label(_endRoot.transform, "es", "方寸山法成，五阶段圆满。\n可继续在山中问道，或关闭重开。", 24, TextAnchor.MiddleCenter,
            Color.white, new Vector2(0.15f, 0.32f), new Vector2(0.85f, 0.5f), Vector2.zero, Vector2.zero);
    }

    void ShowLoading()
    {
        _loading = true;
        _loadT = 0;
        if (_loadRoot != null) _loadRoot.gameObject.SetActive(true);
        Paused = true;
    }

    void TickLoading()
    {
        _loadT += Time.deltaTime;
        float p = Mathf.Clamp01(_loadT / 2.2f);
        if (_loadBar != null)
        {
            var rt = _loadBar.rectTransform;
            rt.anchorMax = new Vector2(Mathf.Max(0.02f, p), 1);
        }
        if (_loadText != null) _loadText.text = "正在进入游戏 " + Mathf.RoundToInt(p * 100) + "%";
        if (p >= 1f)
        {
            _loading = false;
            Paused = false;
            if (_loadRoot != null) _loadRoot.gameObject.SetActive(false);
        }
    }

    void TickHud()
    {
        if (stage == 1)
        {
            if (_xiuText != null) _xiuText.text = "五灵  " + SumQi() + " / " + (QiNeed * 5);
            for (int i = 0; i < 5; i++)
            {
                if (_wxText[i] != null)
                {
                    _wxText[i].gameObject.transform.parent.gameObject.SetActive(true);
                    _wxText[i].text = Danao.WuXingNames[i] + " " + wuXing[i] + "/" + QiNeed;
                    _wxFill[i].rectTransform.anchorMax = new Vector2(Mathf.Clamp01(wuXing[i] / (float)QiNeed), 1f);
                }
            }
        }
        else
        {
            if (_xiuText != null) _xiuText.text = "修为  " + xiuwei + " / " + NeedXiu();
            for (int i = 0; i < 5; i++)
                if (_wxText[i] != null) _wxText[i].gameObject.transform.parent.gameObject.SetActive(false);
        }
        if (_hpFill != null)
            _hpFill.rectTransform.anchorMax = new Vector2(Mathf.Clamp01(hp / (float)maxHp), 1f);
        if (_hpText != null) _hpText.text = hp + " / " + maxHp;
    }

    void ShowBreakPrompt(bool show)
    {
        if (_breakRoot == null) return;
        _breakRoot.gameObject.SetActive(show);
        _breakRoot.color = new Color(0.05f, 0.02f, 0.08f, show ? 0.35f : 0);
        if (show)
        {
            int idx = Mathf.Clamp(stage - 1, 0, 4);
            _breakTitle.text = Danao.BreakTitles[idx] + "\n点击突破";
        }
    }

    void OnClickBreak()
    {
        if (!CanBreak() || _breaking) return;
        ShowBreakPrompt(false);
        StartCoroutine(BreakthroughCo());
    }
}
