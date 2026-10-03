# INSTALL.md — 《AIR》夏日青空 主题皮肤 · 安装引导（v0.2.6）

> 给 AI 安装代理看的完整说明。30 秒速查见 **AGENTS.md**，改动记录见 **CHANGELOG.md**。
> 全部命令可直接复制执行。

---

## 0. 这是什么

一个完整的 DSH 插件（bundle 形态），为 DeepSeek Harness Web GUI 提供「AIR·夏日青空」动漫主题皮肤。
插件 = 宿主半侧（`lib/index.js`，**零 I/O 空壳**，只负责让插件行可被加载）+ 浏览器半侧
（`lib/client.js` + 包内资源 chunk，全部美化逻辑与素材）。

- 包名：`@dsh-external/dsh-client-ui-skin-air`
- 皮肤行 id：`ui-skin-air`
- 皮肤激活标志：`body[data-dsh-air]`
- 皮肤清单：`skin.json`（皮肤选择器据此发现/预览）
- 许可：**CC-BY-SA-4.0**（见 `LICENSE` 全文与 `NOTICE`）
- 当前版本：**v0.2.6**
- **推荐环境：[DSH-Desktop-EAC](https://github.com/DSH-EAC/DSH-Desktop-EAC)**
  —— DeepSeek Harness 的桌面端（EAC = *Embracing All Creation*「揽尽万象」，自带 Node.js 运行时、
  一键启动）。**本皮肤就是在它上面开发与测试的**；纯网页版 `dsh web` 与其它桌面端**同样支持**。

### 素材是怎么进浏览器的（v0.2.6 起）

内核**没有**「把插件包内文件当静态资源通过 HTTP 提供」的通道 —— 唯一能按 URL 读取包内文件的
机制是 client-modules 的 chunk 通道，而它只接受 `client.<名>.js` 这个文件名形状。所以：

- 装饰 SVG、背景图、Q 版萌宠、星轨照片全部**内联**在包内资源 chunk 里
  （`lib/client.art.js`、`lib/client.bg.{a,b}.js`、`lib/client.mascot.js`、`lib/client.star.{a,b}.js`）；
- `lib/client.js` 用 `require.async("./client.<名>.js")` 逐个拉取，**带缓存**（immutable）；
- 宿主半侧因此**不需要**静态路由，也就没有 `node:fs` —— 这正是通过 DSH Store 自动准入的前提
  （files / network / commands / credentials 四个权限信号必须全空）。

`assets/` 里的原图**保留在仓库**作为源素材（不随包分发）；仓库里另有 `preview/` 展示图。
**v0.2.6 删除了** `安装.bat`、`scripts/install.mjs`、`scripts/install.ps1`、`scripts/doctor.mjs`、
`INSTALL-MANUAL.md`：安装改为 agent 自动安装，且这些脚本本身就会命中权限信号。

### 拿到仓库先跑这一条（不用装、不用看图，几秒）

```bash
node tools/check-release.mjs   # 59 项，必须全 OK
node tools/check-anchors.mjs   # 对着已装内核判锚点死活，退出码 0
```

`tools/` 是**开发期工具，不随包分发**（`package.json` 的 `files` 里没有它）。分发包里没有这两条，
跳过即可。任何一项 FAIL，说明这个包是坏的，不要装、也不要发给别人。

## 1. 前置检查

| 检查项 | 命令 | 通过条件 |
| --- | --- | --- |
| Node.js 可用 | `node -v` | ≥ 18（`dsh plugin add` 底层是 pnpm） |
| `dsh` 可用 | `dsh --version` | 能输出命令行工具的版本 |
| 包目录完整 | 列包根 | 含 `package.json`、`lib/`（含 6 个 `client.*.js` chunk）、`cordis.patch.yml`、`skin.json` |
| 语法健康 | `npm run check:release` | 59/59（没有 `tools/` 时改为只跑 `node --check lib/*.js`） |

> 若 `lib/client.js` 语法检查失败：**不要用 PowerShell 的 Get-Content/Set-Content 修文件**
> （会破坏 UTF-8）。用支持 UTF-8 的编辑工具修改，改完重新 `node --check`。

## 2. 安装（agent 自动安装，一条命令，幂等）

```bash
# 从 GitHub 仓库装
dsh plugin --profile <profile名> add github:Okazaki01/dsh-air-theme

# 从本地目录装（离线 / 改过源码时）
dsh plugin --profile <profile名> add <本包目录>
```

- `--profile` 是 `plugin` 子命令的**必需**参数，写在 `plugin` 之后、`add` 之前。
- 底层是 pnpm，也接受 `git+https://github.com/Okazaki01/dsh-air-theme.git`（pnpm 的
  `<git repo url>` 形式）。
- 启用行由包内 `cordis.patch.yml` 自动插入（`id: ui-skin-air`）；命令幂等，重复执行安全。
- **上架后也可以从商店装**：设置 → 插件市场 → 搜「AIR 夏日青空」。

**目标 profile 名怎么定（不要硬编码）**：列 `~/.dsh/profiles/` 下的目录，或看正在运行的
dsh 进程命令行里的 `--profile`。EAC 通常是 `web-desktop`，纯网页版通常是 `web`，其它桌面端
可能是别的名字。判不出来就把候选列给用户，让其明确指定 —— **不要瞎猜**。

### 2.1 不是 EAC 的环境（纯网页版 / 其它桌面端）

**皮肤本身与启动器无关**：浏览器半侧是标准的 `dsh.client` bundle，任何 DSH web 界面都能加载。
生效只取决于三件事：**包装进了哪个 profile、那个 profile 有启用行、宿主重启过**。

| 环境 | 安装 | 生效 |
| --- | --- | --- |
| EAC 桌面端（推荐） | `dsh plugin --profile web-desktop add github:Okazaki01/dsh-air-theme` | 完全退出 EAC（含托盘）再打开 |
| 纯网页版（自己跑 `dsh web`） | `dsh plugin --profile web add github:Okazaki01/dsh-air-theme` | 结束并重新执行 `dsh web`，再刷新浏览器页面 |
| 其它桌面端 / 启动器 | `dsh plugin --profile <名> add github:Okazaki01/dsh-air-theme` | 重启该客户端 |

**桌面壳专属的东西在别处会不会报错？不会。** 唯一与桌面壳相关的是「标题栏配色」那条规则，
它写成 `:is([class*=titlebar],#__dsh_desktop_chrome__,#__dsh_desktop_floatbar__)` —— 匹配不到
就整条不生效，不报错、不影响其它规则。其余锚点（侧栏、输入框、消息区、滚动容器）全是
**内核级契约**，任何 DSH web 界面都有。而且每个装饰步骤都被 `safe(fn, label)` 包住，
单个选择器失效只会少一个装饰，不会拖垮整个皮肤。

## 3. 生效（两种路径，按需选择）

- **首次安装 / 新增皮肤行**：**必须让宿主进程重启一次** —— 启用配置由宿主在启动时读取，且
  `dsh-client-modules` 会在启动时把每行插件的客户端 bundle 一次性读进内存
  （`initialBundleSnapshot`），并以 `Cache-Control: immutable` 对外提供。因此浏览器刷新
  （Ctrl+R）**不会**加载一条**新的**插件行。
  - 桌面端（EAC 等）：**完全退出客户端（含托盘）再打开**；
  - 纯网页版（自己跑 `dsh web`）：**结束该进程并重新执行 `dsh web`**，然后刷新浏览器页面。
- **行已存在、只改了 `lib/*.js`（二次开发日常）**：**不需要重启**。
  `dsh-client-hmr` 每 500ms 轮询 bundle 的 mtime/size，内容变化即重算 rev 并经 SSE 推给浏览器，
  页面会自动热重载该插件（本包 `injectCss()` 因此每次 `apply` 都重写 stylesheet ——
  否则热重载会继续沿用上一版 CSS）。桌面端与网页端同进程，两者都适用。
  > 注意：改了文件之后要**按同一来源重装一次**（`dsh plugin add` 幂等），
  > 否则 profile 里还是旧副本；只有「装进 profile 的目录被直接编辑 / 是链接」时才会自动热重载。
- 想强制走一遍冷路径验证：按上面「桌面端 / 纯网页版」对应的方式重启一次即可。

## 4. 启用与互斥

- 打开 **设置 → 皮肤**，点击「AIR·夏日青空」。
- 多皮肤互斥由 dsh-skin-switch 管理：启用配置里其它皮肤行（`ui-skin-*`）必须是
  `disabled: true`，`ui-skin-air` 保持启用（无 `disabled` 或 `disabled: false`）。

## 5. 验证清单（小白看屏幕；AI 按"命令输出 + 用户反馈"）

**先跑包自检**（不需要装、不需要看图，几秒出结果）：

```bash
node tools/check-release.mjs   # 历史故障修复 + 商店准入合规（59 项，必须全 OK）
node tools/check-anchors.mjs   # 选择器锚点对着**已装内核**逐个判死活（退出码 0 = 全活）
```

**给小白**：重启后看屏幕即可 —— 右下角出现「AIR·夏日青空 主题已生效 ✓ v0.2.6」提示、
背景变为夏日青空、输入框四角有金色弧饰 = 成功。不需要会看代码或接 API。

**给 AI（无视觉 API 时，逐项按"命令输出/用户口述"核对）**：

| # | 验证点 | 通过标准（无需看图） |
| --- | --- | --- |
| 0 | 安装命令输出 | `dsh plugin add` 无报错；profile 里出现 `@dsh-external/dsh-client-ui-skin-air` |
| 1 | 皮肤激活 | 页面右下角出现「AIR·夏日青空 主题已生效 ✓ v0.2.6」；或 F12 → Console 有 `[dsh-air] 主题已激活 ✓` |
| 2 | 背景（浅色 **与深色**） | 用户口述：背景是动漫少女拥抱天空的夏日青空图；**切到深色模式后背景图仍然在** |
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
| 13 | **冷启动不错位（v0.2.4 修复 7）** | **完全退出桌面端再打开**（冷启动）→ 进新会话界面：小鲸鱼 / 文字横幅 / 预览版贴标**仍然同一条水平线、位置正确** |
| 14 | **深色不吞背景（v0.2.5 修复 8）** | **冷启动后**切到深色模式：**背景图还在**（能看到观铃那张夏日青空图），不是一片纯黑 |

> 有视觉 API 时（可选增强）：截图后用视觉模型核对 README 特性表即可，**不是安装前提**。
> 第 **3 / 4 / 5 / 7 / 8 / 13 / 14** 项是 v0.2.3 / v0.2.4 / v0.2.5 专门修的，发给别人时请重点让人确认。
> 其中第 13 / 14 条**必须真的重启一次**才能验证（旧版是"热重载好、冷启动坏"，改完立刻看是看不出来的）。

## 6. 注意事项（红线，违反会引入旧 bug）

1. **禁止用 PowerShell 文本命令改写 `lib/client.js`**（UTF-8 损坏 → 皮肤整体失效）。
   改文件必须用支持 UTF-8 的工具；改后 `node --check lib/client.js` 必须通过。
2. **改完必须跑 `npm run check:release`（59 项）**，并按同一来源重装一次，否则运行中的应用
   加载的是旧副本。
3. **不要恢复历史 bug**：
   - 不要在输入框卡片内放大金角饰（曾导致遮挡工具按钮）——角饰 40px 贴圆角、零侵入；
   - 不要给 `heroWorkspaceRow` 高 z-index（曾导致折叠菜单被遮挡）——必须 `z-index:0!important`；
   - 不要改 `dockChips()` 的定位公式（芯片行必须位于卡片上边外侧左角，`top = card.top - stack.top - 42`）；
   - 不要动 `[data-phase=hero] [class*=composerSeat]{z-index:0}` 与
     `[data-conversation-composer-overlay]{z-index:60}`（层级铁律的根基）；
   - 不要恢复输入框内占位 / 装饰的 `isolation:isolate`（曾盖住设置窗口）。
4. **资产**：素材走包内 chunk（`lib/client.*.js`），经 `require.async("./client.<名>.js")` 加载。
   **不要**在宿主半侧加静态路由或 `node:fs` —— 那会让 DSH Store 的自动准入命中 files 权限信号
   而被拒；也**不要**改 chunk 的调用形式（内核只认 `./` 开头的 `client.*.js`）。
5. **皮肤作用域**：全部 CSS 必须挂在 `body[data-dsh-air]` 之下；`ctx.effect` 负责卸载回收，
   不要手动 `removeEventListener` / 裸 `clearInterval` 式收尾。
6. **注册即 effect**：所有贡献走 `ctx.effect()` / `ctx.on()` / 服务 `register()` 返回的
   disposer；不要改 agent-loop。
7. **禁止硬编码 CSS Modules 哈希前缀（最容易静默失效的一条）**。DSH 界面由 CSS Modules
   构建，应用侧类名一律是 `<hash>_<key>`（如 `XPOEOG_tab`），`<hash>` 由源码路径派生，
   **内核每次重新构建都会变**（0.1.0 是 `wSkVaW_*`，0.1.2 是 `XPOEOG_*` / `_7mhE3G_*`）。
   写死哈希的规则**不报错、不告警，只是一条都不生效**。v0.2.0 起统一走两条抗漂移路径：
   **免前缀属性锚 `[class*=key]`** 或 **运行时令牌 `__AIRMOD(<模块文件名>|<key>[,<兜底>])__`**。
   细节与完整红线清单见 **AGENTS.md** 第 6、7、14、15 条。

## 7. 故障排查

| 现象 | 原因 / 处理 |
| --- | --- |
| 装完完全没反应 | **完全退出宿主再打开**（首次安装新增插件行时 Ctrl+R 不够）。仍无效：确认 profile 的启用配置里有 `id: ui-skin-air`，且该行没有 `disabled: true`。 |
| 不知道 profile 叫什么 | 列 `~/.dsh/profiles/`，或看正在运行的 dsh 进程命令行里的 `--profile`。 |
| 背景在、侧栏/标题/输入框没变化 | 选择器锚点被内核构建漂移打死了。跑 `node tools/check-anchors.mjs` 看哪些 DEAD。 |
| **背景图整块不见了** | v0.2.6 起资源走包内 chunk：先确认 profile 里的包副本含全部 `lib/client.*.js`（缺一个就少一块素材）。重装一次（幂等）通常即可。 |
| **深色模式**下背景图没了、整窗一片黑 | v0.2.5 修的坑（同权重的 `--dsw-alias-bg-base` 被内核深色规则按样式表顺序压掉）。用 **v0.2.6**。 |
| **冷启动错位、热重载正常** | v0.2.4 修的坑（HeroShell 模块迟到 → 令牌退化成 `:not(*)`）。用 **v0.2.6**。 |
| 左上角只有 deepseek 没有 HARNESS | 装的是 v0.2.1 或更早。用 **v0.2.6**。 |

## 8. 二次开发入口

- 全部美化逻辑与 CSS 都在 `lib/client.js`（单文件、手写 `__ModuleLoader__` bundle、无构建步骤）。
- 资源在 `lib/client.*.js` chunk 里；要换图就改 `assets/` 的源图 → 重新生成 chunk
  （注意每个 chunk 必须 ≤ 256 KiB，且注册 id 与文件名成对）。
- 开发期工具在 `tools/`：`check-release.mjs`（59 项自检）、`check-anchors.mjs`（锚点死活）、
  `make-preview.ps1`（生成预览图）。
- 提交/发布前跑：

```bash
npm run check:release   # 59/59
npm run check:anchors   # 退出码 0
```
