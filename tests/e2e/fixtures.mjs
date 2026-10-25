/**
 * Deterministic Supabase-shaped fixtures for local UI E2E runs.
 * The sandbox has no network path to Supabase, so Playwright fulfils every
 * REST/auth call with these rows instead.
 */
export const USER_ID = '11111111-1111-4111-8111-111111111111';
export const ADMIN_ID = '22222222-2222-4222-9222-222222222222';
export const CHILD_ID = '33333333-3333-4333-a333-333333333333';
export const NOW = '2026-10-25T10:00:00.000Z';

export const userProfile = {
  id: USER_ID,
  email: 'hassan.tester@payfollows.test',
  username: 'hassan_tester',
  role: 'user',
  status: 'active',
  balance: 125.5,
  total_spent: 320,
  referral_code: 'PFTEST001',
  referred_by: null,
  parent_id: null,
  created_at: NOW,
};

export const adminProfile = {
  ...userProfile,
  id: ADMIN_ID,
  email: 'admin@payfollows.test',
  username: 'payfollows_admin',
  role: 'admin',
  referral_code: 'PFADMIN01',
  balance: 0,
  total_spent: 0,
};

export const childProfile = {
  id: CHILD_ID,
  email: 'child.panel@payfollows.test',
  username: 'child_panel',
  role: 'user',
  status: 'active',
  balance: 18.25,
  total_spent: 64,
  referral_code: 'PFCHILD01',
  referred_by: null,
  parent_id: USER_ID,
  created_at: NOW,
};

export const services = [
  {
    id: 'svc-001',
    name: 'Instagram Real Followers — High Quality',
    category: 'Instagram Followers',
    status: 'active',
    rate_per_1000: 2.4,
    min_quantity: 50,
    max_quantity: 100000,
    completion_time: 24,
    completion_time_text: '0–1 Hour',
    description: 'Gradual delivery, real-looking profiles, 30-day refill.',
  },
  {
    id: 'svc-002',
    name: 'TikTok Video Views — Instant Start',
    category: 'TikTok Views',
    status: 'active',
    rate_per_1000: 0.18,
    min_quantity: 100,
    max_quantity: 1000000,
    completion_time: 6,
    completion_time_text: 'Instant',
    description: 'Fast views with retention-friendly pacing.',
  },
  {
    id: 'svc-003',
    name: 'YouTube Subscribers — Global',
    category: 'YouTube Subscribers',
    status: 'active',
    rate_per_1000: 12.9,
    min_quantity: 10,
    max_quantity: 20000,
    completion_time: 72,
    completion_time_text: '1–6 Hours',
    description: 'Channel-safe global subscribers.',
  },
];

export const orders = [
  {
    id: 'ord-drip-0001',
    user_id: USER_ID,
    service_id: 'svc-001',
    link: 'https://instagram.com/p/abc123',
    quantity: 5000,
    charge: 12,
    delivery_time: 24,
    status: 'processing',
    is_dripfeed: true,
    runs: 5,
    interval_minutes: 60,
    runs_delivered: 2,
    created_at: NOW,
    service: { id: 'svc-001', name: 'Instagram Real Followers — High Quality' },
  },
  {
    id: 'ord-plain-0002',
    user_id: USER_ID,
    service_id: 'svc-002',
    link: 'https://tiktok.com/@x/video/1',
    quantity: 50000,
    charge: 9,
    delivery_time: 6,
    status: 'completed',
    is_dripfeed: false,
    runs: null,
    interval_minutes: null,
    runs_delivered: 0,
    created_at: NOW,
    service: { id: 'svc-002', name: 'TikTok Video Views — Instant Start' },
  },
];

export const notifications = [
  {
    id: 'ntf-1',
    user_id: USER_ID,
    title: 'Order in progress',
    body: 'Your drip order ord-drip-0001 is being delivered (2/5 runs).',
    type: 'order',
    link: '/dashboard/orders',
    read_at: null,
    created_at: NOW,
  },
  {
    id: 'ntf-2',
    user_id: USER_ID,
    title: 'Referral reward credited',
    body: '$2.00 wallet reward for child_panel first deposit.',
    type: 'referral',
    link: '/dashboard/referrals',
    read_at: null,
    created_at: NOW,
  },
  {
    id: 'ntf-3',
    user_id: USER_ID,
    title: 'Welcome to PayFollows',
    body: 'Explore 6,400+ services from your dashboard.',
    type: 'system',
    link: null,
    read_at: NOW,
    created_at: NOW,
  },
];

export const referredUsers = [
  {
    id: '44444444-4444-4444-8444-444444444444',
    email: 'ref.one@payfollows.test',
    username: 'ref_one',
    role: 'user',
    status: 'active',
    balance: 5,
    total_spent: 20,
    referral_code: 'PFREF0001',
    referred_by: USER_ID,
    parent_id: null,
    created_at: NOW,
  },
  {
    id: '55555555-5555-4555-8555-555555555555',
    email: 'ref.two@payfollows.test',
    username: 'ref_two',
    role: 'user',
    status: 'active',
    balance: 0,
    total_spent: 0,
    referral_code: 'PFREF0002',
    referred_by: USER_ID,
    parent_id: null,
    created_at: NOW,
  },
];

export const referralRewards = [
  {
    id: 'rrw-1',
    referrer_id: USER_ID,
    referred_id: referredUsers[0].id,
    trigger_payment_id: 'pay-1',
    reward_amount: 2,
    status: 'paid',
    created_at: NOW,
  },
];

export const chatChannels = [
  {
    id: 'chn-user-1',
    user_id: USER_ID,
    platform: 'web',
    status: 'open',
    last_message: 'When will my drip order finish?',
    last_sender_role: 'user',
    last_message_at: NOW,
    created_at: NOW,
    user: { username: 'hassan_tester', email: userProfile.email },
  },
  {
    id: 'chn-other-1',
    user_id: CHILD_ID,
    platform: 'web',
    status: 'pending',
    last_message: 'Need help with refill',
    last_sender_role: 'user',
    last_message_at: NOW,
    created_at: NOW,
    user: { username: 'child_panel', email: childProfile.email },
  },
];

export const chatMessages = [
  {
    id: 'msg-1',
    channel_id: 'chn-user-1',
    sender_id: USER_ID,
    sender_role: 'user',
    body: 'Hi! When will my drip order finish?',
    created_at: NOW,
  },
  {
    id: 'msg-2',
    channel_id: 'chn-user-1',
    sender_id: ADMIN_ID,
    sender_role: 'admin',
    body: 'Hello — run 3 goes out within the hour, full delivery today.',
    created_at: NOW,
  },
];

export const platformSettings = {
  site_name: 'PayFollows',
  support_email: 'support@payfollows.com',
  min_deposit: 5,
  processing_fee_pct: 2,
  referral_reward_amount: 2,
  new_orders: true,
  maintenance: false,
  auto_sync: true,
  email_alerts: true,
  referral_reward_enabled: true,
};

export const platformEarnings = [
  {
    id: 'earn-1',
    order_id: orders[0].id,
    order_date: '2026-10-24',
    customer_charge: 12,
    provider_cost: 8.4,
    platform_profit: 3.6,
    status: 'completed',
  },
  {
    id: 'earn-2',
    order_id: orders[1].id,
    order_date: '2026-10-23',
    customer_charge: 9,
    provider_cost: 6.1,
    platform_profit: 2.9,
    status: 'completed',
  },
];

export const platformSummary = [
  {
    date: '2026-10-23',
    total_orders: 12,
    successful_orders: 11,
    total_customer_charges: 148.2,
    total_provider_costs: 101.4,
    gross_profit: 46.8,
    net_profit: 44.1,
  },
  {
    date: '2026-10-24',
    total_orders: 19,
    successful_orders: 18,
    total_customer_charges: 221.75,
    total_provider_costs: 154.3,
    gross_profit: 67.45,
    net_profit: 63.9,
  },
];

export const paymentLogs = [
  { id: 'plog-1', action: 'gateway_order_created', created_at: NOW },
  { id: 'plog-2', action: 'webhook_verified', created_at: NOW },
];

export const providerPayouts = [
  {
    id: 'pout-1',
    payout_method: 'monthly_bank_transfer',
    total_amount: 412.6,
    created_at: NOW,
    provider: { id: 'prv-1', name: 'CaspersMM' },
  },
];

export const auditLogs = [
  {
    id: 'aud-1',
    actor_id: ADMIN_ID,
    actor_role: 'admin',
    action: 'app_settings.update',
    entity_type: 'app_settings',
    entity_id: 'platform',
    metadata: { changed: ['referral_reward_amount'] },
    created_at: NOW,
  },
  {
    id: 'aud-2',
    actor_id: ADMIN_ID,
    actor_role: 'admin',
    action: 'orders.update',
    entity_type: 'orders',
    entity_id: 'ord-drip-0001',
    metadata: { status: { old: 'pending', new: 'processing' } },
    created_at: NOW,
  },
  {
    id: 'aud-3',
    actor_id: null,
    actor_role: 'admin',
    action: 'provider_margin_rules.insert',
    entity_type: 'provider_margin_rules',
    entity_id: 'pmr-9',
    metadata: { service_id: 'svc-002' },
    created_at: NOW,
  },
];
