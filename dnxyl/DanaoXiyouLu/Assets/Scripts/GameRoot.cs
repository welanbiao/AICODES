using System.Collections.Generic;
using UnityEngine;

public partial class GameRoot : MonoBehaviour
{
    public static GameRoot I;

    public int stage = 1;
    public int[] wuXing = new int[5];
    public long xiuwei;
    public int hp = 100;
    public int maxHp = 100;
    public bool Paused;

    public Transform player;
    public Transform modelSlot;
    GameObject _model;
    RunCycle _run;
    Camera _cam;
    Transform _boat;
    Light _sun;
    Light _heroLight;

    float _x;
    float _pathW = 4.2f;
    float _speed = 5.2f;
    float _atkCd;
    float _hurtCd;
    float _spawnCd = 1f;
    float _playTime;
    float _gateLock;

    readonly List<GameObject> _chunks = new List<GameObject>();
    int _nextChunk;
    const float ChunkLen = 22f;

    void Awake()
    {
        I = this;
        Application.targetFrameRate = 60;
    }

    [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
    static void Boot()
    {
        if (Object.FindFirstObjectByType<GameRoot>() != null) return;
        var go = new GameObject("GameRoot");
        go.AddComponent<GameRoot>();
    }

    void Start()
    {
        BuildCamera();
        BuildSun();
        BuildPlayer();
        BuildHud();
        ApplyStageVisuals();
        RebuildModel();
        EnsureChunks();
        ShowLoading();
    }

    void BuildCamera()
    {
        if (Camera.main != null) _cam = Camera.main;
        else
        {
            var cgo = new GameObject("GameCamera");
            _cam = cgo.AddComponent<Camera>();
            cgo.AddComponent<AudioListener>();
            cgo.tag = "MainCamera";
        }
        _cam.clearFlags = CameraClearFlags.Skybox;
        _cam.fieldOfView = 42f;
        _cam.farClipPlane = 220f;
        _cam.allowHDR = true;
    }

    void BuildSun()
    {
        _sun = null;
        var lights = Object.FindObjectsByType<Light>(FindObjectsSortMode.None);
        for (int i = 0; i < lights.Length; i++)
        {
            if (lights[i].type == LightType.Directional)
            {
                _sun = lights[i];
                break;
            }
        }
        if (_sun == null)
        {
            var go = new GameObject("Sun");
            _sun = go.AddComponent<Light>();
            _sun.type = LightType.Directional;
        }
        _sun.transform.rotation = Quaternion.Euler(42, -30, 0);
        _sun.shadows = LightShadows.Soft;
        _sun.intensity = 1.15f;
        RenderSettings.fog = true;
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
    }

    void BuildPlayer()
    {
        var p = new GameObject("Player");
        player = p.transform;
        player.position = new Vector3(0, 0, 0);
        modelSlot = Danao.Node(player, "Model", Vector3.zero);
        var col = p.AddComponent<CapsuleCollider>();
        col.height = 1.7f;
        col.radius = 0.35f;
        col.center = new Vector3(0, 0.85f, 0);
        col.isTrigger = true;
        var rb = p.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        rb.useGravity = false;
        p.AddComponent<PlayerHit>();
        _heroLight = Danao.Glow(player, Danao.Gold, 0.45f, 4.5f);
    }

    public void RebuildModel()
    {
        if (_model != null) Destroy(_model);
        _model = WukongBuilder.Build(stage, modelSlot);
        _run = _model.GetComponent<RunCycle>();
        if (_boat != null) Destroy(_boat.gameObject);
        _boat = null;
        if (stage == 3)
        {
            _boat = Danao.Node(player, "Boat", new Vector3(0, 0.05f, 0.1f));
            Danao.Prim(_boat, "hull", PrimitiveType.Cube, new Vector3(0, 0.08f, 0), new Vector3(1.4f, 0.18f, 2.4f),
                Mats.Solid(new Color(0.45f, 0.28f, 0.12f), "wood"));
            Danao.Prim(_boat, "head", PrimitiveType.Cube, new Vector3(0, 0.16f, 1.1f), new Vector3(0.9f, 0.12f, 0.4f),
                Mats.Solid(new Color(0.55f, 0.32f, 0.14f), "wood2"));
            Danao.Prim(_boat, "pole", PrimitiveType.Cylinder, new Vector3(0.5f, 0.7f, -0.4f), new Vector3(0.04f, 0.7f, 0.04f), Mats.Cloth);
        }
    }

    void Update()
    {
        if (_loading) { TickLoading(); return; }
        if (_breakPrompted && !_breaking && (Input.GetKeyDown(KeyCode.Space) || Input.GetKeyDown(KeyCode.Return)))
            OnClickBreak();
        if (Paused) return;
        if (_breaking) return;

        _playTime += Time.deltaTime;
        HandleMove();
        HandleAttack();
        TickCamera();
        EnsureChunks();
        TickSpawn();
        TickHud();
        if (_run != null) _run.run = 1f;

        if (CanBreak() && !_breakPrompted)
        {
            _breakPrompted = true;
            ShowBreakPrompt(true);
            Paused = true;
        }
    }

    void HandleMove()
    {
        bool hold = Input.GetMouseButton(0) || Input.touchCount > 0;
        if (hold)
        {
            Vector3 sp = Input.touchCount > 0 ? (Vector3)Input.GetTouch(0).position : Input.mousePosition;
            float vx = _cam.ScreenToViewportPoint(sp).x;
            float target = Mathf.Lerp(-_pathW, _pathW, vx);
            _x = Mathf.Lerp(_x, target, 1f - Mathf.Exp(-12f * Time.deltaTime));
        }
        if (Input.GetKey(KeyCode.A) || Input.GetKey(KeyCode.LeftArrow)) _x -= 9f * Time.deltaTime;
        if (Input.GetKey(KeyCode.D) || Input.GetKey(KeyCode.RightArrow)) _x += 9f * Time.deltaTime;
        _x = Mathf.Clamp(_x, -_pathW, _pathW);
        player.position = new Vector3(_x, 0, player.position.z + _speed * Time.deltaTime);
        if (_boat != null)
        {
            var lp = _boat.localPosition;
            lp.y = 0.05f + Mathf.Sin(Time.time * 3.2f) * 0.04f;
            _boat.localRotation = Quaternion.Euler(0, 0, Mathf.Sin(Time.time * 2.4f) * 3f);
            _boat.localPosition = lp;
        }
    }

    void HandleAttack()
    {
        _atkCd -= Time.deltaTime;
        if (_atkCd > 0) return;
        _atkCd = FireInterval();
        if (_run != null) _run.attack = 1f;

        Transform target = NearestMob();
        Vector3 muzzle = player.position + Vector3.up * (stage == 1 ? 1.1f : 1.15f) + player.forward * 0.4f;
        Vector3 dir = Vector3.forward;
        if (target != null)
        {
            dir = (target.position + Vector3.up * 0.6f - muzzle);
            dir.y *= 0.15f;
            if (dir.sqrMagnitude < 0.01f) dir = Vector3.forward;
            dir.Normalize();
        }
        int n = ProjectileCount();
        for (int i = 0; i < n; i++)
        {
            float spread = (i - (n - 1) * 0.5f) * 0.08f;
            Vector3 d = Quaternion.Euler(0, spread * 40f, 0) * dir;
            SpawnBolt(muzzle, d);
        }
    }

    void SpawnBolt(Vector3 pos, Vector3 dir)
    {
        var go = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        Destroy(go.GetComponent<Collider>());
        go.transform.position = pos;
        go.transform.localScale = Vector3.one * (stage == 1 ? 0.28f : 0.18f);
        int elem = stage == 1 ? StrongestElement() : -1;
        Color c = elem >= 0 ? Danao.WuXing[elem] : Danao.Gold;
        go.GetComponent<MeshRenderer>().sharedMaterial = Mats.Solid(c, Color.white, c, "bolt" + elem + stage);
        var sc = go.AddComponent<SphereCollider>();
        sc.isTrigger = true;
        sc.radius = 0.55f;
        var rb = go.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        rb.useGravity = false;
        var b = go.AddComponent<Bolt>();
        b.vel = dir.normalized * 22f;
        b.dmg = AttackDamage();
        b.element = elem;
        Destroy(go, 2.3f);
    }

    Transform NearestMob()
    {
        Mob best = null;
        float bestD = 18f * 18f;
        var mobs = Object.FindObjectsByType<Mob>(FindObjectsSortMode.None);
        for (int i = 0; i < mobs.Length; i++)
        {
            if (mobs[i].dead) continue;
            Vector3 d = mobs[i].transform.position - player.position;
            if (d.z < -0.4f) continue;
            float sq = d.sqrMagnitude;
            if (sq < bestD) { bestD = sq; best = mobs[i]; }
        }
        return best != null ? best.transform : null;
    }

    float AttackDamage()
    {
        float d = 11f + stage * 7f;
        if (stage == 1) d += (wuXing[0] + wuXing[1] + wuXing[2] + wuXing[3] + wuXing[4]) / 220f;
        else d += Mathf.Log(1 + xiuwei) * 1.8f;
        return d;
    }

    float FireInterval()
    {
        float t = 0.28f - stage * 0.02f;
        if (stage == 1) t -= Mathf.Min(0.08f, SumQi() / 20000f);
        return Mathf.Max(0.14f, t);
    }

    int ProjectileCount()
    {
        if (stage == 1) return 1 + SumQi() / 900;
        if (xiuwei > 80000) return 4;
        if (xiuwei > 12000) return 3;
        if (xiuwei > 1500) return 2;
        return 1;
    }

    int SumQi()
    {
        int s = 0;
        for (int i = 0; i < 5; i++) s += wuXing[i];
        return s;
    }

    int StrongestElement()
    {
        int b = 0;
        for (int i = 1; i < 5; i++) if (wuXing[i] > wuXing[b]) b = i;
        return b;
    }

    void TickCamera()
    {
        Vector3 want = player.position + new Vector3(0, 10.5f, -11.5f);
        _cam.transform.position = Vector3.Lerp(_cam.transform.position, want, 1f - Mathf.Exp(-8f * Time.deltaTime));
        _cam.transform.LookAt(player.position + new Vector3(0, 1.1f, 7.5f));
    }

    public bool IsPlayerCollider(Collider c)
    {
        if (c == null || player == null) return false;
        return c.transform == player || c.transform.IsChildOf(player) || c.GetComponentInParent<PlayerHit>() != null;
    }

    public void HurtPlayer(int dmg)
    {
        if (_hurtCd > 0) return;
        _hurtCd = 0.7f;
        hp -= dmg;
        if (hp < 0) hp = 0;
        Vfx.Burst(player.position + Vector3.up, Color.red, 12);
        if (hp <= 0)
        {
            RestartRun();
            return;
        }
    }

    void RestartRun()
    {
        StopAllCoroutines();
        _breaking = false;
        _breakPrompted = false;
        Paused = false;
        ShowBreakPrompt(false);
        if (_endRoot != null) _endRoot.gameObject.SetActive(false);

        stage = 1;
        for (int i = 0; i < 5; i++) wuXing[i] = 0;
        xiuwei = 0;
        maxHp = 100;
        hp = maxHp;
        _playTime = 0f;
        _x = 0f;
        _atkCd = 0f;
        _hurtCd = 0.8f;
        _spawnCd = 1.2f;
        _gateLock = 0f;
        player.position = Vector3.zero;

        ClearWorld(true);
        ApplyStageVisuals();
        RebuildModel();
        EnsureChunks();
        FloatText.Show(player.position + Vector3.up * 2f, "元神溃散 · 从头再炼", new Color(1f, 0.45f, 0.35f));
    }

    void LateUpdate()
    {
        _hurtCd -= Time.deltaTime;
        _gateLock -= Time.deltaTime;
    }
}
