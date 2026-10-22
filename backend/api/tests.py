from django.test import TestCase, RequestFactory
from decimal import Decimal
from datetime import date
from api.models import Users, Login, Donor, Donation
from api.views import donor_donation_history_api, download_receipt_api

class DonorContributionSystemTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

        # Create User 1 and Login 1 (Eleanor Vance)
        self.u1 = Users.objects.create(
            full_name='Eleanor Vance',
            phone_number='9876543210',
            gender='Female',
            address='123 Beacon Street, Boston',
            designation='Patron Donor'
        )
        self.l1 = Login.objects.create(
            email='donor@orphanage.com',
            password='hashed_password_1',
            role='donor',
            user=self.u1
        )
        self.d1 = Donor.objects.create(
            full_name='Eleanor Vance',
            email='donor@orphanage.com',
            phone_number='9876543210',
            address='123 Beacon Street, Boston'
        )

        # Create User 2 and Login 2 (Anita Desai)
        self.u2 = Users.objects.create(
            full_name='Anita Desai',
            phone_number='9876543211',
            gender='Female',
            address='456 Park Avenue, Mumbai',
            designation='Community Donor'
        )
        self.l2 = Login.objects.create(
            email='anita.desai@gmail.com',
            password='hashed_password_2',
            role='donor',
            user=self.u2
        )
        self.d2 = Donor.objects.create(
            full_name='Anita Desai & Friends',
            email='anita.desai@gmail.com',
            phone_number='9876543211',
            address='456 Park Avenue, Mumbai'
        )

        # Eleanor Vance Donations:
        # 1. Successful Money
        self.ev_money_succ = Donation.objects.create(
            donor=self.d1,
            donation_type='Money',
            amount=Decimal('25000.00'),
            purpose='Child Education & Scholarships',
            receipt_number='HN-REC-EV-01',
            payment_method='Razorpay UPI',
            payment_status='Successful',
            razorpay_order_id='order_ev_01',
            razorpay_payment_id='pay_ev_01',
            razorpay_signature='secret_sig_ev_01',
            donation_date=date(2026, 9, 15),
            status='Received'
        )
        # 2. Pending Money (Must NOT be counted in total_donated!)
        self.ev_money_pend = Donation.objects.create(
            donor=self.d1,
            donation_type='Money',
            amount=Decimal('2500.00'),
            purpose='Festival Celebrations',
            payment_method='Razorpay UPI',
            payment_status='Pending',
            razorpay_order_id='order_ev_02',
            donation_date=date(2026, 10, 19),
            status='Pending Payment'
        )
        # 3. Refunded Money (Must NOT be counted in total_donated!)
        self.ev_money_ref = Donation.objects.create(
            donor=self.d1,
            donation_type='Money',
            amount=Decimal('1000.00'),
            purpose='Emergency Medical Aid (Refunded)',
            payment_method='Razorpay NetBanking',
            payment_status='Refunded',
            razorpay_order_id='order_ev_03',
            razorpay_payment_id='pay_ev_03',
            donation_date=date(2026, 10, 1),
            status='Refunded'
        )
        # 4. In-Kind Item Donation
        self.ev_item = Donation.objects.create(
            donor=self.d1,
            donation_type='Clothing Donation',
            item_category='Clothing Donation',
            item_name='Winter Sweaters, Jackets & Cardigans',
            item_description='25 sets of woolen clothing',
            quantity=Decimal('25.00'),
            unit='sets',
            delivery_option='Pickup',
            collection_status='In Orphanage Inventory',
            receipt_number='HN-ACK-EV-01',
            purpose='In-Kind Support: Winter Clothing',
            payment_method='In-Kind / Physical Fulfillment',
            payment_status='N/A',
            donation_date=date(2026, 10, 12),
            status='Received'
        )

        # Anita Desai Donations:
        # 1. Successful Money
        self.ad_money_succ = Donation.objects.create(
            donor=self.d2,
            donation_type='Money',
            amount=Decimal('1000.00'),
            purpose='Healthcare Fund',
            receipt_number='HN-REC-AD-01',
            payment_method='Razorpay UPI',
            payment_status='Successful',
            razorpay_order_id='order_ad_01',
            razorpay_payment_id='pay_ad_01',
            razorpay_signature='secret_sig_ad_01',
            donation_date=date(2026, 9, 20),
            status='Received'
        )
        # 2. Failed Money (Must NOT be counted in total_donated!)
        self.ad_money_failed = Donation.objects.create(
            donor=self.d2,
            donation_type='Money',
            amount=Decimal('500.00'),
            purpose='Art Supplies',
            payment_method='Razorpay Card',
            payment_status='Failed',
            razorpay_order_id='order_ad_02',
            donation_date=date(2026, 10, 11),
            status='Failed Payment'
        )
        # 3. Item Donation
        self.ad_item = Donation.objects.create(
            donor=self.d2,
            donation_type='Books and Educational Materials',
            item_category='Books and Educational Materials',
            item_name='Mathematics Workbooks & Science Kits',
            item_description='40 STEM practice books',
            quantity=Decimal('40.00'),
            unit='pcs',
            delivery_option='Direct Delivery',
            collection_status='Collected',
            receipt_number='HN-ACK-AD-01',
            purpose='In-Kind Support: STEM Education',
            payment_method='In-Kind / Physical Fulfillment',
            payment_status='N/A',
            donation_date=date(2026, 8, 14),
            status='Received'
        )

    def test_donor_isolation_eleanor(self):
        """Eleanor Vance should only see Eleanor's donations (total 4 records)."""
        req = self.factory.get('/api/donations/history/?paginated=true',
                               HTTP_X_USER_EMAIL='donor@orphanage.com',
                               HTTP_X_USER_ROLE='donor',
                               HTTP_X_DONOR_NAME='Eleanor Vance')
        resp = donor_donation_history_api(req)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['count'], 4)
        for r in resp.data['results']:
            self.assertEqual(r['donor'], self.d1.donor_id)
            self.assertIn('Eleanor', r['donor_name'])

    def test_donor_isolation_anita(self):
        """Anita Desai should only see Anita's donations (total 3 records)."""
        req = self.factory.get('/api/donations/history/?paginated=true',
                               HTTP_X_USER_EMAIL='anita.desai@gmail.com',
                               HTTP_X_USER_ROLE='donor',
                               HTTP_X_DONOR_NAME='Anita Desai & Friends')
        resp = donor_donation_history_api(req)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.data['count'], 3)
        for r in resp.data['results']:
            self.assertEqual(r['donor'], self.d2.donor_id)
            self.assertIn('Anita', r['donor_name'])

    def test_summary_kpi_calculations_eleanor(self):
        """
        Total Donated must be ₹25,000.00 (excludes Pending ₹2,500 and Refunded ₹1,000).
        Total Contributions = 4.
        Tax Receipts = 1.
        In-Kind Items = 1.
        """
        req = self.factory.get('/api/donations/history/?paginated=true',
                               HTTP_X_USER_EMAIL='donor@orphanage.com',
                               HTTP_X_USER_ROLE='donor')
        resp = donor_donation_history_api(req)
        self.assertEqual(resp.status_code, 200)
        summary = resp.data['summary']
        self.assertEqual(summary['total_donated'], 25000.0)
        self.assertEqual(summary['total_contributions'], 4)
        self.assertEqual(summary['tax_receipts_count'], 1)
        self.assertEqual(summary['item_donations_count'], 1)

    def test_summary_kpi_calculations_anita(self):
        """
        Total Donated must be ₹1,000.00 (excludes Failed ₹500).
        Total Contributions = 3.
        Tax Receipts = 1.
        In-Kind Items = 1.
        """
        req = self.factory.get('/api/donations/history/?paginated=true',
                               HTTP_X_USER_EMAIL='anita.desai@gmail.com',
                               HTTP_X_USER_ROLE='donor')
        resp = donor_donation_history_api(req)
        self.assertEqual(resp.status_code, 200)
        summary = resp.data['summary']
        self.assertEqual(summary['total_donated'], 1000.0)
        self.assertEqual(summary['total_contributions'], 3)
        self.assertEqual(summary['tax_receipts_count'], 1)
        self.assertEqual(summary['item_donations_count'], 1)

    def test_idor_protection_blocked(self):
        """Donor trying to query another donor_id must receive 403 Forbidden."""
        req = self.factory.get(f'/api/donations/history/?donor_id={self.d1.donor_id}',
                               HTTP_X_USER_EMAIL='anita.desai@gmail.com',
                               HTTP_X_USER_ROLE='donor')
        resp = donor_donation_history_api(req)
        self.assertEqual(resp.status_code, 403)
        self.assertIn('Forbidden', resp.data['error'])

    def test_cross_tenant_receipt_blocked(self):
        """Donor trying to download another donor's receipt must receive 403 Forbidden."""
        req = self.factory.get(f'/api/donations/{self.ev_money_succ.donation_id}/receipt/',
                               HTTP_X_USER_EMAIL='anita.desai@gmail.com',
                               HTTP_X_USER_ROLE='donor')
        resp = download_receipt_api(req, self.ev_money_succ.donation_id)
        self.assertEqual(resp.status_code, 403)

    def test_pending_receipt_blocked(self):
        """Receipt for pending payment must return 400 Bad Request."""
        req = self.factory.get(f'/api/donations/{self.ev_money_pend.donation_id}/receipt/',
                               HTTP_X_USER_EMAIL='donor@orphanage.com',
                               HTTP_X_USER_ROLE='donor')
        resp = download_receipt_api(req, self.ev_money_pend.donation_id)
        self.assertEqual(resp.status_code, 400)
        self.assertIn('verified successful payments', resp.data['error'])

    def test_refunded_receipt_blocked(self):
        """Receipt for refunded payment must return 400 Bad Request."""
        req = self.factory.get(f'/api/donations/{self.ev_money_ref.donation_id}/receipt/',
                               HTTP_X_USER_EMAIL='donor@orphanage.com',
                               HTTP_X_USER_ROLE='donor')
        resp = download_receipt_api(req, self.ev_money_ref.donation_id)
        self.assertEqual(resp.status_code, 400)

    def test_failed_receipt_blocked(self):
        """Receipt for failed payment must return 400 Bad Request."""
        req = self.factory.get(f'/api/donations/{self.ad_money_failed.donation_id}/receipt/',
                               HTTP_X_USER_EMAIL='anita.desai@gmail.com',
                               HTTP_X_USER_ROLE='donor')
        resp = download_receipt_api(req, self.ad_money_failed.donation_id)
        self.assertEqual(resp.status_code, 400)

    def test_legitimate_receipts_succeed(self):
        """Monetary receipt and In-Kind acknowledgement succeed with PDF content."""
        # Monetary PDF
        req_m = self.factory.get(f'/api/donations/{self.ev_money_succ.donation_id}/receipt/',
                                 HTTP_X_USER_EMAIL='donor@orphanage.com',
                                 HTTP_X_USER_ROLE='donor')
        resp_m = download_receipt_api(req_m, self.ev_money_succ.donation_id)
        self.assertEqual(resp_m.status_code, 200)
        self.assertEqual(resp_m.get('Content-Type'), 'application/pdf')

        # In-Kind PDF
        req_i = self.factory.get(f'/api/donations/{self.ev_item.donation_id}/receipt/',
                                 HTTP_X_USER_EMAIL='donor@orphanage.com',
                                 HTTP_X_USER_ROLE='donor')
        resp_i = download_receipt_api(req_i, self.ev_item.donation_id)
        self.assertEqual(resp_i.status_code, 200)
        self.assertEqual(resp_i.get('Content-Type'), 'application/pdf')

    def test_filters_and_search(self):
        """Test database filters: type, payment_status, collection_status, search."""
        # Filter by type=Item
        req_item = self.factory.get('/api/donations/history/?type=Item&paginated=true',
                                    HTTP_X_USER_EMAIL='donor@orphanage.com',
                                    HTTP_X_USER_ROLE='donor')
        resp_item = donor_donation_history_api(req_item)
        self.assertEqual(resp_item.status_code, 200)
        self.assertEqual(resp_item.data['count'], 1)
        self.assertEqual(resp_item.data['results'][0]['donation_type'], 'Clothing Donation')

        # Filter by payment_status=Pending
        req_pend = self.factory.get('/api/donations/history/?payment_status=Pending&paginated=true',
                                    HTTP_X_USER_EMAIL='donor@orphanage.com',
                                    HTTP_X_USER_ROLE='donor')
        resp_pend = donor_donation_history_api(req_pend)
        self.assertEqual(resp_pend.status_code, 200)
        self.assertEqual(resp_pend.data['count'], 1)
        self.assertEqual(resp_pend.data['results'][0]['payment_status'], 'Pending')

        # Filter by collection_status='In Orphanage Inventory'
        req_inv = self.factory.get('/api/donations/history/?collection_status=In Orphanage Inventory&paginated=true',
                                   HTTP_X_USER_EMAIL='donor@orphanage.com',
                                   HTTP_X_USER_ROLE='donor')
        resp_inv = donor_donation_history_api(req_inv)
        self.assertEqual(resp_inv.status_code, 200)
        self.assertEqual(resp_inv.data['count'], 1)

        # Search by item name
        req_search = self.factory.get('/api/donations/history/?search=Sweaters&paginated=true',
                                      HTTP_X_USER_EMAIL='donor@orphanage.com',
                                      HTTP_X_USER_ROLE='donor')
        resp_search = donor_donation_history_api(req_search)
        self.assertEqual(resp_search.status_code, 200)
        self.assertEqual(resp_search.data['count'], 1)
        self.assertIn('Sweaters', resp_search.data['results'][0]['item_name'])

    def test_payment_secrets_never_exposed(self):
        """Ensure razorpay_signature or payment secrets are never exposed in serialized output."""
        req = self.factory.get('/api/donations/history/?paginated=true',
                               HTTP_X_USER_EMAIL='donor@orphanage.com',
                               HTTP_X_USER_ROLE='donor')
        resp = donor_donation_history_api(req)
        for r in resp.data['results']:
            self.assertNotIn('razorpay_signature', r)
