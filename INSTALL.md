# INSTALL.md — 《AIR》夏日青空 主题皮肤 · AI 安装引导

> 本文件是**给 AI 模型（安装代理）看**的懒人式安装说明。用户把本插件包交给你，
> 你按下面步骤完成安装并验证生效即可。全部命令可直接复制执行。

---

## 0.5 选哪种方式（二选一，绝不叠加）

| 方式 | 谁动手 | 适合谁 | 没有 Node.js 能装吗 |
| --- | --- | --- | --- |
| **推荐：交给 AI** | AI 代装 | 任何人（尤其小白） | 能——AI 会自己探测，没 Node 就自动引导用户双击 `安装.bat` |
| 备用：自己双击 `安装.bat` | 人自己 | 熟手 / 不想聊 AI | 能——`安装.bat` 用的就是 Windows 自带 PowerShell |

**关键：两种是二选一，做其中一种就完成安装，不要两个都做。**

- 选了「交给 AI」：把包放进工作区 → 告诉 AI "请安装 `dsh-air-theme`，先读 `AGENTS.md`/`INSTALL.md`"。
  AI 会自己查 Node：有→跑 `node scripts/install.mjs`；没有→引导用户双击 `安装.bat`。
  **用户全程不用手动碰 `.bat`**（那只在 AI 判定电脑没 Node 时才轮到点）。
- 选了「自己装」：直接双击 `安装.bat` 装完即止，之后不需再给任何 AI 发指令。

**文档导航**：下面 §0 是什么 → §1 前置检查 → §1.5 小白双击路径 → §2 AI 脚本路径
→ §5 验证清单（无视觉 API 版）→ §6 注意事项红线 → §7 故障排查。
版本改动记录见 **CHANGELOG.md**；AI 代理的 30 秒速查见 **AGENTS.md**。

一个完整的 dsh 插件（bundle 形态），为 DeepSeek Harness Web GUI 提供「AIR·夏日青空」
动漫主题皮肤。插件 = 宿主半侧（`lib/index.js`，静态资源路由）+ 浏览器半侧
（`lib/client.js`，全部美化逻辑）+ 内置美化包（`assets/` 背景/萌宠/金饰素材）。

- 包名：`@dsh-external/dsh-client-ui-skin-air`
- 皮肤行 id：`ui-skin-air`
- 皮肤激活标志：`body[data-dsh-air]`
- 皮肤清单：`skin.json`（皮肤选择器据此发现/预览）
- 当前版本：**v0.2.5**
- **推荐环境：[DSH-Desktop-EAC](https://github.com/DSH-EAC/DSH-Desktop-EAC)**
  —— DeepSeek Harness 的桌面端（EAC = *Embracing All Creation*「揽尽万象」，自带 Node.js 运行时、
  一键启动）。**本皮肤就是在它上面开发与测试的**，下文也以它为例；
  纯网页版 `dsh web` 与其它桌面端**同样支持**（安装脚本会自动判定环境与 profile）。

### 拿到包先跑这一条（不用装、不用看图，几秒）

```bash
node scripts/check-release.mjs
```

它会逐条断言**三类历史故障的修复是否真的在这个包里**（品牌行 deepseek/HARNESS、
新会话标题与小鲸鱼对齐、输入框不随滚轮移动、冷启动不错位、深色模式不吞背景），外加抗内核漂移与语法检查，共 41 项。
看到 `结论: 三类历史故障的修复全部在位 ✓ 可以打包` 才继续安装；
任何一项 FAIL 说明这个包是坏的，不要装、也不要发给别人。

## 1. 前置检查（先确认，缺一不可）

| 检查项 | 命令 | 通过条件 |
| --- | --- | --- |
| Node.js 可用 | `node -v` | ≥ 18（**仅 AI 脚本路径需要**；小白双击路径不需要 Node） |
| 包目录完整 | `dir`（包根） | 含 `package.json`、`lib/`、`assets/`、`scripts/install.mjs`、`INSTALL.md` |
| 语法健康 | `node --check lib/index.js` 与 `node --check lib/client.js` | 均输出无报错 |

> 若 `lib/client.js` 语法检查失败：**不要用 PowerShell 的 Get-Content/Set-Content 修文件**
> （会破坏 UTF-8）。用支持 UTF-8 的编辑工具修改，改完重新 `node --check`。

## 1.5 小白路径（0 门槛，推荐给完全不懂电脑/API 的用户）

**不需要 Node.js、不需要任何 API key、不需要命令行知识**：

1. 找到包里的 **`安装.bat`**（或 `scripts\install.ps1`），**双击**它；
2. 窗口里会显示"安装完成！接下来 3 步"，按提示做：
   - 完全退出 EAC 再打开（或直接 Ctrl+R 刷新页面）；
   - **看屏幕右下角**是否短暂出现 **「AIR·夏日青空 主题已生效 ✓」** 提示；
   - 背景变成夏日青空 = 成功。没出现才需要去 设置 → 皮肤 手动点启用。
3. 关闭窗口即可。

> 说明：安装过程**完全不依赖外部 API 或视觉模型**——它只是把皮肤文件复制到
> EAC 和 profile 目录并写入一行启用配置。**"确认生效"也只需看屏幕**（右下角 ✓ 提示 +
> 背景变化），不需要任何人会看图、读图、接 API。

## 2. 安装（AI 脚本路径，一步脚本，幂等）

在**包根目录**执行：

```bash
node scripts/install.mjs
```

脚本自动完成：

1. **同步整树到桌面壳皮肤目录**（仅当探测到桌面壳，且目标 profile 就是它管理的那个）
   —— EAC 4.x 是 `<安装目录>\dsh-desktop\assets\skins\air`，旧布局是
   `<安装目录>\resources\app\assets\skins\air`，两种都会自动识别；
2. 同步整树到目标 profile 插件目录
   `<DSH home>\profiles\<profile>\node_modules\@dsh-external\dsh-client-ui-skin-air`；
3. 写入 `.eac-copy-stamp.json`（桌面壳的同步标记，借壳自己的算法算，保证逐字节一致）；
4. 确保 profile 的 `cordis.patch.yml` 存在 `ui-skin-air` 启用行（幂等追加）。

**目标 profile 是自动判定的**，输出里会写明依据：

```
目标 profile : web-desktop   ← 正在运行的 dsh 进程命令行（--profile）
环境判定     : EAC 桌面端（会把整树同步到壳的 assets/skins）
```

判定顺序：`--profile` 参数 → `DSH_DESKTOP_PROFILE` 环境变量（桌面壳注入）→
**正在运行的 dsh 进程命令行**（最准）→ profiles 目录下唯一的一个 → 常见名兜底
（`web-desktop` / `web` / `default`）。都判不出来时会列出候选并要求显式指定，**不瞎猜**。

其他参数：

```bash
node scripts/install.mjs --profile web           # 指定 profile（纯网页版通常叫 web）
node scripts/install.mjs --eac-root "D:\某桌面端" # 桌面端目录没探测到 / 布局不认识时
node scripts/install.mjs --no-eac                 # 只装 profile，绝不碰桌面壳目录
node scripts/install.mjs --dry-run                # 只预览不写盘
node scripts/install.mjs --skip-patch             # 不动 cordis.patch.yml
```

> ⚠️ **指定了非桌面壳 profile 时，脚本会自动跳过桌面壳的 `assets/skins`。**
> 例如机器上同时装了 EAC 和纯网页版，你只想装给网页版 —— 若还去写壳的皮肤目录，
> 壳下次冷启动会把皮肤推进它自己的 profile，造成串台。

### 2.1 不是 EAC 的环境（纯网页版 / 其它桌面端）

**皮肤本身与启动器无关**：宿主半侧走 `ctx.webServer.register`，浏览器半侧是标准的
`dsh.client` bundle，任何 DSH web 界面都能加载。EAC 只是其中一种启动器。
生效只取决于三件事：**包装进了哪个 profile、那个 profile 有启用行、宿主重启过**。

| 环境 | 安装 | 生效 |
| --- | --- | --- |
| EAC 桌面端（本包默认适配） | `node scripts/install.mjs` / 双击 `安装.bat` | 完全退出 EAC（含托盘）再打开 |
| 纯网页版（自己跑 `dsh web`） | `node scripts/install.mjs --profile web` | 结束并重新执行 `dsh web`，再刷新浏览器页面 |
| 其它桌面端 / 启动器 | `node scripts/install.mjs --profile <名>` | 重启该客户端 |
| 桌面端但目录不认识 | 追加 `--eac-root "D:\你的目录"` | 重启该客户端 |

**不确定该跑哪条？先体检**（只读，不改任何文件）：

```bash
node scripts/doctor.mjs
```

它会列出本机所有 profile、标出正在运行的是哪一个（含端口）、皮肤装没装、启用行开没开，
然后给出你这个环境专属的下一步命令。

**桌面壳专属的东西在别处会不会报错？不会。** 唯一与桌面壳相关的是「标题栏配色」那条规则，
它写成 `:is([class*=titlebar],#__dsh_desktop_chrome__,#__dsh_desktop_floatbar__)` —— 匹配不到
就整条不生效，不报错、不影响其它规则。其余锚点（侧栏、输入框、消息区、滚动容器）全是
**内核级契约**，任何 DSH web 界面都有。而且每个装饰步骤都被 `safe(fn, label)` 包住，
单个选择器失效只会少一个装饰，不会拖垮整个皮肤。

## 3. 生效（两种路径，按需选择）

- **首次安装 / 新增皮肤行**：**必须让宿主进程重启一次** —— `cordis.patch.yml` 由宿主在
  启动时读取，且 `dsh-client-modules` 会在启动时把每行插件的客户端 bundle 一次性读进内存
  （`initialBundleSnapshot`），并以 `Cache-Control: immutable` 对外提供。因此浏览器刷新
  （Ctrl+R）**不会**加载一条**新的**插件行。
  - 桌面端（EAC 等）：**完全退出客户端（含托盘）再打开**；
  - 纯网页版（自己跑 `dsh web`）：**结束该进程并重新执行 `dsh web`**，然后刷新浏览器页面。
- **行已存在、只改了 `lib/client.js`（二次开发日常）**：**不需要重启**。
  `dsh-client-hmr` 每 500ms 轮询 bundle 的 mtime/size，内容变化即重算 rev 并经 SSE 推给浏览器，
  页面会自动热重载该插件（本包 `injectCss()` 因此每次 `apply` 都重写 stylesheet ——
  否则热重载会继续沿用上一版 CSS）。桌面端与网页端同进程，两者都适用。
- 想强制走一遍冷路径验证：按上面「桌面端 / 纯网页版」对应的方式重启一次即可。

## 4. 启用与互斥

- 打开 **设置 → 皮肤**，点击「AIR·夏日青空」。
- 多皮肤互斥由 dsh-skin-switch 管理：`cordis.patch.yml` 中其它皮肤行
  （`ui-skin-*`）必须是 `disabled: true`，`ui-skin-air` 保持启用（无 `disabled` 或
  `disabled: false`）。

## 5. 验证清单（小白看屏幕；AI 按"命令输出 + 用户反馈"）

**先跑包自检**（不需要装、不需要看图，几秒出结果）：

```bash
node scripts/doctor.mjs          # 环境体检：本机有哪些 profile、在跑哪个、皮肤装没装、下一步做什么
node scripts/check-release.mjs   # 三类历史故障的修复是否都在本包里（41 项，必须全 OK）
node scripts/check-anchors.mjs   # 包里的选择器锚点对着**已装内核**逐个判死活（退出码 0 = 全活）
```

**装完没生效时，第一步永远是 `node scripts/doctor.mjs`**：它会指出卡在
「没装 / 没启用行 / 启用行被禁用 / 客户端入口坏了 / 只是没重启」中的哪一步。

**给小白**：重启后看屏幕即可——右下角出现「AIR·夏日青空 主题已生效 ✓ v0.2.5」提示、
背景变为夏日青空、输入框四角有金色弧饰 = 成功。不需要会看代码或接 API。

**给 AI（无视觉 API 时，逐项按"命令输出/用户口述"核对）**：

| # | 验证点 | 通过标准（无需看图） |
| --- | --- | --- |
| 0 | 安装脚本输出 | 4 步全绿（同步/写入/stamp/patch），无报错 |
| 1 | 皮肤激活 | 页面右下角出现「AIR·夏日青空 主题已生效 ✓ v0.2.5」；或 F12 → Console 有 `[dsh-air] 主题已激活 ✓` |
| 2 | 背景（浅色 **与深色**） | 用户口述：背景是动漫少女拥抱天空的夏日青空图；**切到深色模式后背景图仍然在**（旧版 v0.2.5 之前会有「深色变全黑」） |
| 3 | **品牌行（v0.2.3 修复 1）** | 用户口述：左上角有**金色 `deepseek`** 字样，右边紧跟一个**深蓝小胶囊里的白色 `HARNESS`** —— 两个都要在 |
| 4 | **hero 标题行（v0.2.3 修复 2）** | 新会话界面：小鲸鱼图标旁有标题「将未完的夏天，寄往天空的尽头」，**两者在同一水平线上**（不是一高一低），标题外面有浅色圆角胶囊底 |
| 5 | **输入框不随滚动（v0.2.3 修复 3）** | 有消息的会话里滚到最底部再继续往下滚、以及往上滚回看历史：**输入框全程固定在底部不动**，不会再出现"上移然后弹回" |
| 6 | **输入框金框** | 用户口述：输入框四角有金色弧线、上边框中央有金色宝石 |
| 7 | **hero 输入框位置（v0.2.3 修复 5）** | 新会话界面：输入框大致在**竖直中间、略偏下**（不是被压在窗口最底部）；小鲸鱼 / 文字横幅 / 预览版在同一水平线、整体居中 |
| 8 | **悬停提示不被挡（v0.2.3 修复 6）** | 鼠标移到模型输出框底下的动作按钮（复制 / 分享…）上，弹出的黑色提示框**完整可见**，不被输入框切掉 |
| 9 | 芯片行外置 | 用户口述：「DSHapp」「Router Standard」两个小按钮在输入框**上边外侧最左角**，没和标题叠在一起 |
| 10 | 折叠菜单层级 | 用户操作：打开技能选择器/模型选择菜单 → 口述菜单内容完整可见、没被两个小按钮盖住 |
| 11 | 标题栏配色 | 用户口述：标题金色、选项卡/统计行橙色 |
| 12 | 暗色主题 | 用户切深色模式 → 口述配色正常不糊 |
| 13 | **冷启动不错位（v0.2.4 修复 7）** | **完全退出桌面端再打开**（冷启动）→ 进新会话界面：小鲸鱼 / 文字横幅 / 预览版贴标**仍然同一条水平线、位置正确**。旧版这里是「热重载一次就正常、冷启动必错位」，要重点确认 |
| 14 | **深色不吞背景（v0.2.5 修复 8）** | **冷启动后**切到深色模式：**背景图还在**（能看到观铃那张夏日青空图），不是一片纯黑。旧版是「热重载后有、冷启动没有」 |

> 有视觉 API 时（可选增强）：截图后用视觉模型核对 README 特性表即可，**不是安装前提**。
> 第 **3 / 4 / 5 / 7 / 8 / 13 / 14** 项是 v0.2.3 / v0.2.4 / v0.2.5 专门修的，发给别人时请重点让人确认这几条。
> 其中第 13 / 14 条**必须真的重启一次**才能验证（旧版是"热重载好、冷启动坏"，改完立刻看是看不出来的）。

## 6. 注意事项（红线，违反会引入旧 bug）

1. **禁止用 PowerShell 文本命令改写 `lib/client.js`**（UTF-8 损坏 → 皮肤整体失效）。
   改文件必须用支持 UTF-8 的工具；改后 `node --check lib/client.js` 必须通过。
2. **改完任何文件必须重跑 `node scripts/install.mjs`**，否则运行中的应用加载旧版。
   `lib/client.js` 有 src / EAC assets / profile 三处副本，必须保持一致。
3. **不要恢复历史 bug**：
   - 不要在输入框卡片内放大金角饰（曾导致遮挡工具按钮）——角饰 40px 贴圆角、零侵入；
   - 不要给 `heroWorkspaceRow` 高 z-index（曾导致折叠菜单被遮挡）——必须 `z-index:0!important`；
   - 不要改 `dockChips()` 的定位公式（芯片行必须位于卡片上边外侧左角，`top = card.top - stack.top - 42`）；
   - 不要动 `[data-phase=hero] [class*=composerSeat]{z-index:0}` 与
     `[data-conversation-composer-overlay]{z-index:60}`（层级铁律的根基）；
   - 不要恢复输入框内占位 / 装饰的 `isolation:isolate`（曾盖住设置窗口）。
4. **资产路径**：素材经 `/air-assets/<file>` 路由（`lib/index.js`）加载；不要改路由前缀
   `/air-assets`，不要绕过 `resolveAsset` 的路径穿越防护。
5. **皮肤作用域**：全部 CSS 必须挂在 `body[data-dsh-air]` 之下；`ctx.effect` 负责卸载回收，
   不要手动 `removeEventListener` / 裸 `clearInterval` 式收尾。
6. **注册即 effect**：所有贡献走 `ctx.effect()` / `ctx.on()` / 服务 `register()` 返回的
   disposer；不要改 agent-loop。
7. **禁止硬编码 CSS Modules 哈希前缀（最容易静默失效的一条）**。DSH 界面由 CSS Modules
   构建，应用侧类名一律是 `<hash>_<key>`（如 `XPOEOG_tab`），`<hash>` 由源码路径派生，
   **内核每次重新构建都会变**（0.1.0 是 `wSkVaW_*`，0.1.2 是 `XPOEOG_*` / `_7mhE3G_*`）。
   写死哈希的规则**不报错、不告警，只是一条都不生效** —— v0.1.1 的侧栏、标题胶囊、
   标题栏选项卡、输入框底部信息行正是这样整体失效的。
   v0.2.0 起统一走两条抗漂移路径，改样式必须沿用：
   - **首选**：免前缀属性锚 `[class*=key]`（如 `[class*=headlineText]`、`[class*=logoRow]`），
     key 在该规则作用域内唯一即可；
   - **key 有歧义时**（`root` / `label` / `icon` / `tab` 等）：写令牌
     `__AIRMOD(<模块文件名>|<key>)__` 或 `__AIRMOD(<模块文件名>|<key>|<兜底选择器>)__`，
     运行时由 `resolveCssTokens()` 从该模块自己的 `<style data-plugin-css="…/Xxx.module.css">`
     读出真实类名。模块文件名是源码级标识，不随构建漂移。
   - 其它稳定契约：桌面壳标题栏是 **id** `#__dsh_desktop_chrome__` / `#__dsh_desktop_floatbar__`
     （不是 class）；输入框占位符是 `[data-composer-placeholder]` 元素，**不是**
     `textarea::placeholder`（编辑器已是 contenteditable）。
   - 改完用 `node scripts/check-anchors.mjs` 复核，它会对着已安装内核把所有锚点判一次死活。

8. **令牌（`__AIRMOD()__` / `__AIRSIDEBAR__` / `__AIRTITLEBAR__`）只能出现在 CSS 模板里，
   绝不能进 JavaScript。** 它们由 `resolveCssTokens()` 在注入 stylesheet 时替换；写进
   `querySelector` / `querySelectorAll` / `closest` 会抛 `SyntaxError`，而且**会把 `apply()`
   从那一行往后整体中断** —— 全局 MutationObserver、占位符、busy 状态、拆除 effect 全部注册不上。
   v0.2.0 就是被这一条打崩的：把 `[data-pane=sidebar],[class*=sidebarCol]` 无差别替换成
   `__AIRSIDEBAR__`，连带 JS 里 5 处查询一起坏掉，表现为「左上角 deepseek / HARNESS 标识消失、
   新会话标题文字不再写入、折叠菜单层不再自愈」。规则：
   - CSS 里 → 用令牌；
   - JS 里 → 用 `sidebarSelector()`（返回**真实**选择器字符串）；
   - 每个装饰步骤都用 `safe(fn, label)` 包住，单个选择器坏掉只降级一个装饰，不许中断 `apply()`。

9. **品牌行不要让内核自带 identity 与皮肤自绘 wordmark 并存**：`.brand` 自带
   `overflow:hidden`，两者挤在一行时自绘的「HARNESS」胶囊会被裁成一个方块。
   必须 `[class*=logoRow] [class*=brandIdentity]{display:none!important}` 让位。

10. **输入框必须用 `position:fixed` 钉住，不要退回 `sticky`（v0.2.3 的关键修复）**。
    内核把 `[data-composer-seat]` 渲染成滚动容器 `[data-conversation-scroll]` 的最后一个孩子，
    **但它下面还排着别的内容**（本机实测 1961px，来自工作区其它插件的面板/装饰溢出到同一容器）。
    `position:sticky;bottom:0` 只在元素的**自然位置**位于视口下方时才托住它 —— 尾部内容会让
    自然位置提前进入视口，**sticky 当场脱钩**：滚轮一滚输入框上移、到顶再弹回。
    实测 `SEATTOP@0,50,90,100% = 993 993 993 89`；负 `margin-bottom` 也无效
    （`scrollHeight` 一点没变，尾部内容既不是它的兄弟也不受它约束）。
    正确做法是 `pinComposerSeat()`：`position:fixed` + JS 同步几何（left/width/bottom），
    再给滚动容器补 `padding-bottom`（= 座高 + 12px）让最后一条消息仍能滚到输入框上方；
    视口 resize 时重新同步，拆除时 `unpinComposerSeat()` 复原。
    实测修复后 `SEATTOP@0,50,99,100% = 993 993 993 993`（全程恒定）。
    样式表里的 `sticky` 只作为 JS 未跑到时的兜底保留。

11. **hero 标题行不要给 `headlineText` 加 `translateY`**：内核用
    `grid-template-columns:34px auto auto; align-items:center` 已经把 小鲸鱼 | 标题胶囊 |
    预览版 三者对齐；再叠加 `translateY(55px)` 会让标题相对小鲸鱼下坠 55px（就是"小鲸鱼错位"）。
    需要整行上移时只调 `[class*=headline]` 的 `margin-top`。

12. **滚动铁律（两道额外保险，别删）**：
    - `[data-conversation-scroll]{overscroll-behavior:contain}` —— 消息区滚到底后，
      滚轮手势不再向外层传递；
    - `body.style.setProperty("overflow","clip","important")` —— **必须走 inline**，
      样式表里的同名规则会被内核更高优先级的 body 规则压掉（实测 computed 仍是 `hidden`）。
      `clip` 不产生 scroll container，连程序化滚动都不存在，页面本体彻底滚不动。

13. **打包前必须跑 `node scripts/check-release.mjs`**：它逐条断言上面三类修复是否真的
    在本包里（41 项），任何一项失败就不许发出去。

## 7. 故障排查

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 皮肤完全不生效（无背景/无 `data-dsh-air`） | 包未同步 / patch 未生效 / **装了但没重启宿主** / **装到了另一个 profile** | **先跑 `node scripts/doctor.mjs`**，它会告诉你卡在哪一步；再按提示重跑 install 或重启 |
| 不知道自己的 profile 叫什么 / 是纯网页版 | profile 名取决于启动方式，不是固定的 | `node scripts/doctor.mjs` 会列出所有 profile 并标出正在运行的那个；安装时用 `--profile <名>` |
| 只有背景生效，侧栏/标题/输入框底部没变化 | 选择器锚点被内核构建漂移打死（v0.1.1 的已知问题） | `node scripts/check-anchors.mjs` 看哪些 DEAD；按红线 7 换成免前缀锚或 `__AIRMOD` 令牌 |
| **左上角 `deepseek` 有、`HARNESS` 没有（或被裁成方块）** | 内核自带 `brandIdentity` 与自绘 wordmark 抢位，`.brand` 的 `overflow:hidden` 把胶囊裁掉 | 确认红线 9 的 `[class*=brandIdentity]{display:none!important}` 还在；`node scripts/check-release.mjs` |
| **新会话标题不出现 / 小鲸鱼与标题一高一低** | `apply()` 被异常中断导致 MutationObserver 没装上；或 `headlineText` 又被加了 `translateY` | 看 F12 Console 有没有 `[dsh-air] xxx failed:` 报错；确认红线 11；跑 `check-release.mjs` |
| **滚轮滚动时输入框跟着动、到顶又弹回** | composer seat 被别的插件内容挤在滚动容器里，`sticky` 脱钩（v0.2.2 修的就是这条） | 确认红线 9/11 都在；`position:fixed` 是由 JS 打的，若被别的脚本清掉，`applyComposer()` 下一次会自动重打 |
| **新会话界面输入框被压在窗口最底部** | hero 态走了「钉底」分支（v0.2.2 的遗留） | 确认红线 13 的 `HERO_CENTER_SHIFT` 分态逻辑在；想微调高低就改那个数值 |
| **模型输出框底下小按钮的悬停提示被切掉** | `dsh-viewport-lock` 给消息视图打的 inline `clip-path` 把提示框整块裁掉了 | 确认红线 12 的 `[class*=viewArea]{clip-path:none!important}` 还在；**不要再靠调 z-index 修** |
| 改了 `lib/client.js` 但界面没变 | HMR 未推送 / 改的是别的副本 | 确认改的是包根的 `lib/client.js` 并重跑 install；等 1~2 秒；仍不变则完全重启 EAC |
| 皮肤一半生效（装饰缺、动画无） | `lib/client.js` 三处副本不一致 | 重跑 install 脚本；`node --check` 验证 |
| 中文乱码 | 文件被错误编码改写 | 从包根重新拷贝 `lib/client.js`；禁止 PowerShell 文本写 |
| 芯片遮挡折叠菜单 | 层级规则被改坏 | 恢复 `heroWorkspaceRow` 为 `z-index:0!important`、seat z0、overlay z60 |
| 按钮点了没反应 | 装饰拦截点击 | 所有 `data-air-chrome=*` 装饰必须有 `pointer-events:none` |

## 8. 二次开发入口

| 想改什么 | 改哪里 |
| --- | --- |
| 配色 / 装饰 / 动画（CSS 规则表） | `lib/client.js` 顶部的 `css = [...]` 数组 |
| DOM 装饰（金饰、萌宠、羽毛、星尘） | `lib/client.js` 的 `build*` / `decorate*` 函数 |
| hero 标题文案、输入框占位文案 | `lib/client.js` 的 `HERO_HEADLINE` / `PLACEHOLDER` |
| 输入框钉底几何 | `lib/client.js` 的 `pinComposerSeat()` / `unpinComposerSeat()` |
| 背景 / 萌宠 / 金饰素材 | `assets/`（经 `/air-assets/<file>` 路由提供） |
| 皮肤卡片预览图 | `preview/light.png`、`dark.png`（可跑 `npm run preview` 重新生成） |
| 皮肤清单（选择器/预览） | `skin.json` |
| 安装链路 | `scripts/install.mjs`（Node）、`scripts/install.ps1`（无 Node）、`cordis.patch.yml`、`package.json` 的 `dsh.bundle` |
| 环境探测逻辑（profile / 桌面壳） | `scripts/install.mjs` 的 `detectProfile()` / `probeEacAppRoot()`；排障看 `scripts/doctor.mjs` |

### 提交/发布前跑这四条

```bash
npm run check              # node --check 全部 JS
npm run check:release      # 三类历史故障的修复是否都在（41 项，必须全 OK）
npm run check:anchors      # 选择器锚点对着已装内核判死活（退出码 0）
node scripts/install.mjs   # 同步到 profile（+ 桌面壳），并写与壳一致的戳记
```

改动记录与「这个版本修了什么」见 **CHANGELOG.md**。
