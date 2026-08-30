# 神笔马良

儿童绘画教育 App，风格参考 Android「神笔马良」。

## 功能

- **动物画 / 自然画 / 机械画**：虚线描摹 + 彩色铅笔；动物画完成后角色会动起来
- **字母画**：26 个字母各一关 + 100 个常用单词关卡
- **数学画**：看图算式选择题（16 关）
- **益智画**：彩虹线条物理解谜（12 关）
- **通关**：彩色礼花筒发射动画
- **布局**：11 寸平板横/竖屏切换
- **背景音乐**：儿歌 BGM

## 运行（浏览器）

```bash
npm install
npm run dev
```

## 打包 APK

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.8-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm run apk:debug
```

安装包：

- `apk/sbml-maliang-debug.apk`（约 11 MB）
- 或 `android/app/build/outputs/apk/debug/app-debug.apk`

拷到手机后允许「未知来源」安装即可。

## 技术

- Vite + React + TypeScript
- Capacitor Android
- Matter.js
