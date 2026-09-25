import type { ReportMeta } from '../types/report';
import { BNB_TX_HASH, DEMO_TX_HASH, TRON_TX_HASH } from './mockAddresses';

export const DEMO_REPORT_ID = 'rpt-2025-0320-a83b';

export const mockReports: ReportMeta[] = [
{ id: DEMO_REPORT_ID, txHash: DEMO_TX_HASH, createdAt: Date.UTC(2025, 2, 20, 8, 14) },
{ id: 'rpt-2025-0320-c47a', txHash: BNB_TX_HASH, createdAt: Date.UTC(2025, 2, 20, 11, 2) },
{ id: 'rpt-2025-0319-5b1e', txHash: TRON_TX_HASH, createdAt: Date.UTC(2025, 2, 19, 9, 40) }];