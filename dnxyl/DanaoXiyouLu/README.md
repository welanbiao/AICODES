# 大闹西游路

Unity 3D 闯关小游戏。主角孙悟空，参考《西游记》开篇：仙石补天、花果山、水帘洞、漂海、方寸山学艺。

当前做到 **五个阶段**。打开本文件夹即可运行。

## 打开方法

用本机已装的 **Unity 2022.3.62f3c1**（中国区 LTS，路径 `D:\Unity\Editor\2022.3.62f3c1`）。

1. Unity Hub 打开本目录 `DanaoXiyouLu`（版本选 2022.3.62f3c1）。
2. 若提示版本/平台不一致：菜单 **大闹西游路 → 切到 Windows x64**，或 `File → Build Settings` 选 **PC, Mac & Linux Standalone**，Architecture **x86_64**。
3. 打开 `Assets/Scenes/Main.unity`，点 Play。

第一次导入会编译脚本，大约一两分钟。改过建模后重新进 Play 即可看到新模型。

## 浏览器运行（端口 5173）

编辑器里点 Play **不会**出现在浏览器。要先打 **WebGL** 包，再用本地服务器打开。

本机 Unity（`D:\Unity\Editor\2022.3.62f3c1`）默认只有 Windows 模块，需先装 WebGL：

1. **完全退出 Unity**。
2. 下载并安装官方模块（约 560 MB）：  
   [UnitySetup-WebGL-Support-for-Editor-2022.3.62f3c1.exe](https://download.unitychina.cn/download_unity/1623fc0bbb97/TargetSupportInstaller/UnitySetup-WebGL-Support-for-Editor-2022.3.62f3c1.exe)  
   安装路径选：`D:\Unity\Editor\2022.3.62f3c1`
3. 再打开本工程，菜单 **大闹西游路 → 构建 WebGL（浏览器 5173）**。第一次构建大约十几分钟。
4. 构建完成后，在本目录运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\serve-webgl.ps1
```

5. 浏览器打开 **http://127.0.0.1:5173/**

不要用资源管理器直接双击 `index.html`，WebGL 必须通过 http 访问。建议 Chrome / Edge。

## 操作

- 鼠标按住或手指左右滑动：横向走位
- `A` / `D` 或方向键：键盘走位
- 自动向前跑、自动攻击
- 五灵满并满足条件后点 **突破**，或按空格 / 回车

## 五阶段

| 阶段 | 形态 | 场景 | 敌人 | 突破条件 |
| --- | --- | --- | --- | --- |
| 1 补天五彩石 | 五彩石贴图 | 五彩祥云跑道、五彩山贴图、前方蓝海；太阳贴 太阳.png 从左边海面升起、右边落下 | 撞击捕获金木水火土精灵 | 五行各 99 |
| 2 花果山小灵猴 | 幼年灵猴 | 花果山林、桃树 | 虎狼野猪蟒、猴将 | 修为 3000；发射石子 |
| 3 出海寻仙 | 稍大灵猴，乘木船 | 东海航道 | 鱼人、鲨、蟹、水母 | 修为 15000；发射水柱 |
| 4 方寸山外门 | 粗布衣灵猴 | 山门松雾、灯笼 | 神仙之徒（剑/杖） | 修为 75000；发射木棍 |
| 5 方寸山问道 | 道袍金冠灵猴 | 玉阶仙殿、祥云 | 仙徒与金甲护法 | 修为 375000；发射火球 |

每阶段所需修为约为上一阶段的 **5 倍**。第一关是五彩祥云跑道（不再有左右漂移的圆云），山用 `五彩山.png`、主角用 `五彩石.png`、太阳用 `太阳.png`；太阳从左边海面升起、右边海面落下，循环。不发射子弹，撞到五灵即捕获，各满 99 可突破。第二关石子、第三关水柱、第四关木棍、第五关火球。血条归零从第一关重开。

## 建模说明

角色与敌人全部在运行时程序化建模（`WukongBuilder` / `EnemyBuilder`），无需额外 FBX：

- 孙悟空：人脸无毛、金眼、金毛发与躯干、长尾；二阶段起持金箍棒；四阶段粗布衣；五阶段青绿道袍与金冠
- 第一关五彩石：广告牌贴图 `五彩石.png`；其后各关为人形金毛悟空
- 第一关场景：五彩祥云跑道；山用 `五彩山.png` 贴在主角前方并随其移动，前方蓝色大海；太阳贴 `太阳.png`，从左边海面升起、右边海面落下
- 突破特效各阶段不同：石破五色、水帘冲天、破浪现山、霞帔加身、金身问道

## 目录

```
DanaoXiyouLu/
  Assets/Scenes/Main.unity
  Assets/Scripts/          玩法、UI、世界
  Assets/Shaders/          神魔描边与宝光
  Assets/Editor/           打开场景菜单
  ProjectSettings/
  Packages/
```

参考小说与截图在上一级 `dnxyl/` 目录。
