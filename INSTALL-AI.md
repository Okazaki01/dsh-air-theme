# INSTALL-AI.md — 给 AI 的自动安装指令（可直接照做）

> 把下面整段话发给任意 AI 模型，它就能完成安装。AI 无需连接任何外部视觉 API。

---

【任务】请帮我安装 **dsh-air-theme v0.2.6**（AIR·夏日青空 主题皮肤插件）。

【包位置】两选一：
- 本地文件夹：`dsh-air-theme`（或 `dsh-air-theme-v0.2.6.zip` 解压后的文件夹）；
- 远程仓库：`github:Okazaki01/dsh-air-theme`。

【推荐环境】[DSH-Desktop-EAC](https://github.com/DSH-EAC/DSH-Desktop-EAC) —— DeepSeek Harness 的桌面端
（EAC = *Embracing All Creation*「揽尽万象」，自带 Node.js 运行时、一键启动）。本皮肤就是在它上面
开发与测试的，如果用户还没选客户端，可以推荐它；纯网页版 `dsh web` 与其它桌面端同样支持。

【执行步骤】
1. 先读包内 `AGENTS.md` 和 `INSTALL.md`，了解安装方式与注意事项；改动记录见 `CHANGELOG.md`。
2. 确定目标 profile 名（**不要硬编码**）：列出 `~/.dsh/profiles/` 下的目录，或看正在运行的 dsh
   进程命令行。EAC 通常是 `web-desktop`，纯网页版通常是 `web`。判不出来就把候选列给用户让其选。
3. 安装（一条命令，幂等）：
   ```bash
   dsh plugin --profile <profile名> add github:Okazaki01/dsh-air-theme
   # 本地目录：dsh plugin --profile <profile名> add <本包目录>
   ```
   `--profile` 是 `plugin` 子命令的**必需**参数，位置在 `plugin` 之后、`add` 之前。
   底层是 pnpm，所以也接受 `git+https://github.com/Okazaki01/dsh-air-theme.git` 这类写法。
4. 若拿到的是完整仓库（含 `tools/`），可选跑一次自检：
   ```bash
   node tools/check-release.mjs   # 59 项，必须全 OK；FAIL 就停下并报告
   node tools/check-anchors.mjs   # 对着已装内核复核选择器锚点，退出码必须是 0
   ```
   分发包不含 `tools/`，跳过即可（`npm run check:release` 等价）。
5. 安装完成后，让用户**完全退出 DeepSeek Harness EAC 再重新打开**。
   注意：**首次安装（新增插件行）时 Ctrl+R 刷新是不够的** —— 宿主在启动时读取插件行并把
   bundle 读进内存后以 immutable 提供；只有「行已存在、只改了 lib/*.js」时才由
   dsh-client-hmr 自动热重载、无需重启。
6. 让用户看屏幕右下角：应短暂出现「AIR·夏日青空 主题已生效 ✓ v0.2.6」徽章（约 8 秒）。

【验证清单（让用户口述即可，不需要截图理解）】
- 左上角是不是**金色 `deepseek`** 字样，右边紧跟一个**深蓝小胶囊里的白色 `HARNESS`**？（两个都要在）
- 新会话界面：小鲸鱼图标旁边有没有标题「将未完的夏天，寄往天空的尽头」，两者是否在**同一水平线**上？
- 在有消息的会话里滚到最底部继续往下滚、以及往上滚回看历史，**输入框是不是全程固定在底部不动**？
- 新会话界面：输入框是不是在**竖直中间略偏下**（而不是被压在窗口最底部）？小鲸鱼 / 文字 / 预览版是否仍居中对齐？
- 鼠标移到模型输出框底下的小按钮（复制 / 分享）上，黑色提示框是否**完整可见**、没被输入框挡住或切掉？
- **完全退出再打开（冷启动）后**再进新会话界面：小鲸鱼 / 文字横幅 / 预览版贴标是不是仍然同一条水平线？
  （v0.2.4 专门修的这条**必须真的重启一次**才看得出来：旧版是「热重载就正常、冷启动必错位」）
- **冷启动后切到深色模式**：背景图还在吗（能看到观铃那张夏日青空图）？还是整窗一片纯黑？
  （v0.2.5 专门修的这条同样**必须冷启动后看**：旧版是「热重载后有、冷启动没有」）
- 背景是不是观铃夏日青空图（浅色与深色都要）？右下角有没有出现 ✓ v0.2.6 徽章？
- 打开技能/模型等折叠菜单，有没有被「DSHapp / Router Standard」两个小按钮挡住？

【红线（改代码时）】
- 禁止用 PowerShell 文本命令写 `lib/client.js`（UTF-8 会损坏）。
- 改完必须跑 `npm run check:release`（59 项）。**注意：v0.2.6 起没有 install.mjs 了** ——
  装进 profile 的副本由 `dsh plugin add` 从来源同步，改了文件就按同一来源重装一次（幂等）。
- **禁止硬编码 CSS Modules 哈希前缀**（`pXSMma_*` / `wSkVaW_*` 这类）；改用免前缀锚
  `[class*=key]` 或运行时令牌 `__AIRMOD(<模块文件名>|<key>)__`，改完跑 `check-anchors.mjs`。
- **令牌只能进 CSS，不能进 JS**：写进 `querySelector` / `closest` 会抛 SyntaxError 并
  **中断整个 `apply()`**（v0.2.0 就是这么崩的）。JS 里用 `sidebarSelector()`，
  每个装饰步骤用 `safe(fn, label)` 包住。
- **资产只能走包内 chunk**：文件 `lib/client.<名>.js` 与内部注册 id `<包名>/client.<名>.js`
  必须成对，且只经 `require.async("./client.<名>.js")` 拉取。**不要**在宿主半侧加路由或 `node:fs`
  —— 那会让 DSH Store 的自动准入命中 files 权限信号而被拒。
- **输入框必须用 `position:fixed` 钉住，不要退回 `sticky`**（内核把 composer seat 放在滚动容器里
  且其下面还排着别的内容，sticky 会中途脱钩）。见 `pinComposerSeat()`。
- 不要改层级铁律：芯片行 `z-index:0!important`、hero 态 `composerSeat z-index:0`、`[data-conversation-composer-overlay] z-index:60`。

【失败处理】
- 命令报错：把报错原文发回给用户/我，不要自己乱改文件。
- 装完没生效：检查 profile 的启用配置是否含 `id: ui-skin-air` 这一行；确认已完全重启宿主
  （Ctrl+R 不够）；仍不生效就跑 `node tools/check-anchors.mjs` 看是否有锚点被内核漂移打死。
- 看到「左上角只有 deepseek 没有 HARNESS」或「滚轮滚动输入框跟着动」：说明装的是旧版
  （v0.1.1 / v0.2.0 / v0.2.1），请换成 v0.2.6。
- 看到「背景图没了 / 只有一片纯黑」：v0.2.6 起资源走包内 chunk，若贴图整体缺失，多半是 profile 里的
  包副本不完整（少了 `lib/client.*.js`）—— 按同一来源重装一次即可（幂等）。
- 看到「**热重载后正常、冷启动（完全退出再打开）就出问题**」：这是 v0.2.3 / v0.2.4 的已知坑
  （冷启动时 HeroShell 模块还没加载 → 令牌解析失败；或样式表顺序让内核规则胜出 →
  深色底盖住天空图），请换成 **v0.2.6**。
