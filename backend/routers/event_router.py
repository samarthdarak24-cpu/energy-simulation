from fastapi import APIRouter, Response, Query
from backend.services.event_service import event_service
from typing import Optional

router = APIRouter(prefix="/api/events", tags=["Event & Audit Logs"])


@router.get("")
def list_events(
    severity: Optional[str] = Query(None),
    event_type: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    return event_service.list_events(
        severity=severity,
        event_type=event_type,
        search=search,
        limit=limit,
        offset=offset
    )


@router.get("/summary")
def get_event_summary():
    evts = event_service.list_events(limit=500)["items"]
    total = len(evts)
    faults = sum(1 for e in evts if "FAULT" in e.get("eventType", ""))
    recoveries = sum(1 for e in evts if "VERIFICATION" in e.get("eventType", "") or "RECOVERY" in e.get("eventType", ""))
    high_critical = sum(1 for e in evts if e.get("severity") in ("High", "Critical"))

    return {
        "totalEvents": total,
        "faultsDetected": faults,
        "recoveryActions": recoveries,
        "criticalAlerts": high_critical,
        "systemHealthPct": 99.4
    }


@router.get("/export-csv")
def export_events_csv():
    csv_content = event_service.export_csv()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=gridheal_audit_events.csv"}
    )
