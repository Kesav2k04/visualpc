# =====================================================
# VisualPC Monitoring — ORM Models
# Tables: workers, jobs, metrics, users
# =====================================================

import datetime
from sqlalchemy import (
    Column, Integer, Float, String, DateTime, ForeignKey, Text, Boolean,
)
from sqlalchemy.orm import relationship

from .database import Base


# ---------------------------------------------------------------------------
# Workers — registered GPU / CPU / edge execution nodes
# ---------------------------------------------------------------------------

class Worker(Base):
    __tablename__ = "workers"

    id                   = Column(Integer, primary_key=True, index=True)
    name                 = Column(String(128), nullable=False)
    device               = Column(String(256), nullable=True)
    status               = Column(String(32), default="active")       # active | offline
    cuda_version         = Column(String(32), nullable=True)
    gpu_memory_total     = Column(Float, nullable=True)               # in MB
    node_ip              = Column(String(64), nullable=True)
    role                 = Column(String(32), default="worker")       # worker | edge
    service_port         = Column(Integer, default=7000)              # port the worker listens on
    last_heartbeat       = Column(DateTime, nullable=True)
    last_reach_success   = Column(Boolean, nullable=True)
    last_reach_tested_at = Column(DateTime, nullable=True)
    registered_at        = Column(DateTime, default=datetime.datetime.utcnow)

    def computed_status(self):
        """Compute ONLINE / DEGRADED / OFFLINE from heartbeat + reachability."""
        now = datetime.datetime.utcnow()
        if self.last_heartbeat is None:
            return "OFFLINE"
        seconds = (now - self.last_heartbeat).total_seconds()
        reachable = self.last_reach_success is True
        if seconds <= 10 and reachable:
            return "ONLINE"
        if seconds <= 30:
            return "DEGRADED"
        return "OFFLINE"

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "device": self.device,
            "status": self.computed_status(),
            "cuda_version": self.cuda_version,
            "gpu_memory_total": self.gpu_memory_total,
            "node_ip": self.node_ip,
            "role": self.role or "worker",
            "service_port": self.service_port or 7000,
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None,
            "last_reach_success": self.last_reach_success,
            "registered_at": self.registered_at.isoformat() if self.registered_at else None,
        }


# ---------------------------------------------------------------------------
# Jobs — each compute job submitted through the pipeline
# ---------------------------------------------------------------------------

class Job(Base):
    __tablename__ = "jobs"

    id            = Column(Integer, primary_key=True, index=True)
    job_id        = Column(String(64), unique=True, nullable=False, index=True)
    job_type      = Column(String(64), nullable=True)
    workload_size = Column(String(32), nullable=True)   # small | medium | large
    priority      = Column(String(16), nullable=True)
    status        = Column(String(32), default="completed")
    submitted_by  = Column(String(128), nullable=True)
    created_at    = Column(DateTime, default=datetime.datetime.utcnow)

    # one-to-many: a job may have multiple metric snapshots
    metrics = relationship("Metric", back_populates="job", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "job_id": self.job_id,
            "job_type": self.job_type,
            "workload_size": self.workload_size,
            "priority": self.priority,
            "status": self.status,
            "submitted_by": self.submitted_by,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


# ---------------------------------------------------------------------------
# Metrics — performance measurements linked to a job
# ---------------------------------------------------------------------------

class Metric(Base):
    __tablename__ = "metrics"

    id              = Column(Integer, primary_key=True, index=True)
    job_id          = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    execution_time  = Column(Float, nullable=True)
    gpu_memory_peak = Column(Float, nullable=True)
    latency_total   = Column(Float, nullable=True)
    workload_size   = Column(String(32), nullable=True)
    timestamp       = Column(DateTime, default=datetime.datetime.utcnow)

    job = relationship("Job", back_populates="metrics")

    def to_dict(self):
        return {
            "id": self.id,
            "job_id": self.job_id,
            "execution_time": self.execution_time,
            "gpu_memory_peak": self.gpu_memory_peak,
            "latency_total": self.latency_total,
            "workload_size": self.workload_size,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }


# ---------------------------------------------------------------------------
# Users — platform users with roles
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(128), unique=True, nullable=False, index=True)
    email           = Column(String(256), unique=True, nullable=True)
    full_name       = Column(String(256), nullable=True)
    hashed_password = Column(String(256), nullable=True)
    role            = Column(String(32), default="user")   # admin | user
    provider        = Column(String(32), default="credentials")  # credentials | google | github
    created_at      = Column(DateTime, default=datetime.datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "full_name": self.full_name,
            "role": self.role,
            "provider": self.provider,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
