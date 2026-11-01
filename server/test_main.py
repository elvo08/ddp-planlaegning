import pytest
from fastapi.testclient import TestClient

from server.main import create_app


@pytest.fixture
def client(tmp_path):
    return TestClient(create_app(tmp_path / "test.db"))


def test_tom_database_giver_ingen_projekter(client):
    assert client.get("/api/projects").json() == {}


def test_opret_og_hent_projekt(client):
    r = client.put("/api/projects/p1", json={"name": "Lager", "rev": {"users": 3}})
    assert r.status_code == 200
    assert client.get("/api/projects").json() == {"p1": {"name": "Lager", "rev": {"users": 3}}}


def test_patch_fletter_dybt_og_erstatter_lister(client):
    client.put("/api/projects/p1", json={"name": "Lager", "rev": {"users": 3, "rate": 400},
                                          "build": {"stack": ["Python", "Excel"]}})
    r = client.patch("/api/projects/p1", json={"rev": {"users": 5}, "build": {"stack": ["Python"]}})
    assert r.status_code == 200
    p = client.get("/api/projects").json()["p1"]
    assert p["rev"] == {"users": 5, "rate": 400}
    assert p["build"]["stack"] == ["Python"]
    assert p["name"] == "Lager"


def test_patch_paa_ukendt_projekt_giver_404(client):
    assert client.patch("/api/projects/findes-ikke", json={"name": "x"}).status_code == 404


def test_slet_projekt(client):
    client.put("/api/projects/p1", json={"name": "Lager"})
    assert client.delete("/api/projects/p1").status_code == 200
    assert client.get("/api/projects").json() == {}


def test_data_overlever_genstart(tmp_path):
    db = tmp_path / "test.db"
    TestClient(create_app(db)).put("/api/projects/p1", json={"name": "Lager"})
    assert TestClient(create_app(db)).get("/api/projects").json() == {"p1": {"name": "Lager"}}


def test_ugyldigt_id_afvises(client):
    assert client.put("/api/projects/ikke%20gyldigt!", json={"name": "x"}).status_code == 422


def test_brugere_gemmes_og_hentes(client):
    client.put("/api/users/u1", json={"name": "Mette"})
    client.put("/api/users/u1", json={"name": "Mette H"})
    assert client.get("/api/users").json() == {"u1": "Mette H"}


def test_siden_leveres_fra_roden(client):
    r = client.get("/")
    assert r.status_code == 200
    assert "DDP-planlægning" in r.text
