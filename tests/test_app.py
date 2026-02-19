from fastapi.testclient import TestClient
import pytest

# import the app module from src
import sys, os
sys.path.append(os.path.join(os.getcwd(), "src"))
import app as main_app

client = TestClient(main_app.app)

@pytest.fixture(autouse=True)
def reset_activities():
    # make a deep copy of the original activities dict so tests start clean
    from copy import deepcopy
    main_app.activities = deepcopy({
        "Basketball Team": {
            "description": "Competitive basketball team for intramural and friendly matches",
            "schedule": "Mondays and Wednesdays, 4:00 PM - 5:30 PM",
            "max_participants": 15,
            "participants": ["alex@mergington.edu"],
        },
        "Tennis Club": {
            "description": "Learn tennis skills and participate in tournaments",
            "schedule": "Tuesdays and Thursdays, 4:00 PM - 5:00 PM",
            "max_participants": 10,
            "participants": ["james@mergington.edu"],
        },
        "Debate Club": {
            "description": "Develop public speaking and critical thinking skills",
            "schedule": "Wednesdays, 3:30 PM - 5:00 PM",
            "max_participants": 16,
            "participants": ["isabella@mergington.edu"],
        },
    })
    yield


def test_get_activities_returns_dict():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert "Basketball Team" in data
    assert isinstance(data, dict)


def test_signup_new_participant():
    resp = client.post(
        "/activities/Basketball%20Team/signup",
        params={"email": "teststudent@mergington.edu"},
    )
    assert resp.status_code == 200
    assert "Signed up" in resp.json()["message"]
    # participant added
    activities = client.get("/activities").json()
    assert "teststudent@mergington.edu" in activities["Basketball Team"]["participants"]


def test_signup_duplicate():
    resp = client.post(
        "/activities/Basketball%20Team/signup",
        params={"email": "alex@mergington.edu"},
    )
    assert resp.status_code == 400
    assert resp.json()["detail"] == "Student already signed up for this activity"


def test_signup_nonexistent_activity():
    resp = client.post(
        "/activities/NoSuch/signup",
        params={"email": "foo@bar.com"},
    )
    assert resp.status_code == 404


def test_remove_participant_success():
    # remove existing alex
    resp = client.delete(
        "/activities/Basketball%20Team/participants",
        params={"email": "alex@mergington.edu"},
    )
    assert resp.status_code == 200
    assert "Removed alex" in resp.json()["message"]
    activities = client.get("/activities").json()
    assert "alex@mergington.edu" not in activities["Basketball Team"]["participants"]


def test_remove_nonexistent_participant():
    resp = client.delete(
        "/activities/Basketball%20Team/participants",
        params={"email": "nobody@none.com"},
    )
    assert resp.status_code == 404


def test_remove_nonexistent_activity():
    resp = client.delete(
        "/activities/NoSuch/participants",
        params={"email": "someone@mergington.edu"},
    )
    assert resp.status_code == 404
