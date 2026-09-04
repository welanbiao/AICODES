using UnityEngine;

public class Mob : MonoBehaviour
{
    public MobKind kind;
    public float hp;
    public float maxHp;
    public float speed = 2.6f;
    public int element = -1;
    public int xiuReward = 8;
    public bool dead;
    Transform _player;

    public void Init(MobKind k, Transform player, int stage)
    {
        kind = k;
        _player = player;
        element = EnemyBuilder.ElementOf(k);
        float baseHp = 22f + stage * 18f;
        if (k == MobKind.MonkeyGeneral || k == MobKind.GoldenGuard) baseHp *= 2.2f;
        if (k == MobKind.Shark || k == MobKind.DiscipleSword) baseHp *= 1.5f;
        maxHp = hp = baseHp;
        speed = 2.1f + stage * 0.15f;
        xiuReward = 8 + stage * 6;
        if (element >= 0) xiuReward = Random.Range(8, 13);

        var col = gameObject.AddComponent<CapsuleCollider>();
        col.height = 1.6f;
        col.radius = 0.45f;
        col.center = new Vector3(0, 0.7f, 0);
        col.isTrigger = true;
        var rb = gameObject.AddComponent<Rigidbody>();
        rb.isKinematic = true;
        rb.useGravity = false;
    }

    void Update()
    {
        if (dead || _player == null || GameRoot.I == null || GameRoot.I.Paused) return;
        Vector3 p = transform.position;
        Vector3 t = _player.position;
        t.y = p.y;
        Vector3 dir = (t - p);
        dir.y = 0;
        if (dir.sqrMagnitude > 0.01f)
        {
            transform.rotation = Quaternion.Slerp(transform.rotation, Quaternion.LookRotation(dir), Time.deltaTime * 6f);
            transform.position += dir.normalized * speed * Time.deltaTime;
        }
        float dist = Vector3.Distance(new Vector3(p.x, 0, p.z), new Vector3(t.x, 0, t.z));
        if (dist < 1.15f)
        {
            GameRoot.I.HurtPlayer(6 + GameRoot.I.stage * 2);
            transform.position += Vector3.forward * 1.8f;
        }
        if (p.z < _player.position.z - 1.6f)
        {
            GameRoot.I.HurtPlayer(8 + GameRoot.I.stage * 3);
            Die(false);
        }
    }

    public void Hit(float dmg, int elem)
    {
        if (dead) return;
        hp -= dmg;
        FloatText.Show(transform.position, "-" + Mathf.CeilToInt(dmg), elem >= 0 ? Danao.WuXing[elem] : Danao.Gold);
        Vfx.Burst(transform.position + Vector3.up, elem >= 0 ? Danao.WuXing[elem] : Danao.Gold, 10);
        if (hp <= 0) Die(true);
    }

    void Die(bool killedByPlayer)
    {
        if (dead) return;
        dead = true;
        if (killedByPlayer && GameRoot.I != null) GameRoot.I.OnMobKilled(this);
        Destroy(gameObject);
    }
}

public class Bolt : MonoBehaviour
{
    public float dmg = 12;
    public int element = -1;
    public Vector3 vel;
    float _life = 2.2f;

    void Update()
    {
        transform.position += vel * Time.deltaTime;
        transform.Rotate(0, 400f * Time.deltaTime, 0);
        _life -= Time.deltaTime;
        if (_life <= 0) Destroy(gameObject);
    }

    void OnTriggerEnter(Collider other)
    {
        var mob = other.GetComponentInParent<Mob>();
        if (mob != null)
        {
            mob.Hit(dmg, element);
            Vfx.Burst(transform.position, element >= 0 ? Danao.WuXing[element] : Danao.Gold, 14);
            Destroy(gameObject);
            return;
        }
        var barrel = other.GetComponentInParent<Barrel>();
        if (barrel != null)
        {
            barrel.Hit(dmg);
            Destroy(gameObject);
        }
    }
}

public class GateTrigger : MonoBehaviour
{
    public int element = -1;
    public int add;
    public float mul = 1f;
    public int xiuAdd;
    bool _used;

    void OnTriggerEnter(Collider other)
    {
        if (_used || GameRoot.I == null) return;
        if (!GameRoot.I.IsPlayerCollider(other)) return;
        _used = true;
        GameRoot.I.ApplyGate(this);
        Destroy(gameObject);
    }
}

public class PickupOrb : MonoBehaviour
{
    public int element = -1;
    public int qi = 20;
    public int xiu = 0;
    public int heal = 0;
    bool _used;

    void Update()
    {
        transform.Rotate(0, 90f * Time.deltaTime, 0);
        if (GameRoot.I != null && GameRoot.I.player != null)
        {
            if ((transform.position - GameRoot.I.player.position).sqrMagnitude < 1.6f)
                Collect();
        }
    }

    void OnTriggerEnter(Collider other)
    {
        if (GameRoot.I != null && GameRoot.I.IsPlayerCollider(other)) Collect();
    }

    void Collect()
    {
        if (_used) return;
        _used = true;
        if (GameRoot.I != null) GameRoot.I.ApplyPickup(this);
        Destroy(gameObject);
    }
}

public class Barrel : MonoBehaviour
{
    public float hp = 30;
    bool _dead;

    public void Hit(float dmg)
    {
        if (_dead) return;
        hp -= dmg;
        FloatText.Show(transform.position, Mathf.CeilToInt(hp).ToString(), Color.white);
        if (hp <= 0)
        {
            _dead = true;
            if (GameRoot.I != null) GameRoot.I.OnBarrelBreak(transform.position);
            Destroy(gameObject);
        }
    }

    void OnTriggerEnter(Collider other)
    {
        var b = other.GetComponent<Bolt>();
        if (b != null) Hit(b.dmg);
    }
}

public class PlayerHit : MonoBehaviour { }
