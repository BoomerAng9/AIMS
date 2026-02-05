from datetime import datetime, timezone
import uuid
from enum import Enum
from sqlalchemy import (
    UUID,
    Column,
    String,
    ForeignKey,
    Boolean,
    Index,
    TIMESTAMP,
    BigInteger,
    Float,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.dialects.postgresql import JSONB
from ii_agent.core.config.ii_agent_config import config

# Use timezone-aware timestamps for PostgreSQL
TimestampColumn = TIMESTAMP(timezone=True)

Base = declarative_base()


class SessionStateEnum(str, Enum):
    """Enum for session state values."""

    PENDING = "pending"
    ACTIVE = "active"
    PAUSE = "pause"


class ConnectorTypeEnum(str, Enum):
    """Enum for connector types."""

    GOOGLE_DRIVE = "google_drive"


class WaitlistEntry(Base):
    """Waitlist entries for gated logins."""

    __tablename__ = "waitlist"

    email = Column(String, primary_key=True)
    created_at = Column(
        TimestampColumn,
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )


class User(Base):
    """Database model for users."""

    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    avatar = Column(String, nullable=True)
    role = Column(String, default="user")
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    last_login_at = Column(TimestampColumn, nullable=True)
    user_metadata = Column("metadata", JSONB, nullable=True)
    login_provider = Column(String, nullable=True)
    organization = Column(String, nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    subscription_plan = Column(String, nullable=True)
    subscription_status = Column(String, nullable=True)
    subscription_billing_cycle = Column(String, nullable=True)
    subscription_current_period_end = Column(TIMESTAMP(timezone=True), nullable=True)
    credits = Column(Float, nullable=False)  # Default will be set at service layer
    bonus_credits = Column(
        Float, nullable=False, default=0.0
    )  # Bonus credits that are used first

    # Relationships
    sessions = relationship(
        "Session", back_populates="user", cascade="all, delete-orphan"
    )
    llm_settings = relationship(
        "LLMSetting", back_populates="user", cascade="all, delete-orphan"
    )
    mcp_settings = relationship(
        "MCPSetting", back_populates="user", cascade="all, delete-orphan"
    )
    file_uploads = relationship(
        "FileUpload", back_populates="user", cascade="all, delete-orphan"
    )
    session_wishlists = relationship(
        "SessionWishlist", back_populates="user", cascade="all, delete-orphan"
    )
    api_keys = relationship(
        "APIKey", back_populates="user", cascade="all, delete-orphan"
    )
    connectors = relationship(
        "Connector", back_populates="user", cascade="all, delete-orphan"
    )
    billing_transactions = relationship(
        "BillingTransaction",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    projects = relationship(
        "Project", back_populates="user", cascade="all, delete-orphan"
    )

    # Add index for email lookup
    __table_args__ = (Index("idx_users_email", "email"),)


class LLMSetting(Base):
    """Database model for LLM model settings."""

    __tablename__ = "llm_settings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    model = Column(
        String, nullable=False
    )  # Model name (e.g., 'gpt-4', 'claude-3-opus')
    api_type = Column(String, nullable=False)  # 'openai', 'anthropic', 'gemini'
    encrypted_api_key = Column(String, nullable=True)
    base_url = Column(String, nullable=True)
    max_retries = Column(BigInteger, default=10)
    max_message_chars = Column(BigInteger, default=30000)
    temperature = Column(Float, default=0.0)
    thinking_tokens = Column(BigInteger, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    llm_metadata = Column(
        "metadata", JSONB, nullable=True
    )  # For Azure deployment names, Bedrock config, vertex settings, etc.

    # Relationships
    user = relationship("User", back_populates="llm_settings")
    sessions = relationship("Session", back_populates="llm_setting")

    # Add index for model lookup
    # Create a composite index on user_id and model columns for efficient lookups
    # This allows fast queries when filtering LLM settings by both user and model
    __table_args__ = (Index("idx_llm_settings_user_model", "user_id", "model"),)


class MCPSetting(Base):
    """Database model for MCP (Model Context Protocol) settings."""

    __tablename__ = "mcp_settings"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    mcp_config = Column(
        JSONB(none_as_null=True),
        nullable=False,
    )
    mcp_metadata = Column(
        "metadata",
        JSONB(none_as_null=True),
        nullable=True,
        default=None,
    )  # Stores auth_json and store_path from codex tool
    is_active = Column(Boolean, default=True)
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="mcp_settings")


class Session(Base):
    """Database model for agent sessions."""

    __tablename__ = "sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    sandbox_id = Column(String, nullable=True)
    version = Column(BigInteger, default=0, nullable=False)
    llm_setting_id = Column(String, ForeignKey("llm_settings.id"), nullable=True)
    name = Column(String, nullable=True)
    status = Column(
        String, default="active"
    )  # SessionStateEnum values: 'pending', 'active', 'pause'
    agent_state_path = Column(String, nullable=True)  # Path to agent state storage
    agent_type = Column(String, nullable=True)
    state_storage_url = Column(String, nullable=True)  # URL for state storage
    public_url = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)

    # Parent session ID
    parent_session_id = Column(String, ForeignKey("sessions.id"), nullable=True)

    # Token tracking (useful for both chat and agent modes)
    prompt_tokens = Column(BigInteger, default=0, nullable=False)
    completion_tokens = Column(BigInteger, default=0, nullable=False)

    # Summary message ID (CHAT MODE ONLY - references chat_messages table)
    # Will be NULL for agent mode sessions (agent_type != 'chat')
    # No FK constraint since agent mode doesn't use chat_messages
    summary_message_id = Column(String, nullable=True)

    # Cost tracking (useful for both modes)
    cost = Column(Float, default=0.0, nullable=False)

    # Timestamps
    last_message_at = Column(TimestampColumn, nullable=True)
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at = Column(TimestampColumn, nullable=True)

    # Relationships
    user = relationship("User", back_populates="sessions")
    llm_setting = relationship("LLMSetting", back_populates="sessions")
    projects = relationship("Project", back_populates="session")
    events = relationship(
        "Event", back_populates="session", cascade="all, delete-orphan"
    )
    file_uploads = relationship(
        "FileUpload", back_populates="session", cascade="all, delete-orphan"
    )
    slide_contents = relationship(
        "SlideContent", back_populates="session", cascade="all, delete-orphan"
    )
    wishlisted_by = relationship(
        "SessionWishlist", back_populates="session", cascade="all, delete-orphan"
    )

    # Add indexes
    __table_args__ = (
        Index("idx_sessions_user_id", "user_id"),
        Index("idx_sessions_status", "status"),
        Index("idx_sessions_created_at", "created_at"),
    )

    __mapper_args__ = {"version_id_col": version}

    def get_workspace_dir(self) -> str:
        """Get the workspace directory for this session."""
        return f"{config.workspace_path}/{self.id}"


class Project(Base):
    """Projects group user resources, storage, secrets, and deployments."""

    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(
        String,
        ForeignKey("sessions.id", ondelete="SET NULL"),
        nullable=True,
    )
    name = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    status = Column(String, nullable=False, default="active")
    current_build_status = Column(String, nullable=False, default="pending")
    framework = Column(String, nullable=True)
    project_path = Column(String, nullable=True)
    database_json = Column(JSONB, nullable=True)
    storage_json = Column(JSONB, nullable=True)
    secrets_json = Column(JSONB, nullable=True)
    current_production_deployment_id = Column(
        String,
        nullable=True,
    )
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    deleted_at = Column(TimestampColumn, nullable=True)

    user = relationship("User", back_populates="projects")
    session = relationship("Session", back_populates="projects")
    deployments = relationship(
        "ProjectDeployment",
        back_populates="project",
        cascade="all, delete-orphan",
    )
    __table_args__ = (
        Index("idx_projects_user_id", "user_id"),
        Index("idx_projects_status", "status"),
        Index("idx_projects_session_id", "session_id"),
        UniqueConstraint("user_id", "name", name="uq_projects_user_id_name"),
    )


class ProjectDeployment(Base):
    """Deployment records for a project."""

    __tablename__ = "project_deployments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(
        String, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    environment = Column(String, nullable=False)
    deployment_status = Column(String, nullable=False, default="pending")
    is_active = Column(Boolean, default=False)
    deployment_url = Column(String, nullable=True)
    started_at = Column(TimestampColumn, nullable=True)
    deployed_at = Column(TimestampColumn, nullable=True)
    finished_at = Column(TimestampColumn, nullable=True)
    deploy_duration_ms = Column(BigInteger, nullable=True)
    error_message = Column(Text, nullable=True)
    deployed_by_user_id = Column(
        String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    project = relationship("Project", back_populates="deployments")
    deployed_by_user = relationship("User")

    __table_args__ = (
        Index("idx_project_deployments_project_id", "project_id"),
        Index("idx_project_deployments_environment", "environment"),
    )


class Event(Base):
    """Database model for session events."""

    __tablename__ = "events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(
        String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    run_id = Column(UUID, nullable=True)
    type = Column(String, nullable=False)
    content = Column(JSONB, nullable=False)
    source = Column(String, nullable=True)
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))

    # Relationships
    session = relationship("Session", back_populates="events")

    # Add indexes
    __table_args__ = (
        Index("idx_events_session_id", "session_id"),
        Index("idx_events_created_at", "created_at"),
        Index("idx_events_type", "type"),
    )


class FileUpload(Base):
    """Database model for file uploads."""

    __tablename__ = "file_uploads"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    storage_path = Column(String, nullable=False)
    content_type = Column(String, nullable=True)
    session_id = Column(
        String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=True
    )
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="file_uploads")
    session = relationship("Session", back_populates="file_uploads")


class Connector(Base):
    """Database model for external service connectors."""

    __tablename__ = "connectors"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    connector_type = Column(String, nullable=False)
    access_token = Column(String, nullable=False)
    refresh_token = Column(String, nullable=True)
    token_expiry = Column(TimestampColumn, nullable=True)
    connector_metadata = Column("metadata", JSONB, nullable=True)
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="connectors")

    # Add indexes
    __table_args__ = (
        Index("idx_connectors_user_id", "user_id"),
        Index("idx_connectors_type", "connector_type"),
        UniqueConstraint("user_id", "connector_type", name="uq_user_connector_type"),
    )


class SlideContent(Base):
    """Database model for slide content storage."""

    __tablename__ = "slide_contents"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(
        String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    presentation_name = Column(String, nullable=False)
    slide_number = Column(BigInteger, nullable=False)
    slide_title = Column(String, nullable=True)
    slide_content = Column(String, nullable=False)  # Store HTML content as string
    slide_metadata = Column("metadata", JSONB, nullable=True)  # Additional metadata
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    session = relationship("Session", back_populates="slide_contents")

    # Add indexes for efficient queries
    __table_args__ = (
        Index("idx_slide_contents_session_id", "session_id"),
        Index("idx_slide_contents_presentation_name", "presentation_name"),
        Index(
            "idx_slide_contents_session_presentation_slide",
            "session_id",
            "presentation_name",
            "slide_number",
            unique=True,  # Ensure uniqueness of slide within session and presentation
        ),
    )


class SessionWishlist(Base):
    """Database model for session wishlists."""

    __tablename__ = "session_wishlists"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(
        String, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False
    )
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", back_populates="session_wishlists")
    session = relationship("Session", back_populates="wishlisted_by")

    # Add composite unique index to prevent duplicate wishlist entries
    __table_args__ = (
        Index(
            "idx_session_wishlists_user_session", "user_id", "session_id", unique=True
        ),
    )


class SessionMetrics(Base):
    """Database model for session-level credits tracking."""

    __tablename__ = "session_metrics"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(
        String,
        ForeignKey("sessions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )

    # Credits tracking
    credits = Column(Float, default=0.0)

    # Timestamps
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    session = relationship("Session", backref="metrics", uselist=False)

    # Add indexes for efficient queries
    __table_args__ = (
        Index("idx_session_metrics_session_id", "session_id"),
        Index("idx_session_metrics_updated_at", "updated_at"),
    )


class APIKey(Base):
    """Database model for user API keys."""

    __tablename__ = "api_keys"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    api_key = Column(String, nullable=False, unique=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
    # Relationships
    user = relationship("User", back_populates="api_keys")

    # Add indexes for efficient queries
    __table_args__ = (
        Index("idx_api_keys_user_id", "user_id"),
        Index("idx_api_keys_is_active", "is_active"),
    )


class BillingTransaction(Base):
    """Database model for Stripe billing transactions."""

    __tablename__ = "billing_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    stripe_event_id = Column(String, nullable=False, unique=True)
    stripe_object_id = Column(String, nullable=True)
    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)
    stripe_invoice_id = Column(String, nullable=True)
    stripe_payment_intent_id = Column(String, nullable=True)
    amount = Column(Float, nullable=True)
    currency = Column(String, nullable=True)
    plan_id = Column(String, nullable=True)
    billing_cycle = Column(String, nullable=True)
    credits = Column(Float, nullable=True)
    status = Column(String, nullable=True)
    raw_payload = Column(JSONB, nullable=True)
    created_at = Column(TimestampColumn, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        TimestampColumn,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="billing_transactions")

    __table_args__ = (
        Index("idx_billing_transactions_user_id", "user_id"),
        Index(
            "idx_billing_transactions_subscription",
            "stripe_subscription_id",
        ),
    )

