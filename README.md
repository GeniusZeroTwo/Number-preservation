5.31号新增备注 可备注保号要求





# **📱 eSIM-Tracker: 单体全栈保号看板**

告别忘记充值、眼睁睁看着传家宝靓号被回收的惨痛经历！这是一个基于 Cloudflare Workers \+ KV 数据库构建的 **零成本、高颜值、极度安全** 的 eSIM / 实体卡保号管理面板。  
**前端展示、后端 API、定时提醒逻辑，全部浓缩在一个文件内。无需服务器，依托 Cloudflare 免费网络运行！**

## **✨ 核心亮点 / Features**

* 🆓 **完全零成本部署**：无需购买 VPS，完美白嫖 Cloudflare 生态（Workers 托管运行 \+ KV 数据持久化）。  
* 🎨 **高颜值毛玻璃 UI**：基于 TailwindCSS 打造的 Glassmorphism 现代质感界面，手机/PC 完美自适应，绝对防重叠设计。  
* 🛡️ **银行级安全防线**：  
  * **TG 动态密码 (OTP) 登录**：不在代码中写死密码。每次登录需向你的专属 TG 机器人获取 6 位数动态验证码。  
  * **防爆破机制**：验证码 5 分钟有效，连续输错 5 次立刻强制自毁作废，并带有并发延迟防御机制。  
* ⏰ **智能 Telegram 提醒**：利用 CF Cron 定时任务，在卡片到期前 15 天内、到期当天、过期后，准时通过 TG 机器人向你发送告警推送。  
* 🔄 **一键顺延续期**：发完保号短信后，无需日历推算。点击“一键续期”按钮，系统会自动根据设置的“保号周期（如180天）”顺延生成新的到期日。  
* 🌍 **智能国旗匹配**：内置全球数十个国家常用区号字典。录入带区号的号码（如 \+44 或 \+1），面板会自动解析并显示对应国旗。

## **📸 界面预览 / Screenshots**

![image](https://github.com/GeniusZeroTwo/Number-preservation/blob/7519ab70a15dce64f548c1262441710369c5fed1/IMG/%E6%88%AA%E5%B1%8F2026-06-01%2017.56.37.png)

## **🛠️ 极简部署指南 / Deployment Guide**

部署过程全程在网页端完成，小白也能在 5 分钟内搞定。

### **准备工作**

1. 准备一个 [Cloudflare](https://dash.cloudflare.com/) 账号。  
2. 准备一个 Telegram 账号，搜索 @BotFather 发送 /newbot 创建一个机器人，记录下 **Bot Token**。  
3. 搜索 @userinfobot 发送任意消息，记录下你的数字 **Chat ID**。  
4. **主动给你刚建的机器人发送任意一条消息激活它**（机器人不能主动发起会话）。

### **步骤 1：创建 KV 数据库**

1. 登录 Cloudflare 控制台，左侧菜单找到 **Workers & Pages** \-\> **KV**。  
2. 点击 **Create a namespace**，命名为 esim\_db，点击添加。  
3. 创建成功后，复制它旁边长长的一串 **ID**（比如 09fe63fac...）备用。

### **步骤 2：Fork 本仓库并修改配置**

1. 将本项目 **Fork** 到你自己的 GitHub 账号下。  
2. 在你 Fork 后的仓库中，找到并编辑 wrangler.toml 文件。  
3. 将最下方的 id \= "..." 替换为你在**步骤 1 复制的真实 KV 数据库 ID**。  
4. 点击 Commit changes 保存修改。

### **步骤 3：在 Cloudflare 部署**

1. 在 Cloudflare 左侧菜单点击 **Workers & Pages** \-\> **Overview**。  
2. 点击右上角 **Create Application**，选择 **Workers** 选项卡，然后点击 **Connect to Git**。  
3. 授权连接你的 GitHub 账号，选择你刚刚 Fork 的仓库。  
4. **关键配置**（Setup build 区域）：  
   * Root directory (根目录)：**留空**  
   * Build command (构建命令)：**留空**  
   * Entry point (入口点)：手动输入 **worker/worker.js**  
5. 点击 **Save and Deploy**，等待系统部署完成（出现绿色对勾），点击 **Continue to project**。

### **步骤 4：在 KV 数据库中添加 TG 密钥**

由于 Cloudflare 的环境变量偶尔会有部署延迟的 Bug，我们直接将验证密钥存入 KV 数据库，100% 稳定触发：

1. 回到 Cloudflare 左侧菜单，找到 **Workers & Pages** \-\> **KV**。  
2. 点击进入你在步骤 1 创建的 **esim\_db** 详情页。  
3. 点击顶部的 **KV Entries (KV 条目)** 选项卡。  
4. 在此处手动添加两条数据：  
   * **Key (键)** 填 TG\_BOT\_TOKEN，**Value (值)** 填你的机器人 Token。点击 **Add (添加)**。  
   * **Key (键)** 填 TG\_CHAT\_ID，**Value (值)** 填你的数字 ID。点击 **Add (添加)**。

### **步骤 5：开始使用！**

由于密钥直接存入了数据库，配置会**立即生效，无需等待！**  
现在访问 Cloudflare 为你分配的 Worker 域名（例如 https://esim-api.xxx.workers.dev），点击“向 TG 机器人获取验证码”，开始享受你的保号面板吧！

## **🙋‍♂️ 常见问题 / FAQ**

**Q1: 为什么访问网页报错或者显示 404？**  
检查你的入口点是否设置正确。项目中不存在 index.html，所有的前端代码都已经集成在了 worker/worker.js 中。请确保 Cloudflare 的 Entry point 设置为了 worker/worker.js。如果在 GitHub 库里看到了 wrangler.jsonc 文件，请务必删除它！  
**Q2: 点击获取验证码，提示“发送失败: 环境缺失”？**  
这是因为系统没有找到 Telegram 的配置密钥。请返回 Cloudflare 的 KV 数据库 (esim\_db) 的 KV Entries 页面，检查 TG\_BOT\_TOKEN 和 TG\_CHAT\_ID 是否拼写正确、有没有多余的空格。  
**Q3: 如何绑定自己的自定义域名？**  
在 Cloudflare Worker 的详情页，进入 Triggers (触发器) \-\> Custom Domains，点击 Add Custom Domain，输入你托管在 CF 的域名即可，自带 HTTPS。  
**Q4: 我换设备登录了，如何退出？**  
面板右上角有一个红色的“退出门”图标，点击即可销毁本地凭证，退回安全验证界面。

## **📜 许可协议 / License**

本项目基于 [MIT License](http://docs.google.com/LICENSE) 开源。您可以自由使用、修改和分发，但请保留原作者信息。如果您觉得好用，请帮忙点个 ⭐ Star！
