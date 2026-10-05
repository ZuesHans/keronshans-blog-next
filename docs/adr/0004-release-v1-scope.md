# ADR 0004: v1 发行范围与边界

状态：接受，2026-10-06。

当前发行使用单个 Next.js/OpenNext Worker，独立私有内容 Git 与固定 SHA。构建校验 schema、registry、manifest 和资产，产物包含不可变正文快照与静态资源；D1 存储动态运行数据，不是正文备用来源。

管理面采用生产默认关闭的 Access 认证。缺少配置不启动密码旁路。Turnstile 与共享 D1 限流保护互动写入；缺少配置失败关闭。生产后台按作者决定本版不开放。

发行控制面使用 GitHub 手动 workflow 与同一 npm 操作入口：串行构建、源码/产物摘要、归档、部署、健康检查。独立 release-controller、GitHub App/OIDC、R2 长期封存属于后续范围。现存控制器领域原型只参与测试，不能接受生产请求。

此决定收敛先前 PLATFORM-REBUILD-SPEC 的首发范围，保留长期设计。v1 的可发行含义是固定输入可验证构建、公开阅读正确、无双重正文写入、管理入口失败关闭、可追溯与可回滚；不代表未配置的 Access、Turnstile 或未来控制器已完成集成验收。
