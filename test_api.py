#!/usr/bin/env python3
"""
Test script for the Sales Forecasting API
Run this after starting the FastAPI server to test the prediction endpoint.
"""

import requests
import json
import os
from pathlib import Path

def test_api():
    """Test the FastAPI prediction endpoint with example data"""

    # API endpoint
    url = "http://localhost:8000/predict"

    # Path to example CSV file
    csv_file_path = Path(__file__).parent / "example_data.csv"

    if not csv_file_path.exists():
        print(f"❌ Example CSV file not found: {csv_file_path}")
        print("Please ensure example_data.csv exists in the project directory")
        return

    print("🚀 Testing Sales Forecasting API...")
    print(f"📁 Using CSV file: {csv_file_path}")

    try:
        # Prepare the file for upload
        with open(csv_file_path, 'rb') as f:
            files = {'file': ('example_data.csv', f, 'text/csv')}
            response = requests.post(url, files=files)

        print(f"📡 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            print("✅ Prediction successful!")
            print("\n📊 Metadata:")
            print(f"   Filename: {result['metadata']['filename']}")
            print(f"   Data rows: {result['metadata']['data_rows']}")
            print(f"   Date range: {result['metadata']['date_range']['start']} to {result['metadata']['date_range']['end']}")
            print(f"   Available series: {', '.join(result['metadata']['available_series'])}")

            if result['metadata']['missing_series']:
                print(f"   Missing series: {', '.join(result['metadata']['missing_series'])}")

            print("\n🔮 Predictions:")
            for series, data in result['predictions'].items():
                predictions = data['predictions']
                print(f"   {series}: {len(predictions)} predictions")
                if predictions:
                    print(f"      Sample: {predictions[:3]}...")

        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"   Details: {response.text}")

    except requests.exceptions.ConnectionError:
        print("❌ Connection failed! Make sure the API server is running:")
        print("   Run: uvicorn app:app --reload")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

def test_health():
    """Test the health check endpoint"""
    url = "http://localhost:8000/"

    try:
        response = requests.get(url)
        if response.status_code == 200:
            result = response.json()
            print("✅ Health check passed!")
            print(f"   API Version: {result['version']}")
            print(f"   Available series: {len(result['available_series'])}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except requests.exceptions.ConnectionError:
        print("❌ Connection failed! Make sure the API server is running:")
        print("   Run: uvicorn app:app --reload")
    except Exception as e:
        print(f"❌ Health check error: {str(e)}")

if __name__ == "__main__":
    print("=" * 50)
    print("Sales Forecasting API Test")
    print("=" * 50)

    # Test health endpoint
    test_health()
    print()

    # Test prediction endpoint
    test_api()

    print("\n" + "=" * 50)
    print("Test completed!")
    print("=" * 50)
