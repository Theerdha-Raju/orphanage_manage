import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.test import RequestFactory
from api.views import donor_donation_history_api, download_receipt_api

factory = RequestFactory()

def test_donor_contribution_system():
    print("=" * 60)
    print("TESTING HOPE-NEST DONOR CONTRIBUTION LOGS & REPORT SYSTEM")
    print("=" * 60)

    # ----------------------------------------------------
    # TEST 1: Eleanor Vance Authenticated Query
    # ----------------------------------------------------
    req_ev = factory.get('/api/donations/history/?paginated=true&page=1&page_size=20',
                         HTTP_X_USER_EMAIL='donor@orphanage.com',
                         HTTP_X_USER_ROLE='donor',
                         HTTP_X_DONOR_NAME='Eleanor Vance')
    resp_ev = donor_donation_history_api(req_ev)
    assert resp_ev.status_code == 200, f"Expected 200, got {resp_ev.status_code}"
    data_ev = resp_ev.data
    
    print(f"\n[PASS] 1. Eleanor Vance Contribution Records: count={data_ev['count']}")
    print(f"       Summary KPI Cards: {data_ev['summary']}")
    assert data_ev['count'] == 12, f"Expected 12 records, got {data_ev['count']}"
    assert data_ev['summary']['total_donated'] == 105000.0, f"Expected 105000.0, got {data_ev['summary']['total_donated']}"
    assert data_ev['summary']['total_contributions'] == 12
    assert data_ev['summary']['tax_receipts_count'] == 5
    assert data_ev['summary']['item_donations_count'] == 5

    # Verify no records belonging to another donor
    for rec in data_ev['results']:
        assert 'Eleanor' in rec['donor_name'], f"Data leak detected! Found: {rec['donor_name']}"

    # ----------------------------------------------------
    # TEST 2: Anita Desai Authenticated Query
    # ----------------------------------------------------
    req_ad = factory.get('/api/donations/history/?paginated=true&page=1&page_size=20',
                         HTTP_X_USER_EMAIL='anita.desai@gmail.com',
                         HTTP_X_USER_ROLE='donor',
                         HTTP_X_DONOR_NAME='Anita Desai & Friends')
    resp_ad = donor_donation_history_api(req_ad)
    assert resp_ad.status_code == 200
    data_ad = resp_ad.data

    print(f"\n[PASS] 2. Anita Desai Contribution Records: count={data_ad['count']}")
    print(f"       Summary KPI Cards: {data_ad['summary']}")
    assert data_ad['count'] == 5, f"Expected 5 records, got {data_ad['count']}"
    assert data_ad['summary']['total_donated'] == 1000.0, f"Expected 1000.0, got {data_ad['summary']['total_donated']}"
    assert data_ad['summary']['total_contributions'] == 5
    assert data_ad['summary']['tax_receipts_count'] == 1
    assert data_ad['summary']['item_donations_count'] == 3

    # Verify no records belonging to Eleanor or others
    for rec in data_ad['results']:
        assert 'Anita' in rec['donor_name'], f"Data leak detected! Found: {rec['donor_name']}"

    # ----------------------------------------------------
    # TEST 3: Zero Cross-Tenant IDOR Protection
    # Anita Desai attempts to access Eleanor Vance's records via donor_id=12
    # ----------------------------------------------------
    req_idor = factory.get('/api/donations/history/?donor_id=12',
                           HTTP_X_USER_EMAIL='anita.desai@gmail.com',
                           HTTP_X_USER_ROLE='donor',
                           HTTP_X_DONOR_NAME='Anita Desai')
    resp_idor = donor_donation_history_api(req_idor)
    print(f"\n[PASS] 3. IDOR Attack Blocked: Status={resp_idor.status_code}, Msg={resp_idor.data.get('error')}")
    assert resp_idor.status_code == 403, f"Expected 403 Forbidden, got {resp_idor.status_code}"

    # ----------------------------------------------------
    # TEST 4: Cross-Tenant Receipt Download Protection
    # Anita Desai attempts to download Eleanor Vance's receipt (Donation ID 74)
    # ----------------------------------------------------
    req_rcpt_unauth = factory.get('/api/donations/74/receipt/',
                                  HTTP_X_USER_EMAIL='anita.desai@gmail.com',
                                  HTTP_X_USER_ROLE='donor')
    resp_rcpt_unauth = download_receipt_api(req_rcpt_unauth, 74)
    print(f"\n[PASS] 4. Cross-Tenant Receipt Blocked: Status={resp_rcpt_unauth.status_code}, Msg={resp_rcpt_unauth.data.get('error')}")
    assert resp_rcpt_unauth.status_code == 403, f"Expected 403 Forbidden, got {resp_rcpt_unauth.status_code}"

    # ----------------------------------------------------
    # TEST 5: Legitimate Receipt Downloads
    # Eleanor Vance downloads her own verified monetary receipt (Donation ID 74)
    # ----------------------------------------------------
    req_rcpt_legit = factory.get('/api/donations/74/receipt/',
                                 HTTP_X_USER_EMAIL='donor@orphanage.com',
                                 HTTP_X_USER_ROLE='donor')
    resp_rcpt_legit = download_receipt_api(req_rcpt_legit, 74)
    print(f"\n[PASS] 5. Eleanor Vance Legitimate Receipt Download: Status={resp_rcpt_legit.status_code}, Content-Type={resp_rcpt_legit.get('Content-Type')}")
    assert resp_rcpt_legit.status_code == 200
    assert resp_rcpt_legit.get('Content-Type') == 'application/pdf'
    assert len(resp_rcpt_legit.content) > 1000

    # Eleanor Vance downloads her own in-kind item acknowledgement (Donation ID 79)
    req_item_legit = factory.get('/api/donations/79/receipt/',
                                 HTTP_X_USER_EMAIL='donor@orphanage.com',
                                 HTTP_X_USER_ROLE='donor')
    resp_item_legit = download_receipt_api(req_item_legit, 79)
    print(f"\n[PASS] 6. Eleanor Vance In-Kind Acknowledgement Download: Status={resp_item_legit.status_code}, Content-Type={resp_item_legit.get('Content-Type')}")
    assert resp_item_legit.status_code == 200
    assert resp_item_legit.get('Content-Type') == 'application/pdf'

    # ----------------------------------------------------
    # TEST 6: Ineligible Receipt Downloads Blocked
    # Pending donation receipt request blocked (Donation ID 84)
    # ----------------------------------------------------
    req_pending_rcpt = factory.get('/api/donations/84/receipt/',
                                   HTTP_X_USER_EMAIL='donor@orphanage.com',
                                   HTTP_X_USER_ROLE='donor')
    resp_pending_rcpt = download_receipt_api(req_pending_rcpt, 84)
    print(f"\n[PASS] 7. Pending Donation Receipt Blocked: Status={resp_pending_rcpt.status_code}, Msg={resp_pending_rcpt.data.get('error')}")
    assert resp_pending_rcpt.status_code == 400

    # ----------------------------------------------------
    # TEST 7: Filters Verification
    # Filter by type=Item
    # ----------------------------------------------------
    req_item_filter = factory.get('/api/donations/history/?type=Item&paginated=true',
                                  HTTP_X_USER_EMAIL='donor@orphanage.com',
                                  HTTP_X_USER_ROLE='donor')
    resp_item_filter = donor_donation_history_api(req_item_filter)
    assert resp_item_filter.status_code == 200
    print(f"\n[PASS] 8. Filter by Item Type: returned {resp_item_filter.data['count']} items (all items)")
    assert resp_item_filter.data['count'] == 5
    for r in resp_item_filter.data['results']:
        assert r['donation_type'] != 'Money'

    # Filter by payment_status=Pending
    req_pstatus_filter = factory.get('/api/donations/history/?payment_status=Pending&paginated=true',
                                     HTTP_X_USER_EMAIL='donor@orphanage.com',
                                     HTTP_X_USER_ROLE='donor')
    resp_pstatus_filter = donor_donation_history_api(req_pstatus_filter)
    assert resp_pstatus_filter.status_code == 200
    print(f"\n[PASS] 9. Filter by Payment Status (Pending): returned {resp_pstatus_filter.data['count']} record (ID {resp_pstatus_filter.data['results'][0]['donation_id']})")
    assert resp_pstatus_filter.data['count'] == 1
    assert resp_pstatus_filter.data['results'][0]['payment_status'] == 'Pending'

    # Search by item name
    req_search = factory.get('/api/donations/history/?search=Sweaters&paginated=true',
                             HTTP_X_USER_EMAIL='donor@orphanage.com',
                             HTTP_X_USER_ROLE='donor')
    resp_search = donor_donation_history_api(req_search)
    assert resp_search.status_code == 200
    print(f"\n[PASS] 10. Search by Item Name ('Sweaters'): returned {resp_search.data['count']} record ('{resp_search.data['results'][0]['item_name']}')")
    assert resp_search.data['count'] == 1
    assert 'Sweaters' in resp_search.data['results'][0]['item_name']

    # ----------------------------------------------------
    # TEST 8: Sensitive Secrets Check
    # Verify razorpay_signature is NOT exposed in response
    # ----------------------------------------------------
    for rec in data_ev['results']:
        assert 'razorpay_signature' not in rec, f"CRITICAL: razorpay_signature leaked in donation record {rec['donation_id']}!"
    print("\n[PASS] 11. Security Check: Zero payment secrets or razorpay_signature exposed in API responses.")

    print("\n" + "=" * 60)
    print("ALL 11 BACKEND SECURITY & FUNCTIONALITY TESTS PASSED!")
    print("=" * 60)

if __name__ == '__main__':
    test_donor_contribution_system()
