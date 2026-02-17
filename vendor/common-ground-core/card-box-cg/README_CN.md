<p align="left">
   &nbsp中文&nbsp | <a href="README.md">English</a>
</p>

# card-box-core

`card-box-core` 是一个以 `Card` / `CardBox` 为核心的数据与上下文编排库。

## 核心设计原则

### 1. 不可变核心数据

- `Card` 是原子信息单元。
- 逻辑“修改”通过创建新 `Card` 完成（例如 `Card.update(...)` 返回新对象和新 `card_id`）。
- 这样可以保证变换过程可追踪、易审计。

### 2. 线性上下文容器

- `CardBox` 是有序 `card_id` 集合。
- 主流程通过线性顺序处理上下文，降低复杂度。
- 多轮上下文和策略变换都围绕 `CardBox` 展开。

### 3. 中心化状态管理

- `CardStore` 是卡片读写入口，底层委托给存储适配器。
- `CardBox` 只保存引用，实体内容统一从存储层读取。

### 4. 策略化扩展

- 业务处理封装为独立 `Strategy`。
- `ContextEngine.transform(...)` 负责编排策略链，策略间保持低耦合。
- 内置策略示例：`ExtractCodeStrategy`、`PdfToTextStrategy`、`InlineTextFileContentStrategy`。

### 5. 显式可追溯性

- `ContextEngine` 可按 `history_level` 记录卡片与 `CardBox` 变换日志。
- `trace_id` 贯穿一次完整处理流程，用于关联审计信息。

## 核心组件

- `Card`：支持文本、JSON、工具调用、文件引用等内容。
- `CardBox`：上下文引用序列。
- `ContextEngine`：提供 `transform`、`to_api`、`call_model`。
- `AsyncPostgresStorageAdapter`：PostgreSQL 异步存储。
- `LLMAdapter`：统一 LLM 调用（LiteLLM / 可选 Interactions）。

## 安装

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e .
```

可选依赖：

```bash
pip install -e .[test]
pip install -e .[interactions]
```

## 配置 PostgreSQL

设置连接串（二选一）：

```bash
export POSTGRES_STORAGE_ADAPTER_DSN="postgresql://user:pass@localhost:5432/cardbox_db"
# 或
export CARD_BOX_POSTGRES_DSN="postgresql://user:pass@localhost:5432/cardbox_db"
```

## 运行示例

`main.py` 演示最小端到端流程：

1. 初始化 `AsyncPostgresStorageAdapter`（可自动建表）。
2. 创建并保存 `Card`。
3. 保存并加载 `CardBox`。
4. 输出加载结果。

运行：

```bash
python main.py
```

## 运行测试

```bash
python -m unittest discover -s tests -p 'test_*.py' -v
```

说明：

- `tests/test_llm_providers.py` 依赖外部模型环境变量，未配置时会跳过。
- 其余测试优先使用本地替身，不依赖真实外部服务。

## 配置覆盖

可在启动时使用 `configure` 覆盖默认配置：

```python
from card_box_core.config import configure

configure({
    "POSTGRES_STORAGE_ADAPTER": {
        "dsn": "postgresql://user:pass@localhost:5432/cardbox_db",
        "auto_bootstrap": True,
    },
    "LLM_BACKEND": "litellm",
})
```
