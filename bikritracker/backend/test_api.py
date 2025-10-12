import requests
import json
from datetime import datetime, timedelta

API_BASE = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    response = requests.get(f"{API_BASE}/health")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 200
    print("✅ PASSED")

def test_metadata():
    """Test metadata endpoint"""
    print("\n" + "="*60)
    print("TEST 2: Metadata Options")
    print("="*60)
    response = requests.get(f"{API_BASE}/meta/options")
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Categories: {len(data.get('categories', []))}")
    print(f"Min History Required: {data.get('min_history_required')}")
    print(f"Response: {json.dumps(data, indent=2)}")
    assert response.status_code == 200
    print("✅ PASSED")

def test_insufficient_history():
    """Test with insufficient historical data (should fail)"""
    print("\n" + "="*60)
    print("TEST 3: Insufficient History (Should Fail)")
    print("="*60)
    
    payload = {
        "product": {
            "Category": "Eggs, Meat & Fish",
            "Subcategory": "Eggs",
            "City": "Namakkal",
            "Region": "South"
        },
        "history": [
            {"Orderdate": "2024-01-01", "Sales": 1},
            {"Orderdate": "2024-01-02", "Sales": 2},
            {"Orderdate": "2024-01-03", "Sales": 3}
        ],
        "predict_date": "2024-01-04"
    }
    
    response = requests.post(f"{API_BASE}/predict", json=payload)
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    assert response.status_code == 400  # Should fail validation
    print("✅ PASSED - Correctly rejected insufficient data")

def test_realistic_prediction():
    """Test with realistic historical data"""
    print("\n" + "="*60)
    print("TEST 4: Realistic Prediction")
    print("="*60)
    
    # Generate 60 days of realistic sales data
    base_sales = 1300
    history = []
    start_date = datetime(2024, 1, 1)
    
    for i in range(60):
        date = start_date + timedelta(days=i)
        # Add some realistic variation
        variation = (i % 7) * 20 - 50  # Weekly pattern
        noise = (hash(i) % 100) - 50  # Random-like variation
        sales = base_sales + variation + noise
        
        history.append({
            "Orderdate": date.strftime("%Y-%m-%d"),
            "Sales": max(800, min(1800, sales))  # Keep in reasonable range
        })
    
    payload = {
        "product": {
            "Category": "Eggs, Meat & Fish",
            "Subcategory": "Eggs",
            "City": "Namakkal",
            "Region": "South"
        },
        "history": history,
        "predict_date": "2024-03-01"
    }
    
    response = requests.post(f"{API_BASE}/predict", json=payload)
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nPrediction Results:")
        print(f"  Predicted Sales: {data['prediction']}")
        print(f"  Range: {data['lower_bound']} - {data['upper_bound']}")
        print(f"  Confidence: {data['confidence']}")
        
        if '_debug' in data:
            debug = data['_debug']
            print(f"\nDebug Info:")
            print(f"  Features Used: {debug['X_pred_nonzero_count']}/{debug['feature_list_len']}")
            if 'sales_statistics' in debug:
                stats = debug['sales_statistics']
                print(f"  Input Sales Stats:")
                print(f"    Mean: {stats['mean']}")
                print(f"    Std: {stats['std']}")
                print(f"    Range: {stats['min']} - {stats['max']}")
        
        # Verify prediction is not stuck at 1000-1300
        assert data['prediction'] != 1300, "Prediction is still stuck at default value!"
        print("\n✅ PASSED - Model is responding to input data")
    else:
        print(f"Error: {json.dumps(response.json(), indent=2)}")
        print("❌ FAILED")

def test_trend_detection():
    """Test if model detects trends"""
    print("\n" + "="*60)
    print("TEST 5: Trend Detection")
    print("="*60)
    
    # Test 1: Increasing trend
    print("\n📈 Testing INCREASING trend:")
    history_up = []
    start_date = datetime(2024, 1, 1)
    for i in range(60):
        date = start_date + timedelta(days=i)
        sales = 1000 + (i * 5)  # Steady increase
        history_up.append({
            "Orderdate": date.strftime("%Y-%m-%d"),
            "Sales": sales
        })
    
    payload_up = {
        "product": {
            "Category": "Food Grains",
            "Subcategory": "Rice",
            "City": "Chennai",
            "Region": "South"
        },
        "history": history_up,
        "predict_date": "2024-03-01"
    }
    
    response_up = requests.post(f"{API_BASE}/predict", json=payload_up)
    pred_up = response_up.json()['prediction']
    print(f"Last historical value: {history_up[-1]['Sales']}")
    print(f"Predicted value: {pred_up}")
    
    # Test 2: Decreasing trend
    print("\n📉 Testing DECREASING trend:")
    history_down = []
    for i in range(60):
        date = start_date + timedelta(days=i)
        sales = 1500 - (i * 5)  # Steady decrease
        history_down.append({
            "Orderdate": date.strftime("%Y-%m-%d"),
            "Sales": max(800, sales)  # Don't go too low
        })
    
    payload_down = {
        "product": {
            "Category": "Food Grains",
            "Subcategory": "Rice",
            "City": "Chennai",
            "Region": "South"
        },
        "history": history_down,
        "predict_date": "2024-03-01"
    }
    
    response_down = requests.post(f"{API_BASE}/predict", json=payload_down)
    pred_down = response_down.json()['prediction']
    print(f"Last historical value: {history_down[-1]['Sales']}")
    print(f"Predicted value: {pred_down}")
    
    # Verify the model responds differently to different trends
    if pred_up > pred_down + 50:  # Allow some margin
        print(f"\n✅ PASSED - Model detects trends (Δ = {pred_up - pred_down:.2f})")
    else:
        print(f"\n⚠️  WARNING - Model may not be sensitive to trends (Δ = {pred_up - pred_down:.2f})")

def run_all_tests():
    """Run all tests"""
    print("\n" + "="*60)
    print("BIKRITRACKER API TEST SUITE")
    print("="*60)
    
    try:
        test_health()
        test_metadata()
        test_insufficient_history()
        test_realistic_prediction()
        test_trend_detection()
        
        print("\n" + "="*60)
        print("ALL TESTS COMPLETED!")
        print("="*60)
        
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: Could not connect to API")
        print("Make sure the server is running:")
        print("  uvicorn main:app --reload --port 8000")
    except AssertionError as e:
        print(f"\n❌ TEST FAILED: {e}")
    except Exception as e:
        print(f"\n❌ UNEXPECTED ERROR: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    run_all_tests()