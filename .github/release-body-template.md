## 安装 / Install

在 Foundry → **附加模块 → 安装模块** 中粘贴以下 manifest URL：

```
https://github.com/takaqiao/alienrpg-cn/releases/latest/download/module.json
```

## 依赖 / Requires

- Foundry VTT **v13+**（minimum 13 / verified 14 / maximum 14.999）
- `alienrpg`（Alien Evolved）系统 **4.1.13+**
- [Babele](https://foundryvtt.com/packages/babele) **2.9.1+**

可选（装了才生效，没装零成本）：`alien-mu-th-ur` · `motion_tracker` ·
`token-action-hud-alien` · `terminal` · `motion-tracker-multideck` · `yze-combat` ·
`alien-evolved-starterset` · `alien-evolved-corerules`。

新手包与核心书的正文另有两个模块：
[`alien-evolved-starterset-cn`](https://github.com/takaqiao/alien-evolved-starterset-cn) ·
[`alien-evolved-corerules-cn`](https://github.com/takaqiao/alien-evolved-corerules-cn)。

## 变更 / Changes

### v0.2.5 —— 状态与特技术语修订

- `Freezing`：冷冻 → **受冻**
- `Encumbered`：受阻 → **超重**
- `Gravity Dyspraxia`：重力运动障碍 → **重力失调**
- `Critical Injuries` 的状态栏标签：英文 → **重伤**（RollTable 文档名仍冻结英文）
- `Stunts`：炫技 → **特技**；`Skill-Stunts`：技能炫技 → **技能特技**

改动已同步到系统界面、系统合集、Evolved 技能特技正文、12 个中文动态键别名与
Starter Set 对应文本。插件语言发布闸也已扩到当前七个条件式入口，含 YZE Combat 80 键。

完整改动请见本次发布对应的提交记录。
See the commits associated with this tag for the full change list.
