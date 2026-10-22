import requests
import json

BASE = 'http://127.0.0.1:8000'

def run_live_tests():
    print("=" * 65)
    print("LIVE API VERIFICATION AGAINST RUNNING DJANGO SERVER")
    print("=" * 65)

    # Test 1: Eleanor Vance paginated history with summary
    r = requests.get(f'{BASE}/api/donations/history/', params={
        'paginated': 'true', 'page': '1', 'page_size': '10'
    }, headers={
        'X-User-Email': 'donor@orphanage.com',
        'X-User-Role': 'donor',
        'X-Donor-Name': 'Eleanor Vance'
    })
    assert r.status_code == 200, f'Expected 200, got {r.status_code}: {r.text}'
    d = r.json()
    print("\n[TEST 1] Eleanor Vance paginated history")
    print(f"  Total count: {d['count']}")
    print(f"  Total pages: {d['total_pages']}")
    print(f"  Summary: {d['summary']}")
    print(f"  Analytics trend entries: {len(d['analytics']['trend'])}")
    assert d['count'] == 12, f"Expected 12, got {d['count']}"
    assert d['summary']['total_donated'] == 105000.0
    assert d['summary']['total_contributions'] == 12
    assert d['summary']['tax_receipts_count'] == 5
    assert d['summary']['item_donations_count'] == 5
    first = d['results'][0]
    assert 'razorpay_signature' not in first, "SECURITY ISSUE: razorpay_signature exposed!"
    print(f"  First record: ID={first['donation_id']}, Donor={first['donor_name']}, Status={first['payment_status']}")
    print("  [PASS]")

    # Test 2: Anita Desai paginated history
    r2 = requests.get(f'{BASE}/api/donations/history/', params={
        'paginated': 'true', 'page': '1', 'page_size': '10'
    }, headers={
        'X-User-Email': 'anita.desai@gmail.com',
        'X-User-Role': 'donor',
        'X-Donor-Name': 'Anita Desai & Friends'
    })
    assert r2.status_code == 200, f'Expected 200, got {r2.status_code}'
    d2 = r2.json()
    print("\n[TEST 2] Anita Desai paginated history")
    print(f"  Total count: {d2['count']}")
    print(f"  Summary: {d2['summary']}")
    assert d2['count'] == 5, f"Expected 5, got {d2['count']}"
    assert d2['summary']['total_donated'] == 1000.0
    assert d2['summary']['tax_receipts_count'] == 1
    assert d2['summary']['item_donations_count'] == 3
    for rec in d2['results']:
        assert 'Anita' in rec['donor_name'], f"Data leak! Found: {rec['donor_name']}"
    print("  [PASS]")

    # Test 3: IDOR protection - Anita tries to access Eleanor's records (donor_id=12)
    eleanor_donor_id = None
    import os, django
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
    django.setup()
    from api.models import Donor
    eleanor = Donor.objects.filter(full_name__icontains='Eleanor Vance').first()
    eleanor_donor_id = eleanor.donor_id if eleanor else 12

    r3 = requests.get(f'{BASE}/api/donations/history/', params={
        'donor_id': eleanor_donor_id
    }, headers={
        'X-User-Email': 'anita.desai@gmail.com',
        'X-User-Role': 'donor'
    })
    print("\n[TEST 3] IDOR attack blocked")
    print(f"  Status: {r3.status_code}, Error: {r3.json().get('error','N/A')}")
    assert r3.status_code == 403, f"Expected 403 Forbidden, got {r3.status_code}"
    print("  [PASS]")

    # Test 4: Cross-tenant receipt download blocked
    from api.models import Donation
    ev_receipt = Donation.objects.filter(donor_id=12, payment_status='Successful', donation_type='Money').first()
    r4 = requests.get(f'{BASE}/api/donations/{ev_receipt.donation_id}/receipt/', headers={
        'X-User-Email': 'anita.desai@gmail.com',
        'X-User-Role': 'donor'
    })
    print("\n[TEST 4] Cross-tenant receipt download blocked")
    print(f"  Status: {r4.status_code}, Error: {r4.json().get('error','N/A')}")
    assert r4.status_code == 403
    print("  [PASS]")

    # Test 5: Eleanor's own receipt downloads successfully
    r5 = requests.get(f'{BASE}/api/donations/{ev_receipt.donation_id}/receipt/', headers={
        'X-User-Email': 'donor@orphanage.com',
        'X-User-Role': 'donor'
    })
    print("\n[TEST 5] Eleanor own monetary receipt download")
    print(f"  Status: {r5.status_code}, Content-Type: {r5.headers.get('Content-Type')}")
    assert r5.status_code == 200
    assert 'pdf' in r5.headers.get('Content-Type', '')
    assert len(r5.content) > 1000
    print("  [PASS]")

    # Test 6: Pending payment receipt is blocked (donation_id=84)
    ev_pending = Donation.objects.filter(donor_id=12, payment_status='Pending').first()
    if ev_pending:
        r6 = requests.get(f'{BASE}/api/donations/{ev_pending.donation_id}/receipt/', headers={
            'X-User-Email': 'donor@orphanage.com',
            'X-User-Role': 'donor'
        })
        print("\n[TEST 6] Pending payment receipt blocked")
        print(f"  Status: {r6.status_code}, Error: {r6.json().get('error','N/A')}")
        assert r6.status_code == 400
        print("  [PASS]")

    # Test 7: Filter by type=Item
    r7 = requests.get(f'{BASE}/api/donations/history/', params={
        'paginated': 'true', 'type': 'Item'
    }, headers={
        'X-User-Email': 'donor@orphanage.com',
        'X-User-Role': 'donor'
    })
    d7 = r7.json()
    print("\n[TEST 7] Filter by type=Item")
    print(f"  Returned: {d7['count']} item records")
    assert d7['count'] == 5, f"Expected 5 items, got {d7['count']}"
    print("  [PASS]")

    # Test 8: Filter by payment_status=Pending
    r8 = requests.get(f'{BASE}/api/donations/history/', params={
        'paginated': 'true', 'payment_status': 'Pending'
    }, headers={
        'X-User-Email': 'donor@orphanage.com',
        'X-User-Role': 'donor'
    })
    d8 = r8.json()
    print("\n[TEST 8] Filter by payment_status=Pending")
    print(f"  Returned: {d8['count']} pending records, ID={d8['results'][0]['donation_id'] if d8['results'] else 'N/A'}")
    assert d8['count'] == 1
    print("  [PASS]")

    # Test 9: Search by item name 'Sweaters'
    r9 = requests.get(f'{BASE}/api/donations/history/', params={
        'paginated': 'true', 'search': 'Sweaters'
    }, headers={
        'X-User-Email': 'donor@orphanage.com',
        'X-User-Role': 'donor'
    })
    d9 = r9.json()
    print("\n[TEST 9] Search by item name 'Sweaters'")
    print(f"  Returned: {d9['count']} record: '{d9['results'][0].get('item_name','N/A') if d9['results'] else 'N/A'}'")
    assert d9['count'] == 1
    assert 'Sweaters' in (d9['results'][0].get('item_name') or '')
    print("  [PASS]")

    # Test 10: Filter by date range FY 2026-2027
    r10 = requests.get(f'{BASE}/api/donations/history/', params={
        'paginated': 'true', 'period': 'Financial Year 2026-2027'
    }, headers={
        'X-User-Email': 'donor@orphanage.com',
        'X-User-Role': 'donor'
    })
    d10 = r10.json()
    print("\n[TEST 10] Filter by Financial Year 2026-2027 period")
    print(f"  Returned: {d10['count']} records")
    assert d10['count'] >= 1
    print("  [PASS]")

    # Test 11: Security - verify no razorpay_signature in any response
    for i, rec in enumerate(d['results']):
        assert 'razorpay_signature' not in rec, f"SECRET LEAK at record index {i}"
    print("\n[TEST 11] razorpay_signature concealed in all response records")
    print("  [PASS]")

    print("\n" + "=" * 65)
    print("ALL 11 LIVE API VERIFICATION TESTS PASSED!")
    print("=" * 65)

if __name__ == '__main__':
    run_live_tests()
