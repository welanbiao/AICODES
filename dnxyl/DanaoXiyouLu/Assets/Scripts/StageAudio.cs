using UnityEngine;

[DefaultExecutionOrder(-40)]
public class StageAudio : MonoBehaviour
{
    const int Sr = 22050;
    static StageAudio _i;
    AudioSource _bgm;
    AudioSource _sfx;
    readonly AudioClip[] _loop = new AudioClip[6];
    readonly AudioClip[] _hit = new AudioClip[6];
    readonly AudioClip[] _fire = new AudioClip[6];
    readonly AudioClip[] _hurt = new AudioClip[6];
    readonly AudioClip[] _pick = new AudioClip[6];
    int _stage = -1;
    int _prevBolts;
    int _hpSeen = -1;
    float _hitGate;
    float _fireGate;

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<StageAudio>() != null) return;
        var go = new GameObject("StageAudio");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<StageAudio>();
    }

    void Awake()
    {
        _i = this;
        _bgm = gameObject.AddComponent<AudioSource>();
        _bgm.loop = true;
        _bgm.playOnAwake = false;
        _bgm.spatialBlend = 0f;
        _bgm.priority = 32;
        _bgm.ignoreListenerPause = true;
        _sfx = gameObject.AddComponent<AudioSource>();
        _sfx.loop = false;
        _sfx.playOnAwake = false;
        _sfx.spatialBlend = 0f;
        _sfx.priority = 64;
        _sfx.ignoreListenerPause = true;
        EnsureListener();
    }

    void LateUpdate()
    {
        var g = GameRoot.I;
        if (g == null) return;
        EnsureListener();
        if (g.stage != _stage)
        {
            _stage = Mathf.Clamp(g.stage, 1, 5);
            if (!g.UserPaused) PlayStage(_stage);
        }
        if (g.UserPaused)
        {
            if (_bgm.isPlaying) _bgm.Pause();
            return;
        }
        if (_bgm.clip != null)
            _bgm.volume = g.Paused ? 0.10f : 0.36f;
        if (_hpSeen >= 0 && g.hp < _hpSeen) PlayHurt();
        _hpSeen = g.hp;
        if (g.stage <= 1)
        {
            _prevBolts = 0;
            return;
        }
        int n = Object.FindObjectsByType<Bolt>(FindObjectsSortMode.None).Length;
        if (n > _prevBolts) PlayFire();
        _prevBolts = n;
    }

    void PlayStage(int stage)
    {
        if (_loop[stage] == null)
            _loop[stage] = SafeClip("bgm_" + stage, () => BuildLoop(stage));
        _bgm.Stop();
        _bgm.clip = _loop[stage];
        _bgm.volume = 0.36f;
        if (_bgm.clip != null) _bgm.Play();
    }

    public static void SetHeld(bool held)
    {
        if (_i == null) return;
        if (held)
        {
            if (_i._bgm != null) _i._bgm.Pause();
            if (_i._sfx != null) _i._sfx.Pause();
        }
        else
        {
            if (_i._bgm != null)
            {
                _i._bgm.UnPause();
                if (_i._bgm.clip != null && !_i._bgm.isPlaying) _i._bgm.Play();
            }
            if (_i._sfx != null) _i._sfx.UnPause();
        }
    }

    public static void PlayHit()
    {
        if (_i == null) return;
        if (Time.unscaledTime < _i._hitGate) return;
        _i._hitGate = Time.unscaledTime + 0.045f;
        Shot(_i._hit, "hit", BuildHit, 0.82f);
    }

    public static void PlayFire()
    {
        if (_i == null) return;
        if (Stage() <= 1) return;
        if (Time.unscaledTime < _i._fireGate) return;
        _i._fireGate = Time.unscaledTime + 0.07f;
        Shot(_i._fire, "fire", BuildFire, 0.55f);
    }

    public static void PlayHurt()
    {
        if (_i == null) return;
        Shot(_i._hurt, "hurt", BuildHurt, 0.86f);
    }

    public static void PlayPickup()
    {
        if (_i == null) return;
        Shot(_i._pick, "pick", BuildPick, 0.7f);
    }

    public static void PlayBreak(int fromStage)
    {
        StageBreakAudio.Play(fromStage);
    }

    static void Shot(AudioClip[] bank, string key, System.Func<int, AudioClip> make, float vol)
    {
        int s = Stage();
        if (bank[s] == null)
            bank[s] = SafeClip(key + "_" + s, () => make(s));
        if (bank[s] == null || _i._sfx == null) return;
        if (GameRoot.I != null && GameRoot.I.UserPaused) return;
        _i._sfx.PlayOneShot(bank[s], vol);
    }

    static int Stage()
    {
        int s = GameRoot.I != null ? GameRoot.I.stage : 1;
        return Mathf.Clamp(s, 1, 5);
    }

    static void EnsureListener()
    {
        if (Object.FindFirstObjectByType<AudioListener>() != null) return;
        Camera cam = Camera.main;
        if (cam != null) cam.gameObject.AddComponent<AudioListener>();
        else if (_i != null) _i.gameObject.AddComponent<AudioListener>();
    }

    static AudioClip SafeClip(string name, System.Func<AudioClip> make)
    {
        try { return make(); }
        catch (System.Exception e)
        {
            Debug.LogWarning("StageAudio " + name + ": " + e.Message);
            return AudioClip.Create(name + "_empty", 256, 1, Sr, false);
        }
    }

    static float Midi(int m) { return 440f * Mathf.Pow(2f, (m - 69) / 12f); }

    static int Hash(int i)
    {
        i = (i ^ 61) ^ (i >> 16);
        i *= 9;
        i = i ^ (i >> 4);
        i *= 0x27d4eb2d;
        return i ^ (i >> 15);
    }

    static float Noise(int i) { return ((Hash(i) & 0xffff) / 32768f) - 1f; }

    static void Mix(float[] buf, int i, float v)
    {
        if ((uint)i >= (uint)buf.Length) return;
        buf[i] += v;
    }

    static void Tone(float[] buf, float t0, float dur, float freq, float amp, int kind)
    {
        int n0 = Mathf.Max(0, Mathf.FloorToInt(t0 * Sr));
        int n = Mathf.Min(buf.Length - n0, Mathf.CeilToInt(dur * Sr));
        if (n <= 0 || freq < 1f) return;
        float a = Mathf.Min(0.016f, dur * 0.12f);
        float r = Mathf.Min(0.12f, dur * 0.4f);
        for (int k = 0; k < n; k++)
        {
            float t = k / (float)Sr;
            float env = 1f;
            if (t < a) env = t / Mathf.Max(0.0001f, a);
            else if (t > dur - r) env = Mathf.Max(0f, (dur - t) / Mathf.Max(0.0001f, r));
            if (kind == 1) env *= Mathf.Exp(-t * 4.6f);
            else if (kind == 2) env *= Mathf.Exp(-t * 7.4f);
            else if (kind == 3) env *= Mathf.Exp(-t * 18f);
            float ph = 2f * Mathf.PI * freq * t;
            float s = kind == 0 ? Mathf.Sin(ph)
                : kind == 1 ? Mathf.Sin(ph) + 0.28f * Mathf.Sin(ph * 2f)
                : kind == 2 ? Mathf.Sin(ph + 1.6f * Mathf.Sin(ph * 2.05f) * Mathf.Exp(-t * 3.8f))
                : kind == 3 ? (Mathf.Sin(ph) > 0f ? 0.55f : -0.55f) + 0.35f * Noise(n0 + k)
                : Noise(n0 + k);
            Mix(buf, n0 + k, s * amp * env);
        }
    }

    static void Sweep(float[] buf, float t0, float dur, float f0, float f1, float amp, int kind)
    {
        int n0 = Mathf.Max(0, Mathf.FloorToInt(t0 * Sr));
        int n = Mathf.Min(buf.Length - n0, Mathf.CeilToInt(dur * Sr));
        double ph = 0;
        for (int k = 0; k < n; k++)
        {
            float u = k / (float)Mathf.Max(1, n - 1);
            ph += 2.0 * Mathf.PI * Mathf.Lerp(f0, f1, u) / Sr;
            float env = (1f - u) * (u < 0.08f ? u / 0.08f : 1f);
            Mix(buf, n0 + k, (kind == 4 ? Noise(n0 + k) : Mathf.Sin((float)ph)) * amp * env);
        }
    }

    static void Normalize(float[] buf, float peak)
    {
        float m = 0.0001f;
        for (int i = 0; i < buf.Length; i++)
        {
            float a = Mathf.Abs(buf[i]);
            if (a > m) m = a;
        }
        float k = peak / m;
        for (int i = 0; i < buf.Length; i++) buf[i] = Mathf.Clamp(buf[i] * k, -1f, 1f);
    }

    static AudioClip Clip(string name, float[] buf)
    {
        var c = AudioClip.Create(name, buf.Length, 1, Sr, false);
        c.SetData(buf, 0);
        return c;
    }

    static void NoteLine(float[] buf, int[] midi, float bpm, float amp, int kind)
    {
        float step = 60f / bpm * 0.5f;
        for (int i = 0; i < midi.Length; i++)
            if (midi[i] > 0) Tone(buf, i * step, step * 0.88f, Midi(midi[i]), amp, kind);
    }

    static AudioClip BuildLoop(int stage)
    {
        int bpm = 90, leadKind = 0, bassKind = 0;
        float air = 0.04f;
        int[] lead, bass, perc;
        switch (stage)
        {
            case 1:
                bpm = 68; leadKind = 2;
                lead = new[] { 84, 0, 81, 79, 76, 0, 79, 81, 84, 88, 84, 0, 81, 79, 76, 72, 79, 0, 81, 84, 88, 0, 91, 88, 84, 81, 79, 76, 79, 81, 84, 76 };
                bass = new[] { 48, 0, 0, 48, 43, 0, 48, 0, 45, 0, 43, 0, 48, 0, 52, 0, 48, 0, 0, 48, 43, 0, 48, 0, 45, 0, 40, 0, 43, 0, 48, 0 };
                perc = new[] { 3, 0, 0, 3, 0, 2, 3, 0, 3, 0, 2, 0, 3, 2, 0, 3, 3, 0, 0, 3, 0, 2, 3, 0, 3, 2, 0, 2, 3, 0, 2, 3 };
                air = 0.045f;
                break;
            case 2:
                bpm = 112; leadKind = 1; bassKind = 1;
                lead = new[] { 79, 76, 74, 76, 79, 81, 79, 76, 74, 71, 67, 71, 74, 76, 79, 74, 76, 79, 81, 79, 76, 74, 71, 67, 69, 71, 74, 76, 79, 76, 74, 71 };
                bass = new[] { 43, 43, 0, 43, 38, 0, 43, 0, 45, 0, 43, 43, 38, 0, 36, 0, 43, 43, 0, 43, 38, 0, 43, 0, 45, 0, 47, 0, 43, 0, 38, 0 };
                perc = new[] { 1, 2, 5, 2, 1, 0, 5, 2, 1, 2, 5, 2, 1, 5, 2, 5, 1, 2, 5, 2, 1, 0, 5, 2, 1, 2, 5, 2, 1, 5, 3, 5 };
                air = 0.03f;
                break;
            case 3:
                bpm = 90;
                lead = new[] { 69, 0, 67, 64, 67, 69, 74, 0, 69, 67, 64, 0, 62, 64, 67, 69, 74, 0, 76, 74, 69, 67, 64, 62, 64, 0, 67, 69, 74, 69, 67, 62 };
                bass = new[] { 38, 0, 38, 38, 33, 0, 38, 0, 36, 0, 38, 0, 31, 0, 33, 0, 38, 0, 38, 38, 33, 0, 38, 0, 36, 0, 31, 0, 33, 0, 38, 0 };
                perc = new[] { 1, 0, 4, 0, 1, 0, 4, 2, 1, 0, 4, 0, 1, 4, 2, 4, 1, 0, 4, 0, 1, 0, 4, 2, 1, 0, 4, 2, 1, 4, 0, 4 };
                air = 0.09f;
                break;
            case 4:
                bpm = 76; leadKind = 2;
                lead = new[] { 71, 0, 68, 0, 71, 73, 76, 0, 73, 71, 68, 0, 64, 68, 71, 73, 76, 0, 73, 0, 71, 68, 64, 0, 68, 71, 73, 76, 73, 71, 68, 64 };
                bass = new[] { 40, 0, 0, 40, 35, 0, 40, 0, 38, 0, 35, 0, 40, 0, 43, 0, 40, 0, 0, 40, 35, 0, 40, 0, 38, 0, 33, 0, 35, 0, 40, 0 };
                perc = new[] { 3, 0, 5, 0, 3, 5, 0, 5, 3, 0, 5, 0, 3, 0, 5, 3, 3, 0, 5, 0, 3, 5, 0, 5, 3, 0, 5, 0, 3, 5, 0, 3 };
                air = 0.02f;
                break;
            default:
                bpm = 126; leadKind = 1; bassKind = 1;
                lead = new[] { 81, 76, 74, 76, 81, 84, 81, 76, 74, 72, 69, 72, 74, 76, 81, 84, 81, 76, 74, 72, 69, 72, 74, 76, 81, 84, 88, 84, 81, 76, 74, 72 };
                bass = new[] { 45, 45, 0, 45, 40, 0, 45, 0, 47, 0, 45, 45, 40, 0, 38, 0, 45, 45, 0, 45, 40, 0, 45, 0, 47, 0, 48, 0, 45, 0, 40, 0 };
                perc = new[] { 1, 0, 4, 2, 1, 2, 4, 2, 1, 0, 4, 2, 1, 4, 5, 4, 1, 0, 4, 2, 1, 2, 4, 2, 1, 0, 4, 2, 1, 4, 5, 4 };
                air = 0.05f;
                break;
        }

        float spb = 60f / bpm;
        int len = Mathf.Max(Sr, Mathf.RoundToInt(Sr * spb * 16));
        var buf = new float[len];
        NoteLine(buf, lead, bpm, stage == 1 ? 0.22f : 0.18f, leadKind);
        NoteLine(buf, bass, bpm, 0.16f, bassKind);
        if (stage == 1)
        {
            Tone(buf, 0f, 16 * spb, Midi(60), 0.07f, 0);
            Tone(buf, 0f, 16 * spb, Midi(67), 0.05f, 0);
        }
        else if (stage == 3)
        {
            float lp = 0f;
            for (int i = 0; i < len; i++)
            {
                float nse = Noise(i + 901) * (0.55f + 0.45f * Mathf.Sin(i / (float)Sr * 1.35f));
                lp += 0.05f * (nse - lp);
                Mix(buf, i, lp * 0.14f);
            }
        }
        else if (stage == 5)
        {
            for (int i = 0; i < len; i++)
                Mix(buf, i, Noise(i * 3 + 11) * 0.035f * (0.4f + 0.6f * Mathf.Abs(Mathf.Sin(i / (float)Sr * 8.4f))));
        }

        float step = spb * 0.5f;
        for (int i = 0; i < perc.Length; i++)
        {
            float t0 = i * step;
            int p = perc[i];
            if (p == 1) Tone(buf, t0, 0.1f, stage >= 5 ? 58f : 72f, 0.28f, 0);
            else if (p == 2) Tone(buf, t0, 0.04f, stage == 2 ? 880f : 1680f, 0.08f, 2);
            else if (p == 3) Tone(buf, t0, 0.4f, Midi(stage == 1 ? 96 : stage == 4 ? 88 : 91), 0.13f, 2);
            else if (p == 4) { Tone(buf, t0, 0.08f, 165f, 0.12f, 3); Sweep(buf, t0, 0.07f, 2100f, 620f, 0.1f, 4); }
            else if (p == 5) Tone(buf, t0, 0.05f, stage == 2 ? 360f : 420f, 0.16f, 3);
        }
        for (int i = 0; i < len; i++) Mix(buf, i, Noise(i + stage * 997) * air * 0.2f);
        int fade = Mathf.Min(180, len / 10);
        for (int i = 0; i < fade; i++)
        {
            float w = i / (float)fade;
            buf[i] *= w;
            buf[len - 1 - i] *= w;
        }
        Normalize(buf, 0.82f);
        return Clip("bgm_" + stage, buf);
    }

    static AudioClip BuildHit(int stage)
    {
        var buf = new float[Mathf.CeilToInt(Sr * 0.38f)];
        switch (stage)
        {
            case 1:
                Tone(buf, 0f, 0.32f, 1397f, 0.5f, 2);
                Tone(buf, 0.02f, 0.28f, 2093f, 0.32f, 2);
                Tone(buf, 0.05f, 0.2f, 2637f, 0.16f, 2);
                break;
            case 2:
                Tone(buf, 0f, 0.14f, 92f, 0.58f, 3);
                Tone(buf, 0.012f, 0.1f, 246f, 0.24f, 1);
                Sweep(buf, 0f, 0.08f, 720f, 140f, 0.2f, 4);
                break;
            case 3:
                Sweep(buf, 0f, 0.22f, 640f, 120f, 0.32f, 0);
                Sweep(buf, 0f, 0.2f, 1800f, 280f, 0.22f, 4);
                Tone(buf, 0.02f, 0.18f, 196f, 0.18f, 0);
                break;
            case 4:
                Tone(buf, 0f, 0.07f, 196f, 0.48f, 3);
                Tone(buf, 0.02f, 0.12f, 587f, 0.2f, 1);
                Tone(buf, 0.045f, 0.14f, 1175f, 0.1f, 2);
                break;
            default:
                Sweep(buf, 0f, 0.16f, 520f, 70f, 0.34f, 0);
                Sweep(buf, 0f, 0.13f, 2400f, 220f, 0.28f, 4);
                Tone(buf, 0.01f, 0.1f, 82f, 0.28f, 1);
                break;
        }
        Normalize(buf, 0.9f);
        return Clip("hit_" + stage, buf);
    }

    static AudioClip BuildFire(int stage)
    {
        var buf = new float[Mathf.CeilToInt(Sr * 0.22f)];
        switch (stage)
        {
            case 2:
                Tone(buf, 0f, 0.08f, 370f, 0.32f, 3);
                Sweep(buf, 0f, 0.1f, 580f, 140f, 0.2f, 0);
                break;
            case 3:
                Sweep(buf, 0f, 0.16f, 920f, 200f, 0.3f, 0);
                Sweep(buf, 0f, 0.12f, 1680f, 420f, 0.16f, 4);
                break;
            case 4:
                Tone(buf, 0f, 0.06f, 220f, 0.34f, 3);
                Tone(buf, 0.014f, 0.08f, 740f, 0.14f, 1);
                break;
            default:
                Sweep(buf, 0f, 0.14f, 760f, 110f, 0.32f, 0);
                Sweep(buf, 0f, 0.11f, 2500f, 340f, 0.22f, 4);
                break;
        }
        Normalize(buf, 0.8f);
        return Clip("fire_" + stage, buf);
    }

    static AudioClip BuildHurt(int stage)
    {
        var buf = new float[Mathf.CeilToInt(Sr * 0.3f)];
        Tone(buf, 0f, 0.2f, 60f + stage * 8f, 0.42f, 1);
        Sweep(buf, 0f, 0.18f, 280f, 58f, 0.3f, 0);
        Sweep(buf, 0.012f, 0.14f, 1100f, 160f, 0.16f, 4);
        Normalize(buf, 0.88f);
        return Clip("hurt_" + stage, buf);
    }

    static AudioClip BuildPick(int stage)
    {
        var buf = new float[Mathf.CeilToInt(Sr * 0.34f)];
        int a = stage == 1 ? 76 : stage == 2 ? 71 : stage == 3 ? 69 : stage == 4 ? 73 : 81;
        Tone(buf, 0f, 0.28f, Midi(a), 0.28f, 2);
        Tone(buf, 0.05f, 0.24f, Midi(a + 4), 0.22f, 2);
        Tone(buf, 0.1f, 0.2f, Midi(a + 7), 0.16f, 2);
        Normalize(buf, 0.84f);
        return Clip("pick_" + stage, buf);
    }
}
