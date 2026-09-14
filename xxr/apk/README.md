# Android APK 打包说明

## 已生成的安装包

调试版 APK（可直接安装到手机）：

- `apk/小小人-debug.apk`

把该文件拷到 Android 手机，允许「未知来源」后安装即可。

## 重新打包

需已安装：

- Node.js
- JDK 21（`JAVA_HOME` 指向 JDK 21）
- Android SDK（`ANDROID_HOME`，需含 platform-tools / platforms;android-36 / build-tools）

```powershell
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.8-hotspot"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT = $env:ANDROID_HOME

npm run apk:debug
```

产物路径：

`android/app/build/outputs/apk/debug/app-debug.apk`

打包完成后可复制到本目录：

```powershell
Copy-Item android\app\build\outputs\apk\debug\app-debug.apk apk\小小人-debug.apk -Force
```

## 正式签名版（可选）

```powershell
npm run apk:release
```

发布到应用商店前需配置签名密钥（`android/app/keystore` + `signingConfigs`）。

## 说明

- 包名：`com.xxr.xiaoxiaoren`
- 基于 Capacitor 8，流程与神笔马良（`sbmlapp`）一致
- 游戏资源已打进 APK；账号登录等需后端时，请设置 `VITE_API_BASE` 指向可访问的 API 后再重新 `npm run apk:debug`
