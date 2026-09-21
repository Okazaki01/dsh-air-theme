# dsh-air-theme · 《AIR》夏日青空 主题皮肤

以 Key 社《AIR》(2000) 为灵感的 **DeepSeek Harness** 高定制动漫主题皮肤。
支持皮肤热切换，**不改动任何原生功能与按钮行为**（100% 保留原版窗口布局与按钮行为）。

- **当前版本 v0.2.5** ｜ 下载：**[Releases](https://github.com/qq2992254255-oss/dsh-air-theme/releases/latest)**
- **推荐环境：[DSH-Desktop-EAC](https://github.com/DSH-EAC/DSH-Desktop-EAC)** —— DeepSeek Harness 的桌面端
  （EAC = *Embracing All Creation*「揽尽万象」，自带 Node.js 运行时、一键启动）。
  **本皮肤就是在它上面开发与测试的**，用它的体验最省事。
- **反馈邮箱：qq2992254255@gmail.com**（发现 bug 或想提建议，欢迎直接发邮件）
- 安装：解压后双击 `安装.bat`，或 `node scripts/install.mjs`（自动识别环境与 profile）；
  装完**完全退出客户端再打开**（首次新增皮肤行时，刷新页面不够）
- 与启动器无关：只要求「装进某个 profile + 该 profile 有启用行 + 宿主重启过」
  —— 推荐搭配上面的 **EAC 桌面端**，纯网页版 `dsh web` 与其它桌面端也都能用

## 预览

### 浅色模式

| 新会话界面 | 已有会话记录 |
| :---: | :---: |
| ![浅色模式 · 新会话界面](https://raw.githubusercontent.com/qq2992254255-oss/dsh-air-theme/main/preview/light-new-session.png) | ![浅色模式 · 已有会话记录](https://raw.githubusercontent.com/qq2992254255-oss/dsh-air-theme/main/preview/light-conversation.png) |

### 深色模式

| 新会话界面 | 已有会话记录 |
| :---: | :---: |
| ![深色模式 · 新会话界面](https://raw.githubusercontent.com/qq2992254255-oss/dsh-air-theme/main/preview/dark-new-session.png) | ![深色模式 · 已有会话记录](https://raw.githubusercontent.com/qq2992254255-oss/dsh-air-theme/main/preview/dark-conversation.png) |

---

## 完整特性与实现原理

以 Key 社《AIR》(2000) 为灵感的 DeepSeek Harness WebUI 高定制动漫主题皮肤。
全屏神尾观铃（Misuzu Kamio）拥抱天空背景、Q 版观铃侧栏萌宠、羽毛飘落 / 云层流动
环境动画、魔法阵思考特效、樱花旋转设置按钮。通过 **dsh-skin-switch** 热切换，
**不修改任何原生功能结构**（100% 保留原版窗口布局与按钮行为）。

> **当前版本 v0.2.5。** 这个版本共修掉了八个会被用户直接看到的问题：左上角品牌标识缺失、
> 新会话标题行（小鲸鱼）错位、滚轮滚动带走输入框、新会话输入框被压在窗口最底部、
> 消息动作按钮的悬停提示被裁掉、**冷启动后新会话界面三件套错位（v0.2.4）**，以及
> **深色模式下天空图整个消失只剩纯黑（v0.2.5）**。逐条说明与实测数据见 **CHANGELOG.md**。
>
> 拿到包先跑 `node scripts/check-release.mjs`（41 项，全 OK 才是好包）。

## 特性

| 需求 | 实现 |
| --- | --- |
| 热切换 UI 覆盖层 | 全部 CSS 作用域在 `body[data-dsh-air]` 之下，卸载/切换皮肤即整体回收（`ctx.effect` 清理） |
| 全屏背景 | `001.jpg`（神尾观铃全景）经 `/air-assets/bg.jpg` 加载，`fixed` 铺满，透明度按明暗主题自适应 |
| 微风特效 | 3 层 CSS 云朵缓慢水平漂移 + 飞鸟剪影缓浮 |
| 羽毛飘落 | 11 片 SVG 羽毛随机落速/摆幅/旋转，`transform` 纯动画，低负载；加载时加速（`.air-busy`） |
| 输入框四边框（红区） | 玻璃拟态 + **金色豪华镶边**：**定制弧形金角饰 `corner-arc-gold.svg`——四角呈弯月/括号状紧贴 24px 圆角弧线（内弧=卡片圆角本身，金带宽 16px 向外延伸，零侵入卡片）**；上/下细金饰边条 `gold-edge-h.svg`（略加粗至 22px，清晰可见）；左右金竖饰条 `gold-side.svg` v2 完全在边框外侧；左右羽毛垂饰 + 底部漂浮樱花花瓣；聚焦光晕 |
| 上边框中央宝石（替换翅膀） | 定制**金色宝石徽章**（`top-gem.svg`：多面钻石 + 月桂枝 + 垂坠宝石），悬于输入框上边框正中，hero 与对话态都优雅常驻；原翅膀素材已删除，不再使用 |
| 工具按钮不被遮挡（红区） | 命令"+"按钮保留在工具行原生位置（左下角，实心白-天青渐变圆钮），**大金角饰已移除**，任何状态下都不会被金色遮挡、永远可点；**发送按钮提升图层**（`z-index:13`）置于剩余金饰之上，完整可见 |
| 占位文案 | 「嘻嘻，又可以偷吃用户的token了......」— JS 注入 `placeholder`，日系手书体（Zen Kurenaido）+ 淡蓝高光 |
| 消息回复区 | 粗体日系字体栈（Zen Maru Gothic / Clear Sans Japanese）+ 文字发光，樱花粉用户气泡 / 青蓝玻璃助手气泡 |
| 按钮区 | 原生按钮功能不变；发送键**魔法书图标** + 悬停光晕扩散，点击**水波涟漪+水滴音效**；刷新❀樱花旋转；工具/添加键天青圆钮 |
| 思考状态钩子 | `[data-variant=think][data-state=running]` → 双环魔法阵涟漪动画 |
| 加载状态钩子 | 侧栏 `svg[data-state=ongoing]` 呼吸光晕 + 羽毛加速 + 星尘闪烁 |
| 工具运行钩子 | `[data-chat-flow-kind=tool-call][data-state=running]` 行尾星尘爆闪 |
| 左侧边栏 | 和风浅纹理叠加、Q 版观铃剪影（默认在面板下；无对话记录时自动置顶，`data-air-mascot-top`）、❀ 小节装饰、星轨+樱花枝+飞鸟装饰、设置齿轮 → 旋转樱花 🌸 |
| 品牌（绿区） | `deepseek` **明亮金色渐变字 + 深色描边阴影**（醒目清晰，不再发黑）+ 整体右移 16px 更居中；`HARNESS` 金边深蓝徽章；logo 行金色胶囊 + 流光 + 金角饰 |
| 新会话胶囊（紫区） | 天青玻璃胶囊 + **天蓝色花饰四角镶边**（`border-corner-sky.svg`，30px，与输入框金色镶边材质不同）+ 右侧羽毛 + 旋转樱花 + 悬停光晕 |
| 工作区文件夹（粉区） | 文件夹行胶囊化 + **同款天蓝花饰四角镶边**（与新会话胶囊一致）+ 文件夹图标发光 + 悬浮 Q 版剪影 |
| 标题栏（round7） | **上下文对话标题 → 金色镶黑边**（与 deepseek 同款亮金渐变+黑描边）；**选项卡（对话/轨迹/文件）与 agent预设 → 橙色**（含图标） |
| 输入框底部信息（round7） | **统计信息行（缓存命中率 / 输入token / tok/s / 上下文用量）→ 橙色**，清晰可读；dsh-balance 的「本轮¥ · 余额 · 空闲价」行保持原样不动 |
| 设置窗口保护 | 打开设置时（`body[data-air-settings-open]`）：主题立即"让位"——面板恢复不透明原样、环境特效暂停、输入框卡片与 hero 芯片完全隐藏（绝不再遮挡/拦截设置窗口），关闭后自动复原 |
| 素材 | 背景与萌宠为本地素材；金框花饰/星轨/樱花枝为联网搜集（Commons，经 `/air-assets` 本地托管）；羽毛/樱花/星尘/飞鸟/涟漪为内联 SVG |
| 芯片行外置（定稿） | 「选择工作区」「agent预设」两个按钮从卡片内移出，**位于输入框卡片上边外侧最左角**，横向紧凑排列（gap 5px），标题上移让位，**不与 hero 标题重叠** |
| 折叠菜单永不背遮挡（定稿） | 层级铁律：输入框卡片(0) ≤ 芯片行(`z-index:0!important`) < 折叠菜单(overlay `z-index:60` / 工具行 popover 12+ / seat 外 ≥1)；hero 态 `composerSeat` 从原生 z7 降至 z0——技能/模型等任何折叠菜单必然画在芯片按钮之上 |
| hero 标题行（定稿） | **观铃定制文案「将未完的夏天，寄往天空的尽头」**（JS 注入 + React 重渲染自动重应用）；标题文字放入**浅蓝玻璃胶囊**（天青渐变+金边+立体感五层描边/投影）；左侧**小鲸鱼带胶囊底衬**（40×40 圆角玻璃，鱼更清晰）；预览版贴标题右上角；**鱼与文字严格同一水平线**（内核 grid `align-items:center` 对齐，整行高度只调 `headline` 的 `margin-top`，**不再对标题文字叠加 `translateY`** —— v0.2.3 修的就是这条导致的"小鲸鱼错位"） |
| 输入框不随滚动移动（v0.2.3） | 内核把 composer seat 放在滚动容器里、且其下方还排着其它插件内容，`sticky` 会中途脱钩（滚轮一滚输入框上移、到顶弹回）。改为 `position:fixed` + JS 同步几何把它**从滚动流里拿出来**，并给滚动容器补 `padding-bottom` 让最后一条消息仍能滚到输入框上方；视口 resize 重新同步 |
| 新会话输入框位置（v0.2.3） | 空会话（hero）态按「整个 seat（含上方标题行）的垂直中线 + `HERO_CENTER_SHIFT`」摆位 —— **居中偏下**，而不是被压在窗口最底部；小鲸鱼 / 文字横幅 / 预览版都在 seat 内部，天然同步、始终同一条水平线。高低可调：`lib/client.js` 的 `HERO_CENTER_SHIFT`（默认 56，越大越靠下） |
| 悬停提示不被裁（v0.2.3） | `dsh-viewport-lock` 会给消息视图打一条 inline `clip-path:inset(...)`（为旧 sticky 输入框设计），会把消息动作按钮的悬停提示**整块剪掉**。皮肤用 `[class*=viewArea]{clip-path:none!important}` 解除 —— 作者 `!important` 能压过非 important 的 inline 样式 |
| 冷启动不错位（v0.2.4） | 皮肤用运行时令牌 `__AIRMOD(模块|key)__` 从内核的 `<style>` 里解析真实类名，解析失败会退化成 `:not(*)`（**静默失效**）。冷启动时宿主恢复的是**有消息的会话**，`HeroShell.module.css` 还没进 DOM，于是 hero 行的 `-70px` 上移**永久失效** → 看起来就是「三件套错位」。修法两道：① 同一条规则再写一份**免前缀锚**版本兜底；② `injectCss()` 新增 `watchModules()`，盯住 `<head>`，**内核模块样式表一出现就重新解析**（旧代码只用 rAF 重试约 0.7 秒就放弃） |
| 深色不再吞掉背景（v0.2.5） | 皮肤靠 `--dsw-alias-bg-base:transparent` 让天空图透出来，但这条原来**只写在浅色块**（权重 0-1-1），内核深色底是 `body[data-ds-dark-theme]`（**同样 0-1-1**）——同权重按**样式表顺序**决胜：冷启动时皮肤表在前、内核表在后 → 内核赢 → 不透明 `#151517` 铺满全屏把照片盖住；热重载会把皮肤表重建并追加到末尾 → 皮肤赢。修法：深色块**自己也声明**这一条 + 两处都加 `!important` |
| 激活自检徽章 | 皮肤激活时右下角短暂显示「AIR·夏日青空 主题已生效 ✓ **v0.2.5**」（8 秒），看屏幕即可确认生效、也能确认加载的是哪一版 |

## 安装（懒人式）

**小白路径（0 门槛，无需 Node / 无需任何 API）**：双击包内 **`安装.bat`**，按窗口提示
重启即可；**看屏幕确认**——右下角短暂出现「AIR·夏日青空 主题已生效 ✓」、背景变夏日青空、
左上角有金色 `deepseek` + `HARNESS` 胶囊即成功。装好后打开技能/模型等折叠菜单不会被两个芯片按钮遮挡。

**交给 AI 安装**：把本包目录交给任意 AI 模型，让它读包内 **`INSTALL.md`**（面向 AI 的完整
安装引导与注意事项）或 **`AGENTS.md`**（30 秒执行清单）照做即可。核心两步：

> **推荐环境：[DSH-Desktop-EAC](https://github.com/DSH-EAC/DSH-Desktop-EAC)**（DeepSeek Harness 桌面端，
> EAC = *Embracing All Creation*「揽尽万象」，自带 Node.js 运行时、一键启动）。本节与下文的操作示例都以它为例；
> 纯网页版 `dsh web` 与其它桌面端**同样支持**，安装脚本会自动判定 profile。

```bash
node scripts/check-release.mjs   # 先确认包是好的：41 项必须全 OK
node scripts/install.mjs         # 幂等；自动探测 EAC 与 profile 并同步三处副本
```

**首次安装（新增皮肤行）必须完全退出 EAC 再启动** —— 宿主启动时读取 `cordis.patch.yml`，
并把每行插件的客户端 bundle 一次性读进内存后以 `immutable` 提供，所以浏览器 Ctrl+R
**加载不了新插件行**。（只有「行已存在、只改了 `lib/client.js`」的情况才由 `dsh-client-hmr`
自动热重载、无需重启。）patch 行默认启用，重启即生效，**无需手动去设置点皮肤**
（没生效才需要：设置 → 皮肤 → 启用「AIR·夏日青空」）。

方式 A（桌面壳同步）：在包根执行 `node scripts/install.mjs` 即可 —— 它会自动把整树同步到
`<EAC app root>\assets\skins\air\`（EAC 4.x 布局为 `<安装目录>\dsh-desktop\assets\skins\air\`，
旧布局为 `<安装目录>\resources\app\assets\skins\air\`，两种都能探测），
重启 EAC 后皮肤自动同步进 profile。

方式 B（手动，当前 profile）：

```powershell
# 1) 复制插件包到 profile
$dest = "$env:USERPROFILE\.dsh\profiles\web-desktop\node_modules\@dsh-external\dsh-client-ui-skin-air"
New-Item -ItemType Directory -Force (Split-Path $dest) | Out-Null
Copy-Item -Recurse "dsh-air-theme\*" $dest

# 2) 在 profile 的 cordis.patch.yml 追加（幂等，已有则跳过）
# - insert:
#     - id: ui-skin-air
#       name: '@dsh-external/dsh-client-ui-skin-air'

# 3) 重启应用；到 设置 → 皮肤 启用；再重启一次生效
```

启用后若想回到默认皮肤，在 设置 → 皮肤 中切回「默认」即可（皮肤间互斥）。

## 结构

```
dsh-air-theme/
├─ package.json        # @dsh-external/dsh-client-ui-skin-air（dsh.client: web）
├─ skin.json           # 皮肤清单（skin-switch 发现 / 预览）
├─ cordis.patch.yml    # 插件行补丁
├─ INSTALL.md          # ★ 面向 AI 的安装引导与注意事项（懒人安装核心文档）
├─ AGENTS.md           # ★ AI 安装代理 30 秒执行清单
├─ CHANGELOG.md        # ★ 每个版本修了什么（发给别人时让对方先看这个）
├─ 安装.bat            # ★ 小白双击安装（Windows 自带 PowerShell，无需 Node）
├─ lib/index.js        # 宿主半侧：/air-assets 静态资源路由（防路径穿越）
├─ lib/client.js       # 浏览器半侧：ModuleLoader bundle，CSS 覆盖层 + DOM 装饰 + 状态钩子 + 激活自检提示
├─ scripts/install.mjs # ★ 懒人安装脚本（Node，幂等，同步 EAC assets + profile + patch + stamp）
├─ scripts/install.ps1 # ★ 懒人安装脚本（PowerShell，等价于 mjs，供 安装.bat 调用）
├─ scripts/check-release.mjs  # ★ 发布自检：断言三类历史故障的修复都在（41 项，FAIL 不许发）
├─ scripts/check-anchors.mjs  # ★ 锚点死活检查（对着已装内核，退出码 0 = 全活）
├─ scripts/doctor.mjs         # ★ 环境体检 / 排障（只读；告诉你该装哪个 profile、下一步做什么）
├─ scripts/make-preview.ps1   # 生成设置→皮肤 卡片用的 preview/light.png、dark.png
├─ preview/            # 皮肤选择器预览图（light / dark）
├─ assets/             # bg.jpg（背景）/ misuzu.png（Q 版观铃透明 PNG）/ 金饰 SVG
```

## 内核兼容性（v0.2.0 起的抗漂移设计）

DSH 的界面由 **CSS Modules** 构建，应用侧类名一律是 `<hash>_<key>`，其中 `<hash>` 由源码
路径派生、**每次内核重新构建都会变**（0.1.0 是 `wSkVaW_*`，0.1.2 是 `XPOEOG_*` / `_7mhE3G_*` …）。

写死哈希的选择器**不报错、不告警，只是一条都不生效** —— v0.1.1 的侧栏玻璃纸纹样、hero 标题
金色胶囊、标题栏选项卡橙色、输入框底部信息行整体失效，就是这一条造成的。

v0.2.0 改用两条抗漂移路径，样式规则里不再出现任何哈希：

| 方式 | 写法 | 适用 |
| --- | --- | --- |
| 免前缀锚 | `[class*=headlineText]` | key 在该规则作用域内唯一时（首选） |
| 运行时令牌 | `__AIRMOD(HeroShell.module.css\|headlineText)` | key 有歧义时（`root`/`label`/`icon`/`tab`）—— 从该模块自己的 `<style data-plugin-css="…">` 读出真实类名 |

其它稳定契约：桌面壳标题栏是 **id** `#__dsh_desktop_chrome__`；侧栏根用结构锚
`:has(> [class*=logoRow])`（内核已不再使用 `data-pane` / `sidebarCol`）；输入框占位符是
`[data-composer-placeholder]` 元素（编辑器已是 contenteditable，`textarea::placeholder` 不再触发）。

升级内核后跑一次 `node scripts/check-anchors.mjs` 即可知道有没有锚点被漂移打死。

## 不是 EAC 也能用（环境适配）

**先说结论**：皮肤能不能生效，只取决于三件事 ——
**① 包装进了哪个 profile　② 那个 profile 的 `cordis.patch.yml` 里有启用行　③ 宿主重启过**。
和「是桌面端还是纯网页版」没有关系。皮肤本身是内核级插件（宿主半侧走
`ctx.webServer.register`，浏览器半侧是标准的 `dsh.client` bundle），EAC 只是其中一种启动器。

不确定自己是什么环境、该跑哪条命令？**先体检**：

```bash
node scripts/doctor.mjs      # 只读，不改任何文件
```

它会告诉你：本机有哪些 profile、正在跑的是哪一个（连端口）、皮肤装没装、启用行开没开，
然后给出**你这个环境专属**的下一步命令。

| 你的环境 | 怎么装 | 怎么生效 |
| --- | --- | --- |
| **EAC 桌面端**（本包默认适配） | `node scripts/install.mjs`，或双击 `安装.bat` | **完全退出 EAC（含托盘）再打开** |
| **纯网页版**（自己跑 `dsh web`） | `node scripts/install.mjs --profile web`（profile 名以实跑为准） | 结束并重新执行 `dsh web`，然后刷新浏览器页面 |
| **其它桌面端 / 启动器** | `node scripts/install.mjs --profile <它的 profile 名>` | 重启该客户端 |
| **桌面端但目录布局不认识** | `node scripts/install.mjs --eac-root "D:\你的目录"` | 重启该客户端 |
| **只想装 profile、别碰桌面壳** | `node scripts/install.mjs --no-eac` | 重启宿主 |

profile 名**不用猜** —— 安装脚本会按可信度自动判定，并在输出里写明依据：

```
目标 profile : web-desktop   ← 正在运行的 dsh 进程命令行（--profile）
```
判定顺序：`--profile` 参数 → `DSH_DESKTOP_PROFILE` 环境变量（桌面壳注入）→
**正在运行的 dsh 进程命令行**（最准）→ profiles 目录下唯一的一个 → 常见名兜底。
判定不出来时会列出候选并让你显式指定，**绝不瞎猜**。

另外：指定了别的 profile（例如机器上同时装了 EAC 和纯网页版，你只想装给网页版）时，
安装脚本会**自动跳过桌面壳的 `assets/skins`**，避免壳下次冷启动把皮肤推进它自己的 profile 造成串台。

### EAC 专属的东西会不会在别处报错？

不会。皮肤里唯一与桌面壳相关的是「标题栏配色」那条规则，它写成
`:is([class*=titlebar],#__dsh_desktop_chrome__,#__dsh_desktop_floatbar__)` —— 选择器匹配不到就
**整条不生效**，不报错、不影响其它规则。其余锚点（侧栏、输入框、消息区、滚动容器）全部是
**内核级契约**，任何 DSH web 界面都有。而且每个装饰步骤都用 `safe(fn, label)` 包住，
单个选择器失效只会少一个装饰，不会拖垮整个皮肤。

## 常见问题（发给别人时可直接照抄）

| 现象 | 怎么办 |
| --- | --- |
| 装完完全没反应 | **完全退出宿主再打开**（首次安装新增插件行时 Ctrl+R 不够，见「安装」一节）。仍无效跑 `node scripts/doctor.mjs`，它会指出卡在哪一步。 |
| 不知道自己的 profile 叫什么 | `node scripts/doctor.mjs` —— 它会列出所有 profile 并标出正在运行的是哪个。 |
| 不是 EAC / 是纯网页版 | 见上面「不是 EAC 也能用」一节：`--profile <名>` 指定即可，其余完全一样。 |
| 只有背景生效，侧栏/标题/输入框底部没变化 | 选择器锚点被内核构建漂移打死了。跑 `node scripts/check-anchors.mjs` 看哪些 DEAD。 |
| 左上角只有一个金色 `deepseek`，没有 `HARNESS` | 说明你用的是 **v0.1.1 / v0.2.0 / v0.2.1**。v0.2.3 修了这条。 |
| 新会话界面的标题文字不出现 | 同上：v0.2.3 起才会写入（v0.1.x 的 `apply()` 会被一个异常中断，观察器装不上）。 |
| 滚轮滚动时输入框跟着动、到顶又弹回 | v0.2.2 修的就是这条，必须用 v0.2.2 或更高。 |
| 新会话界面输入框被压在窗口最底部 | v0.2.3 修的就是这条，必须用 v0.2.3 或更高。 |
| 模型输出框底下小按钮的悬停提示被切掉 / 像被输入框挡住 | v0.2.3 修的就是这条，必须用 v0.2.3 或更高。 |
| **冷启动**后新会话界面小鲸鱼/横幅/预览版错位，但热重载一次就正常 | v0.2.4 修的就是这条（`HeroShell.module.css` 冷启动时还没加载 → 令牌解析失败）。必须用 **v0.2.4** 或更高；旧版只有「热重载后正常」这个假象。 |
| **深色模式**下背景图没了、整窗一片黑（浅色正常） | v0.2.5 修的就是这条（同权重的 `--dsw-alias-bg-base` 被内核深色规则按样式表顺序压掉）。必须用 **v0.2.5** 或更高。 |
| 想确认加载的是哪一版 | 激活瞬间右下角徽章写着版本号；或 F12 → Console 看 `[dsh-air] 主题已激活 ✓ (… 0.2.5)`。 |
| 想换回默认皮肤 | 设置 → 皮肤 → 点「默认」（皮肤之间互斥，会自动处理）。 |
| 备份/回滚 | 如果装了 `dsh-undo-savepoint`，配置改动会自动存快照，可一键回退。 |

## 状态钩子接口（供二次开发）

| 钩子 | 选择器 | 效果 |
| --- | --- | --- |
| 加载 | `svg[data-state=ongoing]` / `[data-streaming]` | `.air-busy`：羽毛 ×2 速 + 星尘 |
| 思考 | `[data-variant=think][data-state=running]` | 双环涟漪 |
| 工具 | `[data-state=running]` / `[data-composer-card] button:active` | 光晕 / 涟漪 |
| 明暗 | `body[data-dsh-air][data-ds-dark-theme]` | 全套配色自动切换 |

## 性能

- 动画全部为 `transform` / `opacity`（GPU 合成），无 canvas、无逐帧 JS 计算；
- `@media (prefers-reduced-motion: reduce)` 一键关闭全部动画；
- 静态资源 `cache-control: max-age=3600`，浏览器缓存。

## 许可

CC-BY-NC-SA-4.0。背景图 `001.jpg` 与 Q 版角色 `misuzu.png` 为用户提供的素材，
仅随本皮肤本地使用，不重新分发。
