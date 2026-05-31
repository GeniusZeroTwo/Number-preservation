export default {
  // 1. 处理前端的增删改查请求
  async fetch(request, env, ctx) {
    // 跨域设置，允许前端直接调用
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // 处理预检请求 (CORS)
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // 从 KV 数据库读取当前所有 eSIM 数据
    // 注意：如果在 Cloudflare 没绑定名为 ESIM_DB 的 KV，这里会报错
    let esims;
    try {
      esims = await env.ESIM_DB.get("esim_list", { type: "json" });
      if (!esims) esims = []; // 如果为空，初始化为空数组
    } catch (err) {
      return new Response(JSON.stringify({ error: "KV 数据库未绑定或读取失败" }), { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } });
    }

    // [GET] 获取列表
    if (request.method === "GET") {
      return new Response(JSON.stringify(esims), {
        headers: { "Content-Type": "application/json", ...corsHeaders }
      });
    }

    // [POST] 新增卡片
    if (request.method === "POST") {
      try {
        const newSim = await request.json();
        // 简单的数据校验
        if (!newSim.name || !newSim.expireDate) {
          return new Response(JSON.stringify({ success: false, message: "卡名和到期日不能为空" }), { status: 400, headers: corsHeaders });
        }
        
        newSim.id = Date.now().toString(); // 生成唯一 ID
        esims.push(newSim);
        await env.ESIM_DB.put("esim_list", JSON.stringify(esims)); // 保存到 KV
        
        return new Response(JSON.stringify({ success: true, message: "添加成功", data: newSim }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, message: "无效的 JSON 数据" }), { status: 400, headers: corsHeaders });
      }
    }

    // [DELETE] 删除卡片
    if (request.method === "DELETE") {
      try {
        const { id } = await request.json();
        const initialLength = esims.length;
        esims = esims.filter(sim => sim.id !== id);
        
        if (esims.length === initialLength) {
          return new Response(JSON.stringify({ success: false, message: "未找到该记录" }), { status: 404, headers: corsHeaders });
        }

        await env.ESIM_DB.put("esim_list", JSON.stringify(esims)); // 更新 KV
        return new Response(JSON.stringify({ success: true, message: "删除成功" }), { headers: corsHeaders });
      } catch (err) {
        return new Response(JSON.stringify({ success: false, message: "无效的请求" }), { status: 400, headers: corsHeaders });
      }
    }

    // 其他方法均拒绝
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  },

  // 2. 处理定时任务 (Cron Trigger，每天检查并发送 Telegram 提醒)
  async scheduled(event, env, ctx) {
    // 从 KV 数据库读取数据
    const esims = await env.ESIM_DB.get("esim_list", { type: "json" });
    if (!esims || esims.length === 0) return; // 没有数据则跳过

    const today = new Date();
    // 强制转换为东八区时间
    const offset = 8; 
    const localToday = new Date(today.getTime() + offset * 3600 * 1000);
    // 抹平时间差异，只算日期
    localToday.setUTCHours(0, 0, 0, 0);

    let messages = [];

    esims.forEach(sim => {
      const expDate = new Date(sim.expireDate);
      expDate.setUTCHours(0, 0, 0, 0); // 抹平时间差异，只算日期
      
      const diffTime = expDate - localToday;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 15 && diffDays > 0) {
        messages.push(`⚠️ 【eSIM 保号提醒】\n📱 卡名: ${sim.name}\n📞 号码: ${sim.number || '未填写'}\n📅 到期: ${sim.expireDate}\n⏳ 剩余: ${diffDays} 天！\n👉 请尽快处理！`);
      } else if (diffDays === 0) {
        messages.push(`🚨 【eSIM 紧急提醒】\n📱 卡名: ${sim.name} 今天到期！`);
      } else if (diffDays < 0 && Math.abs(diffDays) % 7 === 0) {
        // 过期后每 7 天提醒一次
        messages.push(`❌ 【eSIM 停机警告】\n📱 卡名: ${sim.name} 已过期 ${Math.abs(diffDays)} 天。`);
      }
    });

    // 如果有需要提醒的消息，发送到 Telegram
    if (messages.length > 0 && env.TG_BOT_TOKEN && env.TG_CHAT_ID) {
      const text = messages.join("\n\n---\n\n");
      const tgUrl = `https://api.telegram.org/bot${env.TG_BOT_TOKEN}/sendMessage`;
      await fetch(tgUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          chat_id: env.TG_CHAT_ID, 
          text: text, 
          parse_mode: "HTML" 
        })
      });
    }
  }
};
```
