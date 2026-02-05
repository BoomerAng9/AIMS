from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_serializer


class UserPublic(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    role: str
    first_name: str
    last_name: str
    avatar: str | None = None
    subscription_status: str | None = None
    subscription_plan: str | None = None
    subscription_billing_cycle: str | None = None
    subscription_current_period_end: datetime | None = None

    @field_serializer(
        'subscription_current_period_end',
        when_used='json',
        mode='plain'
    )
    def serialize_period_end(
        self,
        value: datetime | None,
        _info
    ) -> str | None:
        if isinstance(value, datetime):
            return value.isoformat()
        return value
