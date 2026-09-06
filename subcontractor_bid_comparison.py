from __future__ import annotations

from decimal import Decimal
from typing import TypedDict
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter
from supabase import Client


class ProjectComparison(TypedDict):
    project_id: str
    project_name: str
    unit_price: float
    subcontractor_name: str


class Comparison(TypedDict):
    new_unit_price: float
    min_unit_price: float | None
    max_unit_price: float | None
    avg_unit_price: float | None
    median_unit_price: float | None
    sample_count: int
    projects_compared: list[ProjectComparison]
    percent_above_min: float


class BidComparison(TypedDict):
    warning: bool
    message: str
    comparison: Comparison


class BidComparisonInput(BaseModel):
    """Validated input sent across the Supabase RPC trust boundary."""

    model_config = ConfigDict(frozen=True)

    new_organization_id: UUID
    new_project_id: UUID
    new_work_item_id: UUID
    new_subcontractor_id: UUID
    new_iscilik_fiyat: Decimal = Field(ge=0)
    new_malzeme_fiyat: Decimal = Field(ge=0)
    new_birim: str = Field(min_length=1)
    threshold_percent: Decimal = Field(default=Decimal("10"), ge=0)


def compare_subcontractor_bid(
    client: Client,
    request: BidComparisonInput,
) -> BidComparison:
    params = request.model_dump(mode="json")
    response = client.rpc("compare_subcontractor_bid", params).execute()
    data = response.data
    return TypeAdapter(BidComparison).validate_python(data)
