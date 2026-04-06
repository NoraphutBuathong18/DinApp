from main import app
from models.user import User
from services.auth_service import get_current_user

def test_get_me(client, db_session):
    # Setup dummy user
    test_user = User(email="user@example.com", is_active=True, profile_picture="url.com")
    db_session.add(test_user)
    db_session.commit()
    
    app.dependency_overrides[get_current_user] = lambda: test_user
    
    response = client.get("/users/me")
    assert response.status_code == 200
    assert response.json()["email"] == "user@example.com"
    
    app.dependency_overrides.pop(get_current_user, None)

def test_update_avatar(client, db_session):
    test_user = User(email="avatar@example.com", is_active=True)
    db_session.add(test_user)
    db_session.commit()
    
    app.dependency_overrides[get_current_user] = lambda: test_user
    
    # Missing payload
    response_bad = client.put("/users/me/avatar", json={"wrong_key": "x"})
    assert response_bad.status_code == 400
    
    # Success
    response = client.put("/users/me/avatar", json={"profile_picture": "new_pic.png"})
    assert response.status_code == 200
    assert response.json()["profile_picture"] == "new_pic.png"
    
    db_session.refresh(test_user)
    assert test_user.profile_picture == "new_pic.png"
    
    app.dependency_overrides.pop(get_current_user, None)

def test_delete_me(client, db_session):
    test_user = User(email="delete@example.com", is_active=True)
    db_session.add(test_user)
    db_session.commit()
    
    app.dependency_overrides[get_current_user] = lambda: test_user
    
    response = client.delete("/users/me")
    assert response.status_code == 200
    
    # Check deleted from DB
    deleted = db_session.query(User).filter(User.email == "delete@example.com").first()
    assert deleted is None
    
    app.dependency_overrides.pop(get_current_user, None)

def test_delete_me_error(client, db_session):
    # Simulate an error by not having the user attached to db properly or forcing a raise
    # Or we can just mock db.commit to raise an exception
    from unittest.mock import patch
    test_user = User(email="error@example.com", is_active=True)
    app.dependency_overrides[get_current_user] = lambda: test_user
    
    with patch("sqlalchemy.orm.Session.commit", side_effect=Exception("DB Error")):
        response = client.delete("/users/me")
        assert response.status_code == 500
        assert "ลบบัญชีไม่สำเร็จ" in response.json()["detail"]
        
    app.dependency_overrides.pop(get_current_user, None)
