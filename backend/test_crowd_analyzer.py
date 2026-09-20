import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.crowd_analyzer import CrowdAnalyzer

def run_test():
    analyzer = CrowdAnalyzer(capacity=50)
    
    # Test 1: LOW occupancy (20 people / 50 capacity = 40%)
    res1 = analyzer.analyze(20)
    assert res1["occupancy"] == 40.0, f"Expected 40.0, got {res1['occupancy']}"
    assert res1["status"] == "LOW", f"Expected LOW, got {res1['status']}"
    assert res1["alert"] is None
    print("Test 1 (LOW 40%): PASSED")

    # Test 2: MODERATE occupancy (35 people / 50 capacity = 70%)
    res2 = analyzer.analyze(35)
    assert res2["occupancy"] == 70.0
    assert res2["status"] == "MODERATE"
    assert res2["alert"] is None
    print("Test 2 (MODERATE 70%): PASSED")

    # Test 3: HIGH occupancy (42 people / 50 capacity = 84%)
    res3 = analyzer.analyze(42)
    assert res3["occupancy"] == 84.0
    assert res3["status"] == "HIGH"
    assert res3["alert"] is not None and res3["alert"]["alert_type"] == "HIGH"
    print("Test 3 (HIGH 84%): PASSED")

    # Test 4: CRITICAL occupancy (55 people / 50 capacity = 110%)
    res4 = analyzer.analyze(55)
    assert res4["occupancy"] == 110.0
    assert res4["status"] == "CRITICAL"
    assert res4["alert"] is not None and res4["alert"]["alert_type"] == "CRITICAL"
    print("Test 4 (CRITICAL 110%): PASSED")

    # Test 5: Invalid capacity protection
    assert not analyzer.set_capacity(0)
    assert not analyzer.set_capacity(-10)
    print("Test 5 (Input Validation): PASSED")

    print("\nAll Crowd Analyzer tests PASSED successfully!")

if __name__ == "__main__":
    run_test()
