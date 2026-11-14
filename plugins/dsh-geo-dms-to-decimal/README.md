<p align="center"><strong>地理工具：dms to decimal</strong></p>

dms to decimal

## 安装（任选一种）

**1）插件市场（推荐）**：在 https://deepseekbase.com/zh/tools/ 搜索 dms_to_decimal，点安装。

**2）命令行**：

    dsh plugin --profile web add dsh-geo-dms-to-decimal

**3）GitHub monorepo（不经 npm 也能装）**：

    dsh plugin --profile web add github:moldkey/dsh-plugins#path:/plugins/dsh-geo-dms-to-decimal

## 能做什么

- dms to decimal
- 本地执行，输入不出机器
- 只注册一个工具，不常驻进程、无需网络

## 用法

在会话里直接说「用dms_to_decimal」，或调用工具 dms_to_decimal。

    工具: dms_to_decimal
    参数: text（必填）

## 示例

输入：

    116.4,39.9

工具会返回处理结果，末尾带全部工具入口。

## 兼容

- DSH >= 0.2.0-rc.2
- Node 18+
- 无外部依赖

## 更多

- 全部工具：https://deepseekbase.com/zh/tools/
- 同类插件：github.com/moldkey/dsh-plugins

## 许可

MIT
