using UnityEngine;

[DefaultExecutionOrder(-39)]
public class StageBreakAudio : MonoBehaviour
{
    const int Sr = 22050;
    static StageBreakAudio _i;
    AudioSource _src;
    readonly AudioClip[] _clip = new AudioClip[6];

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<StageBreakAudio>() != null) return;
        var go = new GameObject("StageBreakAudio");
        Object.DontDestroyOnLoad(go);
        go.AddComponent<StageBreakAudio>();
    }

    void Awake()
    {
        _i = this;
        _src = gameObject.AddComponent<AudioSource>();
        _src.playOnAwake = false;
        _src.loop = false;
        _src.spatialBlend = 0f;
        _src.priority = 8;
        _src.ignoreListenerPause = true;
        _src.volume = 1f;
    }

    public static void SetHeld(bool held)
    {
        if (_i == null || _i._src == null) return;
        if (held) _i._src.Pause();
        else _i._src.UnPause();
    }

    public static void Play(int fromStage)
    {
        if (_i == null) return;
        int s = Mathf.Clamp(fromStage, 1, 5);
        if (_i._clip[s] == null)
            _i._clip[s] = Safe("break_" + s, s);
        AudioClip c = _i._clip[s];
        if (c == null || _i._src == null) return;
        _i._src.Stop();
        _i._src.pitch = 1f;
        _i._src.PlayOneShot(c, 1f);
    }

    static AudioClip Safe(string name, int stage)
    {
        try { return Build(stage); }
        catch (System.Exception e)
        {
            Debug.LogWarning("StageBreakAudio " + name + ": " + e.Message);
            return AudioClip.Create(name + "_empty", 256, 1, Sr, false);
        }
    }

    static AudioClip Build(int stage)
    {
        var buf = new float[Mathf.CeilToInt(Sr * 2.8f)];
        switch (stage)
        {
            case 1:
                NoiseBurst(buf, 0.00f, 0.16f, 0.28f);
                Sweep(buf, 0.02f, 0.22f, 420f, 90f, 0.22f);
                Sweep(buf, 0.04f, 0.18f, 2100f, 480f, 0.16f);
                Chime(buf, 0.12f, 76, 0.9f, 0.36f);
                Chime(buf, 0.30f, 79, 0.9f, 0.34f);
                Chime(buf, 0.48f, 81, 1.0f, 0.32f);
                Chime(buf, 0.68f, 84, 1.1f, 0.30f);
                Chime(buf, 0.90f, 88, 1.2f, 0.32f);
                Chime(buf, 1.16f, 93, 1.4f, 0.28f);
                Tone(buf, 0.8f, 1.8f, Midi(60), 0.09f, 0);
                Tone(buf, 0.8f, 1.8f, Midi(67), 0.07f, 0);
                Tone(buf, 0.8f, 1.8f, Midi(72), 0.05f, 0);
                break;
            case 2:
                Drum(buf, 0.00f, 62f, 0.58f);
                Drum(buf, 0.14f, 88f, 0.42f);
                Drum(buf, 0.28f, 54f, 0.62f);
                NoiseBurst(buf, 0.28f, 0.12f, 0.2f);
                Tone(buf, 0.08f, 0.18f, 210f, 0.16f, 1);
                Tone(buf, 0.22f, 0.16f, 280f, 0.12f, 1);
                Chime(buf, 0.42f, 71, 0.7f, 0.22f);
                Chime(buf, 0.62f, 74, 0.8f, 0.24f);
                Chime(buf, 0.84f, 79, 1.0f, 0.28f);
                Chime(buf, 1.08f, 83, 1.1f, 0.24f);
                Drum(buf, 1.20f, 70f, 0.36f);
                Chime(buf, 1.36f, 86, 1.2f, 0.22f);
                break;
            case 3:
                Sweep(buf, 0.00f, 1.6f, 48f, 220f, 0.28f);
                Sweep(buf, 0.06f, 1.3f, 1400f, 180f, 0.14f);
                Sweep(buf, 0.18f, 1.1f, 360f, 70f, 0.16f);
                NoiseBurst(buf, 0.02f, 0.55f, 0.12f);
                Tone(buf, 0.28f, 1.6f, Midi(50), 0.20f, 0);
                Tone(buf, 0.52f, 1.5f, Midi(57), 0.15f, 0);
                Tone(buf, 0.82f, 1.3f, Midi(62), 0.11f, 0);
                Chime(buf, 1.05f, 69, 1.1f, 0.22f);
                Chime(buf, 1.32f, 74, 1.0f, 0.20f);
                Chime(buf, 1.60f, 81, 1.0f, 0.18f);
                break;
            case 4:
                Bell(buf, 0.00f, 52, 2.2f, 0.42f);
                Bell(buf, 0.22f, 59, 1.9f, 0.28f);
                Drum(buf, 0.18f, 150f, 0.18f);
                Drum(buf, 0.42f, 190f, 0.14f);
                Chime(buf, 0.70f, 68, 1.0f, 0.18f);
                Chime(buf, 0.96f, 71, 1.0f, 0.16f);
                Bell(buf, 1.18f, 64, 1.4f, 0.22f);
                Chime(buf, 1.42f, 76, 1.2f, 0.20f);
                Chime(buf, 1.70f, 80, 1.3f, 0.16f);
                Tone(buf, 0.5f, 2.0f, Midi(40), 0.08f, 0);
                break;
            default:
                Gong(buf, 0.00f, 48, 2.4f, 0.46f);
                Gong(buf, 0.24f, 55, 2.1f, 0.30f);
                Sweep(buf, 0.30f, 1.6f, 180f, 2200f, 0.18f);
                Sweep(buf, 0.34f, 0.9f, 900f, 220f, 0.12f);
                Chime(buf, 0.50f, 76, 1.1f, 0.24f);
                Chime(buf, 0.74f, 80, 1.1f, 0.22f);
                Chime(buf, 0.98f, 83, 1.2f, 0.22f);
                Chime(buf, 1.24f, 88, 1.4f, 0.26f);
                Chime(buf, 1.54f, 93, 1.5f, 0.22f);
                Tone(buf, 0.7f, 2.0f, Midi(57), 0.09f, 0);
                Tone(buf, 0.7f, 2.0f, Midi(64), 0.07f, 0);
                Drum(buf, 0.12f, 48f, 0.28f);
                break;
        }
        Normalize(buf, 0.94f);
        var c = AudioClip.Create("break_" + stage, buf.Length, 1, Sr, false);
        c.SetData(buf, 0);
        return c;
    }

    static float Midi(int m)
    {
        return 440f * Mathf.Pow(2f, (m - 69) / 12f);
    }

    static int Hash(int i)
    {
        i = (i ^ 61) ^ (i >> 16);
        i *= 9;
        i = i ^ (i >> 4);
        i *= 0x27d4eb2d;
        return i ^ (i >> 15);
    }

    static float Noise(int i)
    {
        return ((Hash(i) & 0xffff) / 32768f) - 1f;
    }

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
        for (int k = 0; k < n; k++)
        {
            float t = k / (float)Sr;
            float env = Mathf.Exp(-t * (kind == 0 ? 1.15f : 3.4f));
            if (t < 0.018f) env *= t / 0.018f;
            float ph = 2f * Mathf.PI * freq * t;
            float s = kind == 0
                ? Mathf.Sin(ph)
                : Mathf.Sin(ph) + 0.32f * Mathf.Sin(ph * 2f);
            Mix(buf, n0 + k, s * amp * env);
        }
    }

    static void Chime(float[] buf, float t0, int midi, float dur, float amp)
    {
        Tone(buf, t0, dur, Midi(midi), amp, 0);
        Tone(buf, t0, dur * 0.85f, Midi(midi) * 2.003f, amp * 0.32f, 0);
        Tone(buf, t0, dur * 0.7f, Midi(midi) * 2.997f, amp * 0.12f, 0);
    }

    static void Bell(float[] buf, float t0, int midi, float dur, float amp)
    {
        Tone(buf, t0, dur, Midi(midi), amp, 0);
        Tone(buf, t0, dur, Midi(midi) * 2.76f, amp * 0.22f, 0);
        Tone(buf, t0, dur * 0.8f, Midi(midi) * 5.4f, amp * 0.08f, 0);
    }

    static void Gong(float[] buf, float t0, int midi, float dur, float amp)
    {
        Tone(buf, t0, dur, Midi(midi), amp, 0);
        Tone(buf, t0, dur, Midi(midi) * 1.498f, amp * 0.45f, 0);
        Tone(buf, t0, dur * 0.9f, Midi(midi) * 2.002f, amp * 0.2f, 0);
        Sweep(buf, t0, 0.22f, Midi(midi) * 3f, Midi(midi), amp * 0.12f);
    }

    static void Drum(float[] buf, float t0, float freq, float amp)
    {
        int n0 = Mathf.Max(0, Mathf.FloorToInt(t0 * Sr));
        int n = Mathf.Min(buf.Length - n0, Mathf.CeilToInt(0.24f * Sr));
        double ph = 0;
        for (int k = 0; k < n; k++)
        {
            float t = k / (float)Sr;
            float f = freq * Mathf.Exp(-t * 14f);
            ph += 2.0 * Mathf.PI * f / Sr;
            float env = Mathf.Exp(-t * 18f);
            Mix(buf, n0 + k, ((float)System.Math.Sin(ph) * 0.7f + Noise(n0 + k) * 0.3f) * amp * env);
        }
    }

    static void Sweep(float[] buf, float t0, float dur, float f0, float f1, float amp)
    {
        int n0 = Mathf.Max(0, Mathf.FloorToInt(t0 * Sr));
        int n = Mathf.Min(buf.Length - n0, Mathf.CeilToInt(dur * Sr));
        double ph = 0;
        for (int k = 0; k < n; k++)
        {
            float u = k / (float)Mathf.Max(1, n - 1);
            ph += 2.0 * Mathf.PI * Mathf.Lerp(f0, f1, u) / Sr;
            float env = (1f - u) * (u < 0.06f ? u / 0.06f : 1f);
            Mix(buf, n0 + k, Mathf.Sin((float)ph) * amp * env);
        }
    }

    static void NoiseBurst(float[] buf, float t0, float dur, float amp)
    {
        int n0 = Mathf.Max(0, Mathf.FloorToInt(t0 * Sr));
        int n = Mathf.Min(buf.Length - n0, Mathf.CeilToInt(dur * Sr));
        for (int k = 0; k < n; k++)
        {
            float u = k / (float)Mathf.Max(1, n - 1);
            Mix(buf, n0 + k, Noise(n0 + k) * amp * (1f - u));
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
        for (int i = 0; i < buf.Length; i++)
            buf[i] = Mathf.Clamp(buf[i] * k, -1f, 1f);
    }
}
