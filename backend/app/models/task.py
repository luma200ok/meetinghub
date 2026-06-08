from dataclasses import dataclass
from datetime import date


@dataclass(frozen=True)
class ActionItem:
    id: int
    company_id: int
    title: str
    assignee_name: str
    due_date: date | None
    status: str
    source: str
