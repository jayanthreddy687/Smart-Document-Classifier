from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Document(db.Model):
    __tablename__ = "documents"

    id = db.Column(db.Integer, primary_key=True, index=True)
    filename = db.Column(db.String, index=True)
    content = db.Column(db.String)
    classification = db.Column(db.String)
    confidence = db.Column(db.Float)
    upload_timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    s3_url = db.Column(db.String)

    def to_dict(self):
        return {
            'filename': self.filename,
            'classification': self.classification,
            'confidence': self.confidence,
            'upload_timestamp': self.upload_timestamp.isoformat(),
            's3_url': self.s3_url
        } 