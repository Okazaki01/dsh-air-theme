# 更新日志

本文件记录每个版本修复了什么。发给别人时，对方只需要看这一个文件就能知道
「这个版本到底修好了什么、还有没有已知问题」。

---

## v0.2.5 — 2026-09（当前版本）

**发布前自检：`node scripts/check-release.mjs` → 41/41 通过。**

### 修复 8：深色模式下天空图整个消失（只剩一片纯黑）

- **现象**：深色模式下背景图没了、整窗发黑；**浅色模式正常**。而且
  **冷启动（完全退出再打开）必现，只要热重载一次就恢复**。
- **成因（冷启动现场实测定位）**：皮肤靠 `--dsw-alias-bg-base:transparent` 让天空图"透出来"
  （内核用它画全屏底，实测是 `div.root` / `div.frame` 这类容器）。但这条**只写在浅色配色块里**：
  - 皮肤浅色块：`body[data-dsh-air]` → 权重 **(0,1,1)**
  - 内核深色底：`body[data-ds-dark-theme]` → 权重 **(0,1,1)** ← **同权重**
  同权重时由**样式表顺序**决胜：
  - **冷启动**：皮肤的 `<style>` 先插入，内核的深色样式表后插入 → **内核赢** →
    `--dsw-alias-bg-base` 变成不透明的 `#151517` → 全屏黑底 → 天空图被整个盖住
    （实测读数：`body … base=#151517`；三个采样点都扫出 `div.root` / `div.frame` 是不透明底）；
  - **热重载**：皮肤销毁旧 `<style>`、新建一个并追加到 `<head>` **末尾** → **皮肤赢** →
    `transparent` → 照片回来（实测读数：`base=transparent`）。
- **修复**：① 深色配色块**自己也声明** `--dsw-alias-bg-base:transparent!important`（权重升到 0-2-1，注定赢）；
  ② 浅色块那条也补上 `!important`。两处都在 → 冷启动 / 热重载结果一致。
- **自检**：`check-release.mjs` 新增 2 条断言（深色块必须自己声明 + 两处都要带 `!important`）→ 39/39 变 **41/41**。
- **文档**：README / INSTALL / INSTALL-MANUAL / INSTALL-AI / AGENTS 全部补上**推荐环境
  [DSH-Desktop-EAC](https://github.com/DSH-EAC/DSH-Desktop-EAC)**（DeepSeek Harness 的桌面端，
  EAC = *Embracing All Creation*「揽尽万象」；本皮肤的开发与测试环境）。其它桌面端与纯网页版照旧支持，
  安装脚本仍然不假定环境。

### 排错记录（留给下一位维护者 · 之二）

「**冷启动必坏、热重载就好**」这个指纹，这次已经是**第二种**成因：
- 成因 A（修复 7）：`apply()` 只跑一次 + 重试预算实际只有 ~0.7 秒（注释写 10s）→ 令牌解析不了；
- 成因 B（修复 8）：**样式表顺序变了** —— 热重载会重建 `<style>` 并追加到 `<head>` 末尾，
  冷启动时它却在前面；同权重规则**谁后插谁赢**。

推论：**皮肤里任何与内核"同权重"的变量或规则，都必须加 `!important` 或提高权重**，
否则冷启动与热重载的结果会不一样。查这类问题，先对比「冷启动 vs 热重载」两份实测读数
（例如 `getComputedStyle(body).getPropertyValue('--dsw-alias-bg-base')`），**不要靠肉眼猜**。

---

## v0.2.4 — 2026-09

**发布前自检：`node scripts/check-release.mjs` → 39/39 通过。**

### 修复 7：冷启动后新会话界面的「小鲸鱼 / 横幅 / 预览版」错位

- **现象**：**完全退出桌面端再打开**（冷启动）后进新会话界面，标题行整体位置不对 ——
  小鲸鱼、文字横幅、预览版贴标看起来「错位」；而**只要热重载一次（改一下 `lib/client.js`）就正常了**。
  浅色 / 深色都会出现，只跟「是不是冷启动」有关。
- **成因（代码级定位）**：皮肤为了抗内核类名哈希漂移，用运行时令牌
  `__AIRMOD(<模块文件名>|<key>)__` 从内核自己的 `<style data-plugin-css>` 里解析真实类名；
  解析不到的会退化成 `:not(*)` —— **匹配不到任何元素，整条规则静默失效**。
  - 冷启动时宿主恢复的是**有消息的会话**，`HeroShell.module.css`（只有新会话界面才加载的模块）
    **还没进 DOM**；
  - `injectCss()` 只解析一次，之后用 **`requestAnimationFrame` 重试 40 次** —— 注释写的是「~10s」，
    按 60fps 实际只有 **约 0.7 秒**，随即放弃；
  - 于是 `[data-phase=hero] __AIRMOD(HeroShell.module.css|headline)__{margin-top:-70px;margin-bottom:40px}`
    **永久失效** → hero 整行少了 70px 上移 → 就是看到的「错位」；
  - **热重载之所以能「治好」**：重新 `apply()` 的那一刻，如果正好停在新会话界面，
    模块已经在 DOM 里，令牌就解析成功了 —— 这也是它一直难复现的原因。
- **修复（两道保险）**：
  1. 同一条规则再写一份**免前缀锚**版本
     （`[class*=headline]:not([class*=headlineText]):not([class*=previewBadge])`，排除类名里同样含
     `headline` 的标题胶囊与预览版贴标）：令牌解析失败也有正确结果；解析成功时两条规则值相同、互不冲突。
  2. `injectCss()` 不再「一次性赌」：新增 `watchModules()` —— 用 `MutationObserver` 盯住 `<head>`，
     **内核的模块样式表一出现就立刻重新解析**，另有 30 秒慢轮询兜底；全部解析完成后自动停止
     （`stopWatching()`，拆除时也会断开，不留残留观察器）。
- **自检**：`check-release.mjs` 新增 2 条断言（免前缀兜底在位 + `watchModules()` 在位且拆除时断开）
  → 37/37 变成 **39/39**。以后谁把这套兜底删掉，自检会立刻 FAIL。

### 排错记录（留给下一位维护者）

「**热重载能治好、冷启动就复现**」是这类问题的指纹：它几乎总是
「`apply()` 只跑一次，而它依赖的 DOM 条件在冷启动那一刻还不成立」。
下次看到同类症状，先查 `resolveCssTokens()` / `modulesReady()` / 重试预算对不对，
**不要**先去调 CSS 数值 —— 那会白改很久。

---

## v0.2.3 — 2026-09

**发布前自检：`node scripts/check-release.mjs` → 37/37 通过。**

### 修复 5：新会话界面输入框位置不对（居中偏下）

- **现象**：空会话（hero）界面里，输入框被压在窗口最下面，而不是像设计稿那样**大致居中、略偏下**。
- **成因**：v0.2.2 为修复「滚轮滚动带走输入框」，把输入框改成了 `position:fixed` —— 但它
  **在所有界面都按"钉在底部"摆位**，而 hero 态内核原本是**垂直居中**的。
- **修复**：`pinComposerSeat()` 改为**按界面分态**：
  - hero 态 → 以「整个 seat（含上方标题行 + 卡片）」的垂直中线为准，落在滚动口中线**下方
    `HERO_CENTER_SHIFT`（默认 56px）** 处；
  - 活跃会话态 → 仍然钉底（保持 v0.2.2 的修复）。
  因为小鲸鱼图标、文字横幅、预览版贴标都在 seat 内部，**三者天然跟着一起走**，始终同一条水平线；
  同时把预览版贴标从 `align-self:flex-start`（原来吊在标题右上角）改成 `center`，整行读起来更对称。
  另外 hero 态不再给滚动容器补 `padding-bottom` —— 那是给消息流让位的，在空会话里会**凭空造出滚动条**。
  想微调高低：改 `lib/client.js` 里的 `var HERO_CENTER_SHIFT = 56;`（数值越大越靠下）。

### 修复 6：模型输出框底下小按钮的悬停提示被切掉

- **现象**：鼠标移到模型输出框底下的动作按钮（复制 / 分享…）上，弹出的黑色文字提示被输入框
  "挡住压住"。
- **成因（实测定位，两层）**：
  1. `dsh-viewport-lock` 插件会给消息视图 `XPOEOG_viewArea` 打一条 **inline** 的
     `clip-path: inset(0 0 Npx 0)`，用来裁掉"进入透明输入框范围"的消息像素
     —— 那是为**旧的 sticky 输入框**设计的；
  2. 而那个提示框是 `position:fixed`（`z-index:9999`）、且**渲染在消息行内部**；一旦落进那条
     被裁的带子里，就被**整块剪掉** —— 看起来正是"被输入框挡住"。
     探针证据：命中测试打不到提示框本身（`HIT=scrollBody`）、`viewArea` 的 computed
     `clip=inset(0px 0px Npx 0px)`、且**没有任何 CSS 规则匹配它**（说明是 JS 打的 inline）。
- **修复**：`body[data-dsh-air] [class*=viewArea]{clip-path:none!important}` ——
  作者 `!important` 能压过**非 important 的 inline 样式**。同时因为现在的输入框是 `position:fixed`
  且滚动容器补了 `padding-bottom`（最后一条消息主动停在输入框上方），**已经不再需要那条裁剪**。
  配套保留：输入框层级维持 `z-index:1`（不抢浮层层级），`[role=tooltip]` / radix popper 兜底抬到 9000。

> **排错思路记录（避免以后走弯路）**：这个问题的前两次尝试分别调了「输入框 z-index」和
> 「消息气泡 backdrop-filter」，**都无效**。真因不是层级高低，而是 `clip-path` 把元素**裁没了** ——
> `z-index:auto` 的定位元素与 `z-index:1` 不在同一层，1 永远压过 auto，**跟数值大小无关**。

---

## v0.2.2 — 2026-09

**发布前自检：`node scripts/check-release.mjs` → 31/31 通过。**
该脚本会逐条断言下面三类修复、抗内核漂移与环境无关性是否真的在这个包里；
不通过就不要发出去。

### 适配范围

本包**不限定 EAC**。皮肤是内核级插件（宿主半侧走 `ctx.webServer.register`，
浏览器半侧是标准 `dsh.client` bundle），在纯网页版、其它桌面端上同样工作。
生效只取决于三件事：**包装进了哪个 profile、那个 profile 有启用行、宿主重启过**。
各环境的安装/生效方式见 README 的「不是 EAC 也能用」一节；
不知道自己的环境跑 `node scripts/doctor.mjs` 即可。

### 修复 1：左上角 `deepseek` / `HARNESS` 标识消失

- **现象**：侧边栏顶部品牌行空白，或只剩金色 `deepseek`、右边的 `HARNESS` 胶囊变成一个方块。
- **两个独立成因**：
  1. **JS 里误用了 CSS 模板令牌**。v0.2.0 把 `[data-pane=sidebar],[class*=sidebarCol]`
     全文件替换成令牌 `__AIRSIDEBAR__`，连带 5 处 `querySelector` 一起被改。
     令牌只有 `resolveCssTokens()` 认识，写进 `querySelector` 会抛 `SyntaxError`，
     而且**把 `apply()` 从那一行往后整体中断** —— 品牌装饰、占位符、busy 状态、
     全局 MutationObserver、拆除 effect 全部没注册上。
  2. 内核 `logoRow` 里自带一块 `brandIdentity`（鱼标 + 本地构建版本名），
     和皮肤自绘的 wordmark 挤在同一行，而 `.brand` 自带 `overflow:hidden`，
     把自绘的 `HARNESS` 胶囊裁掉。**这一条在 v0.1.1 就存在**，只是被成因 1 掩盖了。
- **修复**：JS 增加 `sidebarSelector()`（返回真实选择器字符串）；
  `brandIdentity{display:none!important}` 让内核那块退场；`.brand` 解除裁切、改左对齐；
  每个装饰步骤用 `safe(fn, label)` 隔离 —— 单个选择器坏掉只降级一个装饰，
  **永远不允许中断 `apply()`**。

### 修复 2：新会话标题「将未完的夏天，寄往天空的尽头」不出现 / 小鲸鱼错位

- **现象**：新会话界面小鲸鱼图标旁边没有那句自定义标题；或者标题与小鲸鱼明显一个高一个低。
- **成因**：
  1. 标题文字由 `enforceHeadline()` 写入，而它依赖全局 MutationObserver 在 hero 渲染后重跑
     —— 观察器被修复 1 的异常中断，所以永远没跑。
  2. 内核已经用 `grid-template-columns:34px auto auto; align-items:center`
     把「小鲸鱼 | 标题胶囊 | 预览版」三者对齐；皮肤又给 `headlineText` 叠了
     `transform:translateY(55px)`，让标题相对小鲸鱼下坠 55px。
- **修复**：去掉多余的 `translateY`；`enforceHeadline` 用 `safe()` 隔离；
  整行上移只改 `[class*=headline]` 的 `margin-top`。
  **自检**：小鲸鱼与标题的 viewport top 误差 ≤ 1px。

### 修复 3：滚轮滚动时输入框跟着移动、到顶又弹回

- **现象**：在已有消息的会话里滚动滚轮，输入框会跟着上下移动；把它滚到最顶部时
  又"弹回"到最初位置。
- **成因（实测，不是推测）**：内核把 `composerSeat` 渲染成滚动容器
  `[data-conversation-scroll]` 的**最后一个孩子**，**但它下面还排着别的内容**
  （本机实测 1961px，来自工作区其它插件的面板/装饰溢出到同一个滚动容器）。
  `position:sticky; bottom:0` 只在元素的**自然位置**位于视口下方时才托住它；
  滚到接近底部时，尾部内容让输入框的自然位置提前进入视口 → **sticky 当场脱钩**，
  输入框开始跟着内容走；滚到底再"弹"到自然位置。
  ```
  实测 SEATTOP@0,50,90,100% = 993  993  993   89     ← 底部脱钩、弹回
  ```
  sticky 在这种结构下**无解**；负 `margin-bottom` 也无效（实测 `scrollHeight` 一点没变，
  因为尾部内容既不是它的兄弟、也不受它约束）。
- **修复**：不再依赖任何滚动容器的行为 —— 用 `position:fixed` + JS 同步几何
  把输入框**从滚动流里拿出来**（与侧边栏装饰同一套做法）：
  ```
  修复后 SEAT pos=fixed  PADBOTTOM=162px
        SEATTOP@0,50,99,100% = 993  993  993  993     ← 全程恒定
  ```
  配套：视口 resize 时重新同步几何；给滚动容器补 `padding-bottom`
  让最后一条消息仍能滚到输入框上方；拆除时复原内联样式。
  另外保留两层保险：`overscroll-behavior:contain` 切断滚动链、
  `body{overflow:clip!important}`（**必须 inline**，样式表里的同名规则会被内核更高
  优先级的 body 规则压掉）让页面本体不再是滚动容器。

### 修复 4：消息动作按钮的悬停提示被输入框挡住

- **现象**：模型输出框底下那排小按钮（复制 / 分享…），鼠标悬停弹出的黑色文字提示被输入框压住。
- **成因（两层叠加）**：
  1. 皮肤给消息气泡加了 `backdrop-filter: blur()`。按 CSS 规范它会 **① 创建 stacking context，
     ② 成为 `position:fixed` 后代的包含块**；而提示框正是
     `.<hash>_bubble_<n>{position:fixed; z-index:100}`，且渲染在**消息行内部** —— 于是它被关进
     气泡的 stacking context，`z-index:100` 只在气泡内部有效。
  2. 输入框被 `pinComposerSeat()` 改成 `position:fixed` 并带**正的** `z-index`，就整层压在
     "被关住的气泡"之上。实测把 8 降到 1 **无效** —— `z-index:auto` 的定位元素与 `z-index:1`
     不在同一层，1 永远压过 auto，与数值大小无关。
- **修复**：去掉消息气泡与工具行的 `backdrop-filter`（毛玻璃观感用加深的渐变补回），提示框自带的高层级
  即可正常生效；输入框层级降到 `1`（只打赢消息正文），并把 `[role=tooltip]` /
  `[data-radix-popper-content-wrapper]` 统一抬到 `9000` 兜底。
  `check-release.mjs` 增加 3 条断言防复发。

### 其它加固

- **不再假定用户在用 EAC（环境自适应）**。原来安装脚本把 profile 名硬编码成 `web-desktop`
  （EAC 的叫法），纯网页版 `dsh web` 通常用 `web`，别的桌面端/启动器又可能自定义 ——
  硬编码会把皮肤装进一个没人用的目录，表现为"装完了但完全没反应"。
  现在按可信度自动判定并在输出里写明依据：
  `--profile` 参数 → `DSH_DESKTOP_PROFILE` 环境变量 → **正在运行的 dsh 进程命令行**（最准）
  → profiles 下唯一的目录 → 常见名兜底；判不出来就列候选要求显式指定，**不瞎猜**。
  另外：指定了非桌面壳的 profile 时会**自动跳过桌面壳的 `assets/skins`**，
  避免机器上同时装了 EAC 和纯网页版时串台。
- **新增 `scripts/doctor.mjs`（环境体检 / 排障，只读）**。它会列出本机所有 profile、
  标出正在运行的是哪一个（含端口）、皮肤装没装、启用行开没开、客户端入口能不能解析，
  然后给出**你这个环境专属**的下一步命令。装完没生效时，第一步就跑它。
- **桌面壳专属的东西都有兜底**：唯一与桌面壳相关的是「标题栏配色」规则，写成
  `:is([class*=titlebar],#__dsh_desktop_chrome__,#__dsh_desktop_floatbar__)` ——
  其它环境匹配不到就整条不生效，不报错、不影响别的规则。其余锚点全是内核级契约。
- **抗内核漂移**：内核用 CSS Modules，应用侧类名是 `<hash>_<key>`，`<hash>` 每次重新构建
  都会变（0.1.0 = `wSkVaW_*`，0.1.2 = `XPOEOG_*` / `_7mhE3G_*`）。写死哈希的规则
  **不报错、不告警，只是一条都不生效** —— v0.1.1 的侧栏、标题胶囊、标题栏选项卡、
  输入框底部信息行就是这样整体失效的。现在统一走「免前缀锚 `[class*=key]`」或
  「运行时令牌 `__AIRMOD(<模块文件名>|<key>)__`」，样式规则里不再出现任何哈希。
  新增 `node scripts/check-anchors.mjs` 对着已装内核复核每个锚点的死活。
- **发布自检**：新增 `node scripts/check-release.mjs`，逐条断言上面三类修复与抗漂移/环境无关
  是否真的在这个包里（**31 项**），任何一项失败就不该发出去。
- **安装脚本**：v0.1.1 的 `scripts/install.mjs` 只认旧布局
  `<EAC>\resources\app\assets\skins`，在 EAC 4.x（`<EAC>\dsh-desktop\assets\skins`）
  上会直接跳过皮肤目录同步。现在两种布局都能自动探测，并且**直接借用壳自己的
  `lib/plugin-copy.js` 计算同步戳记**，写出的 stamp 与壳逐字节一致，
  避免每次冷启动全量重拷。`安装.bat`（无 Node 路径）同步修好。
- **皮肤预览图**：补上 `preview/light.png`、`dark.png`（原包缺失，导致「设置 → 皮肤」
  卡片显示碎图）；新增 `scripts/make-preview.ps1` 可重新生成。
- **热重载**：`injectCss()` 改为每次 `apply` 都重写 stylesheet —— 客户端插件热重载会
  dispose 后重跑 `apply`，沿用旧判断会继续用上一版 CSS。

### 已知非缺陷

- `[class*=Refresh]`、`[class*=runState]`、`[class*=stateDot]` 三个选择器在当前内核里
  没有对应类名，属于**遗留 no-op**：对应的小装饰（刷新键樱花化、运行状态点光晕）
  不生效，但没有任何副作用。`check-anchors.mjs` 会把这些列为 INFO 而不是失败。

---

## v0.2.1 — 2026-09

- 修复品牌行、hero 标题行、输入框固定三类问题（详见 v0.2.2 的逐条说明，v0.2.2 是它们的完整版）。
- 修正文档中「仅 web 端 Ctrl+R 刷新即可」的错误说法：
  **首次安装（新增插件行）必须完全重启 EAC** —— 宿主启动时读取 `cordis.patch.yml`，
  并把每行插件的客户端 bundle 一次性读进内存后以 `Cache-Control: immutable` 提供，
  浏览器刷新加载不了新插件行。只有「行已存在、只改了 `lib/client.js`」才由
  `dsh-client-hmr`（500ms 轮询 + SSE）自动热重载、无需重启。

## v0.2.0 — 2026-09

- 抗内核漂移：移除全部硬编码 CSS Modules 哈希前缀，改用免前缀锚 + 运行时令牌。
- 新增 `scripts/check-anchors.mjs`；安装脚本支持 EAC 4.x 目录布局。

## v0.1.1 — 初始发布

- 《AIR》夏日青空 主题皮肤首个版本：全屏观铃夏日青空背景、Q 版萌宠侧栏、
  羽毛飘落 / 云飘移氛围、魔法阵思考动画、输入框金色框饰与宝石。
- 该版本在较新内核上会整体失效（CSS Modules 哈希前缀漂移），请使用 v0.2.2。
