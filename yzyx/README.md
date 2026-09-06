# 给孩子的AI益智游戏

小朋友用的益智小站。账号管理和 AI 讲解沿用 **AI卡牌（AIkp）** 同一套办法：管理员开通账号，游戏里调用自己的 Cursor 大模型。

当前第 1 个游戏：**开奖汉字**。

## 怎么运行

两个窗口：

```powershell
cd D:\code\AICODES\yzyx
npm install
npm run server
```

```powershell
cd D:\code\AICODES\yzyx
npm run dev
```

浏览器打开 http://127.0.0.1:5173/

管理员账号（与 AIkp 相同）：**kjxgl** / **kjx.123**

登录后可在「账号管理」里给小朋友开账号。没有公开注册。

## 开奖汉字

1. 点 **开奖**：四个开奖机同时转动，开出声母、韵母、整体认读音节、音调，并自动找汉字、拼读造句。
2. 常用字优先，生僻字也可以；点选其他汉字可换一个讲解。
3. 点 **听一听**，用普通话朗读汉字、词语或句子。

## 自己的 AI

讲解走 **Cursor 大模型**（默认 `composer-2.5`），不再用本地假讲解。

第一次先登录 Cursor（浏览器会弹出）：

```powershell
cd D:\code\AICODES\yzyx
npm run cursor-login
npm run server
```

也可以在 `server/.env` 写入 [Dashboard → API Keys](https://cursor.com/dashboard/api) 里的 `CURSOR_API_KEY`。管理员登录游戏后也能点「登录 Cursor」。

只有设置 `FORCE_MOCK=1` 时才走本地兜底。
