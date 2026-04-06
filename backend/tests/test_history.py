import datetime
from main import app
from models.user import User
from models.soil_data import SoilAnalysis
from services.auth_service import get_current_user

def test_get_history(client, db_session):
    test_user = User(email="history@example.com")
    db_session.add(test_user)
    db_session.commit()
    
    # Insert history
    history1 = SoilAnalysis(
        user_id=test_user.id,
        filename="test.csv",
        nitrogen=10, phosphorus=20, potassium=30,
        ph=6.5, temperature=25.0, humidity=80.0, rainfall=100.0,
        npk_insights="Mock Insight",
        timestamp=datetime.datetime.now(datetime.timezone.utc)
    )
    db_session.add(history1)
    db_session.commit()
    
    # Override authentication
    app.dependency_overrides[get_current_user] = lambda: test_user
    
    response = client.get("/history/")
    assert response.status_code == 200
    data = response.json().get("history", [])
    assert len(data) == 1
    assert data[0]["filename"] == "test.csv"
    assert data[0]["insights"] == "Mock Insight"
    
    # Cleanup override
    app.dependency_overrides.pop(get_current_user, None)
