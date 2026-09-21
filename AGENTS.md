# AGENTS.md — AI 安装代理执行清单（30 秒速查）

本文件是给 AI 模型（安装代理 / 代码代理）的精简执行清单。完整说明见 **INSTALL.md**，
版本改动记录见 **CHANGELOG.md**。当前版本 **v0.2.5**。

## 拿到包先跑这一条

```bash
node scripts/check-release.mjs   # 41 项，必须全 OK；FAIL 就是坏包，别装也别转发
node scripts/doctor.mjs          # 环境体检：本机有哪些 profile、在跑哪个、皮肤装没装、下一步做什么
node scripts/check-anchors.mjs   # 对着已装内核判锚点死活，退出码 0
```

## 环境适配（重要：不要假定是 EAC）

用的人可能用**纯网页版**（自己跑 `dsh web`，浏览器打开）、**其它桌面端/启动器**、
或者 **EAC 但版本/目录/profile 名不同**。皮肤本身与启动器无关 —— 它只要求
「装进某个 profile + 该 profile 有启用行 + 宿主重启过」这三件事。

**profile 名不是固定的**（EAC 用 `web-desktop`，纯网页版通常是 `web`），所以
**不要硬编码**。安装脚本会按可信度自动判定并在输出里写明依据：
`--profile` 参数 → `DSH_DESKTOP_PROFILE` 环境变量 → **正在运行的 dsh 进程命令行** →
profiles 下唯一的目录 → 常见名兜底；判不出来就列候选并要求显式指定。

| 环境 | 安装 | 生效 |
| --- | --- | --- |
| EAC 桌面端 | `node scripts/install.mjs` / 双击 `安装.bat` | 完全退出（含托盘）再打开 |
| 纯网页版 `dsh web` | `node scripts/install.mjs --profile web` | 结束并重跑 `dsh web`，再刷新页面 |
| 其它桌面端 | `node scripts/install.mjs --profile <名>` | 重启该客户端 |
| 桌面端目录不认识 | 追加 `--eac-root "D:\目录"` | 重启该客户端 |
| 只装 profile | 追加 `--no-eac` | 重启宿主 |

- 指定了非桌面壳的 profile 时，脚本会**自动跳过桌面壳的 `assets/skins`**，防止串台。
- 桌面壳专属的只有「标题栏配色」一条规则，写成 `:is([class*=titlebar],#__dsh_desktop_chrome__,…)`，
  匹配不到就整条不生效、不报错；其余锚点都是内核级契约。别把这条改成无兜底的硬绑定。
- **装完没生效，第一步永远是 `node scripts/doctor.mjs`**，它会指出卡在哪一步
  （没装 / 没启用行 / 被禁用 / 入口坏了 / 只是没重启）。

## 小白场景（对方不会装、你没有视觉 API）— 也完全可行

- **安装不依赖任何外部 API / 视觉模型**：只是复制文件 + 写一行启用配置。
- 让用户双击包内 **`安装.bat`**（Windows 自带 PowerShell，无需 Node），按窗口提示重启即可；
  **确认生效靠"看屏幕"**。
- 你（AI）的验证 = 安装脚本输出全绿 + 用户口述下面几条（v0.2.3 / v0.2.4 / v0.2.5 专门修的那几处）
  + 背景/右下角提示。**全程不需要截图理解能力。**

## 安装（有 Node 时照抄执行）

```bash
# 0) 前置：包根目录、node ≥ 18
npm run check

# 1) 一键安装（幂等；profile 自动判定，输出里会写明依据）
node scripts/install.mjs

# 纯网页版 / 其它桌面端：显式指定 profile
node scripts/install.mjs --profile web
# 桌面端目录不认识时：
node scripts/install.mjs --eac-root "D:\某桌面端目录"

# 小白电脑无 Node: 让用户双击 安装.bat（等价，PowerShell 实现）
```

## 生效（不是「Ctrl+R」，也不是「只有 EAC 才行」）

- **首次安装 / 新增皮肤行：必须让宿主进程重启一次。** 宿主启动时读取 `cordis.patch.yml`，
  并把每行插件的客户端 bundle 一次性读进内存后以 immutable 提供 —— 浏览器 Ctrl+R
  **加载不了新行**。
  - 桌面端（EAC 等）：完全退出（含托盘）再打开；
  - 纯网页版：结束进程并重新执行 `dsh web`，再刷新浏览器页面。
- **行已存在、只改了 `lib/client.js`：不用重启。** `dsh-client-hmr` 每 500ms 轮询 bundle，
  内容变了就经 SSE 推给浏览器热重载（这就是日常二次开发的迭代方式）。
- 无需强制去设置点皮肤：patch 行默认启用，重启即生效；**没生效才**引导 设置 → 皮肤 →「AIR·夏日青空」。

## 验证（无视觉 API 版本）

- 安装脚本 4 步全绿无报错
- `node scripts/check-release.mjs` 41/41；`node scripts/check-anchors.mjs` 退出码 0
- 用户口述 ①：背景是观铃夏日青空图（**深色模式下也要在**）+ 右下角出现「AIR·夏日青空 主题已生效 ✓ v0.2.5」
- 用户口述 ②：**左上角有金色 `deepseek`，右边紧跟深蓝胶囊里的白色 `HARNESS`**（两个都要在）
- 用户口述 ③：新会话界面小鲸鱼旁有「将未完的夏天，寄往天空的尽头」，**两者在同一水平线上**
- 用户口述 ④：有消息的会话里**滚到最底部继续滚、再往上滚回看历史，输入框全程不动**
- 用户口述 ⑤：**新会话界面输入框在窗口中间偏下**（不是贴底），小鲸鱼/文案/预览版仍在同一条水平线上
- 用户口述 ⑥：鼠标移到模型输出框底下的小按钮（复制/分享）上，**黑色悬停提示完整可见**，没有被输入框挡住或切掉
- 用户操作口述：打开技能/模型折叠菜单，内容完整可见，未被 DSHapp / Router Standard 两个小按钮盖住
- 用户口述 ⑦（v0.2.4）：**完全退出再打开**（冷启动）后进新会话界面，小鲸鱼/文字横幅/预览版贴标
  **仍然同一条水平线、位置正确** —— 旧版只有「热重载后正常」的假象，冷启动必错位
- 用户口述 ⑧（v0.2.5）：**深色模式下背景图也在**（能看到观铃那张夏日青空图），不是一片纯黑；
  浅色模式下同样在 —— 这条同样**必须冷启动后看**（旧版是「热重载后有、冷启动没有」）
- 有视觉 API 时可选增强：截图核对 README 特性表（不是安装前提）

## 红线（改代码时）

1. **禁止 PowerShell 写 `lib/client.js`**（UTF-8 损坏）；改后 `node --check`。
2. 改任何文件后必须重跑 `node scripts/install.mjs`（保持 src / EAC assets / profile 三处一致）。
3. 不恢复旧 bug：卡片内无大金角饰；`heroWorkspaceRow` 保持 `z-index:0!important`；
   `dockChips()` 保持卡片外定位（`top = card.top - stack.top - 42`）；
   `composerSeat` hero 态 `z-index:0`；`[data-conversation-composer-overlay]{z-index:60}`。
4. 全部 CSS 作用域 `body[data-dsh-air]`；贡献走 `ctx.effect()`；装饰须 `pointer-events:none`
   （含右下角激活提示 `data-air-chrome=ready-badge`，绝不能拦截点击）。
5. 资产走 `/air-assets` 路由，勿改前缀与防穿越校验。
6. **绝不硬编码 CSS Modules 哈希前缀**。应用侧类名是 `<hash>_<key>`，`<hash>` 随内核构建漂移
   （0.1.0 = `wSkVaW_*`，0.1.2 = `XPOEOG_*` / `_7mhE3G_*`）。写死哈希 → 规则静默全失效
   （v0.1.1 的侧栏、标题胶囊、选项卡、输入框底部信息行就是这样挂掉的）。改用：
   - 免前缀锚 `[class*=key]`（key 在作用域内唯一时）；
   - 或令牌 `__AIRMOD(<模块文件名>|<key>)__` / `__AIRMOD(<模块文件名>|<key>|<兜底>)__`，
     由 `resolveCssTokens()` 从 `<style data-plugin-css="…/Xxx.module.css">` 运行时解析。
   - 壳标题栏是 id `#__dsh_desktop_chrome__`（不是 class）；占位符是 `[data-composer-placeholder]`
     （不是 `textarea::placeholder`）。
   - 改完必须 `node scripts/check-anchors.mjs` 通过（退出码 0）。
7. **令牌只能进 CSS，不能进 JS。** `__AIRMOD()__` / `__AIRSIDEBAR__` / `__AIRTITLEBAR__`
   由 `resolveCssTokens()` 替换；写进 `querySelector` / `querySelectorAll` / `closest` 会抛
   `SyntaxError` 并**中断整个 `apply()`**（observer / 占位符 / busy / 拆除 effect 全丢）。
   JS 里一律用 `sidebarSelector()`；每个装饰步骤用 `safe(fn, label)` 包住。
8. **品牌行**：`[class*=logoRow] [class*=brandIdentity]{display:none!important}` 让内核自带
   identity 退场，否则 `.brand{overflow:hidden}` 会把自绘的 HARNESS 胶囊裁成方块。
9. **输入框用 `position:fixed` 钉住，不要退回 `sticky`。** 内核把它放在
   `[data-conversation-scroll]` 里，**而且它下面还排着别的内容**（实测 1961px），
   所以 `sticky;bottom:0` 会在滚到底之前脱钩 → 滚轮一滚输入框上移、到顶弹回
   （实测 `SEATTOP@0,50,90,100% = 993 993 993 89`）。必须用 `pinComposerSeat()`
   （fixed + JS 同步 left/width/bottom + 给滚动容器补 padding-bottom），
   视口 resize 重新同步、拆除时 `unpinComposerSeat()`。样式表里的 sticky 只是兜底。
10. **hero 标题不要用 `translateY`**：内核 grid 已对齐 小鲸鱼|标题|预览版；整行上移请只调
    `[class*=headline]` 的 `margin-top`。
11. **两道滚动保险别删**：`[data-conversation-scroll]{overscroll-behavior:contain}` 切断滚动链；
    `body.style.setProperty("overflow","clip","important")`（**必须 inline**，样式表会被内核规则压掉）。
12. **悬停提示被「挡/裁」—— v0.2.3 实测定位，别再走弯路**
    - **绝不删除 `[class*=viewArea]{clip-path:none!important}` 这条规则。**
      `dsh-viewport-lock` 会给消息视图 `XPOEOG_viewArea` 打一条 **inline**
      `clip-path:inset(0 0 Npx 0)`（它是为**旧的 sticky 输入框**裁掉「进入输入框范围」的消息像素）。
      而消息动作按钮的悬停提示是 `position:fixed`、**渲染在消息行内部** —— 落进那条被裁的带子里
      就**被整块剪掉**，看起来正是「黑框被输入框挡住」。作者 `!important` 能压过非 important 的
      inline 样式，所以这一条足以解除。现在输入框是 fixed + 滚动容器有 padding-bottom，不再需要该裁剪。
    - **别再用「调 z-index」的思路修这类问题。** `z-index:auto` 的定位元素与 `z-index:1`
      不在同一层 —— 1 永远压过 auto，**跟数值大小无关**。输入框保持 `z-index:1` 即可；
      `[role=tooltip]` / radix popper 兜底抬到 9000。
    - 顺带：消息气泡也别加 `backdrop-filter` / `filter`（同类陷阱：创建 stacking context 并成为
      `position:fixed` 后代的包含块）。毛玻璃观感用加深的渐变表达。
13. **hero（空会话）输入框位置不要改回"钉底"**：`pinComposerSeat()` 按界面分态 —— hero 用
    「整体中线 + `HERO_CENTER_SHIFT`（默认 56px，越大越靠下）」，活跃会话才钉底。
    hero 态**不要**给滚动容器补 `padding-bottom`（空会话里会凭空造出滚动条）。
    小鲸鱼 / 文字横幅 / 预览版都在 seat 内部，天然同步；预览版贴标保持 `align-self:center` 以维持对称。
14. **令牌解析必须容忍"模块迟到"（v0.2.4 修的坑，别再踩）**
    - **症状指纹：热重载就正常、冷启动必坏。** 见到这个组合，先怀疑「`apply()` 只跑一次，
      而它依赖的 DOM 条件在冷启动那一刻还不成立」，**不要去调 CSS 数值** —— 会白改很久。
    - 具体坑：`HeroShell.module.css` 只有**新会话界面**才会加载。冷启动时宿主恢复的是
      **有消息的会话**，它不在 DOM 里 → `__AIRMOD(HeroShell.module.css|headline)` 退化成
      `:not(*)` → hero 行 `-70px` 上移整条失效（看起来就是「小鲸鱼/横幅/预览版错位」）。
      旧代码解析一次后只用 `requestAnimationFrame` 重试 40 次（注释写 ~10s，按 60fps 实际约 **0.7 秒**）就放弃。
    - 现在有两道保险，**都不许删**：
      ① `[data-phase=hero] [class*=headline]:not([class*=headlineText]):not([class*=previewBadge])`
         的**免前缀锚**版本（值必须与令牌版一致；`headlineText`/`previewBadge` 的类名里也含 `headline`，必须排除）；
      ② `watchModules()` —— MutationObserver 盯 `<head>`，内核模块样式表一出现就重新解析，
         外加 30 秒慢轮询兜底，全部就绪后 `stopWatching()`（拆除时也要断开，不留残留观察器）。
    - **任何新增的两段式令牌**（`__AIRMOD(file|key)`，没有第三段兜底）都会重演这个坑：
      要么补上第三段兜底，要么确认它依赖的模块在冷启动时**一定**已在 DOM 里。
    - 改完必须 `npm run check:release`（有 2 条断言专门守这个坑）。
15. **与内核"同权重"的变量/规则必须加 `!important` 或提权重（v0.2.5 修的坑）**
    - **同一个指纹的第二种成因**：热重载会**销毁旧 `<style>`、新建一个并追加到 `<head>` 末尾**，
      而冷启动时皮肤表在前面 —— 于是**同权重的规则「谁后插谁赢」**，两者结果不一样。
    - 实例：`--dsw-alias-bg-base`（内核用它画全屏底，实测是 `div.root` / `div.frame`）。皮肤想让它透明
      好让天空图透出来，但这条原来**只写在浅色块** `body[data-dsh-air]`（0-1-1），
      而内核深色是 `body[data-ds-dark-theme]`（**同样 0-1-1**）→ 冷启动内核赢 →
      不透明 `#151517` 铺满全屏 → **深色模式下天空图整个消失**（热重载又正常）。
    - 修法：**深色配色块自己也声明一次**（权重升到 0-2-1，注定赢）+ **两处都加 `!important`**。
    - 排查动作：对比「冷启动 vs 热重载」两份
      `getComputedStyle(document.body).getPropertyValue('--dsw-alias-bg-base')`，**别靠肉眼**。
    - 推论：以后凡是在皮肤里改 `--dsw-*` 变量、或写与内核同选择器结构的规则，**默认加 `!important`**。

## 交付前自查（打包发出前逐条打勾）

- [ ] `npm run check` —— 全部 JS `node --check` 通过
- [ ] `npm run check:release` —— **41/41 全 OK**（七类历史故障的修复都在）
- [ ] `npm run check:anchors` —— 退出码 0（锚点对着已装内核全活）
- [ ] `grep -n "__AIRSIDEBAR__\|__AIRMOD(" lib/client.js` 的结果**全部落在 CSS 数组内或注释里**
- [ ] `node scripts/install.mjs` 执行成功（三处副本 hash 一致、stamp 借壳计算）
- [ ] **不假定 EAC**：README / INSTALL.md / INSTALL-MANUAL.md / INSTALL-AI.md 里都写清
      纯网页版与其它桌面端怎么装、怎么生效；`--profile` 未被硬编码成 `web-desktop`
- [ ] `package.json` 与 `lib/client.js` 的 `SKIN_VERSION` 版本号一致
- [ ] CHANGELOG.md 已记录本次改动
- [ ] 用户侧确认七条：右下角 ✓ 提示 + 青空背景（**深色模式也要有**）+ 左上角 deepseek/HARNESS 都在
      + 新会话标题与小鲸鱼齐平 + 滚轮滚动时输入框不动
      + 新会话输入框居中偏下（不贴底）+ 小按钮悬停提示完整可见
      + **冷启动（完全退出再打开）后新会话三件套位置仍正确**（v0.2.4）
