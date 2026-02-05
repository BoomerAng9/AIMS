"""Pydantic models for credit management."""

from typing import List
from datetime import datetime
from pydantic import BaseModel, Field


class CreditBalance(BaseModel):
    """User's current credit balance."""

    user_id: str
    credits: float = Field(description="Current credit balance")
    bonus_credits: float = Field(
        description="Current bonus credit balance", default=0.0
    )
    updated_at: datetime


class SessionCreditHistory(BaseModel):
    """Credit history for a specific session."""

    session_id: str
    session_title: str = Field(description="Name/title of the session")
    credits: float = Field(description="Total credits used in this session")
    updated_at: datetime = Field(description="When the session was last updated")


class CreditHistory(BaseModel):
    """User's credit transaction history with pagination."""

    sessions: List[SessionCreditHistory] = Field(
        description="List of sessions with their credit usage"
    )
    total: int = Field(description="Total number of sessions with credit usage")
