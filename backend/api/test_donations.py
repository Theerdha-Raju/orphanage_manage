import hmac
import hashlib
import json
from decimal import Decimal
from django.test import TestCase
from django.conf import settings
from rest_framework.test import APIClient
from api.models import Donor, Donation, PaymentOrder

class RazorpayDonationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.key_secret = "test_secret_hopenest_key2026"
        self.webhook_secret = "test_webhook_secret_hopenest"
        settings.RAZORPAY_KEY_ID = "rzp_test_HopeNest2026Test"
        settings.RAZORPAY_KEY_SECRET = self.key_secret
        settings.RAZORPAY_WEBHOOK_SECRET = self.webhook_secret

        # Create test donor 1
        self.donor1 = Donor.objects.create(
            full_name="Aarav Sharma",
            email="aarav@example.com",
            phone_number="9876543210",
            status="Active"
        )
        # Create test donor 2
        self.donor2 = Donor.objects.create(
            full_name="Priya Patel",
            email="priya@example.com",
            phone_number="9876543211",
            status="Active"
        )

    def test_invalid_donation_amounts(self):
        """Amount must be positive and at least ₹1.00"""
        for invalid_amt in [0, -100, "abc", ""]:
            res = self.client.post('/api/donations/create-order/', {
                'amount': invalid_amt,
                'donor_name': 'Test User',
                'donor_email': 'test@example.com'
            }, format='json')
            self.assertEqual(res.status_code, 400)
            self.assertIn('error', res.data)

    def test_create_monetary_order_success(self):
        """Successful order creation creates a Pending PaymentOrder and returns order details"""
        res = self.client.post('/api/donations/create-order/', {
            'amount': 2500,
            'donor_name': 'Aarav Sharma',
            'donor_email': 'aarav@example.com',
            'donor_phone': '9876543210',
            'purpose': 'Child Education Fund',
            'message': 'Keep up the good work'
        }, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res.data['success'])
        self.assertEqual(res.data['amount'], 250000) # In paise
        self.assertTrue(res.data['order_id'].startswith('order_'))

        # Verify PaymentOrder is in PostgreSQL with status 'Pending'
        order = PaymentOrder.objects.get(razorpay_order_id=res.data['order_id'])
        self.assertEqual(order.status, 'Pending')
        self.assertEqual(order.amount, Decimal('2500.00'))
        self.assertEqual(order.donor, self.donor1)
        # Verify NO donation record exists yet (Step 9 requirement)
        self.assertIsNone(order.donation)

    def test_verify_payment_invalid_signature(self):
        """Invalid cryptographic signature is rejected and marks order as Failed"""
        # Create order
        create_res = self.client.post('/api/donations/create-order/', {
            'amount': 1000,
            'donor_name': 'Aarav Sharma',
            'donor_email': 'aarav@example.com'
        }, format='json')
        order_id = create_res.data['order_id']

        verify_res = self.client.post('/api/donations/verify-payment/', {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': 'pay_invalid_123',
            'razorpay_signature': 'tampered_signature_hex'
        }, format='json')
        self.assertEqual(verify_res.status_code, 400)
        self.assertFalse(verify_res.data['success'])

        order = PaymentOrder.objects.get(razorpay_order_id=order_id)
        self.assertEqual(order.status, 'Failed')
        self.assertEqual(Donation.objects.filter(razorpay_order_id=order_id).count(), 0)

    def test_verify_payment_success_and_duplicate_prevention(self):
        """Valid cryptographic signature saves donation in PostgreSQL, and prevents duplicate verification"""
        create_res = self.client.post('/api/donations/create-order/', {
            'amount': 2000,
            'donor_name': 'Aarav Sharma',
            'donor_email': 'aarav@example.com',
            'purpose': 'Healthcare & Nutrition'
        }, format='json')
        order_id = create_res.data['order_id']
        payment_id = "pay_test_9988776655"

        # Compute valid HMAC-SHA256 signature
        valid_sig = hmac.new(
            self.key_secret.encode('utf-8'),
            f"{order_id}|{payment_id}".encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

        # Step 7-9: First verification request
        verify_res = self.client.post('/api/donations/verify-payment/', {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': valid_sig
        }, format='json')
        self.assertEqual(verify_res.status_code, 200)
        self.assertTrue(verify_res.data['success'])
        self.assertIn('HN-REC-', verify_res.data['receipt_number'])

        # Check PostgreSQL donation record created
        donation = Donation.objects.get(razorpay_payment_id=payment_id)
        self.assertEqual(donation.amount, Decimal('2000.00'))
        self.assertEqual(donation.payment_status, 'Successful')
        self.assertEqual(donation.status, 'Received')

        # Test Duplicate Verification: verify duplicate call returns existing donation without creating duplicate
        initial_count = Donation.objects.count()
        dup_res = self.client.post('/api/donations/verify-payment/', {
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': valid_sig
        }, format='json')
        self.assertEqual(dup_res.status_code, 200)
        self.assertTrue(dup_res.data.get('duplicate'))
        self.assertEqual(Donation.objects.count(), initial_count)

    def test_payment_failed_notification(self):
        """Client failure/cancellation updates order status to Failed"""
        create_res = self.client.post('/api/donations/create-order/', {
            'amount': 500,
            'donor_name': 'Aarav Sharma',
            'donor_email': 'aarav@example.com'
        }, format='json')
        order_id = create_res.data['order_id']

        fail_res = self.client.post('/api/donations/payment-failed/', {
            'razorpay_order_id': order_id,
            'error_code': 'BAD_REQUEST_ERROR',
            'error_description': 'User cancelled checkout window'
        }, format='json')
        self.assertEqual(fail_res.status_code, 200)

        order = PaymentOrder.objects.get(razorpay_order_id=order_id)
        self.assertEqual(order.status, 'Failed')
        self.assertIn('User cancelled', order.error_reason)

    def test_webhook_verification_and_event_handling(self):
        """Webhook verifies HMAC signature and handles payment.captured and refund.processed"""
        create_res = self.client.post('/api/donations/create-order/', {
            'amount': 5000,
            'donor_name': 'Aarav Sharma',
            'donor_email': 'aarav@example.com'
        }, format='json')
        order_id = create_res.data['order_id']
        payment_id = "pay_webhook_12345"

        payload_obj = {
            'event': 'payment.captured',
            'payload': {
                'payment': {
                    'entity': {
                        'id': payment_id,
                        'order_id': order_id,
                        'amount': 500000,
                        'status': 'captured'
                    }
                }
            }
        }
        raw_body = json.dumps(payload_obj).encode('utf-8')

        # Invalid webhook signature
        bad_sig_res = self.client.post('/api/donations/webhook/', raw_body, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE='bad_sig')
        self.assertEqual(bad_sig_res.status_code, 400)

        # Valid webhook signature
        valid_wh_sig = hmac.new(self.webhook_secret.encode('utf-8'), raw_body, hashlib.sha256).hexdigest()
        ok_res = self.client.post('/api/donations/webhook/', raw_body, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=valid_wh_sig)
        self.assertEqual(ok_res.status_code, 200)

        # Verify donation is created and payment order marked Successful
        donation = Donation.objects.get(razorpay_payment_id=payment_id)
        self.assertEqual(donation.amount, Decimal('5000.00'))
        self.assertEqual(donation.payment_status, 'Successful')

        # Test Refund Webhook
        refund_payload = {
            'event': 'refund.processed',
            'payload': {
                'refund': {
                    'entity': {
                        'payment_id': payment_id,
                        'amount': 500000,
                        'status': 'processed'
                    }
                }
            }
        }
        refund_raw = json.dumps(refund_payload).encode('utf-8')
        refund_sig = hmac.new(self.webhook_secret.encode('utf-8'), refund_raw, hashlib.sha256).hexdigest()
        ref_res = self.client.post('/api/donations/webhook/', refund_raw, content_type='application/json', HTTP_X_RAZORPAY_SIGNATURE=refund_sig)
        self.assertEqual(ref_res.status_code, 200)

        donation.refresh_from_db()
        self.assertEqual(donation.payment_status, 'Refunded')
        self.assertEqual(donation.status, 'Refunded')

    def test_non_monetary_donation_submission(self):
        """Food, Clothes, Books etc. can be submitted without online monetary gateway"""
        res = self.client.post('/api/donations/non-monetary/', {
            'donor_name': 'Priya Patel',
            'donor_email': 'priya@example.com',
            'donor_phone': '9876543211',
            'item_category': 'Books and Educational Materials',
            'item_name': 'Science Encyclopedia & Maths Workbooks',
            'quantity': 50,
            'unit': 'sets',
            'donation_date': '2026-10-10',
            'delivery_option': 'Pickup',
            'delivery_address': 'Flat 402, Green Valley Apartments, Mumbai',
            'notes': 'Packed in 2 secure cartons',
            'collection_status': 'Pending Collection'
        }, format='json')
        self.assertEqual(res.status_code, 201)
        self.assertTrue(res.data['success'])
        self.assertIn('HN-ACK-', res.data['receipt_number'])

        # Verify in DB
        donation = Donation.objects.get(receipt_number=res.data['receipt_number'])
        self.assertIsNone(donation.amount)
        self.assertEqual(donation.donation_type, 'Books and Educational Materials')
        self.assertEqual(donation.collection_status, 'Pending Collection')
        self.assertEqual(donation.payment_status, 'N/A')

    def test_receipt_pdf_generation_and_donor_access_restriction(self):
        """PDF receipts can be downloaded, and donors cannot access other donors' receipts"""
        # Create successful donation for donor 1
        d1 = Donation.objects.create(
            donor=self.donor1,
            donation_type='Money',
            amount=Decimal('1000.00'),
            receipt_number='HN-REC-2026-9001',
            payment_status='Successful',
            donation_date='2026-10-10',
            status='Received',
            razorpay_payment_id='pay_test_pdf_1'
        )

        # Donor 1 downloads own receipt -> 200 PDF
        res1 = self.client.get(f'/api/donations/{d1.donation_id}/receipt/', HTTP_X_USER_ROLE='donor', HTTP_X_USER_EMAIL='aarav@example.com')
        self.assertEqual(res1.status_code, 200)
        self.assertEqual(res1['Content-Type'], 'application/pdf')
        self.assertTrue(len(res1.content) > 1000)

        # Donor 2 attempts to download Donor 1's receipt -> 403 Forbidden!
        res2 = self.client.get(f'/api/donations/{d1.donation_id}/receipt/', HTTP_X_USER_ROLE='donor', HTTP_X_USER_EMAIL='priya@example.com')
        self.assertEqual(res2.status_code, 403)

        # Admin downloads receipt -> 200 OK
        res3 = self.client.get(f'/api/donations/{d1.donation_id}/receipt/', HTTP_X_USER_ROLE='admin', HTTP_X_USER_EMAIL='admin@orphanage.com')
        self.assertEqual(res3.status_code, 200)

    def test_admin_dashboard_and_collection_status_management(self):
        """Admin dashboard provides totals, monitoring, and updates collection status safely"""
        # Create non-monetary donation
        item_don = Donation.objects.create(
            donor=self.donor2,
            donation_type='Clothing Donation',
            item_category='Clothing Donation',
            item_name='Winter Sweaters',
            quantity=25,
            unit='pcs',
            collection_status='Pending Collection',
            receipt_number='HN-ACK-2026-9002',
            donation_date='2026-10-10',
            status='Received'
        )

        # Admin dashboard query
        dash_res = self.client.get('/api/donations/admin-dashboard/', HTTP_X_USER_ROLE='admin')
        self.assertEqual(dash_res.status_code, 200)
        self.assertIn('totals', dash_res.data)
        self.assertIn('payment_orders', dash_res.data)
        self.assertIn('donations', dash_res.data)

        # Donor forbidden from accessing admin dashboard
        donor_dash_res = self.client.get('/api/donations/admin-dashboard/', HTTP_X_USER_ROLE='donor')
        self.assertEqual(donor_dash_res.status_code, 403)

        # Admin updates collection status
        update_res = self.client.patch(
            f'/api/donations/{item_don.donation_id}/collection-status/',
            {'collection_status': 'Collected'},
            format='json',
            HTTP_X_USER_ROLE='admin'
        )
        self.assertEqual(update_res.status_code, 200)
        item_don.refresh_from_db()
        self.assertEqual(item_don.collection_status, 'Collected')

        # Safety rule: admin cannot mark payment successful without payment gateway evidence
        unverified_monetary = Donation.objects.create(
            donor=self.donor1,
            donation_type='Money',
            amount=Decimal('5000.00'),
            receipt_number='HN-REC-MANUAL-1',
            payment_status='Pending',
            donation_date='2026-10-10',
            status='Pending'
        )
        illegal_update_res = self.client.patch(
            f'/api/donations/{unverified_monetary.donation_id}/collection-status/',
            {'payment_status': 'Successful'},
            format='json',
            HTTP_X_USER_ROLE='admin'
        )
        self.assertEqual(illegal_update_res.status_code, 400)
        self.assertIn('evidence', illegal_update_res.data['error'])
