import csv
import io
import uuid
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.database import SessionLocal
from backend.models.db_models import AuditEvent
from backend.simulation.orchestrator import orchestrator


class EventService:
    """Provides structured audit logging, querying, and CSV exporting."""

    def log_event(
        self,
        event_type: str,
        title: str,
        severity: str = "Low",
        source: str = "Engine",
        affected_asset: str = "System",
        details: Optional[str] = None,
        correlation_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        event_id = f"evt-{uuid.uuid4().hex[:8]}"
        timestamp = orchestrator.clock.current_time_str

        event_dict = {
            "id": event_id,
            "runId": orchestrator.run_id,
            "correlationId": correlation_id,
            "time": timestamp,
            "title": title,
            "eventType": event_type,
            "severity": severity,
            "source": source,
            "affectedAsset": affected_asset,
            "status": "Recorded",
            "details": details,
        }

        db = SessionLocal()
        try:
            ae = AuditEvent(
                id=event_id,
                run_id=orchestrator.run_id,
                correlation_id=correlation_id,
                timestamp=timestamp,
                event_type=event_type,
                severity=severity,
                source=source,
                affected_asset=affected_asset,
                title=title,
                details=details,
                status="Recorded",
            )
            db.add(ae)
            db.commit()
        except Exception as e:
            db.rollback()
            print(f"[EventService] Log error: {e}")
        finally:
            db.close()

        return event_dict

    def list_events(
        self,
        severity: Optional[str] = None,
        event_type: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> Dict[str, Any]:
        db = SessionLocal()
        try:
            query = db.query(AuditEvent)
            if severity and severity != "All":
                query = query.filter(AuditEvent.severity == severity)
            if event_type and event_type != "All":
                query = query.filter(AuditEvent.event_type == event_type)
            if search:
                query = query.filter(
                    AuditEvent.title.ilike(f"%{search}%") | AuditEvent.details.ilike(f"%{search}%")
                )

            total = query.count()
            items = query.order_by(AuditEvent.wall_clock.desc()).offset(offset).limit(limit).all()

            events_list = [
                {
                    "id": item.id,
                    "time": item.timestamp,
                    "title": item.title,
                    "eventType": item.event_type,
                    "severity": item.severity,
                    "source": item.source,
                    "affectedAsset": item.affected_asset,
                    "status": item.status,
                    "details": item.details,
                    "correlationId": item.correlation_id,
                    "runId": item.run_id,
                }
                for item in items
            ]

            return {
                "total": total,
                "items": events_list,
                "limit": limit,
                "offset": offset,
            }
        finally:
            db.close()

    def export_csv(self) -> str:
        events_data = self.list_events(limit=500)["items"]
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Event ID", "Timestamp", "Title", "Type", "Severity", "Source", "Asset", "Status", "Details"])
        for e in events_data:
            writer.writerow([
                e["id"], e["time"], e["title"], e["eventType"], e["severity"],
                e["source"], e["affectedAsset"], e["status"], e["details"] or ""
            ])
        return output.getvalue()


event_service = EventService()
