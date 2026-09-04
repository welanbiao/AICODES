# 界面截图（防侵权备案附录 C）

本目录 PNG 对应 [`防侵权备案_产品设定与开发说明.md`](./防侵权备案_产品设定与开发说明.md) **附录 C**。

| 文件 | 界面 |
|------|------|
| `01_auth.png` | 登录 / 注册 |
| `02_home.png` | 大厅 |
| `03_worlds.png` | 小世界列表 |
| `04_world.png` | 世界详情 |
| `05_create_card.png` | 铸造卡牌 |
| `06_create_world.png` | 创建小世界 |
| `07_ranked.png` | 排位对决 |
| `08_battle.png` | 战报 |
| `09_collection.png` | 卡册 |
| `10_profile.png` | 我的 / 荣耀册 |

## 重抓

```bash
cd AIkp/web
npm run dev -- --host 127.0.0.1 --port 5173
# 另开终端
cd AIkp
node scripts/capture-filing-screens.mjs http://127.0.0.1:5173
```

Web 备案演示：`http://127.0.0.1:5173/?filing=1&screen=home`
